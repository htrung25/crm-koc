import { DEVICE_ID_COOKIE } from "@/features/auth/session";

export { DEVICE_ID_COOKIE };

/**
 * Đọc deviceId từ cookie trình duyệt do proxy.ts khởi tạo.
 * Trả chuỗi rỗng nếu chưa có: proxy.ts là nơi DUY NHẤT sinh và ghi cookie
 * device_id, để cờ Secure/SameSite chỉ do một chỗ quyết định.
 */
export function getDeviceId(): string {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${DEVICE_ID_COOKIE}=`));

  if (!match) return "";

  const value = match.split("=")[1];
  return value ? decodeURIComponent(value) : "";
}
