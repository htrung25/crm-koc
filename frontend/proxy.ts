import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isUserRole, ROLE_HOME } from "@/types/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token và role từ cookie
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  const isAdminLogin = pathname === '/admin/login';
  const isBrandLogin = pathname === '/brand/login';
  const isCreatorLogin = pathname === '/creator/login';
  const isLoginPage = pathname === '/login' || isAdminLogin || isBrandLogin || isCreatorLogin;

  // Nếu truy cập các route đăng nhập mà đã có token hợp lệ
  if (isLoginPage && token && isUserRole(userRole)) {
    return NextResponse.redirect(new URL(ROLE_HOME[userRole], request.url));
  }

  // Bảo vệ route ADMIN
  if (pathname.startsWith('/admin') && !isAdminLogin) {
    if (!token || userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Bảo vệ route BRAND
  if (pathname.startsWith('/brand') && !isBrandLogin) {
    if (!token || userRole !== 'BRAND') {
      return NextResponse.redirect(new URL('/brand/login', request.url));
    }
  }

  // Bảo vệ route CREATOR
  if (pathname.startsWith('/creator') && !isCreatorLogin) {
    if (!token || userRole !== 'CREATOR') {
      return NextResponse.redirect(new URL('/creator/login', request.url));
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
