import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedWithdrawalConfig1790187387411 implements MigrationInterface {
  name = 'SeedWithdrawalConfig1790187387411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "system_configurations" ("key", "value", "type", "group", "description")
      VALUES
        (
          'withdrawal.fee_percent', '10', 2, 'withdrawal',
          'Phí rút tiền (%) trên số tiền yêu cầu. Chốt vào withdrawals.fee lúc tạo lệnh, đổi không ảnh hưởng lệnh cũ.'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "system_configurations" WHERE "group" = 'withdrawal'
    `);
  }
}
