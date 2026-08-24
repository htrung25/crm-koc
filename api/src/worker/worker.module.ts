import { getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Queue } from 'bullmq';
import { EmailService } from '../common/services/email.service';
import { StorageLedgerService } from '../common/services/storage-ledger.service';
import { StorageService } from '../common/services/storage.service';
import { StorageObject } from '../common/entities/storage-object.entity';
import { DatabaseModule } from '../infra/database.module';
import { RedisModule } from '../infra/redis.module';
import { AuthEntity } from '../module/auth/entities/auth.entity';
import { KycDocument } from '../module/kyc/entities/kyc-document.entity';
import { KycSubmission } from '../module/kyc/entities/kyc-submission.entity';
import {
  BULL_HEALTH_QUEUES,
  BullHealthIndicator,
} from '../module/health/bull.health';
import { RedisHealthIndicator } from '../module/health/redis.health';
import { WorkerHealthController } from '../module/health/worker-health.controller';
import { EmailProcessor } from '../queue/email/email.processor';
import { KycExpiryService } from '../queue/kyc/kyc-expiry.service';
import { KycMaintenanceProcessor } from '../queue/kyc/kyc-maintenance.processor';
import { StorageGcService } from '../queue/storage/storage-gc.service';
import { StorageProcessor } from '../queue/storage/storage.processor';
import { QueueModule } from '../queue/queue.module';
import { QUEUE_EMAIL, QUEUE_KYC, QUEUE_STORAGE } from '../queue/queue-names';
import { OtpService } from '../security/otp.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    QueueModule,
    TerminusModule,
    TypeOrmModule.forFeature([
      KycSubmission,
      KycDocument,
      StorageObject,
      AuthEntity,
    ]),
  ],
  controllers: [WorkerHealthController],
  providers: [
    RedisHealthIndicator,
    BullHealthIndicator,
    EmailProcessor,
    EmailService,
    OtpService,
    KycExpiryService,
    KycMaintenanceProcessor,
    StorageProcessor,
    StorageService,
    StorageLedgerService,
    StorageGcService,
    {
      provide: BULL_HEALTH_QUEUES,
      inject: [
        getQueueToken(QUEUE_EMAIL),
        getQueueToken(QUEUE_STORAGE),
        getQueueToken(QUEUE_KYC),
      ],
      useFactory: (...queues: Queue[]) => queues,
    },
  ],
})
export class WorkerModule {}
