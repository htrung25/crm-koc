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
  }

  async generateAndStore(
    adminId: string,
  ): Promise<{ otp: string } | EOtpResult.LOCKED> {
    const lockValue = await this.redis.get(`${OTP_LOCK_PREFIX}${adminId}`);
    if (lockValue !== null) return EOtpResult.LOCKED;

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    await this.redis.set(
      `${OTP_PENDING_PREFIX}${adminId}`,
      JSON.stringify({ otp, attempts: 0 }),
      { EX: this.otpTtl },
    );

    // Fresh login resets the resend counter
    await this.redis.del(`${OTP_RESEND_PREFIX}${adminId}`);

    return { otp };
  }

  async verify(
    adminId: string,
    inputOtp: string,
  ): Promise<
    | { adminId: string }
    | EOtpResult.EXPIRED
    | EOtpResult.LOCKED
    | EOtpResult.INVALID
  > {
    const raw = await this.redis.get(`${OTP_PENDING_PREFIX}${adminId}`);
    if (!raw) return EOtpResult.EXPIRED;

    const data = JSON.parse(raw) as { otp: string; attempts: number };

    // Dùng get thay vì exists vì Redis cluster proxy không hỗ trợ exists
    const lockValue = await this.redis.get(`${OTP_LOCK_PREFIX}${adminId}`);
    if (lockValue !== null) return EOtpResult.LOCKED;

    if (inputOtp === data.otp) {
      await this.redis.del(`${OTP_PENDING_PREFIX}${adminId}`);
      await this.redis.del(`${OTP_RESEND_PREFIX}${adminId}`);
      return { adminId };
    }

    data.attempts += 1;

    if (data.attempts >= this.maxAttempts) {
      await this.redis.set(`${OTP_LOCK_PREFIX}${adminId}`, '1', {
        EX: this.lockTtl,
      });
      return EOtpResult.LOCKED;
    }

    // Cập nhật lại số lần thử, giữ nguyên TTL còn lại
    await this.redis.set(
      `${OTP_PENDING_PREFIX}${adminId}`,
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
    adminId: string,
  ): Promise<{ otp: string } | EOtpResult.LOCKED | EOtpResult.COOLDOWN> {
    const lockValue = await this.redis.get(`${OTP_LOCK_PREFIX}${adminId}`);
    if (lockValue !== null) return EOtpResult.LOCKED;

    const resendRaw = await this.redis.get(`${OTP_RESEND_PREFIX}${adminId}`);
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
        await this.redis.set(`${OTP_LOCK_PREFIX}${adminId}`, '1', {
          EX: this.lockTtl,
        });
        await this.redis.del(`${OTP_PENDING_PREFIX}${adminId}`);
        await this.redis.del(`${OTP_RESEND_PREFIX}${adminId}`);
        return EOtpResult.LOCKED;
      }

      const secondsSinceLast = (now - resendMeta.lastResendAt) / 1000;
      if (secondsSinceLast < this.resendCooldown) return EOtpResult.COOLDOWN;
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await this.redis.set(
      `${OTP_PENDING_PREFIX}${adminId}`,
      JSON.stringify({ otp, attempts: 0 }),
      { EX: this.otpTtl },
    );

    await this.redis.set(
      `${OTP_RESEND_PREFIX}${adminId}`,
      JSON.stringify({ count: prevCount + 1, lastResendAt: now }),
      { EX: this.otpTtl },
    );

    return { otp };
  }

  async isLocked(adminId: string): Promise<boolean> {
    const value = await this.redis.get(`${OTP_LOCK_PREFIX}${adminId}`);
    return value !== null;
  }

  async unlock(adminId: string): Promise<void> {
    await Promise.all([
      this.redis.del(`${OTP_LOCK_PREFIX}${adminId}`),
      this.redis.del(`${OTP_RESEND_PREFIX}${adminId}`),
    ]);
  }
}
