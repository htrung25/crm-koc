import { initializeTransactionalContext } from 'typeorm-transactional';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JsonLogger } from '../common/services/json.logger';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  // Giống main.ts: phải chạy TRƯỚC khi tạo app, nếu không @Transactional() mất
  // context.
  initializeTransactionalContext();

  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(WorkerModule, {
    logger: isProduction
      ? new JsonLogger({ logLevels: ['log', 'error', 'warn'] })
      : ['log', 'error', 'warn'],
  });

  // KHÔNG bỏ dòng này. BullExplorer.onApplicationShutdown() là chỗ duy nhất
  // gọi worker.close() để chờ job đang chạy xong; thiếu hook thì SIGTERM cắt
  // ngang job và toàn bộ graceful drain là số không.
  app.enableShutdownHooks();

  // Nghe đúng PORT như container api: khác container thì khác network
  // namespace, không đụng nhau, và HEALTHCHECK nướng trong image (probe
  // PORT || 3000) chạy đúng cho cả hai.
  const port = app.get(ConfigService).get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
