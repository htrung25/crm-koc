import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { useLogout, useMe } from '../hooks/use-auth';
import { useTheme } from '@/shared/theme';
import { Button, Card, Screen, Text } from '@/shared/ui';

export function AccountScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const me = useMe();
  const logout = useLogout();

  return (
    <Screen scrollable>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
        {me.isPending ? (
          <ActivityIndicator />
        ) : me.error ? (
          <Card>
            <Text variant="heading">{t('common.errorTitle')}</Text>
            <Text tone="muted">{me.error.message}</Text>
            <Button title={t('common.retry')} variant="secondary" onPress={() => me.refetch()} />
          </Card>
        ) : (
          <Card>
            <Text variant="heading">{t('home.greeting', { name: me.data?.name })}</Text>
            <Text tone="muted">
              {t('home.roleLabel')}: {me.data?.accountRole ?? '—'}
            </Text>
          </Card>
        )}
        <Button
          title={t('auth.logout')}
          variant="secondary"
          loading={logout.isPending}
          onPress={() => logout.mutate()}
        />
      </View>
    </Screen>
  );
}
