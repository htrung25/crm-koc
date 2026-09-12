import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpenCollaborationUniqueness1789214000000 implements MigrationInterface {
  name = 'AddOpenCollaborationUniqueness1789214000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Snapshot luật tại thời điểm migration: 1=PENDING, 2=ACTIVE, 3=SUBMITTED.
    // Không tự xoá/hủy dữ liệu trùng: index creation phải fail để xử lý trước.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_collaborations_open_campaign"
        ON "collaborations" ("brand_id", "creator_id", "campaign_id")
        WHERE "campaign_id" IS NOT NULL AND "status" IN (1, 2, 3)
    `);
    // NULL không được so bằng trong unique index thường: tách thành một tập.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_collaborations_open_direct"
        ON "collaborations" ("brand_id", "creator_id")
        WHERE "campaign_id" IS NULL AND "status" IN (1, 2, 3)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_collaborations_open_direct"`);
    await queryRunner.query(`DROP INDEX "UQ_collaborations_open_campaign"`);
  }
}
