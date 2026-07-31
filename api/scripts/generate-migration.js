const fs = require('node:fs');
const path = require('node:path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

function toSnakeCase(input) {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
}

function toPascalCase(snake) {
  return snake
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function main() {
  const raw = process.argv[2];

  if (!raw) {
    console.error('Thiếu tên migration.\n');
    console.error('  node scripts/generate-migration.js create_campaigns');
    process.exit(1);
  }

  const snake = toSnakeCase(raw);
  if (!snake) {
    console.error(`Tên không hợp lệ sau khi chuẩn hoá: "${raw}"`);
    process.exit(1);
  }

  const timestamp = Date.now();
  const className = `${toPascalCase(snake)}${timestamp}`;
  const fileName = `${timestamp}-${snake}.ts`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);

  // Trùng tên class làm TypeORM nhận nhầm migration đã chạy
  const existing = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(`-${snake}.ts`));
  if (existing.length) {
    console.error(`Đã có migration cùng tên: ${existing.join(', ')}`);
    process.exit(1);
  }

  const template = `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${className} implements MigrationInterface {
  name = '${className}';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`
      -- TODO: viết SQL ở đây
    \`);
  }

  // down phải đảo ngược đúng thứ tự của up: xoá index/constraint trước, bảng sau
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`
      -- TODO: viết SQL rollback ở đây
    \`);
  }
}
`;

  fs.writeFileSync(filePath, template);
  console.log(`Đã tạo migrations/${fileName}`);
  console.log(`Class: ${className}`);
}

main();
