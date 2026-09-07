import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaignReviewSubmissions1788755828839 implements MigrationInterface {
  name = 'CreateCampaignReviewSubmissions1788755828839';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "campaign_review_submissions" (
        "id"               uuid        NOT NULL DEFAULT uuidv7(),
        "campaign_id"      uuid        NOT NULL,
        "revision_number"  integer     NOT NULL,
        "campaign_version" integer     NOT NULL,
        "status"           varchar(32) NOT NULL DEFAULT 'open',

        -- Snapshot theo GIÁ TRỊ, không phải tham chiếu tới campaign đang sống.
        -- Trỏ về bản ghi hiện tại thì màn duyệt sẽ hiện dữ liệu draft chưa gửi
        -- như thể đã duyệt, và không diff được hai revision với nhau.
        -- Tiền trong đây lưu dạng chuỗi: jsonb dùng double precision cho number,
        -- đủ để làm sai một giá trị VND lớn.
        "snapshot"         jsonb       NOT NULL,
        -- Chính sách đang áp lúc gửi: giá sàn kèm khoá cấu hình đã dùng, và
        -- policy của category. Chụp lại để về sau giải thích được vì sao một
        -- campaign qua được submit lại trượt approve.
        "applied_policy"   jsonb       NOT NULL,

        "submitted_by"     uuid        NOT NULL,
        "submitted_at"     timestamptz NOT NULL DEFAULT now(),

        "decision"         varchar(32),
        "decided_by"       uuid,
        "decided_at"       timestamptz,
        "reason_code"      varchar(64),
        "checklist_result" jsonb,
        "feedback_items"   jsonb,

        "created_at"       timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT "PK_campaign_review_submissions_id" PRIMARY KEY ("id"),
        -- Chặn hai lượt gửi cùng số revision, kể cả khi có đường ghi khác được
        -- thêm sau này.
        CONSTRAINT "UQ_campaign_review_submissions_revision"
          UNIQUE ("campaign_id", "revision_number"),
        CONSTRAINT "CHK_campaign_review_submissions_numbers"
          CHECK ("revision_number" >= 1 AND "campaign_version" >= 1),
        CONSTRAINT "CHK_campaign_review_submissions_status"
          CHECK ("status" IN ('open', 'decided', 'invalidated')),
        CONSTRAINT "CHK_campaign_review_submissions_decision"
          CHECK ("decision" IS NULL
              OR "decision" IN ('approve', 'request_changes', 'reject')),
        -- Đã quyết thì phải có đủ ai quyết và quyết lúc nào; chưa quyết thì
        -- không được có mảnh nào. Nửa vời là không truy ngược được.
        CONSTRAINT "CHK_campaign_review_submissions_decided"
          CHECK (("status" = 'decided')
                 = ("decision" IS NOT NULL
                    AND "decided_by" IS NOT NULL
                    AND "decided_at" IS NOT NULL)),
        -- RESTRICT: hồ sơ duyệt là bằng chứng, campaign biến mất thì nó vô nghĩa.
        CONSTRAINT "FK_campaign_review_submissions_campaign_id"
          FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // KHÔNG có FK tới accounts cho submitted_by/decided_by: giống
    // campaign_status_history, vết phải sống sót khi tài khoản bị xoá.

    await queryRunner.query(`
      CREATE INDEX "IDX_campaign_review_submissions_campaign"
        ON "campaign_review_submissions" ("campaign_id", "revision_number" DESC)
    `);

    // Hàng chờ của admin. Partial vì số dòng 'open' luôn nhỏ so với lịch sử.
    await queryRunner.query(`
      CREATE INDEX "IDX_campaign_review_submissions_open"
        ON "campaign_review_submissions" ("submitted_at" ASC)
        WHERE "status" = 'open'
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_campaign_review_submissions_open"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_campaign_review_submissions_campaign"`,
    );
    await queryRunner.query(`DROP TABLE "campaign_review_submissions"`);
  }
}
