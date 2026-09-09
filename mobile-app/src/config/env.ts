import { z } from 'zod';

// Chỉ biến EXPO_PUBLIC_* mới được inline vào bundle, nên phải đọc tường minh
// từng biến — process.env không duyệt động được ở runtime của Metro.
const schema = z.object({
  apiUrl: z.url(),
  apiTimeoutMs: z.coerce.number().int().positive().default(15_000),
});

const parsed = schema.safeParse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  apiTimeoutMs: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
});

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Cấu hình env không hợp lệ (${detail}). Xem .env.example.`);
}

export const env = parsed.data;
