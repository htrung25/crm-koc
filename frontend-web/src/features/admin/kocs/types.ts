import type {
  CreatorAccountState,
  CollaborationStatus,
} from './creator-domain';

export type SocialPlatform = 'TikTok' | 'Instagram' | 'YouTube' | 'Facebook';

export type PlatformFollower = {
  platform: SocialPlatform;
  count: string;
};

export type PlatformEngagement = {
  platform: SocialPlatform;
  rate: string;
};

export type KocStatus = CreatorAccountState;

export type KocItem = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  initials: string;
  avatarGradient: string;
  followers: PlatformFollower[];
  engagement: PlatformEngagement[];
  category: string;
  completedCampaigns: number | null;
  totalRevenue: string | null;
  status: KocStatus;
  email?: string;
  phone?: string;
  bio?: string;
  platformMetrics?: {
    platform: SocialPlatform;
    averageViews?: string;
    totalLikes?: string;
    averageLikes?: string;
  }[];
  brandReviews?: {
    averageRating: number;
    contentQuality: number;
    timeliness: number;
    professionalism: number;
    reviews: {
      id: string;
      brand: string;
      campaign: string;
      date: string;
      rating: number;
      comment: string;
    }[];
  };
  campaignHistory?: {
    id: string;
    campaign: string;
    brand: string;
    period: string;
    campaignId: string | null;
    agreedPrice: string | null;
    status: CollaborationStatus;
  }[];
};

export type KocViewMode = 'table' | 'cards';

export type KocFilterStatus = 'all' | KocStatus;
