"use client";

import { BUSINESS_CODE } from "@/constants/business-code";
import { API_ROUTES } from "@/constants/routes";
import { getDeviceId } from "@/lib/api/device";

let pendingRefresh: Promise<boolean> | null = null;

function buildRequestHeaders(existingHeaders?: HeadersInit): Headers {
  const headers = new Headers(existingHeaders);
  const deviceId = getDeviceId();
  if (deviceId && !headers.has("X-Device-Id")) {
    headers.set("X-Device-Id", deviceId);
  }
  return headers;
}

export function isDeviceMismatchError(
  status: number,
  businessCode?: string | number,
): boolean {
  return status === 401 && businessCode === BUSINESS_CODE.DEVICE_MISMATCH;
}

async function refreshSession(): Promise<boolean> {
  const headers = buildRequestHeaders();
  pendingRefresh ??= fetch(API_ROUTES.auth.refresh, {
    method: "POST",
    headers,
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
}

export type FetchOptions = RequestInit & {
  /** Bỏ qua cơ chế tự refresh — dùng cho chính các endpoint auth. */
  skipRefresh?: boolean;
};

export async function apiFetch(
  input: string,
  { skipRefresh, ...init }: FetchOptions = {},
): Promise<Response> {
  const headers = buildRequestHeaders(init.headers);
  const response = await fetch(input, { ...init, headers });

  if (response.status !== 401) {
    return response;
  }

  // clone() để không nuốt mất body của response trả về cho caller.
  const cloned = response.clone();
  const body = (await cloned.json().catch(() => null)) as {
    businessCode?: string | number;
  } | null;

  if (isDeviceMismatchError(response.status, body?.businessCode)) {
    // Không thử refresh: /refresh cũng kiểm thiết bị nên sẽ 401 tiếp.
    if (typeof window !== "undefined") {
      // await để logout kịp tới server; điều hướng ngay sẽ abort request này.
      await fetch(API_ROUTES.auth.logout, { method: "POST" }).catch(() => {});

      const pathname = window.location.pathname;
      const isAlreadyOnAuthPage =
        pathname === "/login" || pathname === "/admin";
      if (!isAlreadyOnAuthPage) {
        const loginUrl = pathname.startsWith("/admin")
          ? "/admin?error=device_mismatch"
          : "/login?error=device_mismatch";
        window.location.href = loginUrl;
      }
    }
    return response;
  }

  if (skipRefresh) {
    return response;
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    return response;
  }

  // Cookie mới đã được ghi trong response của /refresh, request lại lần này
  // sẽ mang access token còn hạn và device ID header.
  return fetch(input, { ...init, headers: buildRequestHeaders(init.headers) });
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly businessCode?: string,
    /**
     * Chỉ có ở 422 IP_WHITELIST_WOULD_LOCK_YOU_OUT: IP thật của người đang
     * thao tác, để dialog tự khoá mời họ thêm chính IP đó vào danh sách.
     */
    public readonly clientIp?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/** Nest trả message dạng string hoặc string[] (ValidationPipe). */
function messageOf(body: unknown, fallback: string): string {
  const raw =
    typeof body === "object" && body !== null && "message" in body
      ? (body as { message: unknown }).message
      : null;

  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    const parts = raw.filter((item): item is string => typeof item === "string");
    if (parts.length) return parts.join(", ");
  }
  return fallback;
}

/**
 * Đọc body JSON của Route Handler; ném ApiRequestError khi status không ok.
 *
 * Mọi màn hình đều cần đúng ba mảnh này để xử lý lỗi — status (401 thì đá về
 * trang đăng nhập), businessCode (để dịch) và clientIp (dialog tự khoá) — nên
 * chúng nằm trên error thay vì mỗi nơi tự bóc lại từ body.
 */
export async function readJson<T>(
  response: Response,
  fallbackMessage = "Yêu cầu thất bại",
): Promise<T> {
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const failure = (body ?? {}) as {
      businessCode?: string;
      clientIp?: string;
    };
    throw new ApiRequestError(
      messageOf(body, fallbackMessage),
      response.status,
      failure.businessCode,
      failure.clientIp,
    );
  }

  return body as T;
}

/** POST JSON kèm tự refresh; ném ApiRequestError khi backend trả lỗi. */
export async function postJson<T>(
  url: string,
  body: unknown,
  options: FetchOptions = {},
): Promise<T> {
  return readJson<T>(
    await apiFetch(url, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options.headers },
      body: JSON.stringify(body),
    }),
  );
}
