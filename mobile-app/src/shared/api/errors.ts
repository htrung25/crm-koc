import axios from 'axios';

export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'conflict'
  | 'rate_limited'
  | 'not_found'
  | 'server'
  | 'unknown';

/** Lỗi theo trường do backend trả về; metadata và trường mở rộng được giữ nguyên. */
export interface ApiErrorIssue {
  readonly code: string;
  readonly fieldPath: string;
  readonly message: string;
  readonly metadata?: unknown;
  readonly [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMessage(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIssue(value: unknown): value is ApiErrorIssue {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.fieldPath === 'string' &&
    isMessage(value.message)
  );
}

/** Giữ HTTP status riêng với status nghiệp vụ; UI không cần phụ thuộc Axios. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status, ví dụ 409; không phải trạng thái campaign. */
  readonly status: number | null;
  readonly details: string[];
  /** Toàn bộ response body, kể cả trường chưa có trong contract mobile. */
  readonly payload: unknown;
  readonly businessCode: number | string | null;
  readonly errors: readonly ApiErrorIssue[];
  readonly resourceStatus: number | string | null;
  readonly version: number | null;

  constructor(params: {
    kind: ApiErrorKind;
    message: string;
    status?: number | null;
    details?: string[];
    payload?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.kind = params.kind;
    this.status = params.status ?? null;
    this.details = params.details ?? [];
    this.payload = params.payload;
    const body = isRecord(params.payload) ? params.payload : {};
    this.businessCode =
      typeof body.businessCode === 'number' ||
      typeof body.businessCode === 'string'
        ? body.businessCode
        : null;
    this.errors = Array.isArray(body.errors) ? body.errors.filter(isIssue) : [];
    this.resourceStatus =
      typeof body.status === 'number' || typeof body.status === 'string'
        ? body.status
        : null;
    this.version =
      typeof body.version === 'number' && Number.isFinite(body.version)
        ? body.version
        : null;
  }

  /** Chỉ hiển thị thông báo, không đưa payload/metadata thô lên giao diện. */
  get messages(): string[] {
    return [
      ...new Set([
        this.message,
        ...this.details,
        ...this.errors.map((issue) => issue.message),
      ]),
    ];
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

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

    const payload: unknown = response.data;
    const body = isRecord(payload) ? payload : {};
    const raw = body.message;
    const details = Array.isArray(raw) ? raw.filter(isMessage) : [];
    const message =
      (isMessage(raw) ? raw : details[0]) ??
      (isMessage(body.error)
        ? body.error
        : `Yêu cầu thất bại (${response.status}).`);

    return new ApiError({
      kind: kindFromStatus(response.status),
      message,
      status: response.status,
      details,
      payload,
    });
  }

  return new ApiError({
    kind: 'unknown',
    message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.',
  });
}
