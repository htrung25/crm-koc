import type { Job } from 'bullmq';
import { EmailProcessor } from './email.processor';
import { JOB_SEND_OTP } from '../queue-names';

const OTP_TTL_SECONDS = 300;

function otpJob(overrides: Partial<Job> = {}): Job {
  return {
    name: JOB_SEND_OTP,
    timestamp: Date.now(),
    data: {
      accountId: 'acc-1',
      email: 'a@b.c',
      displayName: 'A',
      otp: '123456',
    },
    ...overrides,
  } as unknown as Job;
}

describe('EmailProcessor · send-otp', () => {
  const emailService = { sendOtpEmail: jest.fn() };
  const config = { get: jest.fn().mockReturnValue(OTP_TTL_SECONDS) };

  beforeEach(() => jest.clearAllMocks());

  function makeProcessor() {
    return new EmailProcessor(
      emailService as unknown as never,
      config as unknown as never,
      {} as unknown as never,
    );
  }

  it('gửi OTP khi job còn tươi', async () => {
    await makeProcessor().process(otpJob());
    expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
      'a@b.c',
      '123456',
      'A',
    );
  });

  it('bỏ job khi OTP đã quá TTL — gửi mã chết chỉ làm người dùng bối rối', async () => {
    const stale = otpJob({
      timestamp: Date.now() - (OTP_TTL_SECONDS + 60) * 1000,
    });
    await makeProcessor().process(stale);
    expect(emailService.sendOtpEmail).not.toHaveBeenCalled();
  });

  it('để lỗi SendGrid nổi lên cho BullMQ retry', async () => {
    emailService.sendOtpEmail.mockRejectedValueOnce(new Error('sendgrid 503'));
    await expect(makeProcessor().process(otpJob())).rejects.toThrow(
      'sendgrid 503',
    );
  });
});
