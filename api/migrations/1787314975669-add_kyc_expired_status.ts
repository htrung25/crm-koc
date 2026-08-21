import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycExpiredStatus1787314975669 implements MigrationInterface {
  name = 'AddKycExpiredStatus1787314975669';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // VERIFIED không phải trạng thái cuối: giấy tờ có hạn, và gian lận có thể
    // lộ ra sau khi đã duyệt. Thiếu EXPIRED thì không có đường thu hồi.
    await queryRunner.query(`
      ALTER TABLE "kyc_submissions"
        DROP CONSTRAINT "CHK_kyc_submissions_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "kyc_submissions"
        ADD CONSTRAINT "CHK_kyc_submissions_status"
        CHECK ("status" IN (1, 2, 3, 4, 5, 6, 7))
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dòng đang EXPIRED không có chỗ trong tập cũ: đưa về REJECTED, sát nghĩa
    // nhất (đã duyệt hụt, cần làm lại).
    await queryRunner.query(
      `UPDATE "kyc_submissions" SET "status" = 5 WHERE "status" = 7`,
    );
    await queryRunner.query(`
      ALTER TABLE "kyc_submissions"
        DROP CONSTRAINT "CHK_kyc_submissions_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "kyc_submissions"
        ADD CONSTRAINT "CHK_kyc_submissions_status"
        CHECK ("status" IN (1, 2, 3, 4, 5, 6))
    `);
  }
}
