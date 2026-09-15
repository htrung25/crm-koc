import { ConflictException, Injectable } from '@nestjs/common';
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

  /** A sweep that has claimed an expired upload makes it permanently unlinkable. */
  async linkPending(key: string, manager: EntityManager): Promise<void> {
    const result = await manager
      .getRepository(StorageObject)
      .update(
        { storageKey: key, state: EStorageObjectState.PENDING },
        { state: EStorageObjectState.LINKED, updatedAt: new Date() },
      );
    if (result.affected !== 1) {
      throw new ConflictException(
        'upload expired or was reclaimed; upload the file again',
      );
    }
  }

  markGarbage(key: string, manager?: EntityManager): Promise<void> {
    return this.write(key, EStorageObjectState.GARBAGE, manager);
  }

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
