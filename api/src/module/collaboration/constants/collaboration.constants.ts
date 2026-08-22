import { BadRequestException } from '@nestjs/common';
import { ECollaborationStatus } from '../../../common/enum/collaboration-status.enum';
import { ERole } from '../../../common/enum/roles.enum';
import { ESortField } from '../../../common/enum/sort-fields.enum';
import { Collaboration } from '../entities/collaboration.entity';

/** Enum số nên Object.values trả cả tên lẫn số; lọc lấy phần số có kiểu. */
export const ALL_STATUSES = Object.values(ECollaborationStatus).filter(
  (value): value is ECollaborationStatus => typeof value === 'number',
);

/** Hợp tác đang dở: chặn tạo trùng. Xong hoặc huỷ rồi thì hợp tác lại được. */
export const OPEN_STATUSES = [
  ECollaborationStatus.PENDING,
  ECollaborationStatus.ACTIVE,
  ECollaborationStatus.SUBMITTED,
];

/** Enum là số nên thông điệp lỗi phải tự dịch, không thì FE nhận "3" trơ trọi. */
export const STATUS_LABEL: Record<ECollaborationStatus, string> = {
  [ECollaborationStatus.PENDING]: 'pending',
  [ECollaborationStatus.ACTIVE]: 'active',
  [ECollaborationStatus.SUBMITTED]: 'submitted',
  [ECollaborationStatus.COMPLETED]: 'completed',
  [ECollaborationStatus.CANCELLED]: 'cancelled',
  [ECollaborationStatus.DISPUTED]: 'disputed',
};

/**
 * Chuyển trạng thái hợp lệ.
 */
const BOTH_PARTIES = [ERole.BRAND, ERole.CREATOR];

export const TRANSITION_ACTORS: Record<
  ECollaborationStatus,
  Partial<Record<ECollaborationStatus, ERole[]>>
> = {
  [ECollaborationStatus.PENDING]: {
    // Chỉ creator nhận việc. Brand tự nhận thay là mất lớp bảo vệ duy nhất
    // khiến completed có giá trị.
    [ECollaborationStatus.ACTIVE]: [ERole.CREATOR],
    [ECollaborationStatus.CANCELLED]: BOTH_PARTIES,
  },
  [ECollaborationStatus.ACTIVE]: {
    [ECollaborationStatus.SUBMITTED]: [ERole.CREATOR],
    [ECollaborationStatus.CANCELLED]: BOTH_PARTIES,
    [ECollaborationStatus.DISPUTED]: BOTH_PARTIES,
  },
  [ECollaborationStatus.SUBMITTED]: {
    [ECollaborationStatus.COMPLETED]: [ERole.BRAND],
    // Brand từ chối bài, trả về cho creator làm lại.
    [ECollaborationStatus.ACTIVE]: [ERole.BRAND],
    [ECollaborationStatus.CANCELLED]: BOTH_PARTIES,
    [ECollaborationStatus.DISPUTED]: BOTH_PARTIES,
  },
  [ECollaborationStatus.COMPLETED]: {
    [ECollaborationStatus.DISPUTED]: BOTH_PARTIES,
  },
  [ECollaborationStatus.CANCELLED]: {},
  [ECollaborationStatus.DISPUTED]: {
    [ECollaborationStatus.COMPLETED]: [ERole.ADMIN],
  },
};

export type CollaborationTimestamp =
  'startedAt' | 'submittedAt' | 'completedAt' | 'cancelledAt';

/**
 * Mốc thời gian gắn với từng trạng thái.
 * PENDING không có mốc riêng (đã có created_at), DISPUTED chưa có cột.
 */
export const STATUS_TIMESTAMP: Partial<
  Record<ECollaborationStatus, CollaborationTimestamp>
> = {
  [ECollaborationStatus.ACTIVE]: 'startedAt',
  [ECollaborationStatus.SUBMITTED]: 'submittedAt',
  [ECollaborationStatus.COMPLETED]: 'completedAt',
  [ECollaborationStatus.CANCELLED]: 'cancelledAt',
};

export const COLLABORATION_LIST_FIELDS = [
  'id',
  'brandId',
  'creatorId',
  'campaignId',
  'status',
  'agreedPrice',
  'startedAt',
  'submittedAt',
  'completedAt',
  'cancelledAt',
  'createdAt',
  'updatedAt',
] as const;

/** collaborations không có cột name/email nên không nhận trọn ESortField. */
export const COLLABORATION_SORT_FIELDS = [
  ESortField.CREATED_AT,
  ESortField.UPDATED_AT,
  ESortField.STATUS,
  ESortField.AGREED_PRICE,
  ESortField.COMPLETED_AT,
] as const;

/** Kiểu của một dòng trong danh sách: đúng bằng các cột đã select. */
export type CollaborationListItem = Pick<
  Collaboration,
  (typeof COLLABORATION_LIST_FIELDS)[number]
>;

/** sortBy đi thẳng vào SQL nên phải khớp danh sách cột cho phép. */
export function assertSortField(
  value: string,
): (typeof COLLABORATION_SORT_FIELDS)[number] {
  const allowed = COLLABORATION_SORT_FIELDS as readonly string[];
  if (!allowed.includes(value)) {
    throw new BadRequestException(
      `sortBy must be one of: ${allowed.join(', ')}`,
    );
  }
  return value as (typeof COLLABORATION_SORT_FIELDS)[number];
}
