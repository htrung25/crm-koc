import { getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import type { Queue } from 'bullmq';
import { DatabaseModule } from './infra/database.module';
import { RedisModule } from './infra/redis.module';
import {
  BULL_HEALTH_QUEUES,
  BullHealthIndicator,
} from './module/health/bull.health';
import { RedisHealthIndicator } from './module/health/redis.health';
import { WorkerHealthController } from './module/health/worker-health.controller';
import { QueueModule } from './queue/queue.module';
import { QUEUE_EMAIL, QUEUE_KYC, QUEUE_STORAGE } from './queue/queue-names';

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
  ],
  controllers: [WorkerHealthController],
  providers: [
    RedisHealthIndicator,
    BullHealthIndicator,
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
