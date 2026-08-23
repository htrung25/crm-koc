export interface SendOtpJob {
  accountId: string;
  email: string;
  displayName: string;
  /** Bắt buộc nằm trong payload: OTP không đọc lại được từ đâu khác. */
  otp: string;
}

/** Chỉ mang id: processor tự tra DB nên payload không giữ PII trong Redis. */
export interface SendKycStatusJob {
  submissionId: string;
}
