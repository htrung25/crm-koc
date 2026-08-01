import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isUserRole, ROLE_HOME } from "@/types/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token và role từ cookie
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // Chỉ còn một cổng đăng nhập duy nhất: /login
  const isLoginPage = pathname === '/login';

  // Nếu truy cập route đăng nhập mà đã có token hợp lệ
  if (isLoginPage && token && isUserRole(userRole)) {
    return NextResponse.redirect(new URL(ROLE_HOME[userRole], request.url));
  }

  // Bảo vệ route theo role
  const guarded: Array<[string, string]> = [
    ['/admin', 'ADMIN'],
    ['/brand', 'BRAND'],
    ['/creator', 'CREATOR'],
  ];

  for (const [prefix, role] of guarded) {
    if (pathname.startsWith(prefix) && (!token || userRole !== role)) {
      return NextResponse.redirect(new URL('/login', request.url));
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
