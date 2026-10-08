import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillWallets1791459743095 implements MigrationInterface {
  name = 'BackfillWallets1791459743095';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "wallets" ("account_id")
      SELECT "account_id" FROM "brand_profiles"
      UNION
      SELECT "account_id" FROM "creator_profiles"
      ON CONFLICT ("account_id") DO NOTHING
    `);
  }

  public async down(): Promise<void> {}
}
