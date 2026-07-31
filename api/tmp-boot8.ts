import 'reflect-metadata';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
initializeTransactionalContext();
NestFactory.createApplicationContext(AppModule, { logger: ['error'], abortOnError: false })
  .then(async (app) => { console.log('RESULT: BOOT OK'); await app.close(); })
  .catch((e: Error) => console.log('RESULT: BOOT FAIL ->', String(e.message).slice(0, 500)));
