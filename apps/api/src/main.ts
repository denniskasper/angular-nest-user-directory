import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { resolve } from 'node:path';
import { AppModule } from './app/app.module';
import { API_PREFIX, configureApp, DOCS_PATH } from './app/configure-app';

async function bootstrap() {
  // Set by the container image (Dockerfile); unset in development, where the
  // development server serves the frontend and proxies the API.
  const staticDir = process.env.STATIC_DIR;
  const frontendDir = staticDir ? resolve(staticDir) : undefined;
  const app = configureApp(await NestFactory.create(AppModule), {
    frontendDir,
  });
  // In the container Node is process 1, which ignores SIGTERM unless a
  // handler is installed; without this a stop waits out Docker's timeout.
  app.enableShutdownHooks();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/${API_PREFIX}`);
  Logger.log(
    `API documentation at http://localhost:${port}/${API_PREFIX}/${DOCS_PATH}`,
  );
  if (frontendDir) {
    Logger.log(`Frontend served from ${frontendDir}`);
  }
}

bootstrap();
