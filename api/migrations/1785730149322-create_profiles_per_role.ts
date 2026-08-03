import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bỏ account_profiles dùng chung, mỗi vai trò một nơi lưu hồ sơ riêng.
 *
 * - admin: KHÔNG có bảng riêng. Các cột hồ sơ nhập thẳng vào admin_users đã có
 *   sẵn, vì admin chỉ cần vài trường và tách hai bảng vệ tinh cho cùng một
 *   thực thể là thừa. Không lấy address/gender — quản trị viên không dùng tới.
 * - brand: pháp nhân, mã số thuế, ngành hàng, người liên hệ.
 * - creator: nhân khẩu học và lĩnh vực nội dung, phục vụ việc brand tìm KOC.
 *
 * File migration create_account_profiles đã bị xoá khỏi codebase nên trên DB
 * dựng mới bảng đó không tồn tại; to_regclass() xử lý được cả hai trường hợp.
 */
export class CreateProfilesPerRole1785730149322 implements MigrationInterface {
  name = 'SplitProfilesPerRole1785730149322';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---- admin: gộp hồ sơ vào admin_users ----
    // Thêm dạng nullable trước, nạp dữ liệu xong mới siết NOT NULL, nếu không
    // các dòng admin_users đang có sẽ chặn ngay lệnh ALTER.
    await queryRunner.query(`
      ALTER TABLE "admin_users"
        ADD COLUMN "name"       varchar(255),
        ADD COLUMN "email"      citext,
        ADD COLUMN "avatar_url" text,
        ADD COLUMN "timezone"   varchar(64)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        ADD COLUMN "updated_at" timestamptz  NOT NULL DEFAULT now()
    `);

    // Mọi admin phải có dòng trong admin_users, kể cả admin tạo trước khi bảng
    // này ra đời.
    await queryRunner.query(`
      INSERT INTO admin_users (account_id, name, email)
      SELECT a.id, a.name, a.email
        FROM accounts a
       WHERE a.account_role = 'admin'
      ON CONFLICT (account_id) DO UPDATE
        SET name  = EXCLUDED.name,
            email = EXCLUDED.email
    `);

    // ---- brand ----
    await queryRunner.query(`
      CREATE TABLE "brand_profiles" (
        "account_id"    uuid         NOT NULL,
        -- Tên thương hiệu hiển thị, khác tên pháp nhân trên giấy phép
        "brand_name"    varchar(255),
        "company_name"  varchar(255),
        -- MST Việt Nam: 10 số, hoặc 13 ký tự dạng chi nhánh 0123456789-001
        "tax_code"      varchar(14),
        "email"         citext       NOT NULL,
        "phone"         varchar(20),
        "website"       text,
        "industry"      varchar(64),
        "logo_url"      text,
        "description"   text,
        "address"       text,
        -- Người phụ trách phía nhãn hàng, không nhất thiết là chủ tài khoản
        "contact_name"  varchar(255),
        "contact_phone" varchar(20),
        "timezone"      varchar(64)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        "updated_at"    timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_brand_profiles_account_id" PRIMARY KEY ("account_id"),
        CONSTRAINT "UQ_brand_profiles_tax_code" UNIQUE ("tax_code"),
        CONSTRAINT "FK_brand_profiles_account_id"
          FOREIGN KEY ("account_id") REFERENCES "accounts" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // ---- creator ----
    await queryRunner.query(`
      CREATE TABLE "creator_profiles" (
        "account_id"         uuid         NOT NULL,
        "display_name"       varchar(255),
        "email"              citext       NOT NULL,
        "phone"              varchar(20),
        "bio"                text,
        "avatar_url"         text,
        -- Ngày sinh thay vì tuổi: tuổi tự già đi, ngày sinh thì không
        "date_of_birth"      date,
        "gender"             smallint,
        -- Khu vực hoạt động, brand lọc KOC theo địa bàn
        "city"               varchar(128),
        "address"            text,
        -- Lĩnh vực nội dung: beauty, food, tech... Mảng vì một KOC làm nhiều mảng
        "content_categories" text[]       NOT NULL DEFAULT '{}',
        "portfolio_url"      text,
        "timezone"           varchar(64)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        "updated_at"         timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_creator_profiles_account_id" PRIMARY KEY ("account_id"),
        CONSTRAINT "FK_creator_profiles_account_id"
          FOREIGN KEY ("account_id") REFERENCES "accounts" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Lọc KOC theo lĩnh vực là truy vấn phổ biến nhất của brand; GIN là loại
    // index duy nhất dùng được cho toán tử chứa trên mảng.
    await queryRunner.query(`
      CREATE INDEX "IDX_creator_profiles_categories"
        ON "creator_profiles" USING GIN ("content_categories")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_creator_profiles_city" ON "creator_profiles" ("city")
    `);

    // ---- chuyển dữ liệu cũ rồi bỏ bảng gộp ----
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.account_profiles') IS NOT NULL THEN
          UPDATE admin_users au
             SET name       = p.name,
                 email      = p.email,
                 avatar_url = p.avatar_url,
                 timezone   = p.timezone,
                 updated_at = p.updated_at
            FROM account_profiles p
           WHERE p.account_id = au.account_id;

          INSERT INTO brand_profiles
            (account_id, brand_name, email, address, timezone, updated_at)
          SELECT p.account_id, p.name, p.email, p.address, p.timezone, p.updated_at
            FROM account_profiles p
            JOIN accounts a ON a.id = p.account_id
           WHERE a.account_role = 'brand';

          INSERT INTO creator_profiles
            (account_id, display_name, email, gender, address, timezone, updated_at)
          SELECT p.account_id, p.name, p.email, p.gender, p.address, p.timezone,
                 p.updated_at
            FROM account_profiles p
            JOIN accounts a ON a.id = p.account_id
           WHERE a.account_role = 'creator';

          DROP TABLE account_profiles;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "admin_users" ALTER COLUMN "email" SET NOT NULL`,
    );

    // File create_account_profiles đã bị xoá khỏi codebase, nên dòng lịch sử
    // của nó trong bảng migrations trỏ tới một class không còn tồn tại: revert
    // sâu tới đó sẽ báo không tìm thấy migration. Xoá nốt cho khớp.
    // Trên DB dựng mới thì dòng này vốn không có, DELETE thành no-op.
    await queryRunner.query(
      `DELETE FROM "migrations" WHERE "name" = 'CreateAccountProfiles1785024001000'`,
    );
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dựng lại dòng lịch sử đã xoá ở up() để revert đưa bảng migrations về
    // đúng trạng thái trước đó. ON CONFLICT phòng trường hợp chạy lại.
    await queryRunner.query(`
      INSERT INTO "migrations" ("timestamp", "name")
      SELECT 1785024001000, 'CreateAccountProfiles1785024001000'
       WHERE NOT EXISTS (
         SELECT 1 FROM "migrations"
          WHERE "name" = 'CreateAccountProfiles1785024001000'
       )
    `);

    await queryRunner.query(`
      CREATE TABLE "account_profiles" (
        "account_id" uuid         NOT NULL,
        "name"       varchar(255),
        "email"      citext       NOT NULL,
        "avatar_url" text,
        "address"    text,
        "gender"     smallint,
        "timezone"   varchar(64)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        "updated_at" timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_account_profiles_account_id" PRIMARY KEY ("account_id"),
        CONSTRAINT "FK_account_profiles_account_id"
          FOREIGN KEY ("account_id") REFERENCES "accounts" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Gom ba nguồn về bảng gộp. Cột nào bảng mới không có thì trả về NULL —
    // revert không dựng lại được thứ chưa từng được lưu.
    await queryRunner.query(`
      INSERT INTO account_profiles
        (account_id, name, email, avatar_url, address, gender, timezone, updated_at)
      -- NULL trần không có kiểu nên UNION không khớp được với smallint/text ở
      -- nhánh sau; phải ép kiểu tường minh.
      SELECT account_id, name, email, avatar_url, NULL::text, NULL::smallint,
             timezone, updated_at
        FROM admin_users
       WHERE email IS NOT NULL
      UNION ALL
      SELECT account_id, brand_name, email, logo_url, address, NULL::smallint,
             timezone, updated_at
        FROM brand_profiles
      UNION ALL
      SELECT account_id, display_name, email, avatar_url, address, gender, timezone,
             updated_at
        FROM creator_profiles
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_creator_profiles_city"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_creator_profiles_categories"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "creator_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "brand_profiles"`);

    await queryRunner.query(`
      ALTER TABLE "admin_users"
        DROP COLUMN IF EXISTS "updated_at",
        DROP COLUMN IF EXISTS "timezone",
        DROP COLUMN IF EXISTS "avatar_url",
        DROP COLUMN IF EXISTS "email",
        DROP COLUMN IF EXISTS "name"
    `);
  }
}
