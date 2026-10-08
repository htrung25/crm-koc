import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EDepositMethod,
  EDepositStatus,
} from '../../../common/enum/payment.enum';

@Entity('deposits')
export class Deposit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'smallint' })
  method: EDepositMethod;

  // Số user yêu cầu; số thực cộng vào ví là paidAmount.
  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  paidAmount: string | null;

  @Column({ type: 'smallint', default: EDepositStatus.PENDING })
  status: EDepositStatus;

  @Column({ type: 'varchar', length: 32, unique: true })
  paymentCode: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  providerTransactionId: string | null;

  @Column({ type: 'jsonb', nullable: true, select: false })
  providerPayload: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
