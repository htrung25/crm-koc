import type { StatusBadgeTone } from '@/shared/types';

import {
  CAMPAIGN_STATUS,
  type BrandCampaign,
  type CampaignStatus,
} from '@/features/brand/model/types';

/** Phần đuôi của khoá i18n `brand.status.*`. */
export const STATUS_KEY: Record<CampaignStatus, string> = {
  [CAMPAIGN_STATUS.DRAFT]: 'draft',
  [CAMPAIGN_STATUS.PENDING_APPROVAL]: 'pendingApproval',
  [CAMPAIGN_STATUS.CHANGES_REQUESTED]: 'changesRequested',
  [CAMPAIGN_STATUS.REJECTED]: 'rejected',
  [CAMPAIGN_STATUS.APPROVED]: 'approved',
  [CAMPAIGN_STATUS.CANCELLED]: 'cancelled',
};

export const STATUS_TONE: Record<CampaignStatus, StatusBadgeTone> = {
  [CAMPAIGN_STATUS.DRAFT]: 'neutral',
  [CAMPAIGN_STATUS.PENDING_APPROVAL]: 'warning',
  [CAMPAIGN_STATUS.CHANGES_REQUESTED]: 'warning',
  [CAMPAIGN_STATUS.REJECTED]: 'danger',
  [CAMPAIGN_STATUS.APPROVED]: 'success',
  [CAMPAIGN_STATUS.CANCELLED]: 'neutral',
};

export function parseStatus(value: string | undefined): CampaignStatus | null {
  return (
    Object.values(CAMPAIGN_STATUS).find((status) => String(status) === value) ??
    null
  );
}

export function byRecentUpdate(a: BrandCampaign, b: BrandCampaign): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function formatShortDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso));
}
