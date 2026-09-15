import { toApiError } from '@/shared/api';
import { Text } from '@/shared/ui';

/** Hiển thị lỗi trả về từ API ở đầu form. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const message = toApiError(error).messages.join('\n');
  return (
    <Text variant="caption" tone="danger">
      {message}
    </Text>
  );
}
