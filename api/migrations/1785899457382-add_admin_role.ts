import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminRole1785899457382 implements MigrationInterface {
  name = 'AddAdminRole1785899457382';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admin_users"
        ADD COLUMN "admin_role" varchar(32) NOT NULL DEFAULT 'admin'
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_users"
        ADD CONSTRAINT "CHK_admin_users_admin_role"
        CHECK ("admin_role" IN ('admin', 'super_admin'))
    `);

    // Nâng admin gốc lên super_admin. Thiếu bước này thì endpoint vừa gắn
    // guard sẽ không ai gọi được — kể cả người tạo ra nó.
    // Chọn admin CŨ NHẤT cho tất định, tránh phụ thuộc thứ tự trả về của DB.
    await queryRunner.query(`
      UPDATE admin_users
         SET admin_role = 'super_admin'
       WHERE account_id = (
         SELECT a.id
           FROM accounts a
           JOIN admin_users au ON au.account_id = a.id
          WHERE a.account_role = 'admin'
          ORDER BY a.created_at ASC
          LIMIT 1
       )
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admin_users" DROP CONSTRAINT IF EXISTS "CHK_admin_users_admin_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_users" DROP COLUMN IF EXISTS "admin_role"`,
    );
  }
}
