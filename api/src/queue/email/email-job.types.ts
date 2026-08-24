/** Chỉ mang id: OTP đọc từ otp:pending (có TTL), email/tên tra DB. */
export interface SendOtpJob {
  accountId: string;
  email?: string;
  displayName?: string;
  otp?: string;
}

/** Chỉ mang id: processor tự tra DB nên payload không giữ PII trong Redis. */
export interface SendKycStatusJob {
  submissionId: string;
}
