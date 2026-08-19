import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowNullPasswordAndRole1787113888867 implements MigrationInterface {
  name = 'AllowNullPasswordAndRole1787113888867';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tài khoản tạo bằng Google không có mật khẩu. null = "chưa từng đặt",
    // khác hẳn với việc để một chuỗi hash ngẫu nhiên không ai biết.
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "password" DROP NOT NULL`,
    );

    // Google không cho biết brand hay creator. null = "chưa chọn vai trò",
    // frontend gọi PATCH /auth/me để chốt sau khi đăng nhập.
    // CHK_accounts_account_role không phải sửa: CHECK chỉ chặn khi biểu thức
    // ra FALSE, còn NULL IN (...) ra NULL nên vẫn lọt.
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "account_role" DROP NOT NULL`,
    );
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Đặt lại NOT NULL sẽ hỏng nếu đã có dòng null. Dọn trước: tài khoản chưa
    // chọn vai trò và chưa có mật khẩu thì chưa dùng được vào việc gì.
    await queryRunner.query(
      `DELETE FROM "accounts" WHERE "account_role" IS NULL OR "password" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "account_role" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ALTER COLUMN "password" SET NOT NULL`,
    );
  }
}
