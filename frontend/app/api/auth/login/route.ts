import { NextRequest, NextResponse } from 'next/server';
import { isUserRole } from '@/types/auth';

const BACKEND_API_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

type BackendLoginResponse = {
  data?: {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
  };
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_API_URL) {
      return NextResponse.json(
        { message: 'URL backend chưa được cấu hình' },
        { status: 500 },
      );
    }

    const body: unknown = await request.json();
    const backendResponse = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const payload = (await backendResponse.json()) as BackendLoginResponse;

    if (!backendResponse.ok) {
      return NextResponse.json(payload, { status: backendResponse.status });
    }

    const session = payload.data;

    // Backend trả role theo ERole (chữ HOA): ADMIN | BRAND | CREATOR.
    // isUserRole dùng chung USER_ROLES với proxy.ts nên chỉ có một nguồn
    // từ vựng role duy nhất ở phía frontend.
    if (!session?.accessToken || !session.refreshToken) {
      return NextResponse.json(
        { message: 'Phản hồi đăng nhập từ backend không hợp lệ' },
        { status: 502 },
      );
    }
    if (!isUserRole(session.role)) {
      return NextResponse.json(
        { message: 'Phản hồi đăng nhập từ backend không hợp lệ' },
        { status: 502 },
      );
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Tài khoản không có quyền truy cập khu vực quản trị' },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ success: true });
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookies.set('token', session.accessToken, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: 15 * 60,
    });
    response.cookies.set('refresh_token', session.refreshToken, {
      ...cookieOptions,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.set('user_role', session.role, {
      ...cookieOptions,
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Admin login proxy failed:', error);
    return NextResponse.json(
      { message: 'Không thể kết nối đến Backend API' },
      { status: 502 },
    );
  }
}
