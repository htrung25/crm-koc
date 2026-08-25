import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLoginFailedSessionEvent1787546593794 implements MigrationInterface {
  name = 'DropLoginFailedSessionEvent1787546593794';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "session_events"
        DROP CONSTRAINT "CHK_session_events_event_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_events"
        ADD CONSTRAINT "CHK_session_events_event_type"
          CHECK ("event_type" IN (
            'login',
            'refresh',
            'logout',
            'logout_all',
            'revoked_reuse',
            'revoked_by_admin',
            'evicted'
          ))
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "session_events"
        DROP CONSTRAINT "CHK_session_events_event_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_events"
        ADD CONSTRAINT "CHK_session_events_event_type"
          CHECK ("event_type" IN (
            'login',
            'login_failed',
            'refresh',
            'logout',
            'logout_all',
            'revoked_reuse',
            'revoked_by_admin',
            'evicted'
          ))
    `);
  }
}
