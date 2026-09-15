import { z } from 'zod';
const email = z.string().trim().pipe(z.email('redsun.errors.email'));
const password = z.string().min(8, 'redsun.errors.password');
// Khớp PASSWORD_REGEX của API; lệch thì API trả 400
const newPassword = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]).{8,}$/,
    'redsun.errors.passwordStrength'
  );
export const signInSchema = z.object({ email, password });
export type SignInValues = z.infer<typeof signInSchema>;
export const registerSchema = z
  .object({
    role: z.enum(['creator', 'brand']),
    name: z.string().trim().min(2, 'redsun.errors.name'),
    email,
    phone: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s().-]/g, ''))
      .pipe(z.string().regex(/^(?:0|\+84)\d{9}$/, 'redsun.errors.phone')),
    password: newPassword,
    confirmPassword: z.string(),
    terms: z.boolean().refine((value) => value, 'redsun.errors.terms'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'redsun.errors.confirm',
    path: ['confirmPassword'],
  });
export type RegisterValues = z.infer<typeof registerSchema>;
