import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { emailJobOptions } from '../job-options';
import { JOB_SEND_KYC_STATUS, JOB_SEND_OTP, QUEUE_EMAIL } from '../queue-names';
import type { SendKycStatusJob, SendOtpJob } from './email-job.types';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue(QUEUE_EMAIL) private readonly queue: Queue) {}

  async enqueueOtp(payload: SendOtpJob): Promise<void> {
    await this.queue.add(JOB_SEND_OTP, payload, emailJobOptions(JOB_SEND_OTP));
  }

  async enqueueKycStatus(submissionId: string): Promise<void> {
    const payload: SendKycStatusJob = { submissionId };
    await this.queue.add(
      JOB_SEND_KYC_STATUS,
      payload,
      emailJobOptions(JOB_SEND_KYC_STATUS),
    );
  }
}
