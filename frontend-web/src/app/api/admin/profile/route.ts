import { NextResponse } from "next/server";

import { BACKEND_ROUTES } from "@/constants/routes";
import { parseProfileUpdate } from "@/features/admin/profile/profile.schema";
import { apiRequest } from "@/lib/api/server-client";
import { errorResponse, requireSession } from "@/lib/api/route-session";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    return NextResponse.json(
      await apiRequest(BACKEND_ROUTES.admin.profileMe, {
        token: session.token,
        clientContext: session.clientContext,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const parsed = parseProfileUpdate(await request.json());
    if (!parsed.ok) {
      return NextResponse.json(parsed.error, { status: 400 });
    }

    return NextResponse.json(
      await apiRequest(BACKEND_ROUTES.admin.profileMe, {
        method: "PATCH",
        body: parsed.payload,
        token: session.token,
        clientContext: session.clientContext,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
