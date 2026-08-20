export type AccountStatus = "active" | "pending" | "paused";

export interface PlatformBadge {
  name: string;
  style?: string;
}

export interface KOCItem {
  id: number;
  name: string;
  handle: string;
  initials: string;
  avatarBg: string;
  followers: number;
  engagementRate: number;
  category: string;
  categoryVi: string;
  categoryEn: string;
  status: AccountStatus;
  statusStyle: string;
  statusLabelVi: string;
  statusLabelEn: string;
  campaignCount: number;
  revenue: number; // In Millions (VND)
  platforms: string[];
  bio?: string;
  rating?: number;
}

export interface BrandCampaign {
  nameVi: string;
  nameEn: string;
  period: string;
  revenue: string;
  status: AccountStatus;
  statusStyle: string;
  statusLabelVi: string;
  statusLabelEn: string;
}

export interface BrandItem {
  id: number;
  name: string;
  initials: string;
  bg: string;
  category: string;
  industryVi: string;
  industryEn: string;
  campaignCount: number;
  kocCount: number;
  budget: string;
  status: AccountStatus;
  statusStyle: string;
  statusLabelVi: string;
  statusLabelEn: string;
  campaigns: BrandCampaign[];
  kocList: KOCItem[];
  avgEngage: string;
}

export interface LeaderboardKOC {
  rank: number;
  name: string;
  handle: string;
  initials: string;
  avatarBg: string;
  revenue: number;
  pct: number;
}
