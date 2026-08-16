import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm 'evicted' vào CHECK của session_events.event_type.
 * Thiếu migration này thì SessionEventService.record() nuốt lỗi 23514 và sự
 * kiện biến mất lặng lẽ — nó có try/catch chỉ ghi log.
 */
export class AddEvictedSessionEvent1786903948300 implements MigrationInterface {
  name = 'AddEvictedSessionEvent1786903948300';

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Phải dọn dữ liệu trước, nếu không ADD CONSTRAINT sẽ bị chính các dòng
    // 'evicted' đang tồn tại chặn lại.
    await queryRunner.query(
      `DELETE FROM "session_events" WHERE "event_type" = 'evicted'`,
    );
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
          'revoked_by_admin'
        ))
    `);
  }
}
