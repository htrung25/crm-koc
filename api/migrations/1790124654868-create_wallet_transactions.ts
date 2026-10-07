import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWalletTransactions1790124654868 implements MigrationInterface {
  name = 'CreateWalletTransactions1790124654868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wallet_transactions" (
        "id"               uuid          NOT NULL DEFAULT uuidv7(),
        "wallet_id"        uuid          NOT NULL,
        "amount"           numeric(15,2) NOT NULL,
        "status"           smallint      NOT NULL DEFAULT 1,
        "collaboration_id" uuid,
        "withdrawal_id"    uuid,
        "description"      text,
        "completed_at"     timestamptz,
        "created_at"       timestamptz   NOT NULL DEFAULT now(),
        "updated_at"       timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallet_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_wallet_transactions_status"
          CHECK ("status" IN (1, 2, 3)),
        CONSTRAINT "CHK_wallet_transactions_amount"
          CHECK ("amount" <> 0),
        CONSTRAINT "CHK_wallet_transactions_one_source"
          CHECK (("collaboration_id" IS NOT NULL) <> ("withdrawal_id" IS NOT NULL)),
        CONSTRAINT "CHK_wallet_transactions_earning"
          CHECK ("collaboration_id" IS NULL OR ("amount" > 0 AND "status" = 2)),
        CONSTRAINT "CHK_wallet_transactions_withdrawal_sign"
          CHECK ("withdrawal_id" IS NULL OR "amount" < 0),
        CONSTRAINT "CHK_wallet_transactions_completed_at"
          CHECK (("status" = 2) = ("completed_at" IS NOT NULL)),
        -- RESTRICT: sổ cái không được xoá dây chuyền theo ví hay lệnh rút.
        CONSTRAINT "FK_wallet_transactions_wallet_id"
          FOREIGN KEY ("wallet_id") REFERENCES "wallets" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "FK_wallet_transactions_collaboration_id"
          FOREIGN KEY ("collaboration_id") REFERENCES "collaborations" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "FK_wallet_transactions_withdrawal_id"
          FOREIGN KEY ("withdrawal_id") REFERENCES "withdrawals" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Một hợp tác chỉ được cộng tiền đúng một lần, kể cả khi API bị gọi lại.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_wallet_transactions_collaboration"
        ON "wallet_transactions" ("collaboration_id")
        WHERE "collaboration_id" IS NOT NULL
    `);
    // Một lệnh rút chỉ có một dòng ledger; hoàn tiền là đổi status của chính
    // dòng này sang 3, không thêm dòng mới.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_wallet_transactions_withdrawal"
        ON "wallet_transactions" ("withdrawal_id")
        WHERE "withdrawal_id" IS NOT NULL
    `);
    // Sao kê ví.
    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_transactions_wallet_created"
        ON "wallet_transactions" ("wallet_id", "created_at" DESC, "id" ASC)
    `);
    // Đối soát locked_balance: chỉ các dòng rút còn treo mới phải quét.
    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_transactions_pending"
        ON "wallet_transactions" ("wallet_id")
        WHERE "status" = 1
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_wallet_transactions_pending"`);
    await queryRunner.query(
      `DROP INDEX "IDX_wallet_transactions_wallet_created"`,
    );
    await queryRunner.query(`DROP INDEX "UQ_wallet_transactions_withdrawal"`);
    await queryRunner.query(
      `DROP INDEX "UQ_wallet_transactions_collaboration"`,
    );
    await queryRunner.query(`DROP TABLE "wallet_transactions"`);
  }
}
