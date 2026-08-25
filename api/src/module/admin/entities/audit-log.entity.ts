import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EAuditLogCategory } from '../../../common/enum/audit-log.enum';
import type { EAuditLogAction } from '../../../common/enum/audit-log.enum';
import { EBusinessCode } from '../../../common/enum/business-code.enum';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  category!: EAuditLogCategory;

  @Column({ type: 'varchar', length: 30 })
  action!: EAuditLogAction;

  /** null: login thất bại có thể chưa xác định được account. */
  @Column({ type: 'uuid', nullable: true })
  accountId!: string | null;

  /** Email đã gõ khi login hỏng, kể cả email không tồn tại trong accounts. */
  @Column({ type: 'varchar', length: 254, nullable: true })
  emailAttempted!: string | null;

  /** 45 ký tự đủ cho IPv6 dài nhất kèm IPv4-mapped, giống session_events. */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  /** null: sự kiện login không tác động lên tài nguyên nào. */
  @Column({ type: 'varchar', length: 32, nullable: true })
  resourceType!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  resourceId!: string | null;

  @Column({ type: 'int', nullable: true })
  businessCode!: EBusinessCode | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
