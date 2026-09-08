import { NextResponse } from 'next/server';

import { BACKEND_ROUTES } from '@/constants/routes';
import { errorResponse, requireSession } from '@/lib/api/route-session';

function apiBaseUrl(): string {
  const url = process.env.API_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Thiếu biến môi trường API_URL');
    }
    return 'http://localhost:3000';
  }
  return url;
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { message: 'File tải lên không hợp lệ hoặc bị thiếu' },
        { status: 400 }
      );
    }

    const backendFormData = new FormData();
    backendFormData.append('file', file, (file as File).name || 'avatar.png');

    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.token}`,
    };
    if (session.clientContext?.forwardedFor) {
      headers['x-forwarded-for'] = session.clientContext.forwardedFor;
    }
    if (session.clientContext?.deviceId) {
      headers['x-device-id'] = session.clientContext.deviceId;
    }

    const response = await fetch(
      `${apiBaseUrl()}${BACKEND_ROUTES.admin.profileAvatar}`,
      {
        method: 'POST',
        headers,
        body: backendFormData,
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data ?? { message: `Tải ảnh đại diện thất bại (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return new NextResponse('Key không hợp lệ', { status: 400 });
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${session.token}`,
    };
    if (session.clientContext?.forwardedFor) {
      headers['x-forwarded-for'] = session.clientContext.forwardedFor;
    }

    const backendUrl = `${apiBaseUrl()}${BACKEND_ROUTES.admin.profileAvatarStream}?key=${encodeURIComponent(key)}`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return new NextResponse('Không tìm thấy ảnh', {
        status: response.status,
      });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const cacheControl =
      response.headers.get('cache-control') || 'public, max-age=86400';

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
