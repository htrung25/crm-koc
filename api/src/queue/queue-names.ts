export const QUEUE_EMAIL = 'email';
export const QUEUE_STORAGE = 'storage';
export const QUEUE_KYC = 'kyc';

export const JOB_SEND_OTP = 'send-otp';
export const JOB_SEND_KYC_STATUS = 'send-kyc-status';
export const JOB_PROMOTE_DOCUMENTS = 'promote-documents';
export const JOB_SWEEP = 'sweep';
export const JOB_EXPIRE_VERIFIED = 'expire-verified';
export const JOB_RECONCILE_NOTIFICATIONS = 'reconcile-notifications';

/** Id cố định cho scheduler: worker restart không nhân bản lịch. */
export const SCHEDULER_SWEEP = 'storage-sweep';
export const SCHEDULER_EXPIRE_VERIFIED = 'kyc-expire-verified';
export const SCHEDULER_RECONCILE = 'kyc-reconcile-notifications';
