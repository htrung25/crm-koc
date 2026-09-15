import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { brand } from '@/shared/theme';
import { useSession } from '@/features/auth';

export default function PublicLayout() {
  const { status } = useSession();
  if (status === 'authenticated') return <Redirect href="/dashboard" />;
  return (
    <View style={{ flex: 1, backgroundColor: brand.paper }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: brand.paper },
        }}
      />
    </View>
  );
}
