import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { configureApp } from './app/configure-app';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api`);
}

bootstrap();
