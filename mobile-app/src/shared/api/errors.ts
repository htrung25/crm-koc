import axios from 'axios';

export type ApiErrorKind =
  | 'network' // không nối được server / timeout
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'validation' // 400 hoặc 422
  | 'rate_limited' // 429
  | 'not_found' // 404
  | 'server' // 5xx
  | 'unknown';

/** Lỗi đã chuẩn hoá — UI chỉ cần biết `kind` và `message`, không đụng axios. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** Nest gom lỗi validate thành mảng message; giữ nguyên để form map về field. */
  readonly details: string[];

  constructor(params: {
    kind: ApiErrorKind;
    message: string;
    status?: number | null;
    details?: string[];
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.kind = params.kind;
    this.status = params.status ?? null;
    this.details = params.details ?? [];
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 400 || status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

type NestErrorBody = {
  message?: string | string[];
  error?: string;
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const response = error.response;
    if (!response) {
      return new ApiError({
        kind: 'network',
        message: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
      });
    }

    const body = response.data as NestErrorBody | undefined;
    const raw = body?.message;
    const details = Array.isArray(raw) ? raw : [];
    const message =
      (Array.isArray(raw) ? raw[0] : raw) ??
      body?.error ??
      `Yêu cầu thất bại (${response.status}).`;

    return new ApiError({
      kind: kindFromStatus(response.status),
      message,
      status: response.status,
      details,
    });
  }

  return new ApiError({
    kind: 'unknown',
    message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.',
  });
}
