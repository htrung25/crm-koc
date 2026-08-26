import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogsTrgmSearch1787732352839 implements MigrationInterface {
  name = 'AddAuditLogsTrgmSearch1787732352839';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_search"
        ON "audit_logs" USING gin (
          (
            "category" || ' ' || "action" || ' ' ||
            coalesce("email_attempted", '') || ' ' ||
            coalesce("ip_address", '') || ' ' ||
            coalesce("resource_type", '') || ' ' ||
            coalesce("resource_id", '')
          ) gin_trgm_ops
        )
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_search"`);
    // KHÔNG drop extension: schema khác có thể đang dùng pg_trgm.
  }
}
