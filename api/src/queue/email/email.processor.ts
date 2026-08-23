import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { EmailService } from '../../common/services/email.service';
import { KycSubmission } from '../../module/kyc/entities/kyc-submission.entity';
import { JOB_SEND_KYC_STATUS, JOB_SEND_OTP, QUEUE_EMAIL } from '../queue-names';
import type { SendOtpJob } from './email-job.types';

@Processor(QUEUE_EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly otpTtlSeconds: number;

  constructor(
    private readonly emailService: EmailService,
    configService: ConfigService,
    // Chưa dùng: nối ở task sau cho nhánh send-kyc-status. Khai sẵn để lần
    // sau không phải đổi lại constructor lẫn wiring ở WorkerModule.
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
        // Nhánh này được nối ở task sau.
        return;
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
}
