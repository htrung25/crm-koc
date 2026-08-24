import { randomInt } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisClientType } from 'redis';
import {
  OTP_LOCK_PREFIX,
  OTP_PENDING_PREFIX,
  OTP_RESEND_PREFIX,
} from '../common/constants/otp.constants';
import { EOtpResult } from '../common/enum/otp-result.enum';
import { REDIS_CLIENT } from '../infra/redis.module';

@Injectable()
export class OtpService {
  private readonly otpTtl: number;
  private readonly lockTtl: number;
  private readonly maxAttempts: number;
  private readonly resendCooldown: number;
  private readonly maxResends: number;
  private readonly resendWindow: number;

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: RedisClientType,
    configService: ConfigService,
  ) {
    // .env luôn trả string nên phải Number(): '300' lọt vào { EX } sẽ sai kiểu
    this.otpTtl = Number(configService.get('OTP_TTL_SECONDS', 300));
    this.lockTtl = Number(configService.get('OTP_LOCK_TTL_SECONDS', 900));
    this.maxAttempts = Number(configService.get('OTP_MAX_ATTEMPTS', 5));
    this.resendCooldown = Number(
      configService.get('OTP_RESEND_COOLDOWN_SECONDS', 60),
    );
    this.maxResends = Number(configService.get('OTP_MAX_RESENDS', 5));
    this.resendWindow = Number(
      configService.get('OTP_RESEND_WINDOW_SECONDS', 3600),
    );
  }

  async generateAndStore(
    accountId: string,
  ): Promise<{ otp: string } | EOtpResult.LOCKED> {
    const lockValue = await this.redis.get(`${OTP_LOCK_PREFIX}${accountId}`);
    if (lockValue !== null) return EOtpResult.LOCKED;

    const otp = this.generateOtp();

    await this.redis.set(
      `${OTP_PENDING_PREFIX}${accountId}`,
      JSON.stringify({ otp, attempts: 0 }),
      { EX: this.otpTtl },
    );

    // KHÔNG xoá bộ đếm resend ở đây: gọi lại /login sẽ thành đường vòng để
    // xin thêm lượt gửi mail. Bộ đếm tự hết hạn theo resendWindow.

    return { otp };
  }

  async verify(
    accountId: string,
    inputOtp: string,
  ): Promise<
    | { accountId: string }
    | EOtpResult.EXPIRED
    | EOtpResult.LOCKED
    | EOtpResult.INVALID
  > {
    const raw = await this.redis.get(`${OTP_PENDING_PREFIX}${accountId}`);
    if (!raw) return EOtpResult.EXPIRED;

    const data = JSON.parse(raw) as { otp: string; attempts: number };

    // Dùng get thay vì exists vì Redis cluster proxy không hỗ trợ exists
    const lockValue = await this.redis.get(`${OTP_LOCK_PREFIX}${accountId}`);
    if (lockValue !== null) return EOtpResult.LOCKED;

    if (inputOtp === data.otp) {
      await this.redis.del(`${OTP_PENDING_PREFIX}${accountId}`);
      await this.redis.del(`${OTP_RESEND_PREFIX}${accountId}`);
      return { accountId };
    }

    data.attempts += 1;

    if (data.attempts >= this.maxAttempts) {
      await this.redis.set(`${OTP_LOCK_PREFIX}${accountId}`, '1', {
        EX: this.lockTtl,
      });
      return EOtpResult.LOCKED;
    }

    // Cập nhật lại số lần thử, giữ nguyên TTL còn lại
    await this.redis.set(
      `${OTP_PENDING_PREFIX}${accountId}`,
      JSON.stringify(data),
      { EX: this.otpTtl },
    );

    return EOtpResult.INVALID;
  }

  /**
   * Resend OTP for an existing login session.
   * Rules: 60s cooldown between resends, max 5 resends.
   * Exceeding max resends triggers a 15-minute lockout.
   */
  async resend(
    accountId: string,
  ): Promise<{ otp: string } | EOtpResult.LOCKED | EOtpResult.COOLDOWN> {
    const lockValue = await this.redis.get(`${OTP_LOCK_PREFIX}${accountId}`);
    if (lockValue !== null) return EOtpResult.LOCKED;

    const resendRaw = await this.redis.get(`${OTP_RESEND_PREFIX}${accountId}`);
    const now = Date.now();
    const prevCount = resendRaw
      ? (JSON.parse(resendRaw) as { count: number; lastResendAt: number }).count
      : 0;

    if (resendRaw) {
      const resendMeta = JSON.parse(resendRaw) as {
        count: number;
        lastResendAt: number;
      };

      if (resendMeta.count >= this.maxResends) {
        await this.redis.set(`${OTP_LOCK_PREFIX}${accountId}`, '1', {
          EX: this.lockTtl,
        });
        await this.redis.del(`${OTP_PENDING_PREFIX}${accountId}`);
        await this.redis.del(`${OTP_RESEND_PREFIX}${accountId}`);
        return EOtpResult.LOCKED;
      }

      const secondsSinceLast = (now - resendMeta.lastResendAt) / 1000;
      if (secondsSinceLast < this.resendCooldown) return EOtpResult.COOLDOWN;
    }

    const otp = this.generateOtp();
    await this.redis.set(
      `${OTP_PENDING_PREFIX}${accountId}`,
      JSON.stringify({ otp, attempts: 0 }),
      { EX: this.otpTtl },
    );

    await this.redis.set(
      `${OTP_RESEND_PREFIX}${accountId}`,
      JSON.stringify({ count: prevCount + 1, lastResendAt: now }),
      { EX: this.resendWindow },
    );

    return { otp };
  }

  async isLocked(accountId: string): Promise<boolean> {
    const value = await this.redis.get(`${OTP_LOCK_PREFIX}${accountId}`);
    return value !== null;
  }

  async unlock(accountId: string): Promise<void> {
    await Promise.all([
      this.redis.del(`${OTP_LOCK_PREFIX}${accountId}`),
      this.redis.del(`${OTP_RESEND_PREFIX}${accountId}`),
    ]);
  }

  /**
   * Đọc mã đang chờ để gửi mail. KHÔNG xoá: verify() còn cần key này.
   * null nghĩa là TTL đã hết — không còn gì đáng gửi.
   */
  async peek(accountId: string): Promise<string | null> {
    const raw = await this.redis.get(`${OTP_PENDING_PREFIX}${accountId}`);
    if (!raw) return null;
    return (JSON.parse(raw) as { otp: string }).otp;
  }

  private generateOtp(): string {
    return String(randomInt(100_000, 1_000_000));
  }
}
