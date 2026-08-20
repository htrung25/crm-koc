import { headers } from "next/headers";

export type ClientContext = {
  /** Chuỗi x-forwarded-for của request gốc; phần tử đầu là IP client thật. */
  forwardedFor: string | null;
  userAgent: string | null;
};

/**
 * Trích IP thật và User-Agent của người dùng từ request đang vào Next.
 *
 * Trình duyệt không gọi thẳng backend mà đi qua Route Handler, nên nếu không
 * chuyển tiếp thì backend chỉ thấy IP của server Next: IpWhitelistGuard sẽ so
 * sai địa chỉ, và throttle theo IP mất luôn chiều IP.
 *
 * Next tự gắn `x-forwarded-for` cho request đến (dev server cũng có), nên đọc
 * header là đủ — không cần chạm tới socket.
 */
export async function getClientContext(): Promise<ClientContext> {
  const h = await headers();

  return {
    forwardedFor:
      h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? null,
    userAgent: h.get("user-agent"),
  };
}

/** IP client đứng đầu chuỗi x-forwarded-for. */
export function clientIpOf(context: ClientContext): string | null {
  return context.forwardedFor?.split(",")[0]?.trim() || null;
}
