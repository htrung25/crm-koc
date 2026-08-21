import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeCollaborationStatusToSmallint1787277968190 implements MigrationInterface {
  name = 'ChangeCollaborationStatusToSmallint1787277968190';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // CHECK cũ so chuỗi nên phải gỡ TRƯỚC khi đổi kiểu cột, không thì
    // ALTER TYPE fail vì biểu thức không còn hợp lệ.
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        DROP CONSTRAINT "CHK_collaborations_status"
    `);
    // Default cũ là chuỗi 'pending', giữ lại thì ALTER TYPE cũng fail.
    await queryRunner.query(`
      ALTER TABLE "collaborations" ALTER COLUMN "status" DROP DEFAULT
    `);

    // USING để dòng cũ (nếu có) được ánh xạ sang giá trị số tương ứng.
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ALTER COLUMN "status" TYPE smallint
        USING CASE "status"
          WHEN 'pending'   THEN 1
          WHEN 'active'    THEN 2
          WHEN 'completed' THEN 3
          WHEN 'cancelled' THEN 4
          WHEN 'disputed'  THEN 5
        END
    `);

    await queryRunner.query(`
      ALTER TABLE "collaborations" ALTER COLUMN "status" SET DEFAULT 1
    `);
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ADD CONSTRAINT "CHK_collaborations_status"
        CHECK ("status" IN (1, 2, 3, 4, 5))
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        DROP CONSTRAINT "CHK_collaborations_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "collaborations" ALTER COLUMN "status" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ALTER COLUMN "status" TYPE varchar(32)
        USING CASE "status"
          WHEN 1 THEN 'pending'
          WHEN 2 THEN 'active'
          WHEN 3 THEN 'completed'
          WHEN 4 THEN 'cancelled'
          WHEN 5 THEN 'disputed'
        END
    `);
    await queryRunner.query(`
      ALTER TABLE "collaborations" ALTER COLUMN "status" SET DEFAULT 'pending'
    `);
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ADD CONSTRAINT "CHK_collaborations_status"
        CHECK ("status" IN ('pending', 'active', 'completed', 'cancelled', 'disputed'))
    `);
  }
}
