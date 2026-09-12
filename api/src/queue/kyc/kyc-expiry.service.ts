import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EKycStatus } from '../../common/enum/kyc.enum';
import { KycSubmission } from '../../module/kyc/entities/kyc-submission.entity';
import { KycService } from '../../module/kyc/kyc.service';
import { KYC_SYSTEM_ACTOR } from '../../module/kyc/constants/kyc.constants';
import { EmailQueueService } from '../email/email-queue.service';

/** Trạng thái đáng báo cho người dùng. DRAFT/PENDING thì chưa có gì để báo. */
export const NOTIFIABLE = [
  EKycStatus.MORE_INFO,
  EKycStatus.VERIFIED,
  EKycStatus.REJECTED,
  EKycStatus.LOCKED,
  EKycStatus.EXPIRED,
];

export const RECONCILE_BATCH = 200;

@Injectable()
export class KycExpiryService {
  private readonly logger = new Logger(KycExpiryService.name);

  constructor(
    @InjectRepository(KycSubmission)
    private readonly submissionRepository: Repository<KycSubmission>,
    private readonly emailQueue: EmailQueueService,
    private readonly configService: ConfigService,
  ) {}

  async reconcileNotifications(): Promise<number> {
    const rows = await this.submissionRepository
      .createQueryBuilder('kyc')
      .select(['kyc.id AS id', 'kyc.status AS status'])
      .where('kyc.notifiedAt IS NULL')
      .andWhere('kyc.status IN (:...statuses)', { statuses: NOTIFIABLE })
      .andWhere(
        '(kyc.notificationClaimUntil IS NULL OR kyc.notificationClaimUntil <= CURRENT_TIMESTAMP)',
      )
      // Không bỏ rơi thông báo sau outage kéo dài. Claim cập nhật updatedAt,
      // nên hồ sơ lỗi được đưa cuối lượt, không chiếm mãi batch đầu.
      .orderBy('kyc.updatedAt', 'ASC')
      .addOrderBy('kyc.id', 'ASC')
      .limit(RECONCILE_BATCH)
      .getRawMany<{ id: string; status: EKycStatus }>();

    for (const row of rows) {
      await this.emailQueue.enqueueKycStatus(row.id, row.status);
    }

    if (rows.length) {
      this.logger.log(`reconcile: enqueue lại ${rows.length} thông báo KYC`);
    }
    return rows.length;
  }

  /** Bulk compare-and-set ở DB giữ tính nguyên tử; state machine giữ luật actor. */
  async expireVerified(): Promise<number> {
    KycService.assertKycTransition(
      EKycStatus.VERIFIED,
      EKycStatus.EXPIRED,
      KYC_SYSTEM_ACTOR,
    );

    const result = await this.submissionRepository
      .createQueryBuilder()
      .update(KycSubmission)
      // Không đụng reviewNote/reviewedBy: ghi đè là mất ghi chú gốc của admin.
      // status EXPIRED cộng expiresAt đã kể đủ câu chuyện.
      .set({
        status: EKycStatus.EXPIRED,
        notifiedAt: null,
        notificationClaimToken: null,
        notificationClaimUntil: null,
      })
      .where('status = :verified', { verified: EKycStatus.VERIFIED })
      .andWhere('expires_at < now()')
      .returning('id')
      .execute();

    const rows = (result.raw ?? []) as { id: string }[];
    for (const row of rows) {
      await this.emailQueue.enqueueKycStatus(row.id, EKycStatus.EXPIRED);
    }

    if (rows.length) {
      this.logger.log(`expire-verified: ${rows.length} hồ sơ KYC hết hạn`);
    }
    return rows.length;
  }
}
