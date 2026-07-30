import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EAccountRole } from 'src/common/enum/account-roles.enum';
import { EAccountStatus } from 'src/common/enum/account-statuses.enum';

@Entity('accounts')
export class AuthEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  accountRole!: EAccountRole;

  @Column({ type: 'citext', unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  phone!: string | null;

  // select: false => password không bao giờ lọt ra ngoài trừ khi addSelect thủ công
  @Column({ type: 'text', select: false })
  password!: string;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  phoneVerifiedAt!: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 32, default: EAccountStatus.PENDING })
  status!: EAccountStatus;

  @Column({ type: 'text', nullable: true })
  statusReason!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
