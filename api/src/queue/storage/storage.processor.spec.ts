import { StorageProcessor } from './storage.processor';
import { JOB_PROMOTE_DOCUMENTS } from '../queue-names';

function job() {
  return {
    name: JOB_PROMOTE_DOCUMENTS,
    data: { submissionId: 'sub-1' },
  } as unknown as never;
}

describe('StorageProcessor · promote-documents', () => {
  const storage = { copy: jest.fn().mockResolvedValue(undefined) };
  const ledger = {
    markPending: jest.fn().mockResolvedValue(undefined),
    markLinked: jest.fn().mockResolvedValue(undefined),
    markGarbage: jest.fn().mockResolvedValue(undefined),
  };

  function make(docs: { id: string; storageKey: string }[]) {
    const docRepo = {
      findBy: jest.fn().mockResolvedValue(docs),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (m: unknown) => unknown) =>
          cb({ getRepository: () => docRepo }),
        ),
    };
    return {
      p: new StorageProcessor(
        storage as unknown as never,
        ledger as unknown as never,
        docRepo as unknown as never,
        dataSource as unknown as never,
        {} as unknown as never,
        {} as unknown as never,
      ),
      docRepo,
    };
  }

  beforeEach(() => jest.clearAllMocks());

  it('chuyển pending/ sang verified/ bằng khoá TẤT ĐỊNH', async () => {
    const { p } = make([{ id: 'd1', storageKey: 'kyc/pending/abc' }]);
    await p.process(job());
    expect(storage.copy).toHaveBeenCalledWith(
      'kyc/pending/abc',
      'kyc/verified/abc',
    );
    expect(ledger.markPending).toHaveBeenCalledWith('kyc/verified/abc');
    expect(ledger.markGarbage).toHaveBeenCalledWith(
      'kyc/pending/abc',
      expect.anything(),
    );
  });

  it('bỏ qua doc đã ở verified/ — chạy hai lần bằng chạy một lần', async () => {
    const { p } = make([{ id: 'd1', storageKey: 'kyc/verified/abc' }]);
    await p.process(job());
    expect(storage.copy).not.toHaveBeenCalled();
  });

  it('retry sau khi copy xong không đụng UNIQUE vì ledger là upsert', async () => {
    const { p } = make([{ id: 'd1', storageKey: 'kyc/pending/abc' }]);
    await p.process(job());
    await p.process(job()); // lượt retry
    expect(ledger.markPending).toHaveBeenCalledTimes(2);
    expect(ledger.markPending).toHaveBeenNthCalledWith(2, 'kyc/verified/abc');
  });
});
