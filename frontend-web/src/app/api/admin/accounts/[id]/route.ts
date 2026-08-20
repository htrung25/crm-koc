import { NextResponse } from "next/server";

import { BACKEND_ROUTES } from "@/constants/routes";
import {
  SUPER_ADMIN_REQUIRED,
  type WhitelistErrorBody,
} from "@/features/admin/ip-whitelist/types";
import { ApiError, apiRequest } from "@/lib/api/server-client";
import { errorResponse, requireSession } from "@/lib/api/route-session";

type Context = { params: Promise<{ id: string }> };

/**
 * SuperAdminGuard ném ForbiddenException nên Nest không kèm businessCode.
 * Chuẩn hoá ở đây để UI so mã, không phải so chuỗi tiếng Anh của backend.
 */
function adminErrorResponse(error: unknown) {
  if (
    error instanceof ApiError &&
    error.status === 403 &&
    error.message === "REQUIRES_SUPER_ADMIN"
  ) {
    const body: WhitelistErrorBody = {
      message: error.message,
      businessCode: SUPER_ADMIN_REQUIRED,
    };
    return NextResponse.json(body, { status: error.status });
  }

  return errorResponse(error);
}

export async function GET(_: Request, context: Context) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const { id } = await context.params;
    return NextResponse.json(
      await apiRequest(BACKEND_ROUTES.admin.detail(id), {
        token: session.token,
        clientContext: session.clientContext,
      }),
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const body = await request.json();
    const { id } = await context.params;
    return NextResponse.json(
      await apiRequest(BACKEND_ROUTES.admin.detail(id), {
        method: "PATCH",
        body,
        token: session.token,
        clientContext: session.clientContext,
      }),
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_: Request, context: Context) {
  const session = await requireSession();
  if (!session.ok) return session.response;

  try {
    const { id } = await context.params;
    return NextResponse.json(
      await apiRequest(BACKEND_ROUTES.admin.detail(id), {
        method: "DELETE",
        token: session.token,
        clientContext: session.clientContext,
      }),
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
