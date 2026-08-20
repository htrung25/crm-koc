"use client";

import { API_ROUTES } from "@/config/route";
/**
 * Interceptor fetch cho phía trình duyệt.
 *
 * Access token sống 15 phút và nằm trong cookie httpOnly nên JS không đọc được
 * hạn của nó. Cách duy nhất biết token hết hạn là gặp 401 — lúc đó gọi
 * /api/auth/refresh rồi thử lại đúng một lần.
 *
 * Refresh token của backend xoay vòng: gọi /refresh hai lần với cùng một token
 * sẽ bị coi là token bị đánh cắp và huỷ cả phiên. Nên nhiều request 401 cùng
 * lúc phải dùng CHUNG một lần refresh — đó là việc của `pendingRefresh`.
 */

let pendingRefresh: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  pendingRefresh ??= fetch(API_ROUTES.auth.refresh, { method: "POST" })
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
  const response = await fetch(input, init);

  if (response.status !== 401 || skipRefresh) {
    return response;
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    return response;
  }

  // Cookie mới đã được ghi trong response của /refresh, request lại lần này
  // sẽ mang access token còn hạn.
  return fetch(input, init);
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly businessCode?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/** POST JSON kèm tự refresh; ném ApiRequestError khi backend trả lỗi. */
export async function postJson<T>(
  url: string,
  body: unknown,
  options: FetchOptions = {},
): Promise<T> {
  const response = await apiFetch(url, {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Route trả rỗng hoặc HTML: giữ nguyên status để bên gọi xử lý.
    data = null;
  }

  if (!response.ok) {
    const failure = data as
      | { message?: string; businessCode?: string }
      | null;
    throw new ApiRequestError(
      failure?.message ?? "Yêu cầu thất bại",
      response.status,
      failure?.businessCode ?? "REQUEST_FAILED",
    );
  }

  return data as T;
}
