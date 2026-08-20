import { headers } from "next/headers";

export type ClientContext = {
  /** Chuỗi x-forwarded-for của request gốc; phần tử đầu là IP client thật. */
  forwardedFor: string | null;
  userAgent: string | null;
};

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
