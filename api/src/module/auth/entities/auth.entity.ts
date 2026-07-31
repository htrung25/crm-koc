import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EAccountRole } from '../../../common/enum/account-roles.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';
import { IsEnum } from 'class-validator';

@Entity('accounts')
export class AuthEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @IsEnum(EAccountRole, {
    message: 'AccountRole must be admin, brand or creator',
  })
  @Column({ type: 'varchar', length: 32 })
  accountRole!: EAccountRole;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'citext', unique: true })
  email!: string;

  /** Lưu ở dạng E.164, ví dụ +84900000001 */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  // select: false => password không bao giờ lọt ra ngoài trừ khi addSelect thủ công
  @Column({ type: 'text', select: false })
  password!: string;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  phoneVerifiedAt!: Date | null;

  // smallint => driver trả về number, khớp EAccountStatus (1..4).
  // Migration không đặt DEFAULT nên mọi lệnh insert phải set status tường minh.
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
