import { KycExpiryService } from './kyc-expiry.service';

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
