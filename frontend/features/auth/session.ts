import type { NextResponse } from "next/server";
import { ROLE_HOME, type UserRole } from "@/features/auth/types";

export const TOKEN_COOKIE = "token";
export const ROLE_COOKIE = "user_role";

/**
 * Access token của backend sống 15 phút (JWT_ACCESS_TOKEN_EXPIRES_IN mặc định).
 * Cookie hết hạn cùng lúc để proxy không tưởng nhầm là còn phiên.
 */
export const SESSION_MAX_AGE = 15 * 60;

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE,
};

/**
 * Ghi phiên vào cookie (chỉ gọi được trong Route Handler).
 * `token` để httpOnly nên JavaScript trên trình duyệt không đọc được;
 * `user_role` không httpOnly để UI biết đang ở workspace nào.
 */
export function applySession(
  response: NextResponse,
  accessToken: string,
  role: UserRole,
): NextResponse {
  response.cookies.set(TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    httpOnly: true,
  });
  response.cookies.set(ROLE_COOKIE, role, {
    ...COOKIE_OPTIONS,
    httpOnly: false,
  });
  return response;
}

export function clearSessionCookies(response: NextResponse): NextResponse {
  for (const name of [TOKEN_COOKIE, ROLE_COOKIE]) {
    response.cookies.set(name, "", { ...COOKIE_OPTIONS, maxAge: 0 });
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
