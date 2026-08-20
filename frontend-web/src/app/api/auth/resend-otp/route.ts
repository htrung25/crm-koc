import { BACKEND_ROUTES } from "@/constants/routes";
import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/server-client";
import { getClientContext } from "@/lib/api/client-context";
import type { LoginPendingResponse } from "@/features/auth/types";

/** Gửi lại OTP đăng nhập. Backend có cooldown riêng, vượt sẽ trả 429. */
export async function POST(request: Request) {
  let payload: { email?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Body không hợp lệ", businessCode: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const email = payload.email?.trim();
  if (!email) {
    return NextResponse.json(
      { message: "Thiếu email", businessCode: "MISSING_EMAIL" },
      { status: 400 },
    );
  }

  try {
    const result = await apiRequest<LoginPendingResponse>(BACKEND_ROUTES.resendOtp, {
      method: "POST",
      body: { email },
      clientContext: await getClientContext(),
    });
    return NextResponse.json({ message: result.message });
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
