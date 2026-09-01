import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';
import { BullHealthIndicator } from './bull.health';
import { RedisHealthIndicator } from './redis.health';

const READINESS_TIMEOUT_MS = 3000;

/** Readiness riêng của worker: HealthModule của API không cần biết gì về queue. */
@ApiTags('health')
@Controller('health')
export class WorkerHealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly bull: BullHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe (worker)' })
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (Postgres + Redis + BullMQ)' })
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () =>
        this.database.pingCheck('postgres', { timeout: READINESS_TIMEOUT_MS }),
      () => this.redis.isHealthy('redis'),
      () => this.bull.isHealthy('bull'),
    ]);
  }
}
