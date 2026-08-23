import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { HealthIndicatorResult } from '@nestjs/terminus';
import type { Queue } from 'bullmq';

export const BULL_HEALTH_QUEUES = 'BULL_HEALTH_QUEUES';

/**
 * Ping được Postgres/Redis chưa nói lên worker đang tiêu thụ job. Indicator này
 * khẳng định đúng thứ deploy gate cần biết: kết nối queue sống và không paused.
 */
@Injectable()
export class BullHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(BULL_HEALTH_QUEUES) private readonly queues: Queue[],
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const notReady: string[] = [];
    const paused: string[] = [];

    for (const queue of this.queues) {
      const client = await queue.client;
      if (client.status !== 'ready') notReady.push(queue.name);
      if (await queue.isPaused()) paused.push(queue.name);
    }

    if (notReady.length) return indicator.down({ notReady });
    if (paused.length) return indicator.down({ paused });
    return indicator.up();
  }
}
