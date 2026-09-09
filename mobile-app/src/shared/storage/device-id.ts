import * as Crypto from 'expo-crypto';

import { secureStorage } from './secure-storage';

const DEVICE_ID_KEY = 'device.id';

export const DEVICE_ID_HEADER = 'X-Device-Id';

let cachedDeviceId: string | null = null;

/**
 * API đối chiếu device id khi refresh token; id phải bền qua các lần mở app,
 * đổi id sẽ bị ghi nhận là đăng nhập từ thiết bị lạ.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const stored = await secureStorage.get(DEVICE_ID_KEY);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const created = Crypto.randomUUID();
  await secureStorage.set(DEVICE_ID_KEY, created);
  cachedDeviceId = created;
  return created;
}
