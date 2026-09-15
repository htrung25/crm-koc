import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/features/auth';
import { TabGlyph, tabBarScreenOptions } from '@/shared/ui';

export default function CreatorLayout() {
  const { t } = useTranslation();
  const { account } = useSession();

  if (account?.accountRole !== 'creator') {
    return <Redirect href="/dashboard" />;
  }

  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color }) => <TabGlyph glyph="⌂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: t('tabs.myCampaigns'),
          tabBarIcon: ({ color }) => <TabGlyph glyph="◎" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t('tabs.wallet'),
          tabBarIcon: ({ color }) => <TabGlyph glyph="◫" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('tabs.account'),
          tabBarIcon: ({ color }) => <TabGlyph glyph="☺" color={color} />,
        }}
      />
    </Tabs>
  );
}
