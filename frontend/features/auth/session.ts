import type { NextResponse } from "next/server";
import { ROLE_HOME, type UserRole } from "@/features/auth/types";

export const ACCESS_COOKIE = "token";
export const REFRESH_COOKIE = "refresh_token";
export const ROLE_COOKIE = "user_role";

/** Khớp JWT_ACCESS_TTL=15m của backend. */
export const ACCESS_MAX_AGE = 15 * 60;
/** Khớp JWT_REFRESH_TTL=7d. Cũng là tuổi thọ thực của phiên. */
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

const BASE_COOKIE = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
};

/**
 * Ghi phiên vào cookie (chỉ gọi được trong Route Handler).
 *
 * Cả ba cookie đều httpOnly, kể cả `user_role`: nó là dữ liệu proxy.ts dùng để
 * gác route chứ không phải trạng thái UI. Cho client sửa được nghĩa là tự mở
 * đường đi vòng qua guard điều hướng.
 *
 * Access sống 15 phút, refresh và role sống 7 ngày — access cookie biến mất
 * trước là chuyện bình thường, interceptor sẽ gọi /api/auth/refresh để lấy cặp
 * mới. Vì vậy proxy.ts xét phiên theo refresh cookie, không theo access.
 */
export function applySession(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  role: UserRole,
): NextResponse {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...BASE_COOKIE,
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...BASE_COOKIE,
    maxAge: REFRESH_MAX_AGE,
  });
  response.cookies.set(ROLE_COOKIE, role, {
    ...BASE_COOKIE,
    maxAge: REFRESH_MAX_AGE,
  });
  return response;
}

export function clearSessionCookies(response: NextResponse): NextResponse {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, ROLE_COOKIE]) {
    response.cookies.set(name, "", { ...BASE_COOKIE, maxAge: 0 });
  }
  return response;
}

export function getRoleHome(role: UserRole) {
  return ROLE_HOME[role];
}

/** Đăng xuất từ phía client: cookie httpOnly chỉ server xoá được. */
export async function requestLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
