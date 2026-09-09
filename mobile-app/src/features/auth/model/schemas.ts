import { z } from 'zod';

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
