import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Screen, Text } from '@/shared/ui';

export default function NotFoundScreen() {
  const { spacing } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
          <Text variant="heading">404</Text>
          <Link href="/">
            <Text tone="primary">/</Text>
          </Link>
        </View>
      </Screen>
    </>
  );
}
