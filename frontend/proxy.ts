import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isUserRole, ROLE_HOME } from "@/features/auth/types";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token và role từ cookie
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // Các trang đăng nhập công khai: /login (chung) và /admin (quản trị)
  const LOGIN_PAGES = ['/login', '/admin'];
  const isLoginPage = LOGIN_PAGES.includes(pathname);

  // Nếu truy cập trang đăng nhập mà đã có token hợp lệ
  if (isLoginPage && token && isUserRole(userRole)) {
    return NextResponse.redirect(new URL(ROLE_HOME[userRole], request.url));
  }

  // Bảo vệ route theo role (trang đăng nhập được loại trừ ở trên)
  const guarded: Array<[string, string]> = [
    ['/admin', 'ADMIN'],
    ['/brand', 'BRAND'],
    ['/creator', 'CREATOR'],
  ];

  if (!isLoginPage) {
    for (const [prefix, role] of guarded) {
      if (pathname.startsWith(prefix) && (!token || userRole !== role)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/creator/:path*',
    '/brand/:path*',
    '/login',
    '/register',
  ],
};
