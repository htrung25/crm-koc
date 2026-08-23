import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycExpiryAndNotified1787498223439 implements MigrationInterface {
  name = 'AddKycExpiryAndNotified1787498223439';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "kyc_submissions"
        ADD COLUMN "expires_at"  timestamptz NULL,
        ADD COLUMN "notified_at" timestamptz NULL
    `);

    // status 4 = VERIFIED. Job expire-verified chỉ quét đúng tập này.
    await queryRunner.query(`
      CREATE INDEX "IDX_kyc_submissions_expiry"
        ON "kyc_submissions" ("expires_at") WHERE "status" = 4
    `);

    // Predicate phải kèm status: DRAFT/PENDING vĩnh viễn có notified_at NULL,
    // lọc mỗi notified_at thì index ôm trọn chúng.
    await queryRunner.query(`
      CREATE INDEX "IDX_kyc_submissions_unnotified"
        ON "kyc_submissions" ("updated_at")
        WHERE "notified_at" IS NULL AND "status" IN (3, 4, 5, 6, 7)
    `);

    // Hồ sơ VERIFIED có sẵn trước migration này: gán hạn từ ngày duyệt.
    await queryRunner.query(`
      UPDATE "kyc_submissions"
      SET "expires_at" = "reviewed_at" + interval '365 days'
      WHERE "status" = 4 AND "reviewed_at" IS NOT NULL
    `);

    // Mọi trạng thái NOTIFIABLE (3 MORE_INFO, 4 VERIFIED, 5 REJECTED,
    // 6 LOCKED, 7 EXPIRED) coi như đã báo rồi, không riêng VERIFIED — nếu
    // không, các dòng MORE_INFO/REJECTED/LOCKED có sẵn sẽ bị job reconcile
    // gửi lại thông báo trong vòng 1 giờ sau khi deploy. COALESCE vì
    // MORE_INFO có thể không có reviewed_at.
    await queryRunner.query(`
      UPDATE "kyc_submissions"
      SET "notified_at" = COALESCE("reviewed_at", "updated_at")
      WHERE "status" IN (3, 4, 5, 6, 7)
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_kyc_submissions_unnotified"`);
    await queryRunner.query(`DROP INDEX "IDX_kyc_submissions_expiry"`);
    await queryRunner.query(`
      ALTER TABLE "kyc_submissions"
        DROP COLUMN "expires_at",
        DROP COLUMN "notified_at"
    `);
  }
}
