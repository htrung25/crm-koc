/** Khớp ECampaignStatus của API. */
export const CAMPAIGN_STATUS = {
  DRAFT: 1,
  PENDING_APPROVAL: 2,
  CHANGES_REQUESTED: 3,
  REJECTED: 4,
  APPROVED: 5,
  CANCELLED: 6,
} as const;

export type CampaignStatus =
  (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

/** Khớp BrandCampaignListItemDto trong spec; tạm dùng dữ liệu mẫu. */
export type BrandCampaign = {
  id: string;
  code: string;
  title: string | null;
  status: CampaignStatus;
  wizardStep: number | null;
  applicationDeadline: string | null;
  updatedAt: string;
};

export type StatusCount = {
  status: CampaignStatus;
  count: number;
};

export type CreatorSummary = {
  id: string;
  name: string;
  platform: string;
  followers: string;
  category: string;
  color: 'primary' | 'blue' | 'purple';
};
