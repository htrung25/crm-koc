import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isUserRole, ROLE_HOME } from "@/features/auth/types";
import {
  DEVICE_ID_COOKIE,
  REFRESH_COOKIE,
  ROLE_COOKIE,
} from "@/features/auth/session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let deviceId = request.cookies.get(DEVICE_ID_COOKIE)?.value;
  const needsDeviceId = !deviceId;
  if (needsDeviceId) {
    deviceId = crypto.randomUUID();
  }

  const attachDeviceId = (res: NextResponse) => {
    if (needsDeviceId && deviceId) {
      res.cookies.set(DEVICE_ID_COOKIE, deviceId, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: false,
        maxAge: 400 * 24 * 60 * 60,
      });
    }
    return res;
  };

  const sessionToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const userRole = request.cookies.get(ROLE_COOKIE)?.value;
  const hasSession = Boolean(sessionToken) && isUserRole(userRole);

  // Cổng đăng nhập công khai: /login (brand & creator) và /admin (quản trị).
  // TODO: /admin đang mở trong giai đoạn phát triển; khi lên production thì
  // đóng lại sau IP whitelist hoặc VPN.
  const LOGIN_PAGES = ["/login", "/admin"];
  const isLoginPage = LOGIN_PAGES.includes(pathname);

  // Đã có phiên mà còn vào trang đăng nhập thì đưa thẳng về workspace.
  if (isLoginPage && hasSession) {
    return attachDeviceId(
      NextResponse.redirect(new URL(ROLE_HOME[userRole], request.url)),
    );
  }

  if (!isLoginPage) {
    const guarded: Array<[string, string]> = [
      ["/admin", "ADMIN"],
      ["/brand", "BRAND"],
      ["/creator", "CREATOR"],
    ];

    for (const [prefix, role] of guarded) {
      if (pathname.startsWith(prefix) && (!hasSession || userRole !== role)) {
        // Trả người dùng về đúng cổng của khu vực họ đang cố vào, thay vì
        // luôn quăng ra cổng chung.
        const loginPage = prefix === "/admin" ? "/admin" : "/login";
        return attachDeviceId(
          NextResponse.redirect(new URL(loginPage, request.url)),
        );
      }
    }
  }

  return attachDeviceId(NextResponse.next());
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
