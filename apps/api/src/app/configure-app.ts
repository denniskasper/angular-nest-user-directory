import { INestApplication } from '@nestjs/common';

/**
 * Configuration every instance of the application gets — the served one in
 * main.ts and the ones the HTTP-level tests boot — so the two cannot drift.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  return app;
}
