import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeposits1791462500929 implements MigrationInterface {
  name = 'CreateDeposits1791462500929';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "deposits" (
        "id"                      uuid          NOT NULL DEFAULT uuidv7(),
        "account_id"              uuid          NOT NULL,
        -- 1 sepay (chuyển khoản QR), 2 vnpay, 3 momo
        "method"                  smallint      NOT NULL,
        -- Số tiền user yêu cầu nạp, dùng để dựng QR.
        "amount"                  numeric(15,2) NOT NULL,
        -- Số tiền ngân hàng/cổng báo thực nhận; đây mới là số được cộng vào ví.
        "paid_amount"             numeric(15,2),
        -- 1 pending, 2 completed
        "status"                  smallint      NOT NULL DEFAULT 1,
        -- Nội dung chuyển khoản, khớp lệnh nạp với giao dịch ngân hàng.
        "payment_code"            varchar(32)   NOT NULL,
        "provider_transaction_id" varchar(128),
        -- Payload gốc của webhook/IPN để đối soát khi có tranh chấp.
        "provider_payload"        jsonb,
        "completed_at"            timestamptz,
        "created_at"              timestamptz   NOT NULL DEFAULT now(),
        "updated_at"              timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_deposits_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_deposits_payment_code" UNIQUE ("payment_code"),
        CONSTRAINT "CHK_deposits_method" CHECK ("method" IN (1, 2, 3)),
        CONSTRAINT "CHK_deposits_status" CHECK ("status" IN (1, 2)),
        CONSTRAINT "CHK_deposits_amount" CHECK ("amount" > 0),
        CONSTRAINT "CHK_deposits_paid_amount"
          CHECK ("paid_amount" IS NULL OR "paid_amount" > 0),
        CONSTRAINT "CHK_deposits_completed"
          CHECK (("status" = 2) = ("completed_at" IS NOT NULL AND "paid_amount" IS NOT NULL)),
        CONSTRAINT "FK_deposits_account_id"
          FOREIGN KEY ("account_id") REFERENCES "accounts" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Webhook retry gửi lại cùng id giao dịch: không được ghi nhận hai lần.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_deposits_provider_transaction"
        ON "deposits" ("method", "provider_transaction_id")
        WHERE "provider_transaction_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_deposits_account_created"
        ON "deposits" ("account_id", "created_at" DESC, "id" ASC)
    `);

    // Ledger thêm nguồn thứ ba: nạp tiền.
    await queryRunner.query(`
      ALTER TABLE "wallet_transactions"
        ADD COLUMN "deposit_id" uuid,
        ADD CONSTRAINT "FK_wallet_transactions_deposit_id"
          FOREIGN KEY ("deposit_id") REFERENCES "deposits" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        DROP CONSTRAINT "CHK_wallet_transactions_one_source",
        ADD CONSTRAINT "CHK_wallet_transactions_one_source"
          CHECK (num_nonnulls("collaboration_id", "withdrawal_id", "deposit_id") = 1),
        -- Nạp tiền là tiền vào và đã về tài khoản thật khi ghi nhận.
        ADD CONSTRAINT "CHK_wallet_transactions_deposit"
          CHECK ("deposit_id" IS NULL OR ("amount" > 0 AND "status" = 2))
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_wallet_transactions_deposit"
        ON "wallet_transactions" ("deposit_id")
        WHERE "deposit_id" IS NOT NULL
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Không xoá chứng từ tiền để rollback: ví sẽ lệch ledger mà không ai biết.
    const [{ n }] = (await queryRunner.query(
      `SELECT count(*)::int AS n FROM "wallet_transactions" WHERE "deposit_id" IS NOT NULL`,
    )) as { n: number }[];
    if (n > 0) {
      throw new Error(
        `cannot revert: ${n} deposit ledger rows exist, reconcile them first`,
      );
    }
    await queryRunner.query(`DROP INDEX "UQ_wallet_transactions_deposit"`);
    await queryRunner.query(`
      ALTER TABLE "wallet_transactions"
        DROP CONSTRAINT "CHK_wallet_transactions_deposit",
        DROP CONSTRAINT "CHK_wallet_transactions_one_source",
        ADD CONSTRAINT "CHK_wallet_transactions_one_source"
          CHECK (("collaboration_id" IS NOT NULL) <> ("withdrawal_id" IS NOT NULL)),
        DROP CONSTRAINT "FK_wallet_transactions_deposit_id",
        DROP COLUMN "deposit_id"
    `);
    await queryRunner.query(`DROP INDEX "IDX_deposits_account_created"`);
    await queryRunner.query(`DROP INDEX "UQ_deposits_provider_transaction"`);
    await queryRunner.query(`DROP TABLE "deposits"`);
  }
}
