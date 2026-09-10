import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import { DEVICE_ID_HEADER, getDeviceId } from '@/shared/storage/device-id';
import { tokenStorage, type TokenPair } from '@/shared/storage/token-storage';

import { ApiError, toApiError } from './errors';
import { notifySessionExpired } from './session-bridge';

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const baseConfig = {
  baseURL: env.apiUrl,
  timeout: env.apiTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
};

export const apiClient: AxiosInstance = axios.create(baseConfig);

// Instance riêng, không interceptor: gọi /refresh bằng apiClient sẽ tự đệ quy khi chính /refresh trả 401.
const refreshClient: AxiosInstance = axios.create(baseConfig);

apiClient.interceptors.request.use(async (config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  config.headers.set(DEVICE_ID_HEADER, await getDeviceId());
  return config;
});

// Chống race condition = gom các request 401 để refresh token một lần duy nhất
// Hủy toàn bộ phiên nếu phát hiện token bị tái sử dụng
let refreshInFlight: Promise<TokenPair> | null = null;

async function runRefresh(): Promise<TokenPair> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    // Không đọc được keychain cũng rơi vào đây (secureStorage nuốt lỗi thành
    // null); tách hai ca đó cần đổi chữ ký secureStorage — xem backlog.
    throw new ApiError({ kind: 'unauthorized', message: 'Phiên đăng nhập đã kết thúc.' });
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
  // Sử dụng promise dùng chung để đảm bảo tín hiệu kết thúc phiên chỉ phát duy nhất một lần cho mọi request đang chờ.
  refreshInFlight ??= runRefresh()
    .catch(async (error: unknown) => {
      throw await endSessionIfDead(error);
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

// Giữ lại token khi gặp lỗi kết nối hoặc lỗi server tạm thời, chỉ đăng xuất khi server xác nhận phiên hết hạn để tránh báo lỗi 401 sai thực tế.
async function endSessionIfDead(error: unknown): Promise<ApiError> {
  const apiError = toApiError(error);
  if (apiError.kind === 'unauthorized' || apiError.kind === 'forbidden') {
    await endSession();
  }
  return apiError;
}

async function endSession(): Promise<void> {
  // Token đã bị dọn tức là request khác vừa kết thúc phiên; đừng báo lần nữa.
  if (!tokenStorage.getAccessToken()) return;
  await tokenStorage.clear();
  notifySessionExpired();
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

    let tokens: TokenPair;
    try {
      tokens = await refreshTokens();
    } catch (refreshError) {
      return Promise.reject(toApiError(refreshError));
    }

    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    try {
      return await apiClient.request(config);
    } catch (replayError) {
      // Token mới tinh mà vẫn 401 nghĩa là phiên đã bị thu hồi phía server.
      return Promise.reject(await endSessionIfDead(replayError));
    }
  },
);

// Endpoint auth trả 401 vì sai mật khẩu/OTP
const AUTH_ENDPOINTS = ['/login/', '/verify-otp', '/resend-otp', '/refresh'];

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((path) => url.includes(path));
}
