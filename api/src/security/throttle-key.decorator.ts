import { SetMetadata } from '@nestjs/common';
import { EThrottleKeyMode } from '../common/enum/throttle-key-modes.enum';

export const THROTTLE_KEY_MODE = 'throttle_key_mode';

/**
 * Chọn cách đếm rate limit cho route.
 *
 * Không khai thì guard tự quyết: có token hợp lệ thì đếm theo account,
 * không thì theo IP. Chỉ cần dùng khi muốn ép ACCOUNT_AND_IP cho endpoint
 * nhạy cảm.
 */
export const ThrottleKey = (mode: EThrottleKeyMode) =>
  SetMetadata(THROTTLE_KEY_MODE, mode);
