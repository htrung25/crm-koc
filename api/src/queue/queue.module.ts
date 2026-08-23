import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailQueueService } from './email/email-queue.service';
import { QUEUE_EMAIL, QUEUE_KYC, QUEUE_STORAGE } from './queue-names';
import { StorageQueueService } from './storage/storage-queue.service';

/**
 * CHỈ producer. Processor nằm ở WorkerModule — @Processor được BullExplorer
 * quét từ container DI đang chạy, nên nhét processor vào đây là container `api`
 * cũng rút job khỏi queue mà không có dấu hiệu nào.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(config.get('REDIS_PORT', 6379)),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(config.get('REDIS_DB', 0)),
          // BullMQ yêu cầu null: để mặc định thì worker tự chết khi Redis
          // chớp mạng thay vì chờ kết nối lại.
          maxRetriesPerRequest: null,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_EMAIL },
      { name: QUEUE_STORAGE },
      { name: QUEUE_KYC },
    ),
  ],
  providers: [EmailQueueService, StorageQueueService],
  exports: [EmailQueueService, StorageQueueService, BullModule],
})
export class QueueModule {}
