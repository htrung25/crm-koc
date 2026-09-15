import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/features/auth';
import { queryClient, setSessionExpiredHandler } from '@/shared/api';
import { initI18n } from '@/shared/i18n';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function useAppBootstrap(): boolean {
  const [ready, setReady] = useState(false);
  const hydrate = useSessionStore((state) => state.hydrate);
  const signOut = useSessionStore((state) => state.signOut);

  useEffect(() => {
    setSessionExpiredHandler(signOut);
    return () => setSessionExpiredHandler(null);
  }, [signOut]);

  useEffect(() => {
    void (async () => {
      await Promise.all([initI18n(), hydrate()]);
      setReady(true);
    })();
  }, [hydrate]);

  return ready;
}
