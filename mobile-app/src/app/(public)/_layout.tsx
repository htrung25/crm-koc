import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { brand } from '@/shared/theme';

export default function PublicLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: brand.paper }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: brand.paper } }}
      />
    </View>
  );
}
