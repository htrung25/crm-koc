import { NextResponse } from 'next/server';
import { BACKEND_ROUTES } from '@/constants/routes';
import { requireSession, errorResponse } from '@/lib/api/route-session';
import { apiRequest } from '@/lib/api/server-client';

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of [
    'page',
    'limit',
    'search',
    'status',
    'sortBy',
    'sortOrder',
  ]) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }
  try {
    return NextResponse.json(
      await apiRequest(`${BACKEND_ROUTES.admin.creatorList}?${query}`, session)
    );
  } catch (error) {
    return errorResponse(error);
  }
}
