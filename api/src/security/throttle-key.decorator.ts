import { SetMetadata } from '@nestjs/common';
import { EThrottleKeyMode } from '../common/enum/throttle-key-modes.enum';

export const THROTTLE_KEY_MODE = 'throttle_key_mode';

export const ThrottleKey = (mode: EThrottleKeyMode) =>
  SetMetadata(THROTTLE_KEY_MODE, mode);
