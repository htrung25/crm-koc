import {
  CAMPAIGN_STATUS,
  type BrandCampaign,
  type CreatorSummary,
  type StatusCount,
} from '@/features/brand/model/types';

export const brandCampaigns: BrandCampaign[] = [
  {
    id: 'b-1',
    code: 'CMP-9KN0CYKR',
    title: 'Seeding serum bí đao cho da dầu mụn',
    status: CAMPAIGN_STATUS.APPROVED,
    wizardStep: null,
    applicationDeadline: '2026-09-30T17:00:00Z',
    updatedAt: '2026-09-10T08:00:00Z',
  },
  {
    id: 'b-2',
    code: 'CMP-4TQ7M2XA',
    title: 'Livestream ra mắt son kem lì',
    status: CAMPAIGN_STATUS.PENDING_APPROVAL,
    wizardStep: null,
    applicationDeadline: '2026-10-05T17:00:00Z',
    updatedAt: '2026-09-11T02:30:00Z',
  },
  {
    id: 'b-3',
    code: 'CMP-H3W8PZ5D',
    title: 'Review bộ chăm sóc tóc thảo mộc',
    status: CAMPAIGN_STATUS.CHANGES_REQUESTED,
    wizardStep: null,
    applicationDeadline: '2026-10-12T17:00:00Z',
    updatedAt: '2026-09-09T10:15:00Z',
  },
  {
    id: 'b-4',
    code: 'CMP-7RB2KV9E',
    title: 'Unbox quà tặng Trung thu',
    status: CAMPAIGN_STATUS.REJECTED,
    wizardStep: null,
    applicationDeadline: null,
    updatedAt: '2026-09-08T04:00:00Z',
  },
  {
    id: 'b-5',
    code: 'CMP-2MX6QT8N',
    title: null,
    status: CAMPAIGN_STATUS.DRAFT,
    wizardStep: 2,
    applicationDeadline: null,
    updatedAt: '2026-09-11T06:45:00Z',
  },
  {
    id: 'b-6',
    code: 'CMP-5JC1WN4R',
    title: 'Son dưỡng môi mùa đông',
    status: CAMPAIGN_STATUS.DRAFT,
    wizardStep: 4,
    applicationDeadline: null,
    updatedAt: '2026-09-07T09:20:00Z',
  },
  {
    id: 'b-7',
    code: 'CMP-8PD3ZL6H',
    title: 'Seeding sữa rửa mặt cà phê',
    status: CAMPAIGN_STATUS.APPROVED,
    wizardStep: null,
    applicationDeadline: '2026-09-20T17:00:00Z',
    updatedAt: '2026-09-05T03:00:00Z',
  },
  {
    id: 'b-8',
    code: 'CMP-3VG9YT2K',
    title: 'Minigame tháng 8',
    status: CAMPAIGN_STATUS.CANCELLED,
    wizardStep: null,
    applicationDeadline: null,
    updatedAt: '2026-08-28T11:00:00Z',
  },
];

// API trả sẵn statusCounts; ở đây đếm từ dữ liệu mẫu để số liệu luôn khớp.
export const statusCounts: StatusCount[] = Object.values(CAMPAIGN_STATUS).map(
  (status) => ({
    status,
    count: brandCampaigns.filter((campaign) => campaign.status === status)
      .length,
  })
);

export const activeCollaborationCount = 12;

export const creators: CreatorSummary[] = [
  {
    id: 'an',
    name: 'An Nhiên Beauty',
    platform: 'TikTok',
    followers: '850K',
    category: 'Làm đẹp',
    color: 'primary',
  },
  {
    id: 'minh',
    name: 'Minh Review Tech',
    platform: 'YouTube',
    followers: '420K',
    category: 'Công nghệ',
    color: 'blue',
  },
  {
    id: 'ha',
    name: 'Hà Linh Skincare',
    platform: 'TikTok',
    followers: '1.2M',
    category: 'Làm đẹp',
    color: 'purple',
  },
  {
    id: 'khoa',
    name: 'Khoa Ăn Gì',
    platform: 'Facebook',
    followers: '310K',
    category: 'Ẩm thực',
    color: 'blue',
  },
  {
    id: 'vy',
    name: 'Vy Mặc Đẹp',
    platform: 'Instagram',
    followers: '96K',
    category: 'Thời trang',
    color: 'primary',
  },
];

export const creatorCategories = [
  ...new Set(creators.map((creator) => creator.category)),
];
