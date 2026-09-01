import { MigrationInterface, QueryRunner } from 'typeorm';

const ACTIONS_WITH_LOGOUT = `'fail_credentials', 'fail_ip', 'fail_otp', 'fail_locked', 'otp_sent', 'logout', 'create', 'update', 'delete', 'approve', 'reject'`;
const ACTIONS_WITHOUT_LOGOUT = `'fail_credentials', 'fail_ip', 'fail_otp', 'fail_locked', 'otp_sent', 'create', 'update', 'delete', 'approve', 'reject'`;
const LOGIN_WITH_LOGOUT = `'fail_credentials', 'fail_ip', 'fail_otp', 'fail_locked', 'otp_sent', 'logout'`;
const LOGIN_WITHOUT_LOGOUT = `'fail_credentials', 'fail_ip', 'fail_otp', 'fail_locked', 'otp_sent'`;

export class AddAuditLogsLogoutAction1787734455046 implements MigrationInterface {
  name = 'AddAuditLogsLogoutAction1787734455046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ELoginAction.LOGOUT đã có trong enum nhưng CHECK chưa biết tới nó: mọi
    // lần ghi sẽ ném 23514, mà write() nuốt lỗi nên hỏng hoàn toàn im lặng.
    await queryRunner.query(`
      ALTER TABLE "audit_logs" DROP CONSTRAINT "CHK_audit_logs_action"`);
    await queryRunner.query(`
      ALTER TABLE "audit_logs" ADD CONSTRAINT "CHK_audit_logs_action"
        CHECK ("action" IN (${ACTIONS_WITH_LOGOUT}))`);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
        DROP CONSTRAINT "CHK_audit_logs_action_matches_category"`);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
        ADD CONSTRAINT "CHK_audit_logs_action_matches_category"
          CHECK (
            ("category" = 'login'    AND "action" IN (${LOGIN_WITH_LOGOUT}))
            OR ("category" = 'audit'    AND "action" IN ('create', 'update', 'delete'))
            OR ("category" = 'approval' AND "action" IN ('approve', 'reject'))
          )`);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dòng action='logout' đã ghi sẽ chặn ADD CONSTRAINT bên dưới. Cố ý: rollback
    // phải dừng lại cho người nhìn, không tự xoá bản ghi audit.
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
        DROP CONSTRAINT "CHK_audit_logs_action_matches_category"`);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
        ADD CONSTRAINT "CHK_audit_logs_action_matches_category"
          CHECK (
            ("category" = 'login'    AND "action" IN (${LOGIN_WITHOUT_LOGOUT}))
            OR ("category" = 'audit'    AND "action" IN ('create', 'update', 'delete'))
            OR ("category" = 'approval' AND "action" IN ('approve', 'reject'))
          )`);

    await queryRunner.query(`
      ALTER TABLE "audit_logs" DROP CONSTRAINT "CHK_audit_logs_action"`);
    await queryRunner.query(`
      ALTER TABLE "audit_logs" ADD CONSTRAINT "CHK_audit_logs_action"
        CHECK ("action" IN (${ACTIONS_WITHOUT_LOGOUT}))`);
  }
}
