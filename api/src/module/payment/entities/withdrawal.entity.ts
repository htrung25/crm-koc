import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EWithdrawalStatus } from '../../../common/enum/payment.enum';
import { AdminUser } from '../../admin/entities/admin-user.entity';

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  accountId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  bankAccountId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  bankCode: string | null;

  @Column({ type: 'varchar', length: 34 })
  bankNumber: string;

  @Column({ type: 'varchar', length: 255 })
  bankName: string;

  @Column({ type: 'varchar', length: 255 })
  accountHolderName: string;

  /** Số tiền yêu cầu rút */
  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: string;

  /** Phí rút tiền / chuyển khoản */
  @Column({ type: 'numeric', precision: 15, scale: 2, default: '0' })
  fee: string;

  /** Cột generated (amount - fee) trong DB: TypeORM chỉ đọc, ghi vào là Postgres từ chối. */
  @Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    insert: false,
    update: false,
  })
  netAmount: string;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Index()
  @Column({
    type: 'smallint',
    default: EWithdrawalStatus.PENDING,
  })
  status: EWithdrawalStatus;

  /** Lý do từ chối nếu Admin reject */
  @Column({ type: 'text', nullable: true })
  rejectReason: string | null;

  @Column({ type: 'text', nullable: true })
  adminNote: string | null;

  /** Mã giao dịch hiển thị cho người dùng và đối soát (vd: WD-20260919-XXXX) */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, unique: true })
  transactionCode: string;

  /** Mã giao dịch tham chiếu từ cổng thanh toán / ngân hàng */
  @Column({ type: 'varchar', length: 128, nullable: true })
  bankTransactionId: string | null;

  /** Admin thực hiện duyệt / từ chối */
  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: AdminUser | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 128, nullable: true })
  idempotencyKey: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
