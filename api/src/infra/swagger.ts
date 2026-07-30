import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const SWAGGER_PATH = 'api/docs';
const OPENAPI_FILE = join(process.cwd(), 'swagger', 'openapi.json');

export function setupSwagger(app: INestApplication): void {
  const logger = new Logger('Swagger');

  const config = new DocumentBuilder()
    .setTitle('CRM KOC API')
    .setDescription('API cho hệ thống CRM KOC')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    // giữ token sau khi reload trang
    swaggerOptions: { persistAuthorization: true },
  });

  // Ghi spec ra file để commit / import vào Postman. Chỉ làm ngoài production
  // vì filesystem lúc chạy prod thường read-only.
  if (process.env.NODE_ENV !== 'production') {
    try {
      writeFileSync(OPENAPI_FILE, JSON.stringify(document, null, 2));
    } catch (error) {
      logger.warn(`Không ghi được ${OPENAPI_FILE}: ${String(error)}`);
    }
  }

  logger.log(`Swagger UI: /${SWAGGER_PATH}`);
}
