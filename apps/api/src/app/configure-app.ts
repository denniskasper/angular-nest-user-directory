import {
  BadRequestException,
  INestApplication,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { validationFailure } from '@pdr-cloud/shared';
import { serveFrontend } from './serve-frontend';

/** The global route prefix every controller is served under. */
export const API_PREFIX = 'api';

/** Where the browsable API documentation is served, under the global prefix. */
export const DOCS_PATH = 'docs';

export interface AppOptions {
  /**
   * The directory of a built frontend to serve beside the API, as the
   * public deployment does. Absent in development, where the development
   * server serves the frontend and proxies `/api`, and in the HTTP-level
   * tests unless a spec asks for one.
   */
  frontendDir?: string;
}

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
export function configureApp(
  app: INestApplication,
  { frontendDir }: AppOptions = {},
): INestApplication {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      exceptionFactory: (issues) =>
        new BadRequestException(validationFailure(issues)),
    }),
  );
  if (frontendDir) {
    serveFrontend(app, { frontendDir, apiPrefix: API_PREFIX });
  }

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('User Directory API')
      .setDescription(
        'Lists, searches and creates Users. What a new User must provide depends on their Role; the rule is enforced and documented from one shared definition.',
      )
      .setVersion('1.0')
      // 3.1, where the creation schema's if/then clauses are keywords
      // rather than extensions a reader may ignore.
      .setOpenAPIVersion('3.1.0')
      .build(),
  );
  SwaggerModule.setup(DOCS_PATH, app, document, {
    useGlobalPrefix: true,
    customSiteTitle: 'User Directory API',
  });
  return app;
}
