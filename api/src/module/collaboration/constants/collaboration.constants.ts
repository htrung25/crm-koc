import { ECollaborationStatus } from '../../../common/enum/collaboration-status.enum';
import { ERole } from '../../../common/enum/roles.enum';

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
 *
 * Creator nộp bài (ACTIVE -> SUBMITTED), brand duyệt (SUBMITTED -> COMPLETED).
 * ACTIVE KHÔNG đi thẳng sang COMPLETED: bỏ qua bước nộp bài là brand tự chốt
 * được một hợp tác hoàn chỉnh mà creator không tham gia.
 *
 * COMPLETED nghĩa là hợp đồng đã xong và đã thanh toán cho creator, nên không
 * quay ngược được — lối ra duy nhất là khiếu nại. CANCELLED là trạng thái
 * cuối: huỷ rồi thì tạo hợp tác mới chứ không hồi sinh cái cũ.
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
