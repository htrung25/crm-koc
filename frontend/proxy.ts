import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isUserRole, ROLE_HOME } from "@/features/auth/types";
import { REFRESH_COOKIE, ROLE_COOKIE } from "@/features/auth/session";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

function localizedPath(locale: string, pathname: string): string {
  return `/${locale}${pathname === "/" ? "" : pathname}`;
}

/**
 * Gác điều hướng cho toàn bộ khu vực có phân quyền.
 *
 * Xét phiên theo REFRESH token chứ không theo access token: access chỉ sống 15
 * phút, hết hạn là cookie biến mất, trong khi phiên vẫn còn hiệu lực tới 7
 * ngày. Nếu gác theo access thì cứ 15 phút không thao tác là người dùng bị đá
 * ra đăng nhập lại, dù interceptor hoàn toàn có thể xin cặp token mới.
 *
 * Proxy chỉ kiểm tra sự hiện diện của phiên, không gọi mạng: việc làm mới token
 * do /api/auth/refresh đảm nhiệm khi có request thật trả về 401. Thẩm quyền
 * cuối cùng vẫn là backend — cookie ở đây chỉ quyết định điều hướng.
 */
export function proxy(request: NextRequest) {
  const i18nResponse = handleI18nRouting(request);
  const { pathname } = request.nextUrl;
  const locale = routing.locales.find(
    (candidate) =>
      pathname === `/${candidate}` || pathname.startsWith(`/${candidate}/`),
  );

  // Không có locale thì next-intl tự redirect sang /vi hoặc /en.
  if (!locale) return i18nResponse;

  const localizedPathname = pathname.slice(locale.length + 1) || "/";

  const sessionToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const userRole = request.cookies.get(ROLE_COOKIE)?.value;
  const hasSession = Boolean(sessionToken) && isUserRole(userRole);

  // Cổng đăng nhập công khai: /login (brand & creator) và /admin (quản trị).
  // TODO: /admin đang mở trong giai đoạn phát triển; khi lên production thì
  // đóng lại sau IP whitelist hoặc VPN.
  const LOGIN_PAGES = ["/login", "/admin"];
  const isLoginPage = LOGIN_PAGES.includes(localizedPathname);

  // Đã có phiên mà còn vào trang đăng nhập thì đưa thẳng về workspace.
  if (isLoginPage && hasSession) {
    return NextResponse.redirect(
      new URL(localizedPath(locale, ROLE_HOME[userRole]), request.url),
    );
  }

  if (!isLoginPage) {
    const guarded: Array<[string, string]> = [
      ["/admin", "ADMIN"],
      ["/brand", "BRAND"],
      ["/creator", "CREATOR"],
    ];

    for (const [prefix, role] of guarded) {
      if (
        localizedPathname.startsWith(prefix) &&
        (!hasSession || userRole !== role)
      ) {
        // Trả người dùng về đúng cổng của khu vực họ đang cố vào, thay vì
        // luôn quăng ra cổng chung.
        const loginPage = prefix === "/admin" ? "/admin" : "/login";
        return NextResponse.redirect(
          new URL(localizedPath(locale, loginPage), request.url),
        );
      }
    }
  }

  return i18nResponse;
}

/**
 * Next 16 đổi tên file middleware -> proxy, nhưng export cấu hình VẪN là
 * `config`. Đặt tên `proxyConfig` thì Next không đọc thấy matcher, và proxy
 * chạy trên MỌI request — kể cả /_next/static — khiến next-intl redirect luôn
 * cả CSS/JS sang /vi/_next/... và toàn bộ trang 404.
 */
export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
