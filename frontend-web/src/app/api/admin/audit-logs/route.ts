import { NextResponse } from "next/server";

import { BACKEND_ROUTES } from "@/constants/routes";
import { apiRequest } from "@/lib/api/server-client";
import { errorResponse, requireSession } from "@/lib/api/route-session";

/**
 * Danh sách Audit Logs của hệ thống, phân trang và lọc ở phía server.
 */
const ALLOWED_PARAMS = [
  "page",
  "limit",
  "search",
  "category",
  "action",
  "accountId",
  "emailAttempted",
  "resourceType",
  "resourceId",
  "createdFrom",
  "createdTo",
  "sortOrder",
] as const;

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
      await apiRequest(`${BACKEND_ROUTES.admin.auditLogs}?${query}`, {
        token: session.token,
        clientContext: session.clientContext,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
