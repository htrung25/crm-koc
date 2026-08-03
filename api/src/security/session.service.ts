import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisClientType } from 'redis';
import { AdminSessionScope } from '../common/enum/admin-scopes.enum';
import { ERole } from '../common/enum/roles.enum';
import {
  SESSION_COOKIE_DEFAULT_NAME,
  SESSION_COOKIE_NAME_KEY,
} from '../common/constants/session.constants';

export interface AdminSession {
  sessionId: string;
  adminId: string;
  email: string;
  displayName: string;
  role: ERole;
  scopes: AdminSessionScope[];
  csrfToken: string;
  /**
   * jti của refresh token ĐANG hợp lệ. Mỗi lần refresh thành công giá trị này
   * bị thay, nên token cũ lập tức vô hiệu — đó là cách phát hiện refresh token
   * bị đánh cắp và dùng lại.
   */
  currentJti: string;
  createdAt: string;
  expiresAt: string; // idle timeout deadline (updated on each request)
  absoluteExpiresAt: string; // absolute timeout deadline (fixed 8h, never changes)
  lastSeenAt?: string;
}

@Injectable()
export class SessionService {
  private readonly ttlSeconds: number;
  private readonly touchIntervalSeconds: number;
  private readonly cookieName: string;
  private readonly ABSOLUTE_TTL_SECONDS = 8 * 60 * 60; // 8 hours

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: RedisClientType,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = this.configService.get<number>(
      'SESSION_TTL_SECONDS',
      30 * 60,
    );
    this.touchIntervalSeconds = Number(
      this.configService.get('SESSION_TOUCH_INTERVAL_SECONDS', 5 * 60),
    );
    this.cookieName = this.configService.get<string>(
      SESSION_COOKIE_NAME_KEY,
      SESSION_COOKIE_DEFAULT_NAME,
    );
  }

  private getKey(sessionId: string): string {
    return `${this.cookieName}:${sessionId}`;
  }

  /** Tập sessionId của một account, phục vụ đăng xuất toàn bộ thiết bị. */
  private getAccountIndexKey(adminId: string): string {
    return `${this.cookieName}:account:${adminId}`;
  }

  async createSession(
    data: Omit<AdminSession, 'createdAt' | 'expiresAt' | 'absoluteExpiresAt'>,
  ): Promise<AdminSession> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);
    const absoluteExpiresAt = new Date(
      now.getTime() + this.ABSOLUTE_TTL_SECONDS * 1000,
    );
    const session: AdminSession = {
      ...data,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      absoluteExpiresAt: absoluteExpiresAt.toISOString(),
    };
    const key = this.getKey(data.sessionId);
    await this.redis.set(key, JSON.stringify(session), {
      EX: this.ttlSeconds,
    });

    // Không thể SCAN toàn bộ key mỗi lần logout-all, nên giữ một chỉ mục
    // riêng. TTL của chỉ mục lấy theo hạn tuyệt đối để không sống lâu hơn
    // phiên dài nhất.
    const indexKey = this.getAccountIndexKey(data.adminId);
    await this.redis.sAdd(indexKey, data.sessionId);
    await this.redis.expire(indexKey, this.ABSOLUTE_TTL_SECONDS);

    return session;
  }

  async getSession(sessionId: string): Promise<AdminSession | null> {
    const raw = await this.redis.get(this.getKey(sessionId));
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    const now = new Date();
    if (new Date(session.expiresAt) < now) {
      await this.redis.del(this.getKey(sessionId));
      return null;
    }
    if (
      session.absoluteExpiresAt &&
      new Date(session.absoluteExpiresAt) < now
    ) {
      await this.redis.del(this.getKey(sessionId));
      return null;
    }
    return session;
  }

  /**
   * Gia hạn idle timeout, nhưng KHÔNG ghi lại mỗi request.
   *
   * Ghi mỗi request nghĩa là mỗi lượt gọi API kéo theo một lệnh SET toàn bộ
   * payload — với AOF thì thành một lượt ghi đĩa. Ở đây chỉ ghi khi đã cách
   * lần gia hạn gần nhất ít nhất touchIntervalSeconds, nên số lệnh ghi bị chặn
   * trên bởi 1 lần mỗi khoảng đó bất kể tần suất request.
   *
   * ĐÁNH ĐỔI: idle timeout thực tế không còn là đúng ttlSeconds mà nằm trong
   * khoảng [ttlSeconds - touchIntervalSeconds, ttlSeconds]. Với mặc định
   * 30 phút và ngưỡng 5 phút thì phiên hết hạn sau 25–30 phút không hoạt động.
   * Cần đúng sàn 30 phút thì nâng SESSION_TTL_SECONDS lên 30 + ngưỡng.
   */
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
    await this.redis.set(
      this.getKey(session.sessionId),
      JSON.stringify(session),
      {
        EX: this.ttlSeconds,
      },
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Đọc trước khi xoá để biết account nào, còn dọn chỉ mục
    const session = await this.getSession(sessionId);
    await this.redis.del(this.getKey(sessionId));
    if (session) {
      await this.redis.sRem(
        this.getAccountIndexKey(session.adminId),
        sessionId,
      );
    }
  }

  /** Xoá mọi phiên của một account. Trả về số phiên đã xoá. */
  async deleteAllByAccount(adminId: string): Promise<number> {
    const indexKey = this.getAccountIndexKey(adminId);
    const sessionIds = await this.redis.sMembers(indexKey);
    if (sessionIds.length) {
      await this.redis.del(sessionIds.map((id) => this.getKey(id)));
    }
    await this.redis.del(indexKey);
    return sessionIds.length;
  }

  /**
   * Đổi currentJti một cách NGUYÊN TỬ: chỉ đổi khi jti hiện tại đúng như
   * mong đợi.
   *
   * Phải làm bằng Lua vì đọc-kiểm tra-ghi qua 3 lệnh riêng sẽ hở race: hai
   * request refresh đồng thời đều đọc được cùng một jti rồi cả hai cùng cho
   * là hợp lệ. Script chạy nguyên khối trên Redis nên request thứ hai chắc
   * chắn thấy jti đã đổi và bị nhận diện là token cũ.
   *
   * KEEPTTL giữ nguyên hạn của phiên, không gia hạn ngầm khi refresh.
   */
  async rotateJti(
    sessionId: string,
    expectedJti: string,
    newJti: string,
  ): Promise<'ok' | 'mismatch' | 'missing'> {
    const script = `
      local raw = redis.call('GET', KEYS[1])
      if not raw then return 'missing' end
      local session = cjson.decode(raw)
      if session.currentJti ~= ARGV[1] then return 'mismatch' end
      session.currentJti = ARGV[2]
      session.lastSeenAt = ARGV[3]
      redis.call('SET', KEYS[1], cjson.encode(session), 'KEEPTTL')
      return 'ok'
    `;
    const result = await this.redis.eval(script, {
      keys: [this.getKey(sessionId)],
      arguments: [expectedJti, newJti, new Date().toISOString()],
    });
    return result as 'ok' | 'mismatch' | 'missing';
  }
}
