import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisClientType } from 'redis';
import { ERole } from '../common/enum/roles.enum';
import {
  SESSION_COOKIE_DEFAULT_NAME,
  SESSION_COOKIE_NAME_KEY,
} from '../common/constants/session.constants';
import { ESessionEventType } from '../common/enum/session-event-types.enum';
import { SessionEventService } from './session-event.service';
import { SESSION_FUNCTIONS } from '../../scripts/session.scripts.js';
import { callAuthRedisFunction } from '../infra/redis-functions';
import { requireDeviceId } from '../common/util/device-binding.util';

export interface AdminSession {
  sessionId: string;
  adminId: string;
  email: string;
  displayName: string;
  role: ERole | null;
  csrfToken: string;
  currentJti: string;
  createdAt: string;
  expiresAt: string;
  absoluteExpiresAt: string;
  lastSeenAt?: string;
  deviceId?: string;
  loginIp?: string;
  loginUserAgent?: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly ttlSeconds: number;
  private readonly maxSessionsAdmin: number;
  private readonly maxSessionsUser: number;
  private readonly touchIntervalSeconds: number;
  private readonly cookieName: string;
  private readonly absoluteTtlSeconds: number;

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: RedisClientType,
    configService: ConfigService,
    private readonly sessionEventService: SessionEventService,
  ) {
    this.ttlSeconds = this.positiveInteger(
      'SESSION_TTL_SECONDS',
      configService.get('SESSION_TTL_SECONDS', 7 * 24 * 60 * 60),
    );
    this.absoluteTtlSeconds = this.positiveInteger(
      'SESSION_ABSOLUTE_TTL_SECONDS',
      configService.get('SESSION_ABSOLUTE_TTL_SECONDS', 7 * 24 * 60 * 60),
    );
    this.touchIntervalSeconds = this.positiveInteger(
      'SESSION_TOUCH_INTERVAL_SECONDS',
      configService.get('SESSION_TOUCH_INTERVAL_SECONDS', 5 * 60),
    );
    this.cookieName = configService.get<string>(
      SESSION_COOKIE_NAME_KEY,
      SESSION_COOKIE_DEFAULT_NAME,
    );
    this.maxSessionsAdmin = this.positiveInteger(
      'SESSION_MAX_PER_ADMIN',
      configService.get('SESSION_MAX_PER_ADMIN', 3),
    );
    this.maxSessionsUser = this.positiveInteger(
      'SESSION_MAX_PER_USER',
      configService.get('SESSION_MAX_PER_USER', 10),
    );
    if (/[{}]/.test(this.cookieName))
      throw new Error(
        'SESSION_COOKIE_NAME must not contain Redis hash-tag braces',
      );
  }

  private positiveInteger(key: string, raw: unknown): number {
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) {
      throw new Error(`${key} must be a positive integer <= 2147483647`);
    }
    return value;
  }

  private getUserKey(adminId: string): string {
    return `${this.cookieName}:user:${adminId}`;
  }

  /** Keep the legacy sessions key; hashing its full name puts the index in the same cluster slot. */
  private keys(accountId: string): string[] {
    if (!accountId || /[{}]/.test(accountId))
      throw new BadRequestException('invalid account id');
    const key = this.getUserKey(accountId);
    return [key, `{${key}}:devices`];
  }

  private run(
    functionName: string,
    accountId: string,
    payload: Record<string, unknown>,
  ) {
    return callAuthRedisFunction(this.redis, functionName, {
      keys: this.keys(accountId),
      arguments: [JSON.stringify({ ...payload, accountId })],
    });
  }

  async createSession(
    data: Omit<AdminSession, 'createdAt' | 'expiresAt' | 'absoluteExpiresAt'>,
  ): Promise<AdminSession> {
    const deviceId = requireDeviceId(data.deviceId);
    const now = new Date();
    const absoluteExpiresAt = new Date(
      now.getTime() + this.absoluteTtlSeconds * 1000,
    );
    const session: AdminSession = {
      ...data,
      deviceId,
      createdAt: now.toISOString(),
      expiresAt: new Date(
        Math.min(
          now.getTime() + this.ttlSeconds * 1000,
          absoluteExpiresAt.getTime(),
        ),
      ).toISOString(),
      absoluteExpiresAt: absoluteExpiresAt.toISOString(),
    };
    const cap =
      session.role === ERole.ADMIN
        ? this.maxSessionsAdmin
        : this.maxSessionsUser;
    const raw = await this.run(SESSION_FUNCTIONS.create, session.adminId, {
      session,
      cap,
    });
    const result = JSON.parse(raw as string) as {
      removed:
        | {
            sessionId: string;
            replacedBy: string;
            reason: 'same_device_login' | 'duplicate_device' | 'device_limit';
          }[]
        | Record<string, never>;
    };
    // Redis cjson encodes an empty Lua list as {}.
    const removed = Array.isArray(result.removed) ? result.removed : [];
    const evicted = removed.filter((item) => item.reason === 'device_limit');
    if (evicted.length) {
      this.logger.warn(
        `Account ${session.adminId} vượt trần ${cap} thiết bị, thu hồi ${evicted.length} phiên`,
      );
    }
    await Promise.all(
      removed.map((item) =>
        this.sessionEventService.record({
          eventType: ESessionEventType.EVICTED,
          accountId: session.adminId,
          sessionId: item.sessionId,
          metadata: {
            cap,
            replacedBy: item.replacedBy,
            triggeredBy: session.sessionId,
            reason: item.reason,
          },
        }),
      ),
    );
    return session;
  }

  async getSession(
    adminId: string,
    sessionId: string,
  ): Promise<AdminSession | null> {
    const raw = await this.run(SESSION_FUNCTIONS.read, adminId, { sessionId });
    return typeof raw === 'string' ? (JSON.parse(raw) as AdminSession) : null;
  }

  /** Read/patch the latest Redis value, never write a caller's stale session snapshot. */
  async refreshSession(session: AdminSession): Promise<void> {
    const raw = await this.update(session.adminId, session.sessionId, {
      operation: 'touch',
      touchIntervalMs: this.touchIntervalSeconds * 1000,
    });
    this.acceptUpdate(session, raw);
  }

  async attachDevice(session: AdminSession, deviceId: string): Promise<void> {
    const raw = await this.update(session.adminId, session.sessionId, {
      operation: 'attach',
      deviceId: requireDeviceId(deviceId),
    });
    this.acceptUpdate(session, raw);
  }

  private acceptUpdate(session: AdminSession, raw: string): void {
    if (raw === 'missing' || raw === 'device_mismatch') {
      throw new UnauthorizedException(
        'session is no longer valid; sign in again',
      );
    }
    Object.assign(session, JSON.parse(raw) as AdminSession);
  }

  private async update(
    adminId: string,
    sessionId: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const now = new Date();
    return (await this.run(SESSION_FUNCTIONS.update, adminId, {
      ...payload,
      sessionId,
      nowIso: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.ttlSeconds * 1000).toISOString(),
    })) as string;
  }

  async deleteSession(adminId: string, sessionId: string): Promise<void> {
    await this.run(SESSION_FUNCTIONS.delete, adminId, { sessionId });
  }

  async deleteAllByAccount(
    adminId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    return (await this.run(SESSION_FUNCTIONS.deleteAccount, adminId, {
      exceptSessionId,
    })) as number;
  }

  async rotateJti(
    adminId: string,
    sessionId: string,
    expectedJti: string,
    newJti: string,
  ): Promise<'ok' | 'mismatch' | 'missing'> {
    const raw = await this.update(adminId, sessionId, {
      operation: 'rotate',
      expectedJti,
      newJti,
    });
    return raw === 'missing' || raw === 'mismatch' ? raw : 'ok';
  }
}
