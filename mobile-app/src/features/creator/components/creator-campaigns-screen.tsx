import { useTranslation } from 'react-i18next';

import { ComingSoonScreen } from '@/features/creator/components/coming-soon-screen';

export function CreatorCampaignsScreen() {
  const { t } = useTranslation();

  return (
    <ComingSoonScreen
      title={t('tabs.myCampaigns')}
      body={t('creator.myCampaignsSoon')}
    />
  );
}
