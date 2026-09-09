import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { LoginForm } from '@/features/auth';
import { useTheme } from '@/shared/theme';
import { Screen, Text } from '@/shared/ui';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <Screen scrollable>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
        <View style={{ gap: spacing.xs }}>
          <Text variant="title">{t('auth.login.title')}</Text>
          <Text tone="muted">{t('auth.login.subtitle')}</Text>
        </View>
        <LoginForm
          onOtpRequired={(email) => router.push({ pathname: '/verify-otp', params: { email } })}
        />
      </View>
    </Screen>
  );
}
