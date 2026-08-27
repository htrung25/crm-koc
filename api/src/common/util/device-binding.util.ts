import type { IncomingHttpHeaders } from 'node:http';

/** FE sinh UUID một lần, lưu localStorage, gửi kèm mọi request. */
export const DEVICE_ID_HEADER = 'x-device-id';

export enum EDeviceCheck {
  /** Khớp, hoặc phiên chưa từng gắn thiết bị nào. */
  OK = 'ok',
  /** Phiên chưa có deviceId — gắn giá trị đang thấy rồi cho qua. */
  BACKFILL = 'backfill',
  /** Request không gửi header. */
  MISSING = 'missing',
  /** Có header nhưng khác thiết bị đã đăng nhập. */
  MISMATCH = 'mismatch',
}

export function readDeviceId(headers: IncomingHttpHeaders): string | null {
  const raw = headers[DEVICE_ID_HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/*So thiết bị của request với thiết bị đã gắn cho phiên.*/
export function checkDevice(
  sessionDeviceId: string | undefined,
  requestDeviceId: string | null,
): EDeviceCheck {
  if (!requestDeviceId) return EDeviceCheck.MISSING;
  if (!sessionDeviceId) return EDeviceCheck.BACKFILL;
  return sessionDeviceId === requestDeviceId
    ? EDeviceCheck.OK
    : EDeviceCheck.MISMATCH;
}
