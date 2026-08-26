export enum EAuditLogCategory {
  LOGIN = 'login',
  AUDIT = 'audit',
  APPROVAL = 'approval',
}

export enum ELoginAction {
  FAIL_CREDENTIALS = 'fail_credentials',
  FAIL_IP = 'fail_ip',
  FAIL_OTP = 'fail_otp',
  FAIL_LOCKED = 'fail_locked',
  OTP_SENT = 'otp_sent',
  LOGOUT = 'logout',
  // category=audit
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  // category=approval
  APPROVE = 'approve',
  REJECT = 'reject',
}
/** Tập mọi action, dùng cho cột `action` vốn chỉ là varchar. */
export type EAuditLogAction = ELoginAction;

/**
 * Cặp category–action hợp lệ. Dùng ở chữ ký hàm ghi audit để cặp lệch nhau bị
 * chặn lúc gõ, thay vì để CHECK constraint ném 23514 giữa production.
 */
/** Danh sách runtime cho validate query: EAuditLogAction là type, không dò được. */
export const AUDIT_LOG_ACTIONS: EAuditLogAction[] = [
  ...Object.values(ELoginAction),
];

export type AuditLogEvent =
  | { category: EAuditLogCategory.LOGIN; action: ELoginAction }
  | { category: EAuditLogCategory.AUDIT; action: ELoginAction }
  | { category: EAuditLogCategory.APPROVAL; action: ELoginAction };
