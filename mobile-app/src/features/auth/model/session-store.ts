import { create } from 'zustand';

import { queryClient } from '@/shared/api/query-client';
import { tokenStorage } from '@/shared/storage/token-storage';

import type { Account, TokenPair } from '@/features/auth/model/types';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

type SessionState = {
  status: SessionStatus;
  account: Account | null;
  sessionVersion: number;
  /** Đọc token từ keychain lúc mở app; giữ splash cho tới khi xong. */
  hydrate: () => Promise<void>;
  signIn: (tokens: TokenPair, account: Account) => Promise<void>;
  setAccount: (account: Account, sessionVersion: number) => void;
  signOut: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'loading',
  account: null,
  sessionVersion: tokenStorage.getSessionVersion(),

  hydrate: async () => {
    const tokens = await tokenStorage.hydrate();
    // Có token là đủ để vào app; `GET /auth/me` sẽ xác nhận và nạp account,
    // 401 ở đó sẽ đẩy ngược về unauthenticated qua session bridge.
    set({
      status: tokens ? 'authenticated' : 'unauthenticated',
      sessionVersion: tokenStorage.getSessionVersion(),
    });
  },

  signIn: async (tokens, account) => {
    const clearing = tokenStorage.clear();
    const sessionVersion = tokenStorage.getSessionVersion();
    queryClient.clear();
    await clearing;
    await tokenStorage.save(tokens, sessionVersion);
    tokenStorage.assertSession(sessionVersion);
    set({ status: 'authenticated', account, sessionVersion });
  },

  setAccount: (account, sessionVersion) => {
    if (
      get().status !== 'authenticated' ||
      sessionVersion !== tokenStorage.getSessionVersion()
    )
      return;
    set({ account });
  },

  signOut: async () => {
    const clearing = tokenStorage.clear();
    set({
      status: 'unauthenticated',
      account: null,
      sessionVersion: tokenStorage.getSessionVersion(),
    });
    // clear() hủy query đang chạy và xóa cả query cache lẫn mutation cache.
    queryClient.clear();
    await clearing;
  },
}));
