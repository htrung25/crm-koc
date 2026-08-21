/* Tiền tố khoá trong bucket.*/
export const STORAGE_PREFIX_PENDING = 'kyc/pending/';
export const STORAGE_PREFIX_VERIFIED = 'kyc/verified/';

/** Chỉ nhận đúng ba định dạng này, xác định bằng magic bytes. */
export const ALLOWED_DOCUMENT_MIMES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const;

export type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIMES)[number];
