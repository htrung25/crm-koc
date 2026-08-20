import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/src/lib/api/client";
import { getClientContext } from "@/src/lib/api/client-context";
import {
  establishSession,
  parseExpectedRole,
} from "@/src/features/auth/guard-role";
import type { LoginTokenResponse } from "@/src/features/auth/types";

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
    const result = await apiRequest<LoginTokenResponse>("/verify-otp", {
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
