import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  accountId: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: '0' })
  availableBalance: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: '0' })
  lockedBalance: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
