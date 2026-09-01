import { initializeTransactionalContext } from 'typeorm-transactional';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './infra/swagger';
import { JsonLogger } from './common/logger/json.logger';
import { DEVICE_ID_HEADER } from './common/util/device-binding.util';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Phải chạy TRƯỚC khi tạo app, nếu không @Transactional() sẽ không có context
  initializeTransactionalContext();

  // Production ghi JSON ra stdout để Docker json-file gom được; dev giữ log màu.
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProduction
      ? new JsonLogger({ logLevels: ['log', 'error', 'warn'] })
      : ['log', 'error', 'warn'],
  });

  // Frontend Next gọi API thay cho trình duyệt nên IP thật nằm trong
  // X-Forwarded-For.
  app.set('trust proxy', 1);

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static files from uploads directory
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  const corsCredentials =
    configService.get<string>('CORS_CREDENTIALS', 'true') !== 'false';

  app.enableCors({
    origin:
      corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
    credentials: corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', DEVICE_ID_HEADER],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  // Không có hook này thì SIGTERM (docker stop, nest --watch restart) không gọi
  // onModuleDestroy: socket Redis còn mở giữ process sống, lần start sau đụng
  // EADDRINUSE.
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT', 3000);

  await app.listen(port, '0.0.0.0');
}
void bootstrap();
