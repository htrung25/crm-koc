import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import {
  EAuditLogAction,
  EAuditLogCategory,
} from '../../common/enum/audit-log.enum';
import { KafkaService } from '../../infra/kafka.service';
import { AUDIT_LOG_TOPIC, AuditLogEvent } from './constants/audit-log.kafka';

export interface WriteAuditLogDto {
  category: EAuditLogCategory;
  action: EAuditLogAction;
  accountId?: string | null;
  emailAttempted?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  businessCode?: number | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLog: Repository<AuditLog>,
    private readonly kafkaService: KafkaService,
  ) {}

  /**
   * Cổng cho các luồng dùng chung ba vai trò (login, OTP, logout): audit_logs
   * chỉ chứa hoạt động của admin. role null/undefined cũng bỏ qua — email lạ
   * chưa xác định được vai trò thì không có cơ sở để coi là admin.
   */
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

  /** @deprecated findAll() đã tự đọc query.search. Giữ cho call site cũ. */
  async search(
    query: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLogListItem>> {
    return this.findAll(query);
  }

  async findAll(
    query: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLogListItem>> {
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

    if (query.category !== undefined) {
      qb.andWhere('log.category = :category', { category: query.category });
    }

    if (query.action !== undefined) {
      qb.andWhere('log.action = :action', { action: query.action });
    }

    if (query.accountId) {
      qb.andWhere('log.accountId = :accountId', { accountId: query.accountId });
    }

    if (query.emailAttempted?.trim()) {
      qb.andWhere('log.emailAttempted = :emailAttempted', {
        emailAttempted: query.emailAttempted.trim(),
      });
    }

    if (query.resourceId && !query.resourceType) {
      throw new BadRequestException(
        'resourceType is required when filtering by resourceId',
      );
    }
    if (query.resourceType) {
      qb.andWhere('log.resourceType = :resourceType', {
        resourceType: query.resourceType,
      });
    }
    if (query.resourceId) {
      qb.andWhere('log.resourceId = :resourceId', {
        resourceId: query.resourceId,
      });
    }

    if (query.createdFrom) {
      qb.andWhere('log.createdAt >= :from', { from: query.createdFrom });
    }
    if (query.createdTo) {
      const to = new Date(query.createdTo);
      to.setDate(to.getDate() + 1);
      qb.andWhere('log.createdAt < :to', { to });
    }

    const sortOrder =
      query.sortOrder === undefined
        ? ESortOrder.DESC
        : assertEnum(ESortOrder, query.sortOrder, 'sortOrder');

    qb.orderBy('log.createdAt', sortOrder);
    qb.addOrderBy('log.id', sortOrder);

    return paginate(qb, query);
  }
}
