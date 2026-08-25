import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1787543564884 implements MigrationInterface {
  name = 'CreateAuditLogs1787543564884';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // audit_logs: nhật ký append-only, cùng họ với session_events nhưng rộng
    // hơn — ghi cả thao tác nghiệp vụ, không chỉ sự kiện phiên. Không có
    // updated_at vì bản ghi không bao giờ bị sửa.
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"              uuid         NOT NULL DEFAULT uuidv7(),
        "category"        varchar(20)  NOT NULL,
        "action"          varchar(30)  NOT NULL,
        -- nullable: login thất bại chưa xác định được account
        "account_id"      uuid,
        -- email người dùng gõ vào khi login hỏng, kể cả email không tồn tại
        "email_attempted" varchar(254),
        -- 45 ký tự đủ cho IPv6 dạng dài nhất kèm IPv4-mapped, giống
        -- session_events. KHÔNG dùng inet: giá trị đến từ X-Forwarded-For
        -- có thể là chuỗi nhiều IP và sẽ làm 22P02 đúng lúc cần ghi log nhất.
        "ip_address"      varchar(45),
        "user_agent"      text,
        -- nullable: sự kiện login không tác động lên tài nguyên nào
        "resource_type"   varchar(32),
        "resource_id"     varchar(64),
        "business_code"   int,
        "metadata"        jsonb,
        "created_at"      timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_audit_logs_category"
          CHECK ("category" IN ('login', 'audit', 'approval')),
        CONSTRAINT "CHK_audit_logs_action"
          CHECK ("action" IN (
            'fail_credentials',
            'fail_ip',
            'fail_otp',
            'fail_locked',
            'otp_sent',
            'create',
            'update',
            'delete',
            'approve',
            'reject'
          )),
        -- EAuditLogAction đã tự chia nhóm theo category trong comment; ràng ở
        -- đây để cặp lệch nhau không lọt xuống bảng.
        CONSTRAINT "CHK_audit_logs_action_matches_category"
          CHECK (
            ("category" = 'login'    AND "action" IN ('fail_credentials', 'fail_ip', 'fail_otp', 'fail_locked', 'otp_sent'))
            OR ("category" = 'audit'    AND "action" IN ('create', 'update', 'delete'))
            OR ("category" = 'approval' AND "action" IN ('approve', 'reject'))
          ),
        -- resource_id không đứng một mình được: có id thì phải biết id của cái gì
        CONSTRAINT "CHK_audit_logs_resource_pair"
          CHECK ("resource_id" IS NULL OR "resource_type" IS NOT NULL)
      )
    `);

    // Cố ý KHÔNG đặt khoá ngoại tới accounts: log điều tra phải sống sót kể
    // cả khi account bị xoá, và account_id có thể null.

    // Truy vấn phổ biến nhất: lịch sử của một account, mới nhất trước
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_account_created"
        ON "audit_logs" ("account_id", "created_at" DESC)
    `);

    // Màn hình audit lọc theo nhóm rồi cuộn theo thời gian
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_category_created"
        ON "audit_logs" ("category", "created_at" DESC)
    `);

    // "Ai đã đụng vào bản ghi X". Partial vì đa số dòng login không có resource.
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_resource"
        ON "audit_logs" ("resource_type", "resource_id", "created_at" DESC)
        WHERE "resource_id" IS NOT NULL
    `);

    // Điều tra dò mật khẩu theo email, kể cả email chưa từng tồn tại nên
    // không join được sang accounts. Partial vì chỉ login hỏng mới ghi cột này.
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_email_attempted"
        ON "audit_logs" ("email_attempted", "created_at" DESC)
        WHERE "email_attempted" IS NOT NULL
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_audit_logs_email_attempted"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_resource"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_audit_logs_category_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_audit_logs_account_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
