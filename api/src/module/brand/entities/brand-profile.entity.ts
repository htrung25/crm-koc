import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuthEntity } from '../../auth/entities/auth.entity';

/**
 * Hồ sơ nhãn hàng. Quan hệ 1-1 với accounts: account_id vừa là PK vừa là FK.
 *
 * Cột hướng theo nghiệp vụ pháp nhân — thứ brand cần khai để ký hợp đồng và
 * xuất hoá đơn — nên không có gender như creator.
 */
@Entity('brand_profiles')
export class BrandProfile {
  @PrimaryColumn({ type: 'uuid' })
  accountId: string;

  @OneToOne(() => AuthEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: AuthEntity;

  /** Tên thương hiệu hiển thị, thường khác tên pháp nhân trên giấy phép. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  brandName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName: string | null;

  /** MST Việt Nam: 10 số, hoặc 13 ký tự dạng chi nhánh 0123456789-001. */
  @Column({ type: 'varchar', length: 14, nullable: true })
  taxCode: string | null;

  @Column({ type: 'citext' })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  website: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  industry: string | null;

  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  /** Người phụ trách phía nhãn hàng, không nhất thiết là chủ tài khoản. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
