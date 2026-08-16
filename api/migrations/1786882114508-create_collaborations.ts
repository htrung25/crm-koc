import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCollaborations1786882114508 implements MigrationInterface {
  name = 'CreateCollaborations1786882114508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "collaborations" (
        "id"           uuid          NOT NULL DEFAULT uuidv7(),
        "brand_id"     uuid          NOT NULL,
        "creator_id"   uuid          NOT NULL,
        -- Chưa có bảng campaigns nên CHƯA có FK. Nullable vì hợp tác có thể
        -- thoả thuận trực tiếp, không qua chiến dịch nào.
        "campaign_id"  uuid,
        "status"       varchar(32)   NOT NULL DEFAULT 'pending',
        -- numeric chứ không float: giá tiền không được sai số nhị phân.
        "agreed_price" numeric(14,2),
        "started_at"   timestamptz,
        "completed_at" timestamptz,
        "cancelled_at" timestamptz,
        "created_at"   timestamptz   NOT NULL DEFAULT now(),
        "updated_at"   timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_collaborations_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_collaborations_status"
          CHECK ("status" IN ('pending', 'active', 'completed', 'cancelled', 'disputed')),
        CONSTRAINT "CHK_collaborations_agreed_price"
          CHECK ("agreed_price" IS NULL OR "agreed_price" >= 0),
        CONSTRAINT "FK_collaborations_brand_id"
          FOREIGN KEY ("brand_id")
          REFERENCES "brand_profiles" ("account_id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "FK_collaborations_creator_id"
          FOREIGN KEY ("creator_id")
          REFERENCES "creator_profiles" ("account_id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Hai chiều đọc chính: brand xem hợp tác của mình, creator xem của mình.
    // Ghép status vào vì màn hình nào cũng lọc theo trạng thái.
    await queryRunner.query(`
      CREATE INDEX "idx_collaborations_brand_status"
        ON "collaborations" ("brand_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_collaborations_creator_status"
        ON "collaborations" ("creator_id", "status")
    `);
    // Partial: phần lớn dòng có campaign_id NULL, không cần nằm trong index.
    await queryRunner.query(`
      CREATE INDEX "idx_collaborations_campaign"
        ON "collaborations" ("campaign_id")
        WHERE "campaign_id" IS NOT NULL
    `);
  }

  // down đảo ngược đúng thứ tự của up: xoá index trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_collaborations_campaign"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_collaborations_creator_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_collaborations_brand_status"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "collaborations"`);
  }
}
