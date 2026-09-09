import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import { DEVICE_ID_HEADER, getDeviceId } from '@/shared/storage/device-id';
import { tokenStorage, type TokenPair } from '@/shared/storage/token-storage';

import { toApiError } from './errors';
import { notifySessionExpired } from './session-bridge';

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const baseConfig = {
  baseURL: env.apiUrl,
  timeout: env.apiTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
};

export const apiClient: AxiosInstance = axios.create(baseConfig);

// Instance riêng, không interceptor: gọi /refresh bằng apiClient sẽ tự đệ quy
// khi chính /refresh trả 401.
const refreshClient: AxiosInstance = axios.create(baseConfig);

apiClient.interceptors.request.use(async (config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  config.headers.set(DEVICE_ID_HEADER, await getDeviceId());
  return config;
});

// API xoay vòng refresh token và coi token đã dùng lại là dấu hiệu bị đánh cắp
// (huỷ toàn bộ phiên). Nhiều request cùng 401 phải dồn về đúng MỘT lần refresh.
let refreshInFlight: Promise<TokenPair> | null = null;

async function runRefresh(): Promise<TokenPair> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('no refresh token');
  }

  const { data } = await refreshClient.post<TokenPair>(
    '/refresh',
    { refreshToken },
    { headers: { [DEVICE_ID_HEADER]: await getDeviceId() } },
  );

  await tokenStorage.save(data);
  return data;
}

function refreshTokens(): Promise<TokenPair> {
  refreshInFlight ??= runRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    const canRetry = status === 401 && config && !config._retried && !isAuthEndpoint(config.url);

    if (!canRetry) {
      return Promise.reject(toApiError(error));
    }

    config._retried = true;
    try {
      const tokens = await refreshTokens();
      config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      return await apiClient.request(config);
    } catch {
      await tokenStorage.clear();
      notifySessionExpired();
      return Promise.reject(toApiError(error));
    }
  },
);

// Các endpoint auth trả 401 vì sai mật khẩu/OTP, không phải vì token hết hạn —
// refresh ở đây chỉ tổ giấu mất lỗi thật.
const AUTH_ENDPOINTS = ['/login/', '/verify-otp', '/resend-otp', '/refresh'];

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((path) => url.includes(path));
}
