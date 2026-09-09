import { Redirect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { OtpForm } from '@/features/auth';
import { useTheme } from '@/shared/theme';
import { Screen, Text } from '@/shared/ui';

export default function VerifyOtpScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { email } = useLocalSearchParams<{ email?: string }>();

  // Vào thẳng bằng deep link mà không có email thì không xác thực được
  if (!email) return <Redirect href="/login" />;

  return (
    <Screen scrollable>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
        <View style={{ gap: spacing.xs }}>
          <Text variant="title">{t('auth.otp.title')}</Text>
          <Text tone="muted">{t('auth.otp.subtitle', { email })}</Text>
        </View>
        <OtpForm email={email} />
      </View>
    </Screen>
  );
}
