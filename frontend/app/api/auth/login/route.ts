import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Đăng nhập mô phỏng thành công' });
  const cookieOptions = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  response.cookies.set('token', 'mock-jwt-token-admin', {
    ...cookieOptions,
    httpOnly: false,
    maxAge: 15 * 60,
  });
  response.cookies.set('refresh_token', 'mock-refresh-token-admin', {
    ...cookieOptions,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60,
  });
  response.cookies.set('user_role', 'ADMIN', {
    ...cookieOptions,
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}

