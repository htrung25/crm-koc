import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollaborationSubmittedStatus1787283534526 implements MigrationInterface {
  name = 'AddCollaborationSubmittedStatus1787283534526';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SUBMITTED chen vào giữa nên COMPLETED/CANCELLED/DISPUTED bị đẩy lên 1.
    // Nới CHECK trước, không thì bước dời dữ liệu bên dưới vi phạm ràng buộc.
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        DROP CONSTRAINT "CHK_collaborations_status"
    `);

    // Dời TỪ LỚN XUỐNG NHỎ. Làm ngược lại thì 3->4 xong 4->5 sẽ dời tiếp
    // đúng những dòng vừa đổi, đẩy completed thành cancelled.
    await queryRunner.query(
      `UPDATE "collaborations" SET "status" = 6 WHERE "status" = 5`,
    );
    await queryRunner.query(
      `UPDATE "collaborations" SET "status" = 5 WHERE "status" = 4`,
    );
    await queryRunner.query(
      `UPDATE "collaborations" SET "status" = 4 WHERE "status" = 3`,
    );

    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ADD CONSTRAINT "CHK_collaborations_status"
        CHECK ("status" IN (1, 2, 3, 4, 5, 6))
    `);

    // Mốc creator nộp bài, cùng bộ với started_at/completed_at/cancelled_at.
    await queryRunner.query(`
      ALTER TABLE "collaborations" ADD COLUMN "submitted_at" timestamptz
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "collaborations" DROP COLUMN "submitted_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        DROP CONSTRAINT "CHK_collaborations_status"
    `);

    // Dòng đang ở SUBMITTED không có chỗ trong enum cũ: đưa về ACTIVE, sát
    // nghĩa nhất (đã nhận việc, chưa được duyệt).
    await queryRunner.query(
      `UPDATE "collaborations" SET "status" = 2 WHERE "status" = 3`,
    );
    // Lần này dời TỪ NHỎ LÊN LỚN, vì đang kéo ngược xuống.
    await queryRunner.query(
      `UPDATE "collaborations" SET "status" = 3 WHERE "status" = 4`,
    );
    await queryRunner.query(
      `UPDATE "collaborations" SET "status" = 4 WHERE "status" = 5`,
    );
    await queryRunner.query(
      `UPDATE "collaborations" SET "status" = 5 WHERE "status" = 6`,
    );

    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ADD CONSTRAINT "CHK_collaborations_status"
        CHECK ("status" IN (1, 2, 3, 4, 5))
    `);
  }
}
