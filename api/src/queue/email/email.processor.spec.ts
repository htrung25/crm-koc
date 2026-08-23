import type { Job } from 'bullmq';
import { EmailProcessor } from './email.processor';
import { JOB_SEND_OTP, JOB_SEND_KYC_STATUS } from '../queue-names';
import { EKycStatus } from '../../common/enum/kyc.enum';

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

describe('EmailProcessor · send-kyc-status', () => {
  const emailService = { sendKycStatusNotification: jest.fn() };
  const config = { get: jest.fn().mockReturnValue(300) };

  function job() {
    return {
      name: JOB_SEND_KYC_STATUS,
      timestamp: Date.now(),
      data: { submissionId: 'sub-1' },
    } as unknown as never;
  }

  function repo(row: unknown) {
    return {
      findOne: jest.fn().mockResolvedValue(row),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
  }

  beforeEach(() => jest.clearAllMocks());

  it('bỏ qua khi notified_at đã có — đây là chốt chống gửi trùng', async () => {
    const submissionRepo = repo({
      id: 'sub-1',
      notifiedAt: new Date(),
      status: EKycStatus.VERIFIED,
      account: { email: 'a@b.c', name: 'A' },
    });
    const p = new EmailProcessor(
      emailService as unknown as never,
      config as unknown as never,
      submissionRepo as unknown as never,
    );
    await p.process(job());
    expect(emailService.sendKycStatusNotification).not.toHaveBeenCalled();
  });

  it('gửi rồi mới ghi notified_at — thứ tự này quyết định ngữ nghĩa at-least-once', async () => {
    const order: string[] = [];
    emailService.sendKycStatusNotification.mockImplementation(() => {
      order.push('send');
      return Promise.resolve();
    });
    const submissionRepo = repo({
      id: 'sub-1',
      notifiedAt: null,
      status: EKycStatus.VERIFIED,
      rejectReason: null,
      reviewNote: null,
      account: { email: 'a@b.c', name: 'A' },
    });
    submissionRepo.update.mockImplementation(() => {
      order.push('mark');
      return Promise.resolve({ affected: 1 });
    });

    const p = new EmailProcessor(
      emailService as unknown as never,
      config as unknown as never,
      submissionRepo as unknown as never,
    );
    await p.process(job());

    expect(order).toEqual(['send', 'mark']);
  });

  it('không ghi notified_at khi gửi hỏng', async () => {
    emailService.sendKycStatusNotification.mockRejectedValueOnce(
      new Error('boom'),
    );
    const submissionRepo = repo({
      id: 'sub-1',
      notifiedAt: null,
      status: EKycStatus.VERIFIED,
      rejectReason: null,
      reviewNote: null,
      account: { email: 'a@b.c', name: 'A' },
    });
    const p = new EmailProcessor(
      emailService as unknown as never,
      config as unknown as never,
      submissionRepo as unknown as never,
    );
    await expect(p.process(job())).rejects.toThrow('boom');
    expect(submissionRepo.update).not.toHaveBeenCalled();
  });
});
