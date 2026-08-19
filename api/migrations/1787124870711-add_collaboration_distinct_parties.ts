import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollaborationDistinctParties1787124870711 implements MigrationInterface {
  name = 'AddCollaborationDistinctParties1787124870711';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Từ khi một account giữ được cả brand_profile lẫn creator_profile, hai
    // cột này trỏ về cùng một account được. Tự hợp tác rồi đặt completed sẽ
    // thổi phồng countSuccessfulCreators và lịch sử giao dịch của chính mình.
    // Lớp cuối: service đã chặn trước, đây là chốt nếu có đường ghi khác.
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        ADD CONSTRAINT "CHK_collaborations_distinct_parties"
        CHECK ("brand_id" <> "creator_id")
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "collaborations"
        DROP CONSTRAINT "CHK_collaborations_distinct_parties"
    `);
  }
}
