import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/features/auth/session";
import { ApiError, apiRequest } from "@/lib/api/client";
import { getClientContext } from "@/lib/api/client-context";
import {
  SUPER_ADMIN_REQUIRED,
  type WhitelistErrorBody,
} from "@/features/admin/ip-whitelist/types";

type Context = { params: Promise<{ id: string }> };

async function session() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return { token, clientContext: await getClientContext() };
}

function errorResponse(error: unknown) {
  if (!(error instanceof ApiError)) throw error;

  // SuperAdminGuard ném ForbiddenException nên Nest không kèm businessCode.
  // Chuẩn hoá ở đây để UI so mã, không phải so chuỗi tiếng Anh của backend.
  const body: WhitelistErrorBody =
    error.status === 403 && error.message === "REQUIRES_SUPER_ADMIN"
      ? { message: error.message, businessCode: SUPER_ADMIN_REQUIRED }
      : {
          message: error.message,
          businessCode: error.businessCode,
          clientIp: error.clientIp,
        };

  return NextResponse.json(body, { status: error.status });
}

export async function GET(_: Request, context: Context) {
  const { token, clientContext } = await session();
  if (!token) {
    return NextResponse.json({ message: "Phiên đã kết thúc", businessCode: "SESSION_EXPIRED" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    return NextResponse.json(
      await apiRequest(`/admin/${id}`, { token, clientContext }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  const { token, clientContext } = await session();
  if (!token) {
    return NextResponse.json({ message: "Phiên đã kết thúc", businessCode: "SESSION_EXPIRED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = await context.params;
    return NextResponse.json(
      await apiRequest(`/admin/${id}`, {
        method: "PATCH",
        body,
        token,
        clientContext,
      }),
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "Body không hợp lệ", businessCode: "INVALID_BODY" }, { status: 400 });
    }
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: Context) {
  const { token, clientContext } = await session();
  if (!token) {
    return NextResponse.json({ message: "Phiên đã kết thúc", businessCode: "SESSION_EXPIRED" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    return NextResponse.json(
      await apiRequest(`/admin/${id}`, {
        method: "DELETE",
        token,
        clientContext,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
