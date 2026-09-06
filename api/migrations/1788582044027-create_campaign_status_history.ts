import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaignStatusHistory1788582044027 implements MigrationInterface {
  name = 'CreateCampaignStatusHistory1788582044027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "campaign_status_history" (
        "id"             uuid        NOT NULL DEFAULT uuidv7(),
        "campaign_id"    uuid        NOT NULL,
        -- NULL cho bản ghi khai sinh: chưa có trạng thái nào trước đó.
        "from_status"    smallint,
        "to_status"      smallint    NOT NULL,
        "before_version" integer,
        "after_version"  integer     NOT NULL,
        "actor_type"     varchar(32) NOT NULL,
        -- KHÔNG có FK tới accounts: giống session_events, vết phải sống sót khi
        -- tài khoản bị xoá, nếu không thì mất luôn ai đã làm gì.
        "actor_id"       uuid,
        "reason_code"    varchar(64),
        "note"           text,
        -- Nối nhiều thao tác trong cùng một luồng để đọc ngược lại được.
        "correlation_id" uuid,
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_status_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_campaign_status_history_to_status"
          CHECK ("to_status" IN (1, 2, 3, 4, 5, 6)),
        CONSTRAINT "CHK_campaign_status_history_from_status"
          CHECK ("from_status" IS NULL OR "from_status" IN (1, 2, 3, 4, 5, 6)),
        CONSTRAINT "CHK_campaign_status_history_actor_type"
          CHECK ("actor_type" IN ('brand', 'admin', 'system')),
        -- Scheduler không có tài khoản đứng sau; người thì luôn phải có.
        CONSTRAINT "CHK_campaign_status_history_actor_id"
          CHECK (("actor_type" = 'system') = ("actor_id" IS NULL)),
        CONSTRAINT "CHK_campaign_status_history_versions"
          CHECK (("before_version" IS NULL OR "before_version" >= 1)
             AND "after_version" >= 1),
        -- RESTRICT chứ không CASCADE: lịch sử không có nghĩa nếu campaign biến
        -- mất, và nó chặn luôn việc xoá cứng campaign đã từng chuyển trạng thái
        -- — đúng quy tắc "đã submit thì chỉ được huỷ, không được xoá".
        CONSTRAINT "FK_campaign_status_history_campaign_id"
          FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Đường đọc duy nhất: dòng thời gian của MỘT campaign, mới nhất trước.
    await queryRunner.query(`
      CREATE INDEX "IDX_campaign_status_history_campaign"
        ON "campaign_status_history" ("campaign_id", "created_at" DESC)
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_campaign_status_history_campaign"`,
    );
    await queryRunner.query(`DROP TABLE "campaign_status_history"`);
  }
}
