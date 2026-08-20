import { BACKEND_ROUTES } from "@/config/route";
import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import { getClientContext } from "@/lib/api/client-context";
import {
  establishSession,
  parseExpectedRole,
} from "@/features/auth/guard-role";
import {
  isPendingOtp,
  type LoginResponse,
  type LoginResult,
} from "@/features/auth/types";

export async function POST(request: Request) {
  let payload: { email?: string; password?: string; expectedRole?: unknown };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body không hợp lệ", businessCode: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const email = payload.email?.trim();
  const { password } = payload;
  const expectedRole = parseExpectedRole(payload.expectedRole);

  if (!email || !password) {
    return NextResponse.json(
      {
        message: "Vui lòng nhập email và mật khẩu",
        businessCode: "MISSING_CREDENTIALS",
      },
      { status: 400 },
    );
  }

  // IP thật của người dùng: backend cần nó cho IP whitelist của cổng admin và
  // cho throttle theo email+IP. Thiếu thì mọi request trông như đến từ server.
  const clientContext = await getClientContext();

  try {
    const result = await apiRequest<LoginResponse>(
      expectedRole === "ADMIN" ? BACKEND_ROUTES.loginAdmin
        : BACKEND_ROUTES.loginBrandCreator,
      {
        method: "POST",
        body: { email, password },
        clientContext,
      },
    );

    // Admin: backend mới gửi OTP, chưa có token nên chưa xét được vai trò.
    // Chốt chặn role nằm ở /api/auth/verify-otp.
    if (isPendingOtp(result)) {
      return NextResponse.json<LoginResult>({
        status: "otp_required",
        message: result.message,
      });
    }

    return await establishSession(result, expectedRole, clientContext);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
