import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { INITIAL_CAMPAIGNS } from '@/features/admin/campaigns/campaign-data';
import { CampaignDetailContainer } from '@/features/admin/campaigns/components/campaign-detail-container';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const campaign = INITIAL_CAMPAIGNS.find((c) => c.id === resolvedParams.id);
  if (!campaign) return { title: 'Chi tiết chiến dịch' };
  return { title: `${campaign.title} | Quản lý chiến dịch` };
}

export default async function AdminCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const campaign = INITIAL_CAMPAIGNS.find((c) => c.id === resolvedParams.id);

  if (!campaign) {
    notFound();
  }

  return <CampaignDetailContainer initialCampaign={campaign} />;
}
