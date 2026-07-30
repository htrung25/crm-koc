import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountSessions1785024002000 implements MigrationInterface {
  name = 'CreateAccountSessions1785024002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "account_sessions" (
        "id"                 uuid         NOT NULL DEFAULT gen_random_uuid(),
        "account_id"         uuid         NOT NULL,
        "refresh_token_hash" text         NOT NULL,
        "device_id"          varchar(255),
        "device_name"        varchar(255),
        "ip_address"         inet,
        "user_agent"         text,
        "push_token"         text,
        "expires_at"         timestamptz  NOT NULL,
        "revoked_at"         timestamptz,
        "last_used_at"       timestamptz,
        "created_at"         timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_account_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_account_sessions_refresh_token_hash"
          UNIQUE ("refresh_token_hash"),
        CONSTRAINT "FK_account_sessions_account_id"
          FOREIGN KEY ("account_id") REFERENCES "accounts" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_account_sessions_account_id" ON "account_sessions" ("account_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_account_sessions_expires_at" ON "account_sessions" ("expires_at")`,
    );
    // Truy vấn phổ biến: lấy các phiên còn sống của 1 account
    await queryRunner.query(`
      CREATE INDEX "IDX_account_sessions_active"
        ON "account_sessions" ("account_id")
        WHERE "revoked_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_account_sessions_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_account_sessions_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_account_sessions_account_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "account_sessions"`);
  }
}
