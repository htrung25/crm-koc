import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { storageJobOptions } from '../job-options';
import { JOB_PROMOTE_DOCUMENTS, QUEUE_STORAGE } from '../queue-names';
import type { PromoteDocumentsJob } from './storage-job.types';

@Injectable()
export class StorageQueueService {
  constructor(@InjectQueue(QUEUE_STORAGE) private readonly queue: Queue) {}

  async enqueuePromoteDocuments(submissionId: string): Promise<void> {
    const payload: PromoteDocumentsJob = { submissionId };
    await this.queue.add(
      JOB_PROMOTE_DOCUMENTS,
      payload,
      storageJobOptions(JOB_PROMOTE_DOCUMENTS),
    );
  }
}
