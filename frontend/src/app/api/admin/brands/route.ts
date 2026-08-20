import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/src/features/auth/session";
import { ApiError, apiRequest } from "@/src/lib/api/client";
import { getClientContext } from "@/src/lib/api/client-context";

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
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Phiên đã kết thúc", businessCode: "SESSION_EXPIRED" },
      { status: 401 },
    );
  }

  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ALLOWED) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }

  try {
    return NextResponse.json(
      await apiRequest(`/admin/brands-list?${query}`, {
        token,
        clientContext: await getClientContext(),
      }),
    );
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return NextResponse.json(
      { message: error.message, businessCode: error.businessCode },
      { status: error.status },
    );
  }
}
