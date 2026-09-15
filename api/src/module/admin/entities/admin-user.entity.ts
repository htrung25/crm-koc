import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuthEntity } from '../../auth/entities/auth.entity';
import { AdminStatus } from '../constants/status.enum';
import { EAdminRole } from '../constants/admin-roles.enum';

@Entity('admin_users')
export class AdminUser {
  @PrimaryColumn({ type: 'uuid' })
  accountId: string;

  @OneToOne(() => AuthEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: AuthEntity;

  @Column({ type: 'varchar', length: 16, default: AdminStatus.ACTIVE })
  status: AdminStatus;

  @Column({ type: 'varchar', length: 32, default: EAdminRole.ADMIN })
  adminRole: EAdminRole;

  @Column({ type: 'text', nullable: true })
  ipWhitelist: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'citext' })
  email: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
