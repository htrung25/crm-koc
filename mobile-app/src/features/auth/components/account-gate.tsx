import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Button, Card, Screen, Text } from '@/shared/ui';

import { useLogout, useMe, useSession } from '@/features/auth/hooks/use-auth';

/** Mở lại app chỉ còn token; phải nạp xong account mới biết vai trò. */
export function AccountGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { account } = useSession();
  const me = useMe();
  const logout = useLogout();

  if (account) return <>{children}</>;

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
        {me.error ? (
          <Card>
            <Text variant="heading">{t('common.errorTitle')}</Text>
            <Text tone="muted">{me.error.message}</Text>
            <Button
              title={t('common.retry')}
              variant="secondary"
              onPress={() => me.refetch()}
            />
            <Button
              title={t('auth.logout')}
              variant="ghost"
              loading={logout.isPending}
              onPress={() => logout.mutate()}
            />
          </Card>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    </Screen>
  );
}
