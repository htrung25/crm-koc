import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaigns1788106493851 implements MigrationInterface {
  name = 'CreateCampaigns1788106493851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "campaign_categories" (
        "id"         uuid         NOT NULL DEFAULT uuidv7(),
        "name"       varchar(100) NOT NULL,
        -- Đổi được theo thời gian. Campaign chụp lại chính sách tại lúc gửi
        -- duyệt, nên đổi ở đây không hồi tố lên hồ sơ đã duyệt.
        "policy"     varchar(32)  NOT NULL DEFAULT 'allowed',
        "is_active"  boolean      NOT NULL DEFAULT true,
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        "updated_at" timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_campaign_categories_name" UNIQUE ("name"),
        CONSTRAINT "CHK_campaign_categories_policy"
          CHECK ("policy" IN ('allowed', 'restricted', 'prohibited'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "campaigns" (
        "id"          uuid        NOT NULL DEFAULT uuidv7(),
        "brand_id"    uuid        NOT NULL,
        "code"        varchar(20) NOT NULL,
        "status"      smallint    NOT NULL DEFAULT 1,
        "version"     integer     NOT NULL DEFAULT 1,
        -- Bước wizard gần nhất, để mở lại đúng chỗ đang dở.
        "wizard_step" smallint,

        "title"               varchar(150),
        "objective"           varchar(32),
        "category_id"         uuid,
        "product_description" text,

        "key_message"        text,
        "selling_points"     jsonb,
        "prohibited_content" jsonb,
        "required_hashtags"  jsonb,
        "required_mentions"  jsonb,
        "required_links"     jsonb,

        "creator_count"        smallint,
        "recruiting_start_at"  timestamptz,
        "application_deadline" timestamptz,
        "creator_content_categories" text[]        NOT NULL DEFAULT '{}',
        "creator_platforms"          text[]        NOT NULL DEFAULT '{}',
        "creator_min_followers"       bigint,
        "creator_min_engagement_rate" numeric(8,4),
        "creator_cities"              text[]        NOT NULL DEFAULT '{}',
        "creator_audience_note"       text,

        "compensation_type"   varchar(32),
        "pricing_model"       varchar(32),
        -- Tiền là integer VND (bigint), KHÔNG numeric có phần thập phân.
        "cash_unit_price"     bigint,
        "min_cash_unit_price" bigint,
        "max_cash_unit_price" bigint,
        -- Dẫn xuất: creator_count × cash_unit_price khi pricing FIXED. Client
        -- không ghi được cột này.
        "cash_budget"         bigint,
        "product_benefit"     jsonb,
        "usage_rights_scope"  text,
        "usage_rights_kind"   varchar(32),
        "usage_rights_until"  timestamptz,
        "cancellation_policy" text,

        "submitted_at"       timestamptz,
        "approved_at"        timestamptz,
        "cancelled_at"       timestamptz,
        "cancel_reason_code" varchar(64),
        "created_at"         timestamptz NOT NULL DEFAULT now(),
        "updated_at"         timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_campaigns_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_campaigns_code" UNIQUE ("code"),

        -- 7-13 đã đặt chỗ cho nửa tuyển dụng, xem ECampaignStatus.
        CONSTRAINT "CHK_campaigns_status"
          CHECK ("status" IN (1, 2, 3, 4, 5, 6)),
        CONSTRAINT "CHK_campaigns_objective"
          CHECK ("objective" IS NULL OR "objective" IN
                 ('awareness', 'engagement', 'traffic', 'sales')),
        CONSTRAINT "CHK_campaigns_compensation_type"
          CHECK ("compensation_type" IS NULL OR "compensation_type" IN
                 ('cash', 'product', 'hybrid')),
        CONSTRAINT "CHK_campaigns_pricing_model"
          CHECK ("pricing_model" IS NULL OR "pricing_model" IN
                 ('fixed', 'negotiable')),
        CONSTRAINT "CHK_campaigns_usage_rights_kind"
          CHECK ("usage_rights_kind" IS NULL OR "usage_rights_kind" IN
                 ('fixed', 'perpetual')),
        CONSTRAINT "CHK_campaigns_wizard_step"
          CHECK ("wizard_step" IS NULL OR "wizard_step" BETWEEN 1 AND 6),
        CONSTRAINT "CHK_campaigns_creator_count"
          CHECK ("creator_count" IS NULL OR "creator_count" BETWEEN 1 AND 100),
        CONSTRAINT "CHK_campaigns_cash_non_negative"
          CHECK (("cash_unit_price"     IS NULL OR "cash_unit_price"     >= 0)
             AND ("min_cash_unit_price" IS NULL OR "min_cash_unit_price" >= 0)
             AND ("max_cash_unit_price" IS NULL OR "max_cash_unit_price" >= 0)
             AND ("cash_budget"         IS NULL OR "cash_budget"         >= 0)),
        CONSTRAINT "CHK_campaigns_price_range"
          CHECK ("min_cash_unit_price" IS NULL
              OR "max_cash_unit_price" IS NULL
              OR "max_cash_unit_price" >= "min_cash_unit_price"),
        CONSTRAINT "CHK_campaigns_creator_thresholds"
          CHECK (("creator_min_followers" IS NULL OR "creator_min_followers" >= 0)
             AND ("creator_min_engagement_rate" IS NULL
                  OR "creator_min_engagement_rate" >= 0)),
        -- Viết dạng "a IS NULL OR b IS NULL OR ..." chứ không phải "a > b":
        -- Draft mới điền một trong hai mốc vẫn phải lưu được.
        CONSTRAINT "CHK_campaigns_recruiting_before_deadline"
          CHECK ("recruiting_start_at"  IS NULL
              OR "application_deadline" IS NULL
              OR "application_deadline" > "recruiting_start_at"),
        -- Chỉ campaign đã huỷ mới có cancelled_at, và ngược lại.
        CONSTRAINT "CHK_campaigns_cancelled_at"
          CHECK (("status" = 6) = ("cancelled_at" IS NOT NULL)),
        -- Cùng lý do social_accounts dùng varchar + CHECK thay vì enum type của
        -- Postgres: thêm nền tảng chỉ cần sửa CHECK.
        CONSTRAINT "CHK_campaigns_creator_platforms"
          CHECK ("creator_platforms" <@ ARRAY['tiktok', 'instagram',
                                              'youtube', 'facebook']::text[]),

        CONSTRAINT "FK_campaigns_brand_id"
          FOREIGN KEY ("brand_id") REFERENCES "brand_profiles" ("account_id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        -- RESTRICT: xoá một danh mục đang có campaign sẽ làm mất ngữ cảnh của
        -- mọi quyết định kiểm duyệt trước đó.
        CONSTRAINT "FK_campaigns_category_id"
          FOREIGN KEY ("category_id") REFERENCES "campaign_categories" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Màn hình của Brand: campaign của tôi, lọc theo trạng thái.
    await queryRunner.query(`
      CREATE INDEX "IDX_campaigns_brand_status"
        ON "campaigns" ("brand_id", "status")
    `);

    // Hàng chờ của Admin, sắp theo lần cập nhật gần nhất.
    await queryRunner.query(`
      CREATE INDEX "IDX_campaigns_status_updated"
        ON "campaigns" ("status", "updated_at" DESC)
    `);

    // CASCADE chứ không RESTRICT như collaborations: deliverable không có ý
    // nghĩa nào ngoài campaign chứa nó.
    await queryRunner.query(`
      CREATE TABLE "campaign_deliverables" (
        "id"                          uuid        NOT NULL DEFAULT uuidv7(),
        "campaign_id"                 uuid        NOT NULL,
        -- Thứ tự hiển thị. Server gán, client không gửi.
        "position"                    smallint    NOT NULL,
        "content_type"                varchar(32),
        "platform"                    varchar(32),
        "quantity"                    smallint,
        "duration_or_length"          jsonb,
        "format_requirements"         text,
        "content_submission_deadline" timestamptz,
        "publish_deadline"            timestamptz,
        "created_at"                  timestamptz NOT NULL DEFAULT now(),
        "updated_at"                  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_deliverables_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_campaign_deliverables_position"
          UNIQUE ("campaign_id", "position"),
        CONSTRAINT "CHK_campaign_deliverables_content_type"
          CHECK ("content_type" IS NULL OR "content_type" IN
                 ('video', 'image_post', 'livestream', 'story', 'review_article')),
        CONSTRAINT "CHK_campaign_deliverables_platform"
          CHECK ("platform" IS NULL OR "platform" IN
                 ('tiktok', 'instagram', 'youtube', 'facebook')),
        CONSTRAINT "CHK_campaign_deliverables_quantity"
          CHECK ("quantity" IS NULL OR "quantity" >= 1),
        CONSTRAINT "CHK_campaign_deliverables_deadline_order"
          CHECK ("content_submission_deadline" IS NULL
              OR "publish_deadline" IS NULL
              OR "publish_deadline" >= "content_submission_deadline"),
        CONSTRAINT "FK_campaign_deliverables_campaign_id"
          FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Giới hạn 1-10 ảnh KHÔNG đặt ở đây: Draft được phép có 11 ảnh, chỉ lúc gửi
    // duyệt mới chặn (BR-CAM-002).
    await queryRunner.query(`
      CREATE TABLE "campaign_assets" (
        "id"            uuid        NOT NULL DEFAULT uuidv7(),
        "campaign_id"   uuid        NOT NULL,
        "kind"          varchar(32) NOT NULL,
        "position"      smallint    NOT NULL,
        -- Khoá trong R2, sinh ngẫu nhiên: không đoán được từ id campaign.
        "storage_key"   text        NOT NULL,
        -- Tên người dùng đặt, CHỈ để hiển thị. Không bao giờ dùng làm đường dẫn.
        "original_name" varchar(255),
        -- Lấy từ magic bytes, không tin đuôi tên lẫn Content-Type của client.
        "mime_type"     varchar(64) NOT NULL,
        "size_bytes"    integer     NOT NULL,
        "checksum"      char(64)    NOT NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_assets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_campaign_assets_position"
          UNIQUE ("campaign_id", "kind", "position"),
        CONSTRAINT "CHK_campaign_assets_kind"
          CHECK ("kind" IN ('product_image', 'reference_file')),
        CONSTRAINT "CHK_campaign_assets_size" CHECK ("size_bytes" > 0),
        CONSTRAINT "FK_campaign_assets_campaign_id"
          FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // collaborations.campaign_id vốn là uuid trần vì lúc tạo bảng đó chưa có
    // campaigns. Giữ nullable: hợp tác vẫn có thể thoả thuận trực tiếp.
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ADD CONSTRAINT "FK_collaborations_campaign_id"
        FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collaborations" DROP CONSTRAINT "FK_collaborations_campaign_id"`,
    );
    await queryRunner.query(`DROP TABLE "campaign_assets"`);
    await queryRunner.query(`DROP TABLE "campaign_deliverables"`);
    await queryRunner.query(`DROP INDEX "IDX_campaigns_status_updated"`);
    await queryRunner.query(`DROP INDEX "IDX_campaigns_brand_status"`);
    await queryRunner.query(`DROP TABLE "campaigns"`);
    await queryRunner.query(`DROP TABLE "campaign_categories"`);
  }
}
