import { useTranslation } from 'react-i18next';

import { ComingSoonScreen } from '@/features/creator/components/coming-soon-screen';

export function CreatorWalletScreen() {
  const { t } = useTranslation();

  return (
    <ComingSoonScreen title={t('tabs.wallet')} body={t('creator.walletSoon')} />
  );
}
