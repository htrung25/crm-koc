import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

const READINESS_TIMEOUT_MS = 3000;

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  /** Liveness: chỉ trả lời là process còn sống. Không chạm dependency. */
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  /** Readiness: deploy.sh và rollback.sh dùng endpoint này làm cổng chặn. */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (Postgres + Redis)' })
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () =>
        this.database.pingCheck('postgres', { timeout: READINESS_TIMEOUT_MS }),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
