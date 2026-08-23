import { EStorageObjectState } from '../enum/storage-object-state.enum';
import { StorageLedgerService } from './storage-ledger.service';

describe('StorageLedgerService', () => {
  function service() {
    const repo = { upsert: jest.fn().mockResolvedValue(undefined) };
    return { svc: new StorageLedgerService(repo as unknown as never), repo };
  }

  it('markPending dùng UPSERT chứ không INSERT', async () => {
    const { svc, repo } = service();
    await svc.markPending('pending/abc');

    // Retry sau khi đã ghi ledger ở lượt trước sẽ đụng UQ_storage_objects_key
    // nếu đây là INSERT — job chết vì lỗi sai hẳn lỗi gốc.
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        storageKey: 'pending/abc',
        state: EStorageObjectState.PENDING,
      }),
      expect.objectContaining({ conflictPaths: ['storageKey'] }),
    );
  });

  it('markLinked chuyển sang LINKED', async () => {
    const { svc, repo } = service();
    await svc.markLinked('verified/abc');
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ state: EStorageObjectState.LINKED }),
      expect.anything(),
    );
  });

  it('markGarbage chuyển sang GARBAGE', async () => {
    const { svc, repo } = service();
    await svc.markGarbage('pending/abc');
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ state: EStorageObjectState.GARBAGE }),
      expect.anything(),
    );
  });
});
