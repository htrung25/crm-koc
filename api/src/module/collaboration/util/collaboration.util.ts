import { BadRequestException } from '@nestjs/common';
import { COLLABORATION_SORT_FIELDS } from '../constants/collaboration.constants';
import type { CollaborationSortField } from '../types/collaboration.types';

/** sortBy đi thẳng vào SQL nên phải khớp danh sách cột cho phép. */
export function assertSortField(value: string): CollaborationSortField {
  const allowed = COLLABORATION_SORT_FIELDS as readonly string[];
  if (!allowed.includes(value)) {
    throw new BadRequestException(
      `sortBy must be one of: ${allowed.join(', ')}`,
    );
  }
  return value as CollaborationSortField;
}
