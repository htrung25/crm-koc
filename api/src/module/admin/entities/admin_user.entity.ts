import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { AuthEntity } from '../../auth/entities/auth.entity';
import { AdminStatus } from '../constants/status.enum';

@Entity('admin_users')
export class AdminUser {
  @PrimaryColumn({ type: 'uuid' })
  accountId!: string;

  @OneToOne(() => AuthEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account?: AuthEntity;

  // varchar + CHECK ở migration, không phải enum type của Postgres. Khai
  // type: 'enum' ở đây sẽ khiến metadata lệch với schema thật mà không báo lỗi.
  @Column({ type: 'varchar', length: 16, default: AdminStatus.ACTIVE })
  status!: AdminStatus;

  /** Danh sách IP/CIDR ngăn cách bởi dấu phẩy, NULL nghĩa là không giới hạn */
  @Column({ type: 'text', nullable: true })
  ipWhitelist!: string | null;
}
