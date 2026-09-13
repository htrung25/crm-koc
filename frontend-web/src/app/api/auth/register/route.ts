import { BACKEND_ROUTES } from '@/constants/routes';
import { NextResponse } from 'next/server';

import { ApiError, apiRequest } from '@/lib/api/server-client';
import { getClientContext } from '@/lib/api/client-context';
import type { LoginPendingResponse } from '@/features/auth/types';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]).{8,}$/;

export async function POST(request: Request) {
  let payload: {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    role?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Body không hợp lệ', businessCode: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;
  const phone = payload.phone?.trim();
  const role = payload.role?.toUpperCase();

  if (!name) {
    return NextResponse.json(
      { message: 'Vui lòng nhập họ và tên', businessCode: 'MISSING_NAME' },
      { status: 400 }
    );
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { message: 'Email không hợp lệ', businessCode: 'INVALID_EMAIL' },
      { status: 400 }
    );
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      {
        message: 'Mật khẩu phải có tối thiểu 8 ký tự',
        businessCode: 'PASSWORD_TOO_SHORT',
      },
      { status: 400 }
    );
  }

  if (!PASSWORD_REGEX.test(password)) {
    return NextResponse.json(
      {
        message:
          'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
        businessCode: 'PASSWORD_WEAK',
      },
      { status: 400 }
    );
  }

  const VN_PHONE_REGEX = /^(?:\+?84|0)([1-9]\d{8})$/;
  if (phone && !VN_PHONE_REGEX.test(phone)) {
    return NextResponse.json(
      {
        message: 'Số điện thoại không hợp lệ (định dạng số điện thoại Việt Nam)',
        businessCode: 'INVALID_PHONE',
      },
      { status: 400 }
    );
  }

  if (role !== 'BRAND' && role !== 'CREATOR') {
    return NextResponse.json(
      { message: 'Vai trò tài khoản không hợp lệ', businessCode: 'INVALID_ROLE' },
      { status: 400 }
    );
  }

  const clientContext = await getClientContext();

  const endpoint =
    role === 'BRAND'
      ? BACKEND_ROUTES.registerBrand
      : BACKEND_ROUTES.registerCreator;

  try {
    const result = await apiRequest<LoginPendingResponse>(endpoint, {
      method: 'POST',
      body: {
        name,
        email,
        password,
        ...(phone ? { phone } : {}),
      },
      clientContext,
    });

    return NextResponse.json({
      status: 'otp_required',
      message: result.message || 'Mã OTP đã được gửi tới email của bạn.',
      email,
      role,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      let friendlyMessage = error.message;
      if (
        error.status === 409 ||
        error.message.includes('already exists')
      ) {
        friendlyMessage = 'Email hoặc số điện thoại này đã được đăng ký.';
      }

      return NextResponse.json(
        {
          message: friendlyMessage,
          businessCode: error.businessCode,
          clientIp: error.clientIp,
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Đăng ký tài khoản thất bại',
      },
      { status: 500 }
    );
  }
}
