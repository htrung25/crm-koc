import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminUserStatus1785670164268 implements MigrationInterface {
  name = 'AddAdminUserStatus1785670164268';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admin_users"
        ADD COLUMN "status" varchar(16) NOT NULL DEFAULT 'active'
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_users"
        ADD CONSTRAINT "CHK_admin_users_status"
        CHECK ("status" IN ('inactive', 'active'))
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admin_users" DROP CONSTRAINT IF EXISTS "CHK_admin_users_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "status"`,
    );
  }
}
