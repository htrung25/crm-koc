import { DEVICE_ID_COOKIE } from '@/features/auth/session';

export { DEVICE_ID_COOKIE };

// Đọc deviceId từ cookie trình duyệt do proxy.ts khởi tạo.
export function getDeviceId(): string {
  if (typeof document === 'undefined') return '';

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${DEVICE_ID_COOKIE}=`));

  if (!match) return '';

  const value = match.split('=')[1];
  return value ? decodeURIComponent(value) : '';
}
