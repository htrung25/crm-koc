import { KycExpiryService } from './kyc-expiry.service';
import { EKycStatus } from '../../common/enum/kyc.enum';

describe('KycExpiryService.reconcileNotifications', () => {
  const emailQueue = { enqueueKycStatus: jest.fn() };

  function service(rows: { id: string }[]) {
    const repo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(rows),
      }),
    };
    return {
      svc: new KycExpiryService(
        repo as unknown as never,
        emailQueue as unknown as never,
        { get: () => 365 } as unknown as never,
      ),
      repo,
    };
  }

  beforeEach(() => jest.clearAllMocks());

  it('enqueue lại từng hồ sơ chưa được báo', async () => {
    const { svc } = service([{ id: 'a' }, { id: 'b' }]);
    const count = await svc.reconcileNotifications();
    expect(count).toBe(2);
    expect(emailQueue.enqueueKycStatus).toHaveBeenCalledWith('a');
    expect(emailQueue.enqueueKycStatus).toHaveBeenCalledWith('b');
  });

  it('không enqueue gì khi không có hồ sơ sót', async () => {
    const { svc } = service([]);
    expect(await svc.reconcileNotifications()).toBe(0);
    expect(emailQueue.enqueueKycStatus).not.toHaveBeenCalled();
  });
});

describe('KycExpiryService.expireVerified', () => {
  const emailQueue = { enqueueKycStatus: jest.fn() };

  function make(returned: { id: string }[]) {
    const qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn<unknown, [Record<string, unknown>]>().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ raw: returned }),
    };
    const repo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    return {
      svc: new KycExpiryService(
        repo as unknown as never,
        emailQueue as unknown as never,
        { get: () => 365 } as unknown as never,
      ),
      qb,
    };
  }

  beforeEach(() => jest.clearAllMocks());

  it('KHÔNG ghi đè review_note và reviewed_by — mất ghi chú gốc của admin', async () => {
    const { svc, qb } = make([{ id: 'a' }]);
    await svc.expireVerified();
    const patch = qb.set.mock.calls[0][0];
    expect(patch).not.toHaveProperty('reviewNote');
    expect(patch).not.toHaveProperty('reviewedBy');
    expect(patch).not.toHaveProperty('expiresAt');
    expect(patch).toHaveProperty('status', EKycStatus.EXPIRED);
    expect(patch).toHaveProperty('notifiedAt', null);
  });

  it('enqueue email cho từng hồ sơ vừa hết hạn', async () => {
    const { svc } = make([{ id: 'a' }, { id: 'b' }]);
    expect(await svc.expireVerified()).toBe(2);
    expect(emailQueue.enqueueKycStatus).toHaveBeenCalledTimes(2);
    expect(emailQueue.enqueueKycStatus).toHaveBeenCalledWith('a');
    expect(emailQueue.enqueueKycStatus).toHaveBeenCalledWith('b');
  });

  it('không enqueue gì khi không có hồ sơ nào hết hạn', async () => {
    const { svc } = make([]);
    expect(await svc.expireVerified()).toBe(0);
    expect(emailQueue.enqueueKycStatus).not.toHaveBeenCalled();
  });
});
