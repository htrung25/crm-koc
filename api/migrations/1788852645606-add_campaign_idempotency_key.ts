import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCampaignIdempotencyKey1788852645606 implements MigrationInterface {
  name = 'AddCampaignIdempotencyKey1788852645606';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "campaigns"
        ADD COLUMN "idempotency_key" varchar(128)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_campaigns_brand_idempotency"
        ON "campaigns" ("brand_id", "idempotency_key")
    `);
  }

  // down phải đảo ngược đúng thứ tự của up
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_campaigns_brand_idempotency"`);
    await queryRunner.query(
      `ALTER TABLE "campaigns" DROP COLUMN "idempotency_key"`,
    );
  }
}
