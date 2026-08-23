import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { EmailService } from '../../common/services/email.service';
import { EKycRejectReason } from '../../common/enum/kyc.enum';
import { KYC_STATUS_LABEL } from '../../module/kyc/constants/kyc.constants';
import { KycSubmission } from '../../module/kyc/entities/kyc-submission.entity';
import { JOB_SEND_KYC_STATUS, JOB_SEND_OTP, QUEUE_EMAIL } from '../queue-names';
import type { SendKycStatusJob, SendOtpJob } from './email-job.types';

@Processor(QUEUE_EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly otpTtlSeconds: number;

  constructor(
    private readonly emailService: EmailService,
    configService: ConfigService,
    @InjectRepository(KycSubmission)
    private readonly submissionRepository: Repository<KycSubmission>,
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
        this.logger.warn(`job email không nhận diện được: ${job.name}`);
    }
  }

  private async sendOtp(job: Job): Promise<void> {
    const data = job.data as SendOtpJob;

    // OTP sống 300s. Retry sau mốc đó là gửi một mã đã chết.
    const ageSeconds = (Date.now() - job.timestamp) / 1000;
    if (ageSeconds > this.otpTtlSeconds) {
      this.logger.warn(`bỏ OTP quá hạn của account ${data.accountId}`);
      return;
    }

    await this.emailService.sendOtpEmail(
      data.email,
      data.otp,
      data.displayName,
    );
  }

  private async sendKycStatus(job: Job): Promise<void> {
    const { submissionId } = job.data as SendKycStatusJob;

    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: { account: true },
    });
    if (!submission) {
      this.logger.warn(`hồ sơ KYC ${submissionId} không còn tồn tại`);
      return;
    }

    // Chốt chống gửi trùng đặt ở DB, không phải jobId: removeOnComplete trả
    // jobId về trạng thái tự do ngay khi job xong nên job thứ hai cùng id vẫn
    // chạy được.
    if (submission.notifiedAt) return;

    const email = submission.account?.email;
    if (!email) {
      this.logger.warn(`hồ sơ KYC ${submissionId} không có email để gửi`);
      return;
    }

    await this.emailService.sendKycStatusNotification({
      to: email,
      displayName: submission.account.name || 'Valued User',
      status: KYC_STATUS_LABEL[submission.status],
      rejectReason: submission.rejectReason
        ? EKycRejectReason[submission.rejectReason]
        : null,
      reviewNote: submission.reviewNote,
    });

    // Ghi SAU khi gửi xong. Cửa sổ giữa hai dòng này là lý do ngữ nghĩa là
    // at-least-once chứ không phải exactly-once — không đóng được nếu không có
    // giao dịch phân tán với SendGrid.
    await this.submissionRepository.update(
      { id: submissionId },
      { notifiedAt: new Date() },
    );
  }
}
