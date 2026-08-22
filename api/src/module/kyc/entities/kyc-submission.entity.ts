import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ERole } from '../../../common/enum/roles.enum';
import { EKycRejectReason, EKycStatus } from '../../../common/enum/kyc.enum';

@Entity('kyc_submissions')
export class KycSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  /** Chỉ brand hoặc creator — admin không nộp KYC. */
  @Column({ type: 'varchar', length: 32 })
  role: ERole.BRAND | ERole.CREATOR;

  @Column({ type: 'smallint', default: EKycStatus.DRAFT })
  status: EKycStatus;

  /** 1..3. MORE_INFO không làm tăng số này. */
  @Column({ type: 'smallint', default: 1 })
  attemptNo: number;

  /** Chỗ móc sẵn cho module rút tiền; hiện luôn false. */
  @Column({ type: 'boolean', default: false })
  priority: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'smallint', nullable: true })
  rejectReason: EKycRejectReason | null;

  /** Bắt buộc khi rejectReason = OTHER; DB có CHECK ràng buộc. */
  @Column({ type: 'text', nullable: true })
  reviewNote: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
