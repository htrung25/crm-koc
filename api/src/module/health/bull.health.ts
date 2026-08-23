import { Inject, Injectable, Optional } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { HealthIndicatorResult } from '@nestjs/terminus';
import type { Queue } from 'bullmq';

export const BULL_HEALTH_QUEUES = 'BULL_HEALTH_QUEUES';

/** Ngân sách timeout mặc định cho toàn bộ lần check, cùng mức với postgres. */
export const BULL_HEALTH_TIMEOUT_MS = 3000;

/**
 * Ping được Postgres/Redis chưa nói lên worker đang tiêu thụ job. Indicator này
 * khẳng định đúng thứ deploy gate cần biết: kết nối queue sống và không paused.
 *
 * Toàn bộ vòng check bị bó trong một ngân sách timeout duy nhất — queue nào
 * chưa xong khi hết hạn bị coi là down (timedOut), không được để treo request.
 */
@Injectable()
export class BullHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(BULL_HEALTH_QUEUES) private readonly queues: Queue[],
    @Optional() private readonly timeoutMs: number = BULL_HEALTH_TIMEOUT_MS,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const notReady: string[] = [];
    const paused: string[] = [];
    const pending = new Set(this.queues.map((queue) => queue.name));

    const checks = Promise.all(
      this.queues.map(async (queue) => {
        const client = await queue.client;
        if (client.status !== 'ready') notReady.push(queue.name);
        if (await queue.isPaused()) paused.push(queue.name);
        pending.delete(queue.name);
      }),
    );

    let timer: NodeJS.Timeout;
    const timedOutMarker = Symbol('bull-health-timeout');
    const timeout = new Promise<typeof timedOutMarker>((resolve) => {
      timer = setTimeout(() => resolve(timedOutMarker), this.timeoutMs);
    });

    const result = await Promise.race([checks, timeout]);
    clearTimeout(timer!);

    const timedOut = result === timedOutMarker ? [...pending] : [];

    const payload: Record<string, string[]> = {};
    if (notReady.length) payload.notReady = notReady;
    if (paused.length) payload.paused = paused;
    if (timedOut.length) payload.timedOut = timedOut;

    if (Object.keys(payload).length) return indicator.down(payload);
    return indicator.up();
  }
}
