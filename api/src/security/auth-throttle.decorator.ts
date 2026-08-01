import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EThrottleKeyMode } from '../common/enum/throttle-key-modes.enum';
import { ThrottleKey } from './throttle-key.decorator';

/** 5 request / 60 giây — mức dành riêng cho login, OTP và gửi email. */
export const AUTH_THROTTLE_LIMIT = 5;
export const AUTH_THROTTLE_TTL_MS = 60_000;

/** Thời gian phạt khi vượt hạn, dùng cho endpoint bị dò mã. */
export const AUTH_THROTTLE_BLOCK_MS = 900_000;

interface AuthThrottleOptions {
  blockMs?: number;
}

/**
 * Chính sách chung cho nhóm endpoint nhạy cảm: đăng nhập, xác thực OTP và
 * mọi endpoint có gửi email.
 *
 * Kèm luôn EMAIL_AND_IP: cả nhóm này đều chưa đăng nhập nhưng body có email,
 * nên đếm theo email chặn đúng tài khoản bị nhắm tới thay vì chặn cả dải IP.
 */
export const AuthThrottle = (options: AuthThrottleOptions = {}) =>
  applyDecorators(
    Throttle({
      default: {
        limit: AUTH_THROTTLE_LIMIT,
        ttl: AUTH_THROTTLE_TTL_MS,
        ...(options.blockMs ? { blockDuration: options.blockMs } : {}),
      },
    }),
    ThrottleKey(EThrottleKeyMode.EMAIL_AND_IP),
  );
