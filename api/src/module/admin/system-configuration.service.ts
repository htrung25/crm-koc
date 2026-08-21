import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { RedisClientType } from 'redis';
import {
  SYSTEM_CONFIG_GROUP_ENVIRONMENT,
  SYSTEM_CONFIG_GROUP_PREFIX,
  SYSTEM_CONFIG_KEY_PREFIX,
} from './constants/system-config.constants';
import { ESystemConfig } from './constants/system-config.enum';
import { REDIS_CLIENT } from '../../infra/redis.module';
import { SystemConfiguration } from './entities/system-configuration.entity';
import { UpdateSystemConfigurationItemDto } from './dto/system-configuration.dto';
import {
  SystemConfigurationUpsert,
  CachedConfig,
} from './types/system-config.types';

@Injectable()
export class SystemConfigurationService {
  private readonly cacheTtl: number;

  constructor(
    @InjectRepository(SystemConfiguration)
    private readonly configRepository: Repository<SystemConfiguration>,
    @Inject(REDIS_CLIENT)
    private readonly redis: RedisClientType,
    configService: ConfigService,
  ) {
    // .env luôn trả chuỗi nên phải Number()
    this.cacheTtl = Number(
      configService.get('SYSTEM_CONFIG_CACHE_TTL_SECONDS', 300),
    );
  }

  async getString(key: string): Promise<string> {
    const config = await this.read(key);
    this.assertType(key, config.type, ESystemConfig.STRING);
    return config.value;
  }

  async getNumber(key: string): Promise<number> {
    const config = await this.read(key);
    this.assertType(key, config.type, ESystemConfig.NUMBER);
    return Number(config.value);
  }

  async getBoolean(key: string): Promise<boolean> {
    const config = await this.read(key);
    this.assertType(key, config.type, ESystemConfig.BOOLEAN);
    return config.value === 'true';
  }

  async getJson<T>(key: string): Promise<T> {
    const config = await this.read(key);
    this.assertType(key, config.type, ESystemConfig.JSON);
    return JSON.parse(config.value) as T;
  }

  /** Cả nhóm, đã parse. Đây là đường nóng: có cache riêng theo nhóm. */
  async getByGroup(group: string): Promise<Record<string, unknown>> {
    const cacheKey = `${SYSTEM_CONFIG_GROUP_PREFIX}${group}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return JSON.parse(cached) as Record<string, unknown>;
    }

    const rows = await this.configRepository.find({
      where: { group },
      order: { key: 'ASC' },
    });
    const parsed = Object.fromEntries(
      rows.map((row) => [row.key, this.parse(row.value, row.type)]),
    );

    await this.redis.set(cacheKey, JSON.stringify(parsed), {
      EX: this.cacheTtl,
    });
    return parsed;
  }

  /** Cờ bật/tắt toàn hệ thống, cho AdminMaintenanceInterceptor. */
  async getEnvironmentToggles(): Promise<Record<string, unknown>> {
    return this.getByGroup(SYSTEM_CONFIG_GROUP_ENVIRONMENT);
  }

  async findAll(): Promise<SystemConfiguration[]> {
    return this.configRepository.find({ order: { group: 'ASC', key: 'ASC' } });
  }

  async updateMany(
    items: UpdateSystemConfigurationItemDto[],
    actorId: string,
  ): Promise<SystemConfiguration[]> {
    if (items.length === 0) {
      throw new BadRequestException('items must not be empty');
    }

    // Trùng key trong cùng một request: không có cách nào đoán ý người gọi
    // muốn giá trị nào thắng.
    const keys = items.map((item) => item.key);
    const duplicated = keys.filter((key, index) => keys.indexOf(key) !== index);
    if (duplicated.length > 0) {
      throw new BadRequestException(
        `duplicated keys: ${[...new Set(duplicated)].join(', ')}`,
      );
    }

    // Một truy vấn cho cả danh sách, không lặp findOneBy => tránh N+1.
    const existing = await this.findByKeys(keys);
    const byKey = new Map(existing.map((row) => [row.key, row]));

    const unknown = keys.filter((key) => !byKey.has(key));
    if (unknown.length > 0) {
      throw new NotFoundException(
        `unknown configuration keys: ${unknown.join(', ')}`,
      );
    }

    // Gom HẾT lỗi rồi mới ném: sửa 10 cấu hình mà mỗi lần chỉ biết một lỗi
    // thì phải gọi 10 lượt mới xong.
    const errors = items.flatMap((item) => {
      const row = byKey.get(item.key);
      const problem = row && this.validate(item.value, row.type);
      return problem ? [`${item.key}: ${problem}`] : [];
    });
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const saved = await this.writeValues(items, actorId);

    // Xoá cache SAU khi ghi thành công. Xoá trước mà ghi hỏng thì cache nạp
    // lại giá trị cũ và mọi thứ trông như chưa có gì xảy ra.
    await this.invalidate(existing);
    return saved;
  }

  /** Đọc một key, cache-aside theo key. */
  private async read(key: string): Promise<CachedConfig> {
    const cacheKey = `${SYSTEM_CONFIG_KEY_PREFIX}${key}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return JSON.parse(cached) as CachedConfig;
    }

    const row = await this.configRepository.findOneBy({ key });
    if (!row) {
      throw new NotFoundException(`configuration ${key} not found`);
    }

    const config: CachedConfig = { value: row.value, type: row.type };
    await this.redis.set(cacheKey, JSON.stringify(config), {
      EX: this.cacheTtl,
    });
    return config;
  }

  private async findByKeys(keys: string[]): Promise<SystemConfiguration[]> {
    if (keys.length === 0) {
      return [];
    }
    return this.configRepository.findBy({ key: In(keys) });
  }

  private async writeValues(
    items: SystemConfigurationUpsert[],
    updatedBy: string | null,
  ): Promise<SystemConfiguration[]> {
    // $1 là updatedBy, các cặp (key, value) bắt đầu từ $2. Tất cả đều là
    // tham số, không nối chuỗi vào SQL.
    const tuples = items
      .map((_, index) => `($${index * 2 + 2}, $${index * 2 + 3})`)
      .join(', ');
    const params = [
      updatedBy,
      ...items.flatMap((item) => [item.key, item.value]),
    ];

    await this.configRepository.query(
      `UPDATE "system_configurations" AS c
          SET "value" = v.value,
              "updated_by" = $1::uuid,
              "updated_at" = now()
         FROM (VALUES ${tuples}) AS v(key, value)
        WHERE c."key" = v.key`,
      params,
    );

    return this.findByKeys(items.map((item) => item.key));
  }

  /** Xoá cả khoá theo key lẫn khoá theo nhóm của những dòng bị đụng. */
  private async invalidate(rows: SystemConfiguration[]): Promise<void> {
    const cacheKeys = rows.map(
      (row) => `${SYSTEM_CONFIG_KEY_PREFIX}${row.key}`,
    );
    const groupKeys = [...new Set(rows.map((row) => row.group))].map(
      (group) => `${SYSTEM_CONFIG_GROUP_PREFIX}${group}`,
    );
    await this.redis.del([...cacheKeys, ...groupKeys]);
  }

  private parse(value: string, type: ESystemConfig): unknown {
    switch (type) {
      case ESystemConfig.NUMBER:
        return Number(value);
      case ESystemConfig.BOOLEAN:
        return value === 'true';
      case ESystemConfig.JSON:
        return JSON.parse(value);
      case ESystemConfig.STRING:
        return value;
    }
  }

  /** Trả về mô tả lỗi, hoặc null nếu hợp lệ. */
  private validate(value: string, type: ESystemConfig): string | null {
    switch (type) {
      case ESystemConfig.NUMBER:
        return Number.isFinite(Number(value)) && value.trim() !== ''
          ? null
          : 'must be a number';
      case ESystemConfig.BOOLEAN:
        return value === 'true' || value === 'false'
          ? null
          : "must be 'true' or 'false'";
      case ESystemConfig.JSON:
        try {
          JSON.parse(value);
          return null;
        } catch {
          return 'must be valid JSON';
        }
      case ESystemConfig.STRING:
        return null;
    }
  }

  private assertType(
    key: string,
    actual: ESystemConfig,
    expected: ESystemConfig,
  ): void {
    if (actual !== expected) {
      throw new BadRequestException(
        `configuration ${key} is of type ${ESystemConfig[actual]}, not ${ESystemConfig[expected]}`,
      );
    }
  }
}
