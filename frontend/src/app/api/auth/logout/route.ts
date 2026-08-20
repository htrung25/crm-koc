import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/src/lib/api/client";
import { getClientContext } from "@/src/lib/api/client-context";
import {
  clearSessionCookies,
  ACCESS_COOKIE,
} from "@/src/features/auth/session";

/**
 * Thu hồi token ở backend (đưa jti vào blacklist) rồi xoá cookie phiên.
 * Backend lỗi cũng vẫn xoá cookie: người dùng phải đăng xuất được ở phía client.
 */
export async function POST() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;

  if (token) {
    try {
      await apiRequest("/logout", {
        method: "POST",
        token,
        clientContext: await getClientContext(),
      });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
    }
  }

  return clearSessionCookies(NextResponse.json({ success: true }));
}
