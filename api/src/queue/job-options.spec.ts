import { JOB_SEND_OTP, JOB_SEND_KYC_STATUS } from './queue-names';
import { emailJobOptions } from './job-options';

describe('emailJobOptions', () => {
  it('OTP retry xong trong vòng OTP_TTL: tổng backoff < 60s', () => {
    const opts = emailJobOptions(JOB_SEND_OTP);
    expect(opts.attempts).toBe(3);
    // exponential 2s => 2 + 4 = 6s tổng, thừa sức nằm trong TTL 300s
    expect(opts.backoff).toEqual({ type: 'exponential', delay: 2000 });
  });

  it('email KYC kiên nhẫn hơn: 5 lượt, giãn 30s', () => {
    const opts = emailJobOptions(JOB_SEND_KYC_STATUS);
    expect(opts.attempts).toBe(5);
    expect(opts.backoff).toEqual({ type: 'exponential', delay: 30_000 });
  });

  it('giữ 100 job hỏng gần nhất, dọn sạch job thành công', () => {
    const opts = emailJobOptions(JOB_SEND_OTP);
    expect(opts.removeOnComplete).toBe(true);
    expect(opts.removeOnFail).toEqual({ count: 100 });
  });
});
