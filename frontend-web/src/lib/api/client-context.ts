import { headers, cookies } from "next/headers";
import { DEVICE_ID_COOKIE } from "@/features/auth/session";

export type ClientContext = {
  /** Chuỗi x-forwarded-for của request gốc; phần tử đầu là IP client thật. */
  forwardedFor: string | null;
  userAgent: string | null;
  deviceId: string | null;
};

export async function getClientContext(): Promise<ClientContext> {
  const h = await headers();
  const c = await cookies();

  return {
    forwardedFor:
      h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? null,
    userAgent: h.get("user-agent"),
    deviceId:
      h.get("x-device-id") ??
      h.get("X-Device-Id") ??
      c.get(DEVICE_ID_COOKIE)?.value ??
      null,
  };
}

/** IP client đứng đầu chuỗi x-forwarded-for. */
export function clientIpOf(context: ClientContext): string | null {
  return context.forwardedFor?.split(",")[0]?.trim() || null;
}
