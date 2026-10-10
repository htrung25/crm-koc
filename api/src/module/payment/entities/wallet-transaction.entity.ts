import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EWalletTransactionsStatus } from '../../../common/enum/payment.enum';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  /** Dương là tiền vào ví, âm là tiền ra. */
  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: string;

  @Column({ type: 'smallint', default: EWalletTransactionsStatus.PENDING })
  status: EWalletTransactionsStatus;

  @Column({ type: 'uuid', nullable: true })
  collaborationId: string | null;

  @Column({ type: 'uuid', nullable: true })
  withdrawalId: string | null;

  @Column({ type: 'uuid', nullable: true })
  depositId: string | null;

  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
