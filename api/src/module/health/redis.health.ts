import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { HealthIndicatorResult } from '@nestjs/terminus';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '../../infra/redis.module';

/** Terminus không có indicator cho node-redis nên tự PING. */
@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClientType,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      const reply = await this.redis.ping();
      return reply === 'PONG' ? indicator.up() : indicator.down({ reply });
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }
}
