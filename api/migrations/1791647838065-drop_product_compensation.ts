import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductCompensation1791647838065 implements MigrationInterface {
  name = 'DropProductCompensation1791647838065';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Campaign PRODUCT đã gửi duyệt/duyệt có thể đã gắn collaboration hoặc nằm
    // trong hàng chờ admin: không tự đổi được, phải xử lý tay trước.
    const [{ n }] = (await queryRunner.query(`
      SELECT count(*)::int AS n FROM "campaigns"
       WHERE "compensation_type" = 'product' AND "status" NOT IN (1, 3, 4)
    `)) as { n: number }[];
    if (n > 0) {
      throw new Error(
        `cannot drop PRODUCT: ${n} submitted/approved campaigns still use it, handle them first`,
      );
    }

    // Nháp, cần sửa, bị từ chối: xoá lựa chọn để brand chọn lại CASH/HYBRID.
    // Tăng version để bản autosave đang mở trên client nhận 409 thay vì ghi đè.
    await queryRunner.query(`
      UPDATE "campaigns"
         SET "compensation_type" = NULL, "version" = "version" + 1
       WHERE "compensation_type" = 'product'
    `);
    await queryRunner.query(`
      ALTER TABLE "campaigns"
        DROP CONSTRAINT "CHK_campaigns_compensation_type",
        ADD CONSTRAINT "CHK_campaigns_compensation_type"
          CHECK ("compensation_type" IS NULL OR "compensation_type" IN ('cash', 'hybrid'))
    `);

    // Một sàn chung cho cả campaign: bỏ sàn riêng của hybrid.
    await queryRunner.query(`
      DELETE FROM "system_configurations" WHERE "key" = 'campaign.cash_floor.hybrid'
    `);
    await queryRunner.query(`
      UPDATE "system_configurations"
         SET "value" = '500000',
             "description" = 'Ngân sách tiền mặt tối thiểu (VND) của một campaign: creator_count × cash_unit_price phải >= giá trị này.'
       WHERE "key" = 'campaign.cash_floor.default'
    `);
  }

  // down không khôi phục được giá trị 'product' đã bị xoá ở up.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "system_configurations"
         SET "description" = 'Sàn tiền mặt mỗi slot (VND) khi compensation_type = cash. TẠM, chờ Product chốt.'
       WHERE "key" = 'campaign.cash_floor.default'
    `);
    await queryRunner.query(`
      INSERT INTO "system_configurations" ("key", "value", "type", "group", "description")
      VALUES (
        'campaign.cash_floor.hybrid', '200000', 2, 'campaign',
        'Sàn riêng cho hybrid: đã có phần sản phẩm nên phần tiền mặt được thấp hơn. TẠM, chờ Product chốt.'
      )
      ON CONFLICT ("key") DO NOTHING
    `);
    await queryRunner.query(`
      ALTER TABLE "campaigns"
        DROP CONSTRAINT "CHK_campaigns_compensation_type",
        ADD CONSTRAINT "CHK_campaigns_compensation_type"
          CHECK ("compensation_type" IS NULL OR "compensation_type" IN ('cash', 'product', 'hybrid'))
    `);
  }
}
