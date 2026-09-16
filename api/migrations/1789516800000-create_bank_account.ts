import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBankAccount1789516800000 implements MigrationInterface {
  name = 'CreateBankAccount1789516800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bank_account" (
        "id" uuid NOT NULL DEFAULT uuidv7(),
        "account_id" uuid NOT NULL,
        "bank_code" varchar(32),
        "bank_number" varchar(34) NOT NULL,
        "bank_name" varchar(255) NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bank_account_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bank_account_bank_number" UNIQUE ("bank_number")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_bank_account_account_created"
      ON "bank_account" ("account_id", "created_at" DESC, "id" ASC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "bank_account"');
  }
}
