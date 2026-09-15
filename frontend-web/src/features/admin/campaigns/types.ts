export type CampaignStatus =
  | 'all'
  | 'pending'
  | 'active'
  | 'paused'
  | 'overdue'
  | 'rejected'
  | 'completed';

export type CampaignPlatform = 'TikTok' | 'Instagram' | 'YouTube' | 'Facebook';

export type CampaignDeliverable = {
  type: string;
  count: number;
  description: string;
};

export type RegisteredKoc = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatarBg: string;
  platforms: CampaignPlatform[];
  status: 'Đã duyệt' | 'Đã nộp bài' | 'Chờ duyệt';
};

export type CampaignResults = {
  reach: string;
  impressions: string;
  engagementRate: string;
  conversionRate: string;
};

export type KocRequirements = {
  minFollowers: string;
  contentType: string;
  niche: string;
  demographics: string;
};

export type CampaignItem = {
  id: string;
  title: string;
  brandName: string;
  brandAvatarInitials: string;
  brandAvatarBg: string;
  platforms: CampaignPlatform[];
  budgetFormatted: string;
  budgetRaw: number;
  disbursedAmount?: string;
  disbursedPercent?: number;
  kocCurrent: number;
  kocTarget: number;
  deadline: string;
  daysRemaining: number;
  progress: number;
  status: Exclude<CampaignStatus, 'all'>;
  description?: string;
  category?: string;
  createdAt?: string;
  productName?: string;
  productType?: string;
  targetAudience?: string;
  minFollowers?: string;
  kocRequirements?: KocRequirements;
  deliverables?: CampaignDeliverable[];
  submittedAt?: string;
  kocStats?: {
    registered: number;
    approved: number;
    submitted: number;
  };
  results?: CampaignResults;
  registeredKocs?: RegisteredKoc[];
};

export type CampaignStats = {
  total: number;
  pending: number;
  active: number;
  overdue: number;
};
