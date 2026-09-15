import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { AdminCampaignList } from '@/features/admin/campaigns/components/campaign-list';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.campaigns');
  return { title: t('title') };
}

export default async function AdminCampaignsPage() {
  const t = await getTranslations('admin.campaigns');

  return (
    <AdminPageShell title={t('title')} greeting={t('greeting')}>
      <AdminCampaignList />
    </AdminPageShell>
  );
}
