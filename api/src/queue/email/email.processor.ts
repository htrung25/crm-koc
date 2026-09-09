import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { EmailService } from '../../common/services/email.service';
import { EKycRejectReason, EKycStatus } from '../../common/enum/kyc.enum';
import { AuthEntity } from '../../module/auth/entities/auth.entity';
import { KYC_STATUS_LABEL } from '../../module/kyc/constants/kyc.constants';
import { KycSubmission } from '../../module/kyc/entities/kyc-submission.entity';
import { OtpService } from '../../security/otp.service';
import { JOB_SEND_KYC_STATUS, JOB_SEND_OTP, QUEUE_EMAIL } from '../queue-names';
import type { SendKycStatusJob, SendOtpJob } from './email-job.types';

const EMAIL_PROCESSOR_CONCURRENCY = 5;

@Processor(QUEUE_EMAIL, { concurrency: EMAIL_PROCESSOR_CONCURRENCY })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly otpTtlSeconds: number;

  constructor(
    private readonly emailService: EmailService,
    configService: ConfigService,
    @InjectRepository(KycSubmission)
    private readonly submissionRepository: Repository<KycSubmission>,
    @InjectRepository(AuthEntity)
    private readonly accountRepository: Repository<AuthEntity>,
    private readonly otpService: OtpService,
  ) {
    super();
    this.otpTtlSeconds = Number(configService.get('OTP_TTL_SECONDS', 300));
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOB_SEND_OTP:
        return this.sendOtp(job);
      case JOB_SEND_KYC_STATUS:
        return this.sendKycStatus(job);
      default:
        this.logger.warn(`unrecognized email job: ${job.name}`);
    }
  }

  private async sendOtp(job: Job): Promise<void> {
    const data = job.data as SendOtpJob;

    // Guard rẻ, chặn trước khi chạm Redis/DB. TTL của key mới là chốt thật.
    const ageSeconds = (Date.now() - job.timestamp) / 1000;
    if (ageSeconds > this.otpTtlSeconds) {
      this.logger.warn(
        `dropping expired OTP job for account ${data.accountId}`,
      );
      return;
    }

    // Nhánh data.otp là payload cũ còn kẹt trong queue lúc rolling deploy.
    // Gỡ ở release sau, cùng lúc với ba field optional trong SendOtpJob.
    if (data.otp && data.email) {
      await this.emailService.sendOtpEmail(
        data.email,
        data.otp,
        data.displayName ?? 'Valued User',
      );
      return;
    }

    // Key hết hạn thì không còn gì đáng gửi: retry không gửi mã chết nữa.
    const otp = await this.otpService.peek(data.accountId);
    if (!otp) {
      this.logger.warn(
        `OTP for account ${data.accountId} has expired, skipping job`,
      );
      return;
    }

    const account = await this.accountRepository.findOne({
      where: { id: data.accountId },
      select: { email: true, name: true },
    });
    if (!account?.email) {
      this.logger.warn(
        `account ${data.accountId} has no email address to send OTP`,
      );
      return;
    }

    await this.emailService.sendOtpEmail(
      account.email,
      otp,
      account.name || 'Valued User',
    );
  }

  private async sendKycStatus(job: Job): Promise<void> {
    const { submissionId, status } = job.data as SendKycStatusJob;

    // Giành quyền bằng một câu ghi trước khi gửi; ràng `status` để job của lần
    // đổi cũ tự nhận ra mình lỗi thời và bỏ qua.
    const claimed = await this.submissionRepository
      .createQueryBuilder()
      .update(KycSubmission)
      .set({ notifiedAt: new Date() })
      .where(
        'id = :submissionId AND status = :status AND notified_at IS NULL',
        { submissionId, status },
      )
      .execute();
    if (!claimed.affected) return;

    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: { account: true },
    });
    if (!submission) {
      this.logger.warn(`KYC submission ${submissionId} no longer exists`);
      return;
    }

    const email = submission.account?.email;
    if (!email) {
      this.logger.warn(
        `KYC submission ${submissionId} has no email address to send`,
      );
      return;
    }

    // Đã đánh dấu trước khi gửi, nên hỏng thì phải trả lại để BullMQ retry còn
    // tác dụng — không trả lại là thông báo mất luôn.
    let sent = false;
    try {
      sent = await this.emailService.sendKycStatusNotification({
        to: email,
        displayName: submission.account.name || 'Valued User',
        status: KYC_STATUS_LABEL[status],
        rejectReason: submission.rejectReason
          ? EKycRejectReason[submission.rejectReason]
          : null,
        reviewNote: submission.reviewNote,
      });
    } catch (error) {
      await this.releaseClaim(submissionId, status);
      throw error;
    }

    // sent=false nghĩa là toggle email đang tắt — tình trạng tạm thời, nhả ra
    // để reconcile gửi lại khi bật.
    if (!sent) {
      await this.releaseClaim(submissionId, status);
    }
  }

  private async releaseClaim(
    submissionId: string,
    status: EKycStatus,
  ): Promise<void> {
    await this.submissionRepository
      .createQueryBuilder()
      .update(KycSubmission)
      .set({ notifiedAt: null })
      .where('id = :submissionId AND status = :status', {
        submissionId,
        status,
      })
      .execute();
  }
}
