import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScopeCollaborationCampaignToBrand1788837732526 implements MigrationInterface {
  name = 'ScopeCollaborationCampaignToBrand1788837732526';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "campaigns"
        ADD CONSTRAINT "UQ_campaigns_id_brand" UNIQUE ("id", "brand_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "collaborations"
        DROP CONSTRAINT "FK_collaborations_campaign_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ADD CONSTRAINT "FK_collaborations_campaign_brand"
        FOREIGN KEY ("campaign_id", "brand_id")
        REFERENCES "campaigns" ("id", "brand_id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM "collaborations"
           WHERE "agreed_price" IS NOT NULL
             AND "agreed_price" <> round("agreed_price")
        ) THEN
          RAISE EXCEPTION
            'agreed_price còn giá trị thập phân, phải làm sạch trước khi đổi sang bigint';
        END IF;
      END $$
    `);

    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ALTER COLUMN "agreed_price" TYPE bigint USING "agreed_price"::bigint
    `);
  }

  // down phải đảo ngược đúng thứ tự của up
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ALTER COLUMN "agreed_price" TYPE numeric(14,2)
    `);

    await queryRunner.query(`
      ALTER TABLE "collaborations"
        DROP CONSTRAINT "FK_collaborations_campaign_brand"
    `);

    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ADD CONSTRAINT "FK_collaborations_campaign_id"
        FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "campaigns" DROP CONSTRAINT "UQ_campaigns_id_brand"
    `);
  }
}
