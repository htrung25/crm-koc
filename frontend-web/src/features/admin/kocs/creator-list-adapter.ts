import type { CreatorAccount } from './creator-types';
import type { KocItem, KocStatus } from './types';

const states: Record<CreatorAccount['status'], KocStatus> = {
  1: 'pending',
  2: 'active',
  3: 'suspended',
  4: 'banned',
};

export function creatorListItem(account: CreatorAccount): KocItem {
  return {
    id: account.id,
    name: account.name || account.email,
    email: account.email,
    phone: account.phone ?? undefined,
    handle: '—',
    category: '—',
    initials: (account.name || account.email)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase(),
    avatarGradient: 'from-[#7C5CFF] to-[#A78BFA]',
    followers: [],
    engagement: [],
    completedCampaigns: null,
    totalRevenue: null,
    status: states[account.status],
  };
}
