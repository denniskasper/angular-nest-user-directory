import {
  BadRequestException,
  INestApplication,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { validationFailure } from '@pdr-cloud/shared';

/** Where the browsable API documentation is served, under the global prefix. */
export const DOCS_PATH = 'docs';

/**
 * Configuration every instance of the application gets — the served one in
 * main.ts and the ones the HTTP-level tests boot — so the two cannot drift.
 *
 * Validation is the framework's own Standard Schema pipe (ADR-0002): a
 * parameter declared with `{ schema }` is parsed by that schema, and no
 * bespoke validation layer exists. A failure answers with the shared
 * field-keyed body (spec.md, API contract) rather than the framework's
 * default list of prose.
 *
 * The API documentation is generated from those same declarations: the
 * OpenAPI document reads each `{ schema }` and each response's
 * `standardSchema` through the schema's own JSON Schema, so what it says a
 * request must satisfy is what the pipe enforces.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      exceptionFactory: (issues) =>
        new BadRequestException(validationFailure(issues)),
    }),
  );

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('User Directory API')
      .setDescription(
        'Lists, searches and creates Users. What a new User must provide depends on their Role; the rule is enforced and documented from one shared definition.',
      )
      .setVersion('1.0')
      .build(),
  );
  SwaggerModule.setup(DOCS_PATH, app, document, {
    useGlobalPrefix: true,
    customSiteTitle: 'User Directory API',
  });
  return app;
}
