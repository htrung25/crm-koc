import { NextResponse } from 'next/server';
import { BACKEND_ROUTES } from '@/constants/routes';
import { requireSession, errorResponse } from '@/lib/api/route-session';
import { apiRequest } from '@/lib/api/server-client';

// Read-only: no mutation handler is exposed for a Creator profile.
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (!session.ok) return session.response;
  const { id } = await context.params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return NextResponse.json(
      {
        message: 'Creator ID không hợp lệ',
        businessCode: 'INVALID_CREATOR_ID',
      },
      { status: 400 }
    );
  }
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ['historyPage', 'historyLimit']) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }
  try {
    return NextResponse.json(
      await apiRequest(
        `${BACKEND_ROUTES.admin.creatorDetail(id)}?${query}`,
        session
      )
    );
  } catch (error) {
    return errorResponse(error);
  }
}
