import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampaignEscrows1791633442876 implements MigrationInterface {
  name = 'CreateCampaignEscrows1791633442876';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tiền brand đã trả cho campaign, nằm ngoài ví cho tới khi chuyển cho
    // creator hoặc hoàn lại brand.
    await queryRunner.query(`
      CREATE TABLE "campaign_escrows" (
        "campaign_id" uuid          NOT NULL,
        "brand_id"    uuid          NOT NULL,
        "held_amount" numeric(15,2) NOT NULL,
        "created_at"  timestamptz   NOT NULL DEFAULT now(),
        "updated_at"  timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_escrows" PRIMARY KEY ("campaign_id"),
        -- Chi quá phần đã ký quỹ (nhiều hợp tác hơn số suất) vỡ ở đây.
        CONSTRAINT "CHK_campaign_escrows_held" CHECK ("held_amount" >= 0),
        CONSTRAINT "FK_campaign_escrows_campaign_id"
          FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "FK_campaign_escrows_brand_id"
          FOREIGN KEY ("brand_id") REFERENCES "accounts" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Ledger thêm nguồn thứ tư: tiền đi/về giữa ví brand và ký quỹ campaign.
    // Một campaign có nhiều dòng (khoá lúc duyệt, bù chênh thương lượng, hoàn
    // khi huỷ hợp tác) nên không unique theo campaign_id.
    await queryRunner.query(`
      ALTER TABLE "wallet_transactions"
        ADD COLUMN "campaign_id" uuid,
        ADD CONSTRAINT "FK_wallet_transactions_campaign_id"
          FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        DROP CONSTRAINT "CHK_wallet_transactions_one_source",
        ADD CONSTRAINT "CHK_wallet_transactions_one_source"
          CHECK (num_nonnulls("collaboration_id", "withdrawal_id", "deposit_id", "campaign_id") = 1),
        ADD CONSTRAINT "CHK_wallet_transactions_campaign"
          CHECK ("campaign_id" IS NULL OR "status" = 2)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_transactions_campaign"
        ON "wallet_transactions" ("campaign_id")
        WHERE "campaign_id" IS NOT NULL
    `);

    // Giá đang được đề xuất trong lúc thương lượng; chốt thì ghi đè agreed_price.
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ADD COLUMN "proposed_price" bigint,
        ADD COLUMN "proposed_by" varchar(16),
        ADD CONSTRAINT "CHK_collaborations_proposal_pair"
          CHECK (("proposed_price" IS NULL) = ("proposed_by" IS NULL)),
        ADD CONSTRAINT "CHK_collaborations_proposed_price"
          CHECK ("proposed_price" IS NULL OR "proposed_price" > 0),
        ADD CONSTRAINT "CHK_collaborations_proposed_by"
          CHECK ("proposed_by" IS NULL OR "proposed_by" IN ('brand', 'creator'))
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Không xoá chứng từ tiền để rollback: ví sẽ lệch ledger mà không ai biết.
    const [{ n }] = (await queryRunner.query(`
      SELECT (SELECT count(*) FROM "wallet_transactions" WHERE "campaign_id" IS NOT NULL)
           + (SELECT count(*) FROM "campaign_escrows") AS n
    `)) as { n: string }[];
    if (Number(n) > 0) {
      throw new Error(
        `cannot revert: ${n} escrow rows exist, reconcile them first`,
      );
    }

    await queryRunner.query(`
      ALTER TABLE "collaborations"
        DROP CONSTRAINT "CHK_collaborations_proposed_by",
        DROP CONSTRAINT "CHK_collaborations_proposed_price",
        DROP CONSTRAINT "CHK_collaborations_proposal_pair",
        DROP COLUMN "proposed_by",
        DROP COLUMN "proposed_price"
    `);
    await queryRunner.query(`DROP INDEX "IDX_wallet_transactions_campaign"`);
    await queryRunner.query(`
      ALTER TABLE "wallet_transactions"
        DROP CONSTRAINT "CHK_wallet_transactions_campaign",
        DROP CONSTRAINT "CHK_wallet_transactions_one_source",
        ADD CONSTRAINT "CHK_wallet_transactions_one_source"
          CHECK (num_nonnulls("collaboration_id", "withdrawal_id", "deposit_id") = 1),
        DROP CONSTRAINT "FK_wallet_transactions_campaign_id",
        DROP COLUMN "campaign_id"
    `);
    await queryRunner.query(`DROP TABLE "campaign_escrows"`);
  }
}
