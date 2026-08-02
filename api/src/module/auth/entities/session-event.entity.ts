import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ESessionEventType } from '../../../common/enum/session-event-types.enum';

@Entity('session_events')
export class SessionEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  accountId!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  sessionId!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  eventType!: ESessionEventType;

  /** 45 ký tự đủ cho IPv6 dài nhất kèm dạng IPv4-mapped. */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  /** Ngữ cảnh thêm tuỳ sự kiện: lý do thu hồi, IP cũ khi refresh bất thường... */
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
