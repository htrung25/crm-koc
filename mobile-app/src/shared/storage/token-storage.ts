import { CanceledError } from 'axios';

import { secureStorage } from '@/shared/storage/secure-storage';

const ACCESS_TOKEN_KEY = 'auth.access_token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

// Access token được cache trong RAM: interceptor chạy trên mọi request, đọc
// keychain mỗi lần sẽ chậm thấy rõ.
let cachedAccessToken: string | null = null;
let sessionVersion = 0;
let pendingWrite: Promise<void> = Promise.resolve();

// Keychain không có transaction: xếp hàng để lần ghi A luôn kết thúc trước
// lần xóa A / ghi B, kể cả khi logout xảy ra giữa một lần refresh.
function enqueueWrite(operation: () => Promise<void>): Promise<void> {
  const result = pendingWrite.then(operation);
  pendingWrite = result.catch(() => {});
  return result;
}

export const tokenStorage = {
  getSessionVersion(): number {
    return sessionVersion;
  },

  assertSession(version: number): void {
    if (version !== sessionVersion) throw new CanceledError('Session changed');
  },

  async hydrate(): Promise<TokenPair | null> {
    const version = sessionVersion;
    await pendingWrite;
    const [accessToken, refreshToken] = await Promise.all([
      secureStorage.get(ACCESS_TOKEN_KEY),
      secureStorage.get(REFRESH_TOKEN_KEY),
    ]);
    this.assertSession(version);
    cachedAccessToken = accessToken && refreshToken ? accessToken : null;
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },

  getAccessToken(): string | null {
    return cachedAccessToken;
  },

  getRefreshToken(): Promise<string | null> {
    return secureStorage.get(REFRESH_TOKEN_KEY);
  },

  async save(tokens: TokenPair, version = sessionVersion): Promise<void> {
    await enqueueWrite(async () => {
      this.assertSession(version);
      await Promise.all([
        secureStorage.set(ACCESS_TOKEN_KEY, tokens.accessToken),
        secureStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken),
      ]);
      this.assertSession(version);
      cachedAccessToken = tokens.accessToken;
    });
  },

  async clear(): Promise<void> {
    sessionVersion += 1;
    cachedAccessToken = null;
    await enqueueWrite(async () => {
      await Promise.all([
        secureStorage.remove(ACCESS_TOKEN_KEY),
        secureStorage.remove(REFRESH_TOKEN_KEY),
      ]);
    });
  },
};
