import type { AccountStatus } from '@/features/admin/types';

export const CREATOR_ACCOUNT_STATES = {
  pending: { code: 1, label: 'Chờ xác minh' },
  active: { code: 2, label: 'Hoạt động' },
  suspended: { code: 3, label: 'Tạm ngưng' },
  banned: { code: 4, label: 'Đã khóa' },
} as const satisfies Record<string, { code: AccountStatus; label: string }>;
export type CreatorAccountState = keyof typeof CREATOR_ACCOUNT_STATES;

export const COLLABORATION_STATUS = {
  PENDING: 1,
  ACTIVE: 2,
  SUBMITTED: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  DISPUTED: 6,
} as const;
export type CollaborationStatus =
  (typeof COLLABORATION_STATUS)[keyof typeof COLLABORATION_STATUS];
export const COLLABORATION_LABELS: Record<CollaborationStatus, string> = {
  1: 'Chờ xác nhận',
  2: 'Đang thực hiện',
  3: 'Đã nộp nội dung',
  4: 'Hoàn thành',
  5: 'Đã hủy',
  6: 'Tranh chấp',
};
export const CREATOR_REVENUE_DESCRIPTION = 'Tổng giá trị hợp tác đã hoàn thành';

/** No profile mutations are granted by administrative rank, including Super Admin.
 * This is the frontend policy; backend enforcement is tracked in contracts/permissions.md. */
export const ADMIN_CREATOR_PROFILE_ACTIONS = ['view'] as const;

export type CompletedCollaborationInput = {
  id: string;
  campaignId: string | null;
  status: CollaborationStatus;
  agreedPrice: string | null;
  currency: 'VND';
};

/** Reference calculation for complete fixture datasets only, never a page of API history.
 * Production aggregates must come from the backend over the entire Creator scope. */
export function summarizeCompletedCollaborations(
  rows: readonly CompletedCollaborationInput[]
) {
  const unique = new Map<string, CompletedCollaborationInput>();
  for (const row of rows) {
    if (unique.has(row.id)) throw new Error('Duplicate collaboration ID');
    if (row.currency !== 'VND')
      throw new Error('Only VND aggregates are supported');
    if (row.agreedPrice !== null && !/^\d+$/.test(row.agreedPrice))
      throw new Error('Price must be a nonnegative integer string');
    unique.set(row.id, row);
  }
  const completed = [...unique.values()].filter(
    (row) => row.status === COLLABORATION_STATUS.COMPLETED
  );
  const campaigns = new Set(
    completed.flatMap((row) => (row.campaignId ? [row.campaignId] : []))
  );
  return {
    completedCampaigns: campaigns.size,
    completedCollaborations: completed.length,
    totalRevenue: completed.some((row) => row.agreedPrice === null)
      ? null
      : completed
          .reduce((total, row) => total + BigInt(row.agreedPrice!), BigInt(0))
          .toString(),
    currency: 'VND' as const,
  };
}
