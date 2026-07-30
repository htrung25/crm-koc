import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountProfiles1785024001000 implements MigrationInterface {
  name = 'CreateAccountProfiles1785024001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "account_profiles" (
        "account_id" uuid         NOT NULL,
        "full_name"  varchar(255),
        "avatar_url" text,
        "address"    text,
        "gender"     smallint,
        "timezone"   varchar(64)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        "updated_at"  timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_account_profiles_account_id" PRIMARY KEY ("account_id"),
        CONSTRAINT "FK_account_profiles_account_id"
          FOREIGN KEY ("account_id") REFERENCES "accounts" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "account_profiles"`);
  }
}
