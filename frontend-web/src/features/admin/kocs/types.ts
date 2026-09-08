export type SocialPlatform = 'TikTok' | 'Instagram' | 'YouTube' | 'Facebook';

export type PlatformFollower = {
  platform: SocialPlatform;
  count: string;
};

export type PlatformEngagement = {
  platform: SocialPlatform;
  rate: string;
};

export type KocStatus = 'active' | 'pending' | 'suspended';

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
  campaigns: number;
  revenue: string;
  status: KocStatus;
  email?: string;
  phone?: string;
};

export type KocViewMode = 'table' | 'cards';

export type KocFilterStatus = 'all' | KocStatus;
