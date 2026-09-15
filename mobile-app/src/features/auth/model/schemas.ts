import { z } from 'zod';
import { ACCOUNT_STATUSES, ROLES } from '@/features/auth/model/types';

// Kiểm tra runtime: generic Axios không xác nhận enum mà server thực sự trả về.
export const accountSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  accountRole: z.enum(ROLES).nullable(),
  status: z.literal(ACCOUNT_STATUSES),
});

export const loginResponseSchema = z.object({
  account: accountSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.email({ message: 'auth.login.invalidEmail' }),
  password: z.string().min(8, { message: 'auth.login.passwordTooShort' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const verifyOtpSchema = z.object({
  email: z.email(),
  // message là khoá i18n, form dịch lúc render
  otp: z.string().regex(/^\d{6}$/, { message: 'auth.otp.invalidCode' }),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
