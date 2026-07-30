import { initializeTransactionalContext } from 'typeorm-transactional';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './infra/swagger';

async function bootstrap() {
  // Phải chạy TRƯỚC khi tạo app, nếu không @Transactional() sẽ không có context
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
