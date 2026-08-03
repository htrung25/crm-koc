import { MigrationInterface, QueryRunner } from 'typeorm';

export class UseUuidv7Defaults1785670165304 implements MigrationInterface {
  name = 'UseUuidv7Defaults1785670165304';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_events" ALTER COLUMN "id" SET DEFAULT uuidv7()`,
    );
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "session_events" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
  }
}
