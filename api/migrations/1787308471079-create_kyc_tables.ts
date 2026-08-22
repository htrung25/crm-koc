import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKycTables1787308471079 implements MigrationInterface {
  name = 'CreateKycTables1787308471079';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "kyc_submissions" (
        "id"            uuid        NOT NULL DEFAULT uuidv7(),
        "account_id"    uuid        NOT NULL,
        -- Admin không nộp KYC. Một account giữ được cả hai hồ sơ nên trạng
        -- thái phải khoá theo (account, vai trò), không phải theo account.
        "role"          varchar(32) NOT NULL,
        "status"        smallint    NOT NULL DEFAULT 1,
        "attempt_no"    smallint    NOT NULL DEFAULT 1,
        -- Chỗ móc sẵn cho module rút tiền; hiện luôn false.
        "priority"      boolean     NOT NULL DEFAULT false,
        "submitted_at"  timestamptz,
        "reviewed_at"   timestamptz,
        "reviewed_by"   uuid,
        "reject_reason" smallint,
        "review_note"   text,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kyc_submissions_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_kyc_submissions_role"
          CHECK ("role" IN ('brand', 'creator')),
        CONSTRAINT "CHK_kyc_submissions_status"
          CHECK ("status" IN (1, 2, 3, 4, 5, 6)),
        CONSTRAINT "CHK_kyc_submissions_attempt"
          CHECK ("attempt_no" BETWEEN 1 AND 3),
        CONSTRAINT "CHK_kyc_submissions_reject_reason"
          CHECK ("reject_reason" IS NULL OR "reject_reason" IN (1, 2, 3, 4, 5)),
        -- Chọn "khác" mà không giải thích thì người dùng không biết sửa gì,
        -- và lượt nộp lại kế tiếp cũng hỏng.
        CONSTRAINT "CHK_kyc_submissions_other_needs_note"
          CHECK ("reject_reason" <> 5 OR "review_note" IS NOT NULL),
        CONSTRAINT "FK_kyc_submissions_account_id"
          FOREIGN KEY ("account_id") REFERENCES "accounts" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        -- SET NULL: xoá admin không được kéo mất lịch sử duyệt.
        CONSTRAINT "FK_kyc_submissions_reviewed_by"
          FOREIGN KEY ("reviewed_by") REFERENCES "accounts" ("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    // Mỗi cặp (account, vai trò) chỉ được có MỘT hồ sơ đang mở. Thiếu ràng
    // buộc này thì bấm nộp hai lần là hai hồ sơ cùng vào hàng đợi, hai admin
    // duyệt song song ra hai kết quả khác nhau.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_kyc_submissions_open_per_role"
        ON "kyc_submissions" ("account_id", "role")
        WHERE "status" IN (1, 2, 3)
    `);

    // Hàng đợi chỉ quan tâm hồ sơ PENDING; bảng phình theo lịch sử nên đừng
    // đánh index cả những dòng đã xử lý xong.
    await queryRunner.query(`
      CREATE INDEX "IDX_kyc_submissions_queue"
        ON "kyc_submissions" ("priority" DESC, "submitted_at" ASC)
        WHERE "status" = 2
    `);

    await queryRunner.query(`
      CREATE TABLE "kyc_documents" (
        "id"            uuid         NOT NULL DEFAULT uuidv7(),
        "submission_id" uuid         NOT NULL,
        "doc_type"      smallint     NOT NULL,
        -- Khoá trong R2, sinh ngẫu nhiên: không đoán được từ id hồ sơ.
        "storage_key"   text         NOT NULL,
        -- Tên người dùng đặt, CHỈ để hiển thị. Không bao giờ dùng làm đường dẫn.
        "original_name" varchar(255),
        -- Lấy từ magic bytes, không tin đuôi tên lẫn Content-Type của client.
        "mime_type"     varchar(64)  NOT NULL,
        "size_bytes"    integer      NOT NULL,
        "checksum"      char(64),
        -- Xoá mềm khi tới hạn lưu trữ: nội dung đi, metadata ở lại.
        "deleted_at"    timestamptz,
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kyc_documents_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_kyc_documents_doc_type"
          CHECK ("doc_type" IN (1, 2, 3, 4, 5)),
        CONSTRAINT "CHK_kyc_documents_size" CHECK ("size_bytes" > 0),
        CONSTRAINT "UQ_kyc_documents_submission_type"
          UNIQUE ("submission_id", "doc_type"),
        CONSTRAINT "FK_kyc_documents_submission_id"
          FOREIGN KEY ("submission_id") REFERENCES "kyc_submissions" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Bảng audit: KHÔNG có FK nào. Log kiểm toán phải sống sót khi tài khoản
    // bị xoá và khi tài liệu bị xoá theo chính sách lưu trữ — cùng lý do
    // session_events không có FK tới accounts.
    await queryRunner.query(`
      CREATE TABLE "kyc_document_views" (
        "id"            bigserial    NOT NULL,
        "document_id"   uuid         NOT NULL,
        "submission_id" uuid         NOT NULL,
        "viewed_by"     uuid         NOT NULL,
        "viewed_at"     timestamptz  NOT NULL DEFAULT now(),
        "ip_address"    varchar(45),
        "user_agent"    text,
        CONSTRAINT "PK_kyc_document_views_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_kyc_document_views_document_id"
        ON "kyc_document_views" ("document_id")
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_kyc_document_views_document_id"`);
    await queryRunner.query(`DROP TABLE "kyc_document_views"`);
    await queryRunner.query(`DROP TABLE "kyc_documents"`);
    await queryRunner.query(`DROP INDEX "IDX_kyc_submissions_queue"`);
    await queryRunner.query(`DROP INDEX "UQ_kyc_submissions_open_per_role"`);
    await queryRunner.query(`DROP TABLE "kyc_submissions"`);
  }
}
