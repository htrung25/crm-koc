import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { ERole } from '../../common/enum/roles.enum';
import { ESortOrder } from '../../common/enum/sort-fields.enum';
import { assertEnum } from '../../common/util/enum-assert.util';
import {
  escapeLike,
  PaginatedResult,
  paginate,
} from '../../common/util/pagination.util';
import {
  AUDIT_LOG_LIST_FIELDS,
  AUDIT_LOG_SEARCH_EXPRESSION,
  AuditLogListItem,
} from './constants/audit-log.constants';
import { AuditLogFilterDto } from './dto/audit-log.dto';
import { AuditLog } from './entities/audit-log.entity';
import { KafkaService } from '../../infra/kafka.service';
import { AUDIT_LOG_TOPIC, AuditLogEvent } from './constants/audit-log.kafka';

import type { WriteAuditLogDto } from './interfaces/admin.interfaces';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLog: Repository<AuditLog>,
    private readonly kafkaService: KafkaService,
  ) {}

  async writeIfAdmin(
    role: ERole | null | undefined,
    data: WriteAuditLogDto,
  ): Promise<void> {
    if (role !== ERole.ADMIN) return;
    await this.write(data);
  }

  async write(data: WriteAuditLogDto): Promise<void> {
    let saved: AuditLog;
    try {
      saved = await this.auditLog.save(
        this.auditLog.create({
          category: data.category,
          action: data.action,
          accountId: data.accountId ?? null,
          emailAttempted: data.emailAttempted ?? null,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          resourceType: data.resourceType ?? null,
          resourceId: data.resourceId ?? null,
          businessCode: data.businessCode ?? null,
          metadata: data.metadata ?? null,
        }),
      );
    } catch (error) {
      // Audit hỏng không được kéo nghiệp vụ hỏng theo. Nhưng log phải đủ field
      // để dựng lại bản ghi từ stdout khi cần điều tra.
      this.logger.error(
        `audit write failed category=${data.category} action=${data.action} ` +
          `accountId=${data.accountId ?? '-'} ` +
          `resourceType=${data.resourceType ?? '-'} ` +
          `resourceId=${data.resourceId ?? '-'}`,
        error as Error,
      );
      return;
    }

    this.publish(saved);
  }

  // Audit quyết định là bắt buộc: lỗi DB phải rollback cả nghiệp vụ.
  // Kafka chỉ fan-out sau commit, không phát quyết định đã bị rollback.
  @Transactional()
  async writeRequired(data: WriteAuditLogDto): Promise<void> {
    const saved = await this.auditLog.save(this.auditLog.create(data));
    runOnTransactionCommit(() => this.publish(saved));
  }

  /** Bọc try/catch: publish chạy ngoài khối lưu, ném ở đây là hỏng nghiệp vụ. */
  private publish(log: AuditLog): void {
    if (!this.kafkaService.isEnabled()) return;

    try {
      const event: AuditLogEvent = {
        ...log,
        createdAt: log.createdAt.toISOString(),
      };

      // Key theo account để sự kiện của cùng một người giữ nguyên thứ tự trong
      // một partition; login hỏng chưa rõ account thì để Kafka rải đều.
      void this.kafkaService
        .sendMessage(AUDIT_LOG_TOPIC, event, log.accountId ?? undefined)
        .catch((error) => {
          this.logger.error(
            `audit fan-out failed id=${log.id}`,
            error as Error,
          );
        });
    } catch (error) {
      this.logger.error(`audit fan-out failed id=${log.id}`, error as Error);
    }
  }

  // findAll() đã tự đọc query.search. Giữ cho call site cũ.
  async search(
    query: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLogListItem>> {
    return this.findAll(query);
  }

  async findAll(
    query: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLogListItem>> {
    if (query.resourceId && !query.resourceType) {
      throw new BadRequestException(
        'resourceType is required when filtering by resourceId',
      );
    }

    const sortOrder =
      query.sortOrder === undefined
        ? ESortOrder.DESC
        : assertEnum(ESortOrder, query.sortOrder, 'sortOrder');

    const qb = this.auditLog
      .createQueryBuilder('log')
      .select(AUDIT_LOG_LIST_FIELDS.map((f) => `log.${f}`));

    const search = query.search?.trim();
    if (search) {
      // Một ILIKE trên đúng biểu thức của IDX_audit_logs_search. KHÔNG tách
      // thành OR từng cột: planner bỏ BitmapOr khi một nhánh khớp quá nhiều
      // dòng rồi quét cả bảng.
      qb.andWhere(`${AUDIT_LOG_SEARCH_EXPRESSION} ILIKE :search`, {
        search: `%${escapeLike(search)}%`,
      });
    }

    const filters = {
      category: query.category,
      action: query.action,
      accountId: query.accountId || undefined,
      emailAttempted: query.emailAttempted?.trim() || undefined,
      resourceType: query.resourceType || undefined,
      resourceId: query.resourceId || undefined,
    };
    for (const [field, value] of Object.entries(filters)) {
      if (value !== undefined) {
        qb.andWhere(`log.${field} = :${field}`, { [field]: value });
      }
    }

    if (query.createdFrom) {
      qb.andWhere('log.createdAt >= :from', { from: query.createdFrom });
    }
    if (query.createdTo) {
      const to = new Date(query.createdTo);
      to.setDate(to.getDate() + 1);
      qb.andWhere('log.createdAt < :to', { to });
    }

    qb.orderBy('log.createdAt', sortOrder);
    qb.addOrderBy('log.id', sortOrder);

    return paginate(qb, query);
  }
}
