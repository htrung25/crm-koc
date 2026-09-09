import { ApiError } from '@/shared/api';
import { Text } from '@/shared/ui';

/** Hiển thị lỗi trả về từ API ở đầu form. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof ApiError ? error.message : String(error);
  return (
    <Text variant="caption" tone="danger">
      {message}
    </Text>
  );
}
