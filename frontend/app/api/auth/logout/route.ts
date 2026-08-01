import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import { clearSessionCookies, TOKEN_COOKIE } from "@/features/auth/session";

/**
 * Thu hồi token ở backend (đưa jti vào blacklist) rồi xoá cookie phiên.
 * Backend lỗi cũng vẫn xoá cookie: người dùng phải đăng xuất được ở phía client.
 */
export async function POST() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;

  if (token) {
    try {
      await apiRequest("/logout", { method: "POST", token });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
    }
  }

  return clearSessionCookies(NextResponse.json({ success: true }));
}
