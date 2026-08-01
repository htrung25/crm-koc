import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import { establishSession, parseExpectedRole } from "@/features/auth/guard-role";
import {
  isPendingOtp,
  type LoginResponse,
  type LoginResult,
} from "@/features/auth/types";

/**
 * Bước 1 của đăng nhập: kiểm tra email/mật khẩu ở backend.
 *
 * Tài khoản admin không nhận token ngay — backend gửi OTP qua email và trả
 * `requireOtp`, phải gọi tiếp /api/auth/verify-otp. Brand/creator nhận token
 * luôn ở bước này.
 *
 * `expectedRole` là cổng đang đăng nhập (ví dụ /admin gửi "ADMIN"): sai vai
 * trò thì không có phiên nào được tạo.
 */
export async function POST(request: Request) {
  let payload: { email?: string; password?: string; expectedRole?: unknown };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Body không hợp lệ" }, { status: 400 });
  }

  const email = payload.email?.trim();
  const { password } = payload;
  const expectedRole = parseExpectedRole(payload.expectedRole);

  if (!email || !password) {
    return NextResponse.json(
      { message: "Vui lòng nhập email và mật khẩu" },
      { status: 400 },
    );
  }

  try {
    const result = await apiRequest<LoginResponse>("/login", {
      method: "POST",
      body: { email, password },
    });

    // Admin: backend mới gửi OTP, chưa có token nên chưa xét được vai trò.
    // Chốt chặn role nằm ở /api/auth/verify-otp.
    if (isPendingOtp(result)) {
      return NextResponse.json<LoginResult>({
        status: "otp_required",
        message: result.message,
      });
    }

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
