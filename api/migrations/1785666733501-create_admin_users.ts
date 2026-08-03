import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminUsers1785666733501 implements MigrationInterface {
  name = 'CreateAdminUsers1785666733501';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admin_users" (
        "account_id"   uuid NOT NULL,
        "ip_whitelist" text,
        CONSTRAINT "PK_admin_users_account_id" PRIMARY KEY ("account_id"),
        CONSTRAINT "FK_admin_users_account_id"
          FOREIGN KEY ("account_id") REFERENCES "accounts" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_users"`);
  }
}
