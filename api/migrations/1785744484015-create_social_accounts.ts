import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tài khoản mạng xã hội đã kết nối của creator.
 *
 * Hai ràng buộc duy nhất mang ý nghĩa KHÁC nhau, và handleCallback dựa vào
 * chính sự khác nhau đó để phân biệt lỗi:
 * - (creator_profile_id, platform): mỗi creator một tài khoản trên mỗi nền
 *   tảng. Va vào đây là nối lại chính nền tảng đó => ON CONFLICT DO UPDATE.
 * - (platform, external_account_id): một tài khoản social không thuộc về hai
 *   creator. Va vào đây là lỗi nghiệp vụ => bắt 23505 theo TÊN constraint.
 *
 * platform dùng varchar + CHECK chứ không phải enum type của Postgres: thêm
 * nền tảng mới chỉ cần sửa CHECK, còn ALTER TYPE ... ADD VALUE thì nhãn vừa
 * thêm chưa dùng được trong cùng transaction — mà TypeORM bọc mỗi migration
 * trong một transaction. Và enum type không bao giờ xoá được nhãn.
 */
export class CreateSocialAccounts1785744484015 implements MigrationInterface {
  name = 'CreateSocialAccounts1785744484015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "social_accounts" (
        "id"                      uuid          NOT NULL DEFAULT uuidv7(),
        "creator_profile_id"      uuid          NOT NULL,
        "platform"                varchar(32)   NOT NULL,
        "external_account_id"     varchar(255)  NOT NULL,
        "username"                varchar(255)  NOT NULL,
        "display_name"            varchar(255)  NOT NULL,
        "biography"               text,
        "profile_url"             text,
        "avatar_url"              text,
        "follower_count"          bigint        NOT NULL DEFAULT 0,
        "following_count"         bigint        NOT NULL DEFAULT 0,
        "content_count"           bigint        NOT NULL DEFAULT 0,
        "engagement_rate"         numeric(8,4),
        "access_token_encrypted"  text,
        "refresh_token_encrypted" text,
        "token_expires_at"        timestamptz,
        "granted_scopes"          text[]        NOT NULL DEFAULT '{}',
        -- Payload gốc của nền tảng, để truy ngược khi số liệu lệch hoặc API đổi
        "raw_data"                jsonb,
        "last_synced_at"          timestamptz,
        "sync_error"              text,
        "is_active"               boolean       NOT NULL DEFAULT true,
        "created_at"              timestamptz   NOT NULL DEFAULT now(),
        "updated_at"              timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_social_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_social_accounts_platform"
          CHECK ("platform" IN ('tiktok', 'instagram', 'youtube', 'facebook')),
        CONSTRAINT "FK_social_accounts_creator_profile_id"
          FOREIGN KEY ("creator_profile_id")
          REFERENCES "creator_profiles" ("account_id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Tên index phải khớp @Index trong entity VÀ chuỗi so sánh trong
    // handleCallback — đổi ở đây phải đổi cả hai chỗ kia.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_social_accounts_platform_external_id"
        ON "social_accounts" ("platform", "external_account_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_social_accounts_creator_platform"
        ON "social_accounts" ("creator_profile_id", "platform")
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_social_accounts_creator_platform"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_social_accounts_platform_external_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "social_accounts"`);
  }
}
