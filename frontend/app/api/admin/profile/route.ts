import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/features/auth/session";
import type { UpdateAdminProfile } from "@/features/admin/profile/types";
import { ApiError, apiRequest } from "@/lib/api/client";
import { getClientContext } from "@/lib/api/client-context";

async function session() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return { token, clientContext: await getClientContext() };
}

function errorResponse(error: unknown) {
  if (!(error instanceof ApiError)) throw error;
  return NextResponse.json(
    { message: error.message, businessCode: error.businessCode },
    { status: error.status },
  );
}

export async function GET() {
  const { token, clientContext } = await session();
  if (!token) {
    return NextResponse.json({ message: "Phiên đã kết thúc", businessCode: "SESSION_EXPIRED" }, { status: 401 });
  }

  try {
    return NextResponse.json(
      await apiRequest("/admin/profile/me", { token, clientContext }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const { token, clientContext } = await session();
  if (!token) {
    return NextResponse.json({ message: "Phiên đã kết thúc", businessCode: "SESSION_EXPIRED" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ message: "Body không hợp lệ", businessCode: "INVALID_BODY" }, { status: 400 });
    }

    const source = body as Record<string, unknown>;
    const payload: UpdateAdminProfile = {};

    if ("name" in source) {
      if (source.name !== null && typeof source.name !== "string") {
        return NextResponse.json({ message: "name không hợp lệ", businessCode: "INVALID_NAME" }, { status: 400 });
      }
      payload.name = source.name as string | null;
    }
    if ("email" in source) {
      if (typeof source.email !== "string") {
        return NextResponse.json({ message: "email không hợp lệ", businessCode: "INVALID_EMAIL" }, { status: 400 });
      }
      payload.email = source.email;
    }
    if ("avatarUrl" in source) {
      if (source.avatarUrl !== null && typeof source.avatarUrl !== "string") {
        return NextResponse.json(
          { message: "avatarUrl không hợp lệ", businessCode: "INVALID_AVATAR_URL" },
          { status: 400 },
        );
      }
      payload.avatarUrl = source.avatarUrl as string | null;
    }
    if ("timezone" in source) {
      if (typeof source.timezone !== "string") {
        return NextResponse.json(
          { message: "timezone không hợp lệ", businessCode: "INVALID_TIMEZONE" },
          { status: 400 },
        );
      }
      payload.timezone = source.timezone;
    }

    return NextResponse.json(
      await apiRequest("/admin/profile/me", {
        method: "PATCH",
        body: payload,
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
