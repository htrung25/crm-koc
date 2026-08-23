import type { JobsOptions } from 'bullmq';
import {
  JOB_PROMOTE_DOCUMENTS,
  JOB_SEND_KYC_STATUS,
  JOB_SEND_OTP,
} from './queue-names';

/** Giữ 100 job hỏng gần nhất để còn đọc được nguyên nhân; job xong thì dọn. */
const BASE: JobsOptions = {
  removeOnComplete: true,
  removeOnFail: { count: 100 },
};

export function emailJobOptions(jobName: string): JobsOptions {
  switch (jobName) {
    case JOB_SEND_OTP:
      // OTP sống 300s. Retry lâu hơn thế là gửi một mã đã chết.
      return {
        ...BASE,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      };
    case JOB_SEND_KYC_STATUS:
      return {
        ...BASE,
        attempts: 5,
        backoff: { type: 'exponential', delay: 30_000 },
      };
    default:
      return { ...BASE, attempts: 3 };
  }
}

export function storageJobOptions(jobName: string): JobsOptions {
  if (jobName === JOB_PROMOTE_DOCUMENTS) {
    return {
      ...BASE,
      attempts: 5,
      backoff: { type: 'exponential', delay: 10_000 },
    };
  }
  return { ...BASE, attempts: 3 };
}

/** Job định kỳ không retry: chu kỳ sau tự chạy lại. */
export function repeatableJobOptions(): JobsOptions {
  return { ...BASE, attempts: 1 };
}
