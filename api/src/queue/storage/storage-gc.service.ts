import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, In } from 'typeorm';
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
   *
   * Chia làm 3 bước, không giữ transaction xuyên suốt gọi mạng R2:
   *  1) claim batch bằng FOR UPDATE SKIP LOCKED, transaction ngắn.
   *  2) xoá từng object trên R2 NGOÀI transaction, try/catch riêng từng dòng
   *     để một key hỏng (503, throttle, deny...) không chặn cả batch.
   *  3) xoá khỏi ledger đúng những dòng đã xoá thật trên R2, transaction ngắn.
   * Dòng xoá lỗi bị giữ lại để chu kỳ sau thử lại, KHÔNG rollback cả batch.
   */
  async sweep(): Promise<number> {
    const rows = await this.claimBatch();
    if (!rows.length) return 0;

    const succeededIds: string[] = [];
    const failedIds: string[] = [];

    for (const row of rows) {
      try {
        await this.storage.remove(row.storageKey);
        succeededIds.push(row.id);
      } catch (error) {
        failedIds.push(row.id);
        this.logger.warn(
          `sweep: xoá object thất bại, giữ lại để thử lại sau: ${row.storageKey} (${(error as Error).message})`,
        );
      }
    }

    if (succeededIds.length) {
      await this.dataSource.transaction(async (manager) => {
        await manager.getRepository(StorageObject).delete(succeededIds);
      });
    }

    if (failedIds.length) {
      // Đẩy các dòng lỗi ra sau hàng đợi (updatedAt = now()) để chu kỳ sau ưu
      // tiên các dòng cũ hơn trước. Nếu không, một key hỏng vĩnh viễn sẽ luôn
      // rơi vào top ORDER BY updatedAt ASC và chiếm một suất trong mọi batch
      // kế tiếp mãi mãi — vẫn còn 99 suất còn lại cho các dòng khác nên không
      // "khoá cứng" cả batch, nhưng bump updatedAt giúp các dòng chờ lâu hơn
      // được ưu tiên thay vì bị một key poison liên tục chen ngang.
      await this.dataSource.transaction(async (manager) => {
        await manager
          .getRepository(StorageObject)
          .update({ id: In(failedIds) }, { updatedAt: new Date() });
      });
    }

    this.logger.log(
      `sweep: đã dọn ${succeededIds.length}/${rows.length} object` +
        (failedIds.length ? `, ${failedIds.length} lỗi giữ lại thử sau` : ''),
    );
    return succeededIds.length;
  }

  private async claimBatch(): Promise<StorageObject[]> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(StorageObject);

      return (
        repo
          .createQueryBuilder('obj')
          // SKIP LOCKED để nhiều worker không giành nhau cùng một dòng trong
          // lúc claim. Transaction này chỉ dùng để lock+đọc, không gọi mạng.
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
          // Dòng chờ lâu nhất lên trước, để một key lỗi liên tục (bị bump
          // updatedAt mỗi lần thất bại) không chiếm chỗ của các dòng khác qua
          // nhiều chu kỳ liên tiếp.
          .orderBy('obj.updatedAt', 'ASC')
          .limit(SWEEP_BATCH)
          .getMany()
      );
    });
  }
}
