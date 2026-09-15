import { Redirect, Stack } from 'expo-router';

import { AccountGate, useSession } from '@/features/auth';

export default function AppLayout() {
  const { status } = useSession();

  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  return (
    <AccountGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AccountGate>
  );
}
