import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { StorageObject } from '../entities/storage-object.entity';
import { EStorageObjectState } from '../enum/storage-object-state.enum';

@Injectable()
export class StorageLedgerService {
  constructor(
    @InjectRepository(StorageObject)
    private readonly repository: Repository<StorageObject>,
  ) {}

  markPending(key: string, manager?: EntityManager): Promise<void> {
    return this.write(key, EStorageObjectState.PENDING, manager);
  }

  markLinked(key: string, manager?: EntityManager): Promise<void> {
    return this.write(key, EStorageObjectState.LINKED, manager);
  }

  markGarbage(key: string, manager?: EntityManager): Promise<void> {
    return this.write(key, EStorageObjectState.GARBAGE, manager);
  }

  /**
   * LUÔN upsert. Job retry sau khi đã ghi ledger ở lượt trước sẽ đụng
   * UQ_storage_objects_key nếu đây là insert, và chết vì một lỗi khác hẳn lỗi
   * gốc — không bao giờ hoàn thành được.
   */
  private async write(
    storageKey: string,
    state: EStorageObjectState,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(StorageObject)
      : this.repository;
    await repo.upsert(
      { storageKey, state, updatedAt: new Date() },
      { conflictPaths: ['storageKey'] },
    );
  }
}
