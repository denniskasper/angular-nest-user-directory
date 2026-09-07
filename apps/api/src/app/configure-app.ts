import {
  INestApplication,
  StandardSchemaValidationPipe,
} from '@nestjs/common';

/**
 * Configuration every instance of the application gets — the served one in
 * main.ts and the ones the HTTP-level tests boot — so the two cannot drift.
 *
 * Validation is the framework's own Standard Schema pipe (ADR-0002): a
 * parameter declared with `{ schema }` is parsed by that schema, and no
 * bespoke validation layer exists.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  return app;
}
