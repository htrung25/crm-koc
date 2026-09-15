import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Index } from 'typeorm';
import {
  EPaymentMethod,
  EPaymentStatus,
  ECurency,
} from '../../../common/enum/payment.enum';
@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  accountId: string;

  @Column({ type: 'varchar', nullable: true })
  orderId: string;

  @Index({ unique: true })
  @Column({ name: 'transaction_id', unique: true })
  transactionId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 3, default: ECurency.VND })
  currency: ECurency;

  @Column({
    type: 'varchar',
    name: 'payment_method',
  })
  paymentMethod: EPaymentMethod;

  @Column({
    type: 'varchar',
    default: EPaymentStatus.PENDING,
  })
  status: EPaymentStatus;

  @Column('json', { nullable: true })
  payload: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
