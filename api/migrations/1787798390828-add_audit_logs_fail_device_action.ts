import { MigrationInterface, QueryRunner } from 'typeorm';

const LOGIN_WITH = `'fail_credentials', 'fail_ip', 'fail_otp', 'fail_locked', 'fail_device', 'otp_sent', 'logout'`;
const LOGIN_WITHOUT = `'fail_credentials', 'fail_ip', 'fail_otp', 'fail_locked', 'otp_sent', 'logout'`;
const ALL_WITH = `${LOGIN_WITH}, 'create', 'update', 'delete', 'approve', 'reject'`;
const ALL_WITHOUT = `${LOGIN_WITHOUT}, 'create', 'update', 'delete', 'approve', 'reject'`;

export class AddAuditLogsFailDeviceAction1787798390828 implements MigrationInterface {
  name = 'AddAuditLogsFailDeviceAction1787798390828';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "CHK_audit_logs_action"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "CHK_audit_logs_action"
         CHECK ("action" IN (${ALL_WITH}))`,
    );

    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "CHK_audit_logs_action_matches_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "CHK_audit_logs_action_matches_category"
         CHECK (
           ("category" = 'login'    AND "action" IN (${LOGIN_WITH}))
           OR ("category" = 'audit'    AND "action" IN ('create', 'update', 'delete'))
           OR ("category" = 'approval' AND "action" IN ('approve', 'reject'))
         )`,
    );
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dòng action='fail_device' đã ghi sẽ chặn ADD CONSTRAINT. Cố ý: rollback
    // dừng lại cho người nhìn thay vì tự xoá bản ghi audit.
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "CHK_audit_logs_action_matches_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "CHK_audit_logs_action_matches_category"
         CHECK (
           ("category" = 'login'    AND "action" IN (${LOGIN_WITHOUT}))
           OR ("category" = 'audit'    AND "action" IN ('create', 'update', 'delete'))
           OR ("category" = 'approval' AND "action" IN ('approve', 'reject'))
         )`,
    );

    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "CHK_audit_logs_action"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "CHK_audit_logs_action"
         CHECK ("action" IN (${ALL_WITHOUT}))`,
    );
  }
}
