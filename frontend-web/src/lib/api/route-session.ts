import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { ACCESS_COOKIE } from '@/features/auth/session';
import { ApiError } from '@/lib/api/server-client';
import { getClientContext, type ClientContext } from '@/lib/api/client-context';

// Không có token thì trả luôn 401 với cùng một hình dạng lỗi
export async function requireSession(): Promise<
  | { ok: true; token: string; clientContext: ClientContext }
  | { ok: false; response: NextResponse }
> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: 'Phiên đã kết thúc', businessCode: 'SESSION_EXPIRED' },
        { status: 401 }
      ),
    };
  }

  return { ok: true, token, clientContext: await getClientContext() };
}

// Đổi ApiError của backend thành response cho trình duyệt.
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { message: 'Body không hợp lệ', businessCode: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  if (!(error instanceof ApiError)) throw error;

  return NextResponse.json(
    {
      message: error.message,
      businessCode: error.businessCode,
      clientIp: error.clientIp,
    },
    { status: error.status }
  );
}
