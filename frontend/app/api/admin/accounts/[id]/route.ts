import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/features/auth/session";
import { ApiError, apiRequest } from "@/lib/api/client";
import { getClientContext } from "@/lib/api/client-context";

type Context = { params: Promise<{ id: string }> };

async function session() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return { token, clientContext: await getClientContext() };
}

function errorResponse(error: unknown) {
  if (!(error instanceof ApiError)) throw error;
  return NextResponse.json(
    {
      message: error.message,
      businessCode: error.businessCode,
      clientIp: error.clientIp,
    },
    { status: error.status },
  );
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
