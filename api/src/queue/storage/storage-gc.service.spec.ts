import { StorageGcService } from './storage-gc.service';

describe('StorageGcService.sweep', () => {
  const storage = { remove: jest.fn().mockResolvedValue(undefined) };

  function make(rows: { id: string; storageKey: string }[]) {
    const repo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        setOnLocked: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      }),
      delete: jest.fn().mockResolvedValue({ affected: rows.length }),
    };
    const dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (m: unknown) => unknown) =>
          cb({ getRepository: () => repo }),
        ),
    };
    return {
      svc: new StorageGcService(
        storage as unknown as never,
        dataSource as unknown as never,
        { get: () => 60 } as unknown as never,
      ),
      repo,
    };
  }

  beforeEach(() => jest.clearAllMocks());

  it('xoá object trên R2 TRƯỚC rồi mới xoá dòng ledger', async () => {
    const order: string[] = [];
    storage.remove.mockImplementation(() => {
      order.push('remove');
      return Promise.resolve();
    });
    const { svc, repo } = make([{ id: '1', storageKey: 'kyc/pending/x' }]);
    repo.delete.mockImplementation(() => {
      order.push('delete-row');
      return Promise.resolve({ affected: 1 });
    });

    const count = await svc.sweep();
    expect(count).toBe(1);
    // Xoá dòng trước là mất dấu vết một object vẫn còn trên R2 — rác vĩnh viễn
    // không ai biết để dọn.
    expect(order).toEqual(['remove', 'delete-row']);
  });

  it('không xoá gì khi ledger sạch', async () => {
    const { svc } = make([]);
    expect(await svc.sweep()).toBe(0);
    expect(storage.remove).not.toHaveBeenCalled();
  });
});
