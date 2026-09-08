import { NextResponse } from "next/server";

import { BACKEND_ROUTES } from "@/constants/routes";
import { apiRequest } from "@/lib/api/server-client";
import { errorResponse, requireSession } from "@/lib/api/route-session";

const ALLOWED_PARAMS = ["page", "limit", "search", "role", "adminRole"] as const;

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();

  for (const key of ALLOWED_PARAMS) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }

  try {
    return NextResponse.json(
      await apiRequest(`${BACKEND_ROUTES.admin.adminUser}?${query}`, {
        token: session.token,
        clientContext: session.clientContext,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
