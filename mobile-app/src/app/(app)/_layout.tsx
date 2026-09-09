import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/features/auth';

export default function AppLayout() {
  const { status } = useSession();

  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
