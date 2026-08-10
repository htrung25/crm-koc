import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/features/auth/session";
import { ApiError, apiRequest } from "@/lib/api/client";
import { getClientContext } from "@/lib/api/client-context";

function errorResponse(error: unknown) {
  if (!(error instanceof ApiError)) throw error;
  return NextResponse.json(
    { message: error.message, businessCode: error.businessCode },
    { status: error.status },
  );
}

export async function GET(request: Request) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Phiên đã kết thúc" }, { status: 401 });
  }

  const search = new URL(request.url).searchParams.get("search")?.trim();
  const query = new URLSearchParams({ page: "1", limit: "100" });
  if (search) query.set("search", search);

  try {
    const result = await apiRequest(`/admin/admin-list?${query}`, {
      token,
      clientContext: await getClientContext(),
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
