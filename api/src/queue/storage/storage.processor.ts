import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Queue } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { StorageLedgerService } from '../../common/services/storage-ledger.service';
import { StorageService } from '../../common/services/storage.service';
import { StorageGcService } from './storage-gc.service';
import {
  STORAGE_PREFIX_PENDING,
  STORAGE_PREFIX_VERIFIED,
} from '../../module/kyc/constants/kyc-storage.constants';
import { KycDocument } from '../../module/kyc/entities/kyc-document.entity';
import { repeatableJobOptions } from '../job-options';
import {
  JOB_PROMOTE_DOCUMENTS,
  JOB_SWEEP,
  QUEUE_STORAGE,
  SCHEDULER_SWEEP,
} from '../queue-names';
import type { PromoteDocumentsJob } from './storage-job.types';

@Processor(QUEUE_STORAGE)
export class StorageProcessor
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(StorageProcessor.name);

  constructor(
    private readonly storage: StorageService,
    private readonly ledger: StorageLedgerService,
    @InjectRepository(KycDocument)
    private readonly documentRepository: Repository<KycDocument>,
    private readonly dataSource: DataSource,
    @InjectQueue(QUEUE_STORAGE) private readonly queue: Queue,
    private readonly gcService: StorageGcService,
  ) {
    super();
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.queue.upsertJobScheduler(
      SCHEDULER_SWEEP,
      { pattern: '*/15 * * * *' },
      { name: JOB_SWEEP, opts: repeatableJobOptions() },
    );
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOB_PROMOTE_DOCUMENTS:
        return this.promote(job);
      case JOB_SWEEP:
        try {
          await this.gcService.sweep();
        } catch (error) {
          this.logger.warn(`sweep thất bại: ${(error as Error).message}`);
        }
        try {
          await this.gcService.reconcilePromotions();
        } catch (error) {
          this.logger.warn(
            `reconcile-promotions thất bại: ${(error as Error).message}`,
          );
        }
        return;
      default:
        this.logger.warn(`job storage không nhận diện được: ${job.name}`);
    }
  }

  /**
   * Idempotent: newKey TẤT ĐỊNH (pending/x → verified/x) nên copy lần hai ghi
   * đè đúng object cũ bằng nội dung y hệt, không sinh bản sao rác. Khác
   * uploadDocument() vốn dùng generateKey() ngẫu nhiên.
   */
  private async promote(job: Job): Promise<void> {
    const { submissionId } = job.data as PromoteDocumentsJob;
    const documents = await this.documentRepository.findBy({ submissionId });

    for (const doc of documents) {
      if (!doc.storageKey.startsWith(STORAGE_PREFIX_PENDING)) continue;

      const newKey = doc.storageKey.replace(
        STORAGE_PREFIX_PENDING,
        STORAGE_PREFIX_VERIFIED,
      );

      await this.ledger.markPending(newKey);
      await this.storage.copy(doc.storageKey, newKey);

      await this.dataSource.transaction(async (manager) => {
        await manager
          .getRepository(KycDocument)
          .update({ id: doc.id }, { storageKey: newKey });
        await this.ledger.markLinked(newKey, manager);
        await this.ledger.markGarbage(doc.storageKey, manager);
      });
    }
  }
}
