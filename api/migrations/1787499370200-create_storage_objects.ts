import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStorageObjects1787499370200 implements MigrationInterface {
  name = 'CreateStorageObjects1787499370200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "storage_objects" (
        "id"          uuid        NOT NULL DEFAULT uuidv7(),
        "storage_key" text        NOT NULL,
        "state"       smallint    NOT NULL,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        "updated_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_storage_objects_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_storage_objects_key" UNIQUE ("storage_key"),
        CONSTRAINT "CHK_storage_objects_state" CHECK ("state" IN (0, 1, 2))
      )
    `);

    // Chỉ index thứ sweep thật sự quét. LINKED là đa số và không bao giờ bị đụng.
    await queryRunner.query(`
      CREATE INDEX "IDX_storage_objects_gc"
        ON "storage_objects" ("state", "updated_at") WHERE "state" <> 1
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_storage_objects_gc"`);
    await queryRunner.query(`DROP TABLE "storage_objects"`);
  }
}
