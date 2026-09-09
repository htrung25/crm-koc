import { create } from 'zustand';

import { tokenStorage } from '@/shared/storage/token-storage';

import type { Account, TokenPair } from './types';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

type SessionState = {
  status: SessionStatus;
  account: Account | null;
  /** Đọc token từ keychain lúc mở app; giữ splash cho tới khi xong. */
  hydrate: () => Promise<void>;
  signIn: (tokens: TokenPair, account: Account) => Promise<void>;
  setAccount: (account: Account) => void;
  signOut: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  account: null,

  hydrate: async () => {
    const tokens = await tokenStorage.hydrate();
    // Có token là đủ để vào app; `GET /auth/me` sẽ xác nhận và nạp account,
    // 401 ở đó sẽ đẩy ngược về unauthenticated qua session bridge.
    set({ status: tokens ? 'authenticated' : 'unauthenticated' });
  },

  signIn: async (tokens, account) => {
    await tokenStorage.save(tokens);
    set({ status: 'authenticated', account });
  },

  setAccount: (account) => set({ account }),

  signOut: async () => {
    await tokenStorage.clear();
    set({ status: 'unauthenticated', account: null });
  },
}));
