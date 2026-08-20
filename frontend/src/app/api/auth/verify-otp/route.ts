import { BACKEND_ROUTES } from "@/config/route";
import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import { getClientContext } from "@/lib/api/client-context";
import {
  establishSession,
  parseExpectedRole,
} from "@/features/auth/guard-role";
import type { LoginTokenResponse } from "@/features/auth/types";

/**
 * Bước 2 của đăng nhập admin: đổi OTP lấy access token và ghi cookie phiên.
 */
export async function POST(request: Request) {
  let payload: { email?: string; otp?: string; expectedRole?: unknown };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body không hợp lệ", businessCode: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const email = payload.email?.trim();
  const otp = payload.otp?.trim();
  const expectedRole = parseExpectedRole(payload.expectedRole);

  if (!email || !otp) {
    return NextResponse.json(
      { message: "Thiếu email hoặc mã OTP", businessCode: "MISSING_OTP" },
      { status: 400 },
    );
  }

  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json(
      { message: "Mã OTP gồm 6 chữ số", businessCode: "OTP_LENGTH" },
      { status: 400 },
    );
  }

  const clientContext = await getClientContext();

  try {
    const result = await apiRequest<LoginTokenResponse>(BACKEND_ROUTES.verifyOtp, {
      method: "POST",
      body: { email, otp },
      clientContext,
    });

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
