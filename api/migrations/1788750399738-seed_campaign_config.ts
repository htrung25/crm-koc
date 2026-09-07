import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCampaignConfig1788750399738 implements MigrationInterface {
  name = 'SeedCampaignConfig1788750399738';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "system_configurations" ("key", "value", "type", "group", "description")
      VALUES
        (
          'campaign.cash_floor.default', '500000', 2, 'campaign',
          'Sàn tiền mặt mỗi slot (VND) khi compensation_type = cash. TẠM, chờ Product chốt.'
        ),
        (
          'campaign.cash_floor.hybrid', '200000', 2, 'campaign',
          'Sàn riêng cho hybrid: đã có phần sản phẩm nên phần tiền mặt được thấp hơn. TẠM, chờ Product chốt.'
        ),
        (
          'campaign.max_product_images', '10', 2, 'campaign',
          'Số ảnh sản phẩm tối đa khi gửi duyệt'
        ),
        (
          'campaign.asset_max_bytes', '5242880', 2, 'campaign',
          'Dung lượng tối đa mỗi file đính kèm campaign (5MB)'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "system_configurations" WHERE "group" = 'campaign'
    `);
  }
}
