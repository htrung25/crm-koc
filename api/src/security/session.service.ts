import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisClientType } from 'redis';
import { ERole } from '../common/enum/roles.enum';
import {
  SESSION_COOKIE_DEFAULT_NAME,
  SESSION_COOKIE_NAME_KEY,
} from '../common/constants/session.constants';
import { ESessionEventType } from '../common/enum/session-event-types.enum';
import { SessionEventService } from './session-event.service';

export interface AdminSession {
  sessionId: string;
  adminId: string;
  email: string;
  displayName: string;
  role: ERole;
  csrfToken: string;
  currentJti: string;
  createdAt: string;
  expiresAt: string;
  absoluteExpiresAt: string;
  lastSeenAt?: string;
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
    private readonly configService: ConfigService,
    private readonly sessionEventService: SessionEventService,
  ) {
    this.ttlSeconds = this.configService.get<number>(
      'SESSION_TTL_SECONDS',
      7 * 24 * 60 * 60,
    );
    this.absoluteTtlSeconds = this.configService.get<number>(
      'SESSION_ABSOLUTE_TTL_SECONDS',
      7 * 24 * 60 * 60,
    );
    this.touchIntervalSeconds = Number(
      this.configService.get('SESSION_TOUCH_INTERVAL_SECONDS', 5 * 60),
    );
    this.cookieName = this.configService.get<string>(
      SESSION_COOKIE_NAME_KEY,
      SESSION_COOKIE_DEFAULT_NAME,
    );
    // Admin siết chặt hơn: ít thiết bị hơn, thiệt hại khi lộ token cũng nhỏ hơn.
    this.maxSessionsAdmin = this.configService.get<number>(
      'SESSION_MAX_PER_ADMIN',
      3,
    );
    this.maxSessionsUser = this.configService.get<number>(
      'SESSION_MAX_PER_USER',
      10,
    );
  }

  private getUserKey(adminId: string): string {
    return `${this.cookieName}:user:${adminId}`;
  }

  async createSession(
    data: Omit<AdminSession, 'createdAt' | 'expiresAt' | 'absoluteExpiresAt'>,
  ): Promise<AdminSession> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);
    const absoluteExpiresAt = new Date(
      now.getTime() + this.absoluteTtlSeconds * 1000,
    );
    const session: AdminSession = {
      ...data,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      absoluteExpiresAt: absoluteExpiresAt.toISOString(),
    };

    await this.writeSession(session, this.ttlSeconds);
    await this.enforceSessionCap(session);
    return session;
  }

  private async enforceSessionCap(current: AdminSession): Promise<void> {
    const cap =
      current.role === ERole.ADMIN
        ? this.maxSessionsAdmin
        : this.maxSessionsUser;

    const key = this.getUserKey(current.adminId);
    const all = await this.redis.hGetAll(key);
    const ids = Object.keys(all);
    if (ids.length <= cap) return;

    // Đá thiết bị lâu không dùng nhất, không phải đăng nhập sớm nhất: máy dùng
    // hằng ngày từ tuần trước đáng giữ hơn điện thoại đăng nhập hôm qua rồi bỏ.
    const victims = ids
      .filter((id) => id !== current.sessionId)
      .map((id) => ({ id, at: this.lastActivityOf(all[id]) }))
      .sort((a, b) => a.at - b.at)
      .slice(0, ids.length - cap)
      .map((v) => v.id);

    if (!victims.length) return;
    await this.redis.hDel(key, victims);
    this.logger.warn(
      `Account ${current.adminId} vượt trần ${cap} phiên, đá ${victims.length}`,
    );

    // Ghi từng phiên bị đá để còn lần được thiết bị nào biến mất lúc nào.
    await Promise.all(
      victims.map((sessionId) =>
        this.sessionEventService.record({
          eventType: ESessionEventType.EVICTED,
          accountId: current.adminId,
          sessionId,
          metadata: { cap, replacedBy: current.sessionId },
        }),
      ),
    );
  }

  /** JSON hỏng trả 0 => bị đá trước tiên, đúng ý vì nó vốn không đọc được. */
  private lastActivityOf(raw: string): number {
    try {
      const s = JSON.parse(raw) as AdminSession;
      return Date.parse(s.lastSeenAt ?? s.createdAt) || 0;
    } catch {
      return 0;
    }
  }

  /** HSET + HEXPIRE luôn đi cùng nhau: field không TTL sẽ sống mãi. */
  private async writeSession(
    session: AdminSession,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.getUserKey(session.adminId);
    await this.redis.hSet(key, session.sessionId, JSON.stringify(session));
    await this.redis.hExpire(key, session.sessionId, ttlSeconds);
  }

  async getSession(
    adminId: string,
    sessionId: string,
  ): Promise<AdminSession | null> {
    const key = this.getUserKey(adminId);
    const raw = await this.redis.hGet(key, sessionId);
    if (!raw) return null;

    const session = JSON.parse(raw) as AdminSession;
    const now = new Date();

    // HEXPIRE đã dọn theo hạn nghỉ, nhưng vẫn kiểm lại ở đây vì hạn tuyệt đối
    // chỉ nằm trong JSON — Redis không biết gì về nó.
    const idleExpired = new Date(session.expiresAt) < now;
    const absoluteExpired =
      session.absoluteExpiresAt && new Date(session.absoluteExpiresAt) < now;

    if (idleExpired || absoluteExpired) {
      await this.redis.hDel(key, sessionId);
      return null;
    }
    return session;
  }

  async refreshSession(session: AdminSession): Promise<void> {
    const now = new Date();

    // lastSeenAt là mốc lần ghi gần nhất; phiên mới tạo thì lấy createdAt.
    const lastTouch = new Date(session.lastSeenAt ?? session.createdAt);
    const sinceLastTouchMs = now.getTime() - lastTouch.getTime();
    if (sinceLastTouchMs < this.touchIntervalSeconds * 1000) {
      return;
    }

    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);
    session.lastSeenAt = now.toISOString();
    session.expiresAt = expiresAt.toISOString();
    await this.writeSession(session, this.ttlSeconds);
  }

  async deleteSession(adminId: string, sessionId: string): Promise<void> {
    await this.redis.hDel(this.getUserKey(adminId), sessionId);
  }

  /**
   * Xoa moi phien cua mot account. Tra ve so phien da xoa.
   */
  async deleteAllByAccount(
    adminId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const key = this.getUserKey(adminId);
    const sessionIds = await this.redis.hKeys(key);
    const targets = sessionIds.filter((id) => id !== exceptSessionId);
    if (!targets.length) return 0;

    // Xoa ca hash khi khong giu lai gi: re hon HDEL tung field.
    if (targets.length === sessionIds.length) {
      await this.redis.del(key);
    } else {
      await this.redis.hDel(key, targets);
    }
    return targets.length;
  }

  /**
   * Doi currentJti mot cach NGUYEN TU: chi doi khi jti hien tai dung nhu mong
   * doi. Dong thoi gia han phien (sliding) - refresh token la bang chung nguoi
   * dung con hoat dong, nen phai day lui han nghi. Han TUYET DOI trong JSON
   * khong bi dung toi, no van la tran cung.
   */
  async rotateJti(
    adminId: string,
    sessionId: string,
    expectedJti: string,
    newJti: string,
  ): Promise<'ok' | 'mismatch' | 'missing'> {
    const script = `
      local raw = redis.call('HGET', KEYS[1], ARGV[1])
      if not raw then return 'missing' end
      local session = cjson.decode(raw)
      if session.currentJti ~= ARGV[2] then return 'mismatch' end
      session.currentJti = ARGV[3]
      session.lastSeenAt = ARGV[4]
      session.expiresAt = ARGV[5]
      redis.call('HSET', KEYS[1], ARGV[1], cjson.encode(session))
      redis.call('HEXPIRE', KEYS[1], ARGV[6], 'FIELDS', 1, ARGV[1])
      return 'ok'
    `;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);
    const result = await this.redis.eval(script, {
      keys: [this.getUserKey(adminId)],
      arguments: [
        sessionId,
        expectedJti,
        newJti,
        now.toISOString(),
        expiresAt.toISOString(),
        String(this.ttlSeconds),
      ],
    });
    return result as 'ok' | 'mismatch' | 'missing';
  }
}
