import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isUserRole, ROLE_HOME } from "@/features/auth/types";
import { REFRESH_COOKIE, ROLE_COOKIE } from "@/features/auth/session";

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
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const userRole = request.cookies.get(ROLE_COOKIE)?.value;
  const hasSession = Boolean(sessionToken) && isUserRole(userRole);

  // Cổng đăng nhập công khai: /login (brand & creator) và /admin (quản trị).
  // TODO: /admin đang mở trong giai đoạn phát triển; khi lên production thì
  // đóng lại sau IP whitelist hoặc VPN.
  const LOGIN_PAGES = ['/login', '/admin'];
  const isLoginPage = LOGIN_PAGES.includes(pathname);

  // Đã có phiên mà còn vào trang đăng nhập thì đưa thẳng về workspace.
  if (isLoginPage && hasSession) {
    return NextResponse.redirect(new URL(ROLE_HOME[userRole], request.url));
  }

  if (!isLoginPage) {
    const guarded: Array<[string, string]> = [
      ['/admin', 'ADMIN'],
      ['/brand', 'BRAND'],
      ['/creator', 'CREATOR'],
    ];

    for (const [prefix, role] of guarded) {
      if (pathname.startsWith(prefix) && (!hasSession || userRole !== role)) {
        // Trả người dùng về đúng cổng của khu vực họ đang cố vào, thay vì
        // luôn quăng ra cổng chung.
        const loginPage = prefix === '/admin' ? '/admin' : '/login';
        return NextResponse.redirect(new URL(loginPage, request.url));
      }
    }
  }

  return NextResponse.next();
}

// Next 16 đổi tên middleware -> proxy, config -> proxyConfig.
export const proxyConfig = {
  matcher: [
    '/admin/:path*',
    '/creator/:path*',
    '/brand/:path*',
    '/login',
    '/register',
  ],
};
