import { secureStorage } from './secure-storage';

const ACCESS_TOKEN_KEY = 'auth.access_token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

// Access token được cache trong RAM: interceptor chạy trên mọi request, đọc
// keychain mỗi lần sẽ chậm thấy rõ.
let cachedAccessToken: string | null = null;

export const tokenStorage = {
  async hydrate(): Promise<TokenPair | null> {
    const [accessToken, refreshToken] = await Promise.all([
      secureStorage.get(ACCESS_TOKEN_KEY),
      secureStorage.get(REFRESH_TOKEN_KEY),
    ]);
    cachedAccessToken = accessToken;
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },

  getAccessToken(): string | null {
    return cachedAccessToken;
  },

  getRefreshToken(): Promise<string | null> {
    return secureStorage.get(REFRESH_TOKEN_KEY);
  },

  async save(tokens: TokenPair): Promise<void> {
    cachedAccessToken = tokens.accessToken;
    await Promise.all([
      secureStorage.set(ACCESS_TOKEN_KEY, tokens.accessToken),
      secureStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  },

  async clear(): Promise<void> {
    cachedAccessToken = null;
    await Promise.all([
      secureStorage.remove(ACCESS_TOKEN_KEY),
      secureStorage.remove(REFRESH_TOKEN_KEY),
    ]);
  },
};
