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

/**
 * Vừa là cấu hình bảo mật vừa là hồ sơ của admin — gộp một bảng thay vì tách
 * admin_users + admin_profiles, vì cả hai đều 1-1 với cùng một account và
 * admin chỉ cần vài trường hồ sơ.
 *
 * Không có address và gender: quản trị viên không dùng tới, khác brand
 * (cần địa chỉ trụ sở) và creator (cần nhân khẩu học để brand tìm KOC).
 */
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'citext' })
  email!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Ho_Chi_Minh' })
  timezone!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
