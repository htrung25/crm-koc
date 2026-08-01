import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import { establishSession, parseExpectedRole } from "@/features/auth/guard-role";
import type { LoginTokenResponse } from "@/features/auth/types";

/**
 * Bước 2 của đăng nhập admin: đổi OTP lấy access token và ghi cookie phiên.
 */
export async function POST(request: Request) {
  let payload: { email?: string; otp?: string; expectedRole?: unknown };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Body không hợp lệ" }, { status: 400 });
  }

  const email = payload.email?.trim();
  const otp = payload.otp?.trim();
  const expectedRole = parseExpectedRole(payload.expectedRole);

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

    return await establishSession(result, expectedRole);
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
