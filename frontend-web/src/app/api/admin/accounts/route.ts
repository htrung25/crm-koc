import { NextResponse } from "next/server";

import { BACKEND_ROUTES } from "@/constants/routes";
import { apiRequest } from "@/lib/api/server-client";
import { errorResponse, requireSession } from "@/lib/api/route-session";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  const search = new URL(request.url).searchParams.get("search")?.trim();
  const query = new URLSearchParams({ page: "1", limit: "100" });
  if (search) query.set("search", search);

  try {
    return NextResponse.json(
      await apiRequest(`${BACKEND_ROUTES.admin.adminList}?${query}`, {
        token: session.token,
        clientContext: session.clientContext,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
