import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessionEvents1785603284060 implements MigrationInterface {
  name = 'CreateSessionEvents1785603284060';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "session_events" (
        "id"          bigint       GENERATED ALWAYS AS IDENTITY,
        -- nullable: sự kiện login_failed có thể chưa xác định được account
        "account_id"  uuid,
        -- trỏ tới phiên trong Redis, KHÔNG đặt FK vì Redis mới là nguồn
        "session_id"  uuid,
        "event_type"  varchar(32)  NOT NULL,
        -- 45 ký tự đủ cho IPv6 dạng dài nhất kèm IPv4-mapped
        "ip_address"  varchar(45),
        "user_agent"  text,
        "metadata"    jsonb,
        "created_at"  timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_session_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_session_events_event_type"
          CHECK ("event_type" IN (
            'login',
            'login_failed',
            'refresh',
            'logout',
            'logout_all',
            'revoked_reuse',
            'revoked_by_admin'
          ))
      )
    `);

    // Cố ý KHÔNG đặt khoá ngoại tới accounts: log điều tra phải sống sót kể
    // cả khi account bị xoá, và account_id có thể null.

    // Truy vấn phổ biến: lần theo lịch sử của một account, mới nhất trước
    await queryRunner.query(`
      CREATE INDEX "IDX_session_events_account_created"
        ON "session_events" ("account_id", "created_at" DESC)
    `);

    // Lần theo toàn bộ sự kiện của một phiên cụ thể
    await queryRunner.query(`
      CREATE INDEX "IDX_session_events_session"
        ON "session_events" ("session_id")
    `);

    // Lọc theo loại sự kiện, ví dụ tìm mọi revoked_reuse gần đây
    await queryRunner.query(`
      CREATE INDEX "IDX_session_events_type_created"
        ON "session_events" ("event_type", "created_at" DESC)
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_session_events_type_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_session_events_session"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_session_events_account_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "session_events"`);
  }
}
