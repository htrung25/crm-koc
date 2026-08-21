import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemConfigurations1787299518340 implements MigrationInterface {
  name = 'CreateSystemConfigurations1787299518340';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "system_configurations" (
        -- key là khoá chính tự nhiên: ON CONFLICT (key) của updateMany cần nó,
        -- và không có id thay thế nào có nghĩa hơn.
        "key"         varchar(128) NOT NULL,
        -- Luôn là text; cột type bên dưới mới cho biết cách đọc.
        "value"       text         NOT NULL,
        "type"        smallint     NOT NULL,
        "group"       varchar(64)  NOT NULL,
        "description" text,
        -- Ai sửa lần cuối. SET NULL để xoá admin không kéo theo mất cấu hình.
        "updated_by"  uuid,
        "created_at"  timestamptz  NOT NULL DEFAULT now(),
        "updated_at"  timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_configurations_key" PRIMARY KEY ("key"),
        CONSTRAINT "CHK_system_configurations_type" CHECK ("type" IN (1, 2, 3, 4)),
        CONSTRAINT "FK_system_configurations_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "accounts" ("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    // getByGroup chạy trên MỌI request qua AdminMaintenanceInterceptor.
    await queryRunner.query(`
      CREATE INDEX "IDX_system_configurations_group"
        ON "system_configurations" ("group")
    `);

    // Gieo sẵn cờ bảo trì: thiếu dòng này thì interceptor rơi vào nhánh mặc
    // định và không ai bật/tắt bảo trì được qua API.
    await queryRunner.query(`
      INSERT INTO "system_configurations" ("key", "value", "type", "group", "description")
      VALUES (
        'ENV_SYSTEM_ACTIVE', 'true', 3, 'environment',
        'false = toàn hệ thống vào chế độ bảo trì, chỉ admin thao tác được'
      )
    `);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_system_configurations_group"`);
    await queryRunner.query(`DROP TABLE "system_configurations"`);
  }
}
