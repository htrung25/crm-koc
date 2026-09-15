import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ERole } from '../../../common/enum/roles.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';
import { IsEnum } from 'class-validator';

@Entity('accounts')
export class AuthEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @IsEnum(ERole, {
    message: 'AccountRole must be admin, brand or creator',
  })
  @Column({ type: 'varchar', length: 32, nullable: true })
  accountRole!: ERole | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'citext', unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', select: false, nullable: true })
  password!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  phoneVerifiedAt!: Date | null;

  @Index()
  @Column({ type: 'smallint' })
  status!: EAccountStatus;

  @Column({ type: 'text', nullable: true })
  statusReason!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
