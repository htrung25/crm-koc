import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccounts1785024000000 implements MigrationInterface {
  name = 'CreateAccounts1785024000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id"                uuid         NOT NULL DEFAULT gen_random_uuid(),
        "account_role"      varchar(32)  NOT NULL,
        "name"              varchar(255) NOT NULL,
        "email"             citext       NOT NULL,
        "phone"             varchar(20),
        "password"          text         NOT NULL,
        "email_verified_at" timestamptz,
        "phone_verified_at" timestamptz,
        "status"            smallint  NOT NULL ,
        "status_reason"     text,
        "created_at"         timestamptz  NOT NULL DEFAULT now(),
        "updated_at"         timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_accounts_email" UNIQUE ("email"),
        CONSTRAINT "UQ_accounts_phone" UNIQUE ("phone"),
        CONSTRAINT "CHK_accounts_account_role"
          CHECK ("account_role" IN ('admin', 'brand', 'creator'))
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_accounts_account_role" ON "accounts" ("account_role")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_accounts_status" ON "accounts" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_accounts_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_accounts_account_role"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts"`);
  }
}
