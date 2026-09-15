import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { env } from '@/config/env';
import { DEVICE_ID_HEADER, getDeviceId } from '@/shared/storage/device-id';
import { tokenStorage, type TokenPair } from '@/shared/storage/token-storage';

import { ApiError, toApiError } from '@/shared/api/errors';
import { notifySessionExpired } from '@/shared/api/session-bridge';

type RetriableConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
  _sessionVersion?: number;
};

const baseConfig = {
  baseURL: env.apiUrl,
  timeout: env.apiTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
};

export const apiClient: AxiosInstance = axios.create(baseConfig);

// Instance riêng, không interceptor: gọi /refresh bằng apiClient sẽ tự đệ quy khi chính /refresh trả 401.
const refreshClient: AxiosInstance = axios.create(baseConfig);

apiClient.interceptors.request.use(async (config) => {
  const scopedConfig = config as RetriableConfig;
  scopedConfig._sessionVersion ??= tokenStorage.getSessionVersion();
  tokenStorage.assertSession(scopedConfig._sessionVersion);
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  config.headers.set(DEVICE_ID_HEADER, await getDeviceId());
  tokenStorage.assertSession(scopedConfig._sessionVersion);
  return config;
});

// Chống race condition = gom các request 401 để refresh token một lần duy nhất
// Hủy toàn bộ phiên nếu phát hiện token bị tái sử dụng
let refreshInFlight: { version: number; promise: Promise<TokenPair> } | null =
  null;

async function runRefresh(version: number): Promise<TokenPair> {
  const refreshToken = await tokenStorage.getRefreshToken();
  tokenStorage.assertSession(version);
  if (!refreshToken) {
    // Không đọc được keychain cũng rơi vào đây (secureStorage nuốt lỗi thành
    // null); tách hai ca đó cần đổi chữ ký secureStorage — xem backlog.
    throw new ApiError({
      kind: 'unauthorized',
      message: 'Phiên đăng nhập đã kết thúc.',
    });
  }

  const deviceId = await getDeviceId();
  tokenStorage.assertSession(version);
  const { data } = await refreshClient.post<TokenPair>(
    '/refresh',
    { refreshToken },
    { headers: { [DEVICE_ID_HEADER]: deviceId } }
  );

  await tokenStorage.save(data, version);
  return data;
}

function refreshTokens(version: number): Promise<TokenPair> {
  // Sử dụng promise dùng chung để đảm bảo tín hiệu kết thúc phiên chỉ phát duy nhất một lần cho mọi request đang chờ.
  if (!refreshInFlight || refreshInFlight.version !== version) {
    const promise = runRefresh(version)
      .catch(async (error: unknown) => {
        tokenStorage.assertSession(version);
        throw await endSessionIfDead(error, version);
      })
      .finally(() => {
        if (refreshInFlight?.promise === promise) refreshInFlight = null;
      });
    refreshInFlight = { version, promise };
  }
  return refreshInFlight.promise;
}

// Giữ lại token khi gặp lỗi kết nối hoặc lỗi server tạm thời, chỉ đăng xuất khi server xác nhận phiên hết hạn để tránh báo lỗi 401 sai thực tế.
async function endSessionIfDead(
  error: unknown,
  version: number
): Promise<ApiError> {
  tokenStorage.assertSession(version);
  const apiError = toApiError(error);
  if (apiError.kind === 'unauthorized' || apiError.kind === 'forbidden') {
    await endSession();
  }
  return apiError;
}

async function endSession(): Promise<void> {
  // Token đã bị dọn tức là request khác vừa kết thúc phiên; đừng báo lần nữa.
  if (!tokenStorage.getAccessToken()) return;
  await notifySessionExpired();
}

apiClient.interceptors.response.use(
  (response) => {
    const version = (response.config as RetriableConfig)._sessionVersion;
    if (version !== undefined) tokenStorage.assertSession(version);
    return response;
  },
  async (error: AxiosError) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const config = error.config as RetriableConfig | undefined;
    const version = config?._sessionVersion;
    if (version !== undefined) tokenStorage.assertSession(version);
    const status = error.response?.status;

    const canRetry =
      status === 401 &&
      config &&
      version !== undefined &&
      !config._retried &&
      !isAuthEndpoint(config.url);

    if (!canRetry) {
      return Promise.reject(toApiError(error));
    }

    config._retried = true;

    let tokens: TokenPair;
    try {
      tokens = await refreshTokens(version);
    } catch (refreshError) {
      if (axios.isCancel(refreshError)) return Promise.reject(refreshError);
      return Promise.reject(toApiError(refreshError));
    }

    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    tokenStorage.assertSession(version);
    try {
      return await apiClient.request(config);
    } catch (replayError) {
      if (axios.isCancel(replayError)) return Promise.reject(replayError);
      // Token mới tinh mà vẫn 401 nghĩa là phiên đã bị thu hồi phía server.
      return Promise.reject(await endSessionIfDead(replayError, version));
    }
  }
);

// Endpoint auth trả 401 vì sai mật khẩu/OTP
const AUTH_ENDPOINTS = ['/login/', '/verify-otp', '/resend-otp', '/refresh'];

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((path) => url.includes(path));
}
