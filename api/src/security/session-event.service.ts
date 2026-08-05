import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ESessionEventType } from '../common/enum/session-event-types.enum';
import { SessionEventEntity } from '../module/auth/entities/session-event.entity';

export interface SessionEventInput {
  eventType: ESessionEventType;
  accountId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Giới hạn độ dài để một User-Agent bất thường không làm phình bảng log. */
const MAX_USER_AGENT_LENGTH = 512;

@Injectable()
export class SessionEventService {
  private readonly logger = new Logger(SessionEventService.name);

  constructor(
    @InjectRepository(SessionEventEntity)
    private readonly eventRepository: Repository<SessionEventEntity>,
  ) {}

  async record(input: SessionEventInput): Promise<void> {
    try {
      // save() chứ không phải insert(): insert() nhận QueryDeepPartialEntity,
      // kiểu này không tương thích với cột jsonb khai là Record<string, unknown>.
      const event = this.eventRepository.create({
        eventType: input.eventType,
        accountId: input.accountId ?? null,
        sessionId: input.sessionId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
        metadata: input.metadata ?? null,
      });
      await this.eventRepository.save(event);
    } catch (error) {
      this.logger.error(
        `Không ghi được session_event ${input.eventType}: ${(error as Error).message}`,
      );
    }
  }

  /** Lịch sử của một account, mới nhất trước. */
  async findByAccount(
    accountId: string,
    limit = 50,
  ): Promise<SessionEventEntity[]> {
    return this.eventRepository.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /** Toàn bộ sự kiện của một phiên, dùng khi lần theo một sự cố cụ thể. */
  async findBySession(sessionId: string): Promise<SessionEventEntity[]> {
    return this.eventRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  /** Lọc theo loại, ví dụ tìm mọi revoked_reuse gần đây. */
  async findByType(
    eventType: ESessionEventType,
    limit = 100,
  ): Promise<SessionEventEntity[]> {
    return this.eventRepository.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
