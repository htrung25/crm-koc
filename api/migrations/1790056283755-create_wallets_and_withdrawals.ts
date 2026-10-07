import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWalletsAndWithdrawals1790056283755 implements MigrationInterface {
  name = 'CreateWalletsAndWithdrawals1790056283755';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id"                uuid          NOT NULL DEFAULT uuidv7(),
        "account_id"        uuid          NOT NULL,
        -- available: rút được ngay. locked: đang giữ cho lệnh rút chưa xong,
        -- trừ hẳn khi completed, trả về available khi rejected/failed/cancelled.
        "available_balance" numeric(15,2) NOT NULL DEFAULT 0,
        "locked_balance"    numeric(15,2) NOT NULL DEFAULT 0,
        "created_at"        timestamptz   NOT NULL DEFAULT now(),
        "updated_at"        timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wallets_account_id" UNIQUE ("account_id"),
        -- Chốt chặn cuối cho race: hai lệnh rút song song mà app kiểm tra sót
        -- thì UPDATE thứ hai vỡ ở đây thay vì để số dư âm.
        CONSTRAINT "CHK_wallets_available_balance"
          CHECK ("available_balance" >= 0),
        CONSTRAINT "CHK_wallets_locked_balance"
          CHECK ("locked_balance" >= 0),
        -- RESTRICT: ví còn tiền thì không được biến mất theo account.
        CONSTRAINT "FK_wallets_account_id"
          FOREIGN KEY ("account_id") REFERENCES "accounts" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "withdrawals" (
        "id"                  uuid          NOT NULL DEFAULT uuidv7(),
        "account_id"          uuid          NOT NULL,
        "bank_account_id"     uuid,
        "bank_code"           varchar(32),
        "bank_number"         varchar(34)   NOT NULL,
        "bank_name"           varchar(255)  NOT NULL,
        "account_holder_name" varchar(255)  NOT NULL,
        "amount"              numeric(15,2) NOT NULL,
        "fee"                 numeric(15,2) NOT NULL DEFAULT 0,
        -- Generated: app không tự tính được sai.
        "net_amount"          numeric(15,2) GENERATED ALWAYS AS ("amount" - "fee") STORED,
        "currency"            varchar(3)    NOT NULL DEFAULT 'VND',
        "status"              smallint      NOT NULL DEFAULT 1,
        "reject_reason"       text,
        "admin_note"          text,
        "transaction_code"    varchar(64)   NOT NULL,
        "bank_transaction_id" varchar(128),
        "reviewed_by"         uuid,
        "reviewed_at"         timestamptz,
        "processed_at"        timestamptz,
        "idempotency_key"     varchar(128),
        "metadata"            jsonb,
        "created_at"          timestamptz   NOT NULL DEFAULT now(),
        "updated_at"          timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_withdrawals_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_withdrawals_transaction_code" UNIQUE ("transaction_code"),
        -- 1 pending, 2 processing, 3 completed, 4 rejected, 5 failed, 6 cancelled
        CONSTRAINT "CHK_withdrawals_status"
          CHECK ("status" IN (1, 2, 3, 4, 5, 6)),
        CONSTRAINT "CHK_withdrawals_amount" CHECK ("amount" > 0),
        CONSTRAINT "CHK_withdrawals_fee" CHECK ("fee" >= 0 AND "fee" < "amount"),
        CONSTRAINT "CHK_withdrawals_currency" CHECK ("currency" IN ('VND')),
        CONSTRAINT "CHK_withdrawals_rejected_needs_reason"
          CHECK ("status" <> 4 OR "reject_reason" IS NOT NULL),
        CONSTRAINT "CHK_withdrawals_completed_needs_processed_at"
          CHECK ("status" <> 3 OR "processed_at" IS NOT NULL),
        -- RESTRICT: chứng từ tiền không được xoá dây chuyền.
        CONSTRAINT "FK_withdrawals_account_id"
          FOREIGN KEY ("account_id") REFERENCES "accounts" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "FK_withdrawals_bank_account_id"
          FOREIGN KEY ("bank_account_id") REFERENCES "bank_account" ("id")
          ON DELETE SET NULL ON UPDATE CASCADE,
        -- SET NULL: xoá admin không được kéo mất lịch sử duyệt.
        CONSTRAINT "FK_withdrawals_reviewed_by"
          FOREIGN KEY ("reviewed_by") REFERENCES "accounts" ("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    // Bấm rút hai lần cùng key thì lần sau đụng index này thay vì trừ tiền lần nữa.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_withdrawals_account_idempotency"
        ON "withdrawals" ("account_id", "idempotency_key")
    `);
    // Một mã giao dịch ngân hàng không được ghi nhận cho hai lệnh rút.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_withdrawals_bank_transaction_id"
        ON "withdrawals" ("bank_transaction_id")
        WHERE "bank_transaction_id" IS NOT NULL
    `);
    // Người dùng xem lịch sử rút của mình.
    await queryRunner.query(`
      CREATE INDEX "IDX_withdrawals_account_created"
        ON "withdrawals" ("account_id", "created_at" DESC, "id" ASC)
    `);
    // Hàng đợi admin chỉ cần lệnh đang mở; bảng phình theo lịch sử.
    await queryRunner.query(`
      CREATE INDEX "IDX_withdrawals_open_queue"
        ON "withdrawals" ("status", "created_at" ASC)
        WHERE "status" IN (1, 2)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_withdrawals_bank_account_id"
        ON "withdrawals" ("bank_account_id")
        WHERE "bank_account_id" IS NOT NULL
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_withdrawals_bank_account_id"`);
    await queryRunner.query(`DROP INDEX "IDX_withdrawals_open_queue"`);
    await queryRunner.query(`DROP INDEX "IDX_withdrawals_account_created"`);
    await queryRunner.query(`DROP INDEX "UQ_withdrawals_bank_transaction_id"`);
    await queryRunner.query(`DROP INDEX "UQ_withdrawals_account_idempotency"`);
    await queryRunner.query(`DROP TABLE "withdrawals"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
  }
}
