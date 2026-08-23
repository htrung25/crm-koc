import { getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Queue } from 'bullmq';
import { EmailService } from '../common/services/email.service';
import { DatabaseModule } from '../infra/database.module';
import { RedisModule } from '../infra/redis.module';
import { KycSubmission } from '../module/kyc/entities/kyc-submission.entity';
import {
  BULL_HEALTH_QUEUES,
  BullHealthIndicator,
} from '../module/health/bull.health';
import { RedisHealthIndicator } from '../module/health/redis.health';
import { WorkerHealthController } from '../module/health/worker-health.controller';
import { EmailProcessor } from '../queue/email/email.processor';
import { QueueModule } from '../queue/queue.module';
import { QUEUE_EMAIL, QUEUE_KYC, QUEUE_STORAGE } from '../queue/queue-names';

/**
 * Điểm DUY NHẤT được phép import processor. Container `api` chỉ là producer;
 * @Processor lọt vào AppModule là nó âm thầm rút job khỏi queue.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    QueueModule,
    TerminusModule,
    TypeOrmModule.forFeature([KycSubmission]),
  ],
  controllers: [WorkerHealthController],
  providers: [
    RedisHealthIndicator,
    BullHealthIndicator,
    EmailProcessor,
    EmailService,
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
