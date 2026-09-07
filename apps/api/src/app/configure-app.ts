import {
  BadRequestException,
  INestApplication,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { validationFailure } from '@pdr-cloud/shared';

/**
 * Configuration every instance of the application gets — the served one in
 * main.ts and the ones the HTTP-level tests boot — so the two cannot drift.
 *
 * Validation is the framework's own Standard Schema pipe (ADR-0002): a
 * parameter declared with `{ schema }` is parsed by that schema, and no
 * bespoke validation layer exists. A failure answers with the shared
 * field-keyed body (spec.md, API contract) rather than the framework's
 * default list of prose.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      exceptionFactory: (issues) =>
        new BadRequestException(validationFailure(issues)),
    }),
  );
  return app;
}
