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
 * Quan hệ 1-1 với accounts: account_id vừa là PK vừa là FK.
 * Giá trị account_id luôn bằng accounts.id, không tự sinh.
 */
@Entity('account_profiles')
export class Profile {
  @PrimaryColumn({ type: 'uuid' })
  accountId!: string;

  @OneToOne(() => AuthEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account?: AuthEntity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'citext' })
  email!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  // smallint => driver trả về number, không phải GenderEnum (string '1'|'2'|'3')
  @Column({ type: 'smallint', nullable: true })
  gender!: number | null;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Ho_Chi_Minh' })
  timezone!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
