import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useSessionStore } from '../model/session-store';

/** Check once per launch, then whenever the app returns from the background. */
export function useAppEntry(ready: boolean) {
  const navigation = useRootNavigationState();
  const entered = useRef(false);
  const wasBackgrounded = useRef(AppState.currentState === 'background');

  useEffect(() => {
    if (!ready || !navigation?.key) return;

    if (!entered.current) {
      entered.current = true;
      const { status } = useSessionStore.getState();
      router.replace(status === 'authenticated' ? '/dashboard' : '/welcome');
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        wasBackgrounded.current = true;
      } else if (state === 'active' && wasBackgrounded.current) {
        wasBackgrounded.current = false;
        if (useSessionStore.getState().status === 'unauthenticated') {
          // Clear the guest form stack so Back cannot reopen a previous form.
          router.dismissAll();
          router.replace('/welcome');
        }
      }
      // An iOS "inactive" event alone (notification shade / system dialog)
      // is not leaving the app and must not interrupt form entry.
    });
    return () => subscription.remove();
  }, [ready, navigation?.key]);
}
