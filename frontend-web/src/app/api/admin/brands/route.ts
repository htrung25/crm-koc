import { NextResponse } from "next/server";

import { BACKEND_ROUTES } from "@/constants/routes";
import { apiRequest } from "@/lib/api/server-client";
import { errorResponse, requireSession } from "@/lib/api/route-session";

/**
 * Danh sách brand, phân trang và lọc Ở PHÍA SERVER.
 *
 * Chỉ chuyển tiếp đúng những tham số backend khai trong BrandFilterDto:
 * gửi thừa sẽ bị ValidationPipe (forbidNonWhitelisted) từ chối cả request.
 */
const ALLOWED = [
  "page",
  "limit",
  "search",
  "status",
  "sortBy",
  "sortOrder",
  "emailVerified",
  "createdFrom",
  "createdTo",
  "address",
] as const;

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ALLOWED) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }

  try {
    return NextResponse.json(
      await apiRequest(`${BACKEND_ROUTES.admin.brandList}?${query}`, {
        token: session.token,
        clientContext: session.clientContext,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
