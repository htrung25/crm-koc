import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { Job } from 'bullmq';
import { Queue } from 'bullmq';
import { repeatableJobOptions } from '../job-options';
import {
  JOB_EXPIRE_VERIFIED,
  JOB_RECONCILE_NOTIFICATIONS,
  QUEUE_KYC,
  SCHEDULER_EXPIRE_VERIFIED,
  SCHEDULER_RECONCILE,
} from '../queue-names';
import { KycExpiryService } from './kyc-expiry.service';

@Processor(QUEUE_KYC)
export class KycMaintenanceProcessor
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(KycMaintenanceProcessor.name);

  constructor(
    private readonly expiryService: KycExpiryService,
    @InjectQueue(QUEUE_KYC) private readonly queue: Queue,
  ) {
    super();
  }

  /** upsert nên worker restart bao nhiêu lần cũng không nhân bản lịch. */
  async onApplicationBootstrap(): Promise<void> {
    await this.queue.upsertJobScheduler(
      SCHEDULER_RECONCILE,
      { pattern: '0 * * * *' },
      { name: JOB_RECONCILE_NOTIFICATIONS, opts: repeatableJobOptions() },
    );
    await this.queue.upsertJobScheduler(
      SCHEDULER_EXPIRE_VERIFIED,
      { pattern: '0 2 * * *' },
      { name: JOB_EXPIRE_VERIFIED, opts: repeatableJobOptions() },
    );
  }

  async process(job: Job): Promise<void> {
    if (job.name === JOB_RECONCILE_NOTIFICATIONS) {
      await this.expiryService.reconcileNotifications();
      return;
    }
    if (job.name === JOB_EXPIRE_VERIFIED) {
      await this.expiryService.expireVerified();
      return;
    }
    this.logger.warn(`job kyc không nhận diện được: ${job.name}`);
  }
}
