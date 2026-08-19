import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountIdentities1787112439802 implements MigrationInterface {
  name = 'CreateAccountIdentities1787112439802';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "account_identities" (
        "id"               uuid         NOT NULL DEFAULT uuidv7(),
        "account_id"       uuid         NOT NULL,
        "provider"         varchar(32)  NOT NULL,
        -- 'sub' của Google. KHÔNG dùng email làm khoá: người dùng đổi được
        -- email của tài khoản Google, đổi xong là mất liên kết.
        "provider_user_id" varchar(255) NOT NULL,
        -- Email TẠI provider lúc liên kết; có thể lệch accounts.email về sau.
        "email"            citext,
        -- Google có tài khoản email chưa xác minh. Chỉ ghép theo email khi cờ
        -- này true, nếu không ai đăng ký Google trùng email là chiếm tài khoản.
        "email_verified"   boolean      NOT NULL DEFAULT false,
        "display_name"     varchar(255),
        "avatar_url"       text,
        "linked_at"        timestamptz  NOT NULL DEFAULT now(),
        "last_login_at"    timestamptz,
        "created_at"       timestamptz  NOT NULL DEFAULT now(),
        "updated_at"       timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_account_identities_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_account_identities_provider"
          CHECK ("provider" IN ('google')),
        -- Một tài khoản Google chỉ gắn được vào MỘT account. Đây là ràng buộc
        -- chống chiếm tài khoản quan trọng nhất của bảng này.
        CONSTRAINT "UQ_account_identities_provider_user"
          UNIQUE ("provider", "provider_user_id"),
        -- Và một account chỉ có một danh tính cho mỗi provider.
        CONSTRAINT "UQ_account_identities_account_provider"
          UNIQUE ("account_id", "provider"),
        CONSTRAINT "FK_account_identities_account_id"
          FOREIGN KEY ("account_id")
          REFERENCES "accounts" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    // Không cần index riêng cho account_id: UQ_..._account_provider đã có
    // account_id ở cột dẫn đầu nên tra theo mình nó vẫn dùng được index đó.
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "account_identities"`);
  }
}
