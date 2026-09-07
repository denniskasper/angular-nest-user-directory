import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { configureApp, DOCS_PATH } from './app/configure-app';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api`);
  Logger.log(`API documentation at http://localhost:${port}/api/${DOCS_PATH}`);
}

bootstrap();
