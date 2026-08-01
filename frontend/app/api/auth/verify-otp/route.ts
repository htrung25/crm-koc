import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import { applySession } from "@/features/auth/session";
import {
  toUserRole,
  ROLE_HOME,
  type LoginTokenResponse,
  type LoginResult,
} from "@/features/auth/types";

/**
 * Bước 2 của đăng nhập admin: đổi OTP lấy access token và ghi cookie phiên.
 */
export async function POST(request: Request) {
  let payload: { email?: string; otp?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Body không hợp lệ" }, { status: 400 });
  }

  const email = payload.email?.trim();
  const otp = payload.otp?.trim();

  if (!email || !otp) {
    return NextResponse.json(
      { message: "Thiếu email hoặc mã OTP" },
      { status: 400 },
    );
  }

  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json(
      { message: "Mã OTP gồm 6 chữ số" },
      { status: 400 },
    );
  }

  try {
    const result = await apiRequest<LoginTokenResponse>("/verify-otp", {
      method: "POST",
      body: { email, otp },
    });

    const role = toUserRole(result.account.accountRole);
    if (!role) {
      return NextResponse.json(
        { message: `Vai trò không được hỗ trợ: ${result.account.accountRole}` },
        { status: 502 },
      );
    }

    return applySession(
      NextResponse.json<LoginResult>({
        status: "authenticated",
        role,
        redirectTo: ROLE_HOME[role],
      }),
      result.access_token,
      role,
    );
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
