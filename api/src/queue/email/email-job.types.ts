import type { EKycStatus } from '../../common/enum/kyc.enum';

/** Chỉ mang id: OTP đọc từ otp:pending (có TTL), email/tên tra DB. */
export interface SendOtpJob {
  accountId: string;
  email?: string;
  displayName?: string;
  otp?: string;
}

// Không giữ PII; `status` là danh tính lần đổi sinh ra job, không phải trạng thái hiện tại. */
export interface SendKycStatusJob {
  submissionId: string;
  status: EKycStatus;
}
