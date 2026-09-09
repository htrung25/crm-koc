import { z } from 'zod';
const email = z.string().trim().pipe(z.email('redsun.errors.email'));
const password = z.string().min(8, 'redsun.errors.password');
export const signInSchema = z.object({ email, password, remember: z.boolean() });
export type SignInValues = z.infer<typeof signInSchema>;
export const registerSchema = z
  .object({
    role: z.enum(['koc', 'brand']),
    name: z.string().trim().min(2, 'redsun.errors.name'),
    email,
    phone: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s().-]/g, ''))
      .pipe(z.string().regex(/^(?:0|\+84)\d{9}$/, 'redsun.errors.phone')),
    password,
    confirmPassword: z.string(),
    terms: z.boolean().refine((value) => value, 'redsun.errors.terms'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'redsun.errors.confirm',
    path: ['confirmPassword'],
  });
export type RegisterValues = z.infer<typeof registerSchema>;
