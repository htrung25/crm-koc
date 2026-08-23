import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { StorageObject } from '../../common/entities/storage-object.entity';
import { EStorageObjectState } from '../../common/enum/storage-object-state.enum';
import { StorageService } from '../../common/services/storage.service';

const SWEEP_BATCH = 100;

@Injectable()
export class StorageGcService {
  private readonly logger = new Logger(StorageGcService.name);
  private readonly graceMinutes: number;

  constructor(
    private readonly storage: StorageService,
    private readonly dataSource: DataSource,
    configService: ConfigService,
  ) {
    this.graceMinutes = Number(
      configService.get('STORAGE_SWEEP_PENDING_GRACE_MINUTES', 60),
    );
  }

  /**
   * KHÔNG list bucket và KHÔNG suy đoán. Chỉ xoá key mà chính hệ thống đã ghi
   * nhận là bỏ đi. KYC giới hạn 3 lượt nộp nên xoá nhầm giấy tờ thật là thiệt
   * hại không sửa được — ở đây không có chỗ cho heuristic.
   */
  async sweep(): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(StorageObject);

      const rows = await repo
        .createQueryBuilder('obj')
        // SKIP LOCKED để nhiều worker không giành nhau cùng một dòng.
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where(
          "(obj.state = :garbage) OR (obj.state = :pending AND obj.updatedAt < now() - (:grace || ' minutes')::interval)",
          {
            garbage: EStorageObjectState.GARBAGE,
            pending: EStorageObjectState.PENDING,
            grace: this.graceMinutes,
          },
        )
        .limit(SWEEP_BATCH)
        .getMany();

      if (!rows.length) return 0;

      for (const row of rows) {
        // Xoá object TRƯỚC, xoá dòng SAU. Ngược lại là mất dấu vết một object
        // vẫn còn nằm trên R2 — rác vĩnh viễn không ai biết để dọn.
        await this.storage.remove(row.storageKey);
        await repo.delete({ id: row.id });
      }

      this.logger.log(`sweep: đã dọn ${rows.length} object`);
      return rows.length;
    });
  }
}
