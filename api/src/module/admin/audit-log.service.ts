import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ESortOrder } from '../../common/enum/sort-fields.enum';
import { assertEnum } from '../../common/util/enum-assert.util';
import {
  escapeLike,
  PaginatedResult,
  paginate,
} from '../../common/util/pagination.util';
import {
  AUDIT_LOG_LIST_FIELDS,
  AuditLogListItem,
} from './constants/audit-log.constants';
import { AuditLogFilterDto } from './dto/audit-log.dto';
import { AuditLog } from './entities/audit-log.entity';
import {
  EAuditLogAction,
  EAuditLogCategory,
} from 'src/common/enum/audit-log.enum';
import { KafkaService } from 'src/infra/kafka.service';
import { ADMIN_LOG_TOPIC } from './constants/audit-log.kafka';

export interface WriteAuditLogDto {
  category: EAuditLogCategory;
  action: EAuditLogAction;
  account_id?: string;
  email_attempted?: string;
  ip_address?: string;
  user_agent?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLog: Repository<AuditLog>,
    private readonly kafkaService: KafkaService,
  ) {}

  async write(data: WriteAuditLogDto): Promise<void> {
    if (!this.kafkaService.isEnabled()) {
      const log = this.auditLog.create(data);
      await this.auditLog.save(log);
      return;
    }

    await this.kafkaService.sendMessage(ADMIN_LOG_TOPIC, data);
  }

  async search(
    query: AuditLogFilterDto,
  ): Promise<PaginatedResult<AuditLogListItem>> {
    return this.findAll(query, query.search?.trim());
  }

  async findAll(
    query: AuditLogFilterDto,
    search?: string,
  ): Promise<PaginatedResult<AuditLogListItem>> {
    const qb = this.auditLog
      .createQueryBuilder('log')
      .select(AUDIT_LOG_LIST_FIELDS.map((f) => `log.${f}`));

    if (search) {
      qb.andWhere(
        `(
          log.category ILIKE :search
          OR log.action ILIKE :search
          OR CAST(log.accountId AS text) ILIKE :search
          OR log.emailAttempted ILIKE :search
          OR log.ipAddress ILIKE :search
          OR log.resourceType ILIKE :search
          OR log.resourceId ILIKE :search
        )`,
        { search: `%${escapeLike(search)}%` },
      );
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
