import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import { basename, join } from 'node:path';

export interface ServeFrontendOptions {
  /** The directory holding the built frontend, `index.html` at its root. */
  frontendDir: string;
  /** The global route prefix; requests under it are never answered with a page. */
  apiPrefix: string;
}

/**
 * Serves the built frontend from the same process as the API, so the public
 * deployment is one container on one origin: the browser's relative `/api`
 * requests reach the API with no proxy and no CORS, exactly as they do
 * behind the development server's proxy.
 *
 * Only a served instance opts in (main.ts, through `STATIC_DIR`); the
 * development server serves the frontend itself, and the HTTP-level tests
 * boot without a frontend unless a spec asks for one.
 *
 * Four things the browser depends on:
 * - the SPA fallback: any page request outside the API prefix gets
 *   `index.html`, so a deep link such as `/users/7` or a reload on `/smiley`
 *   reaches the router instead of a bare 404;
 * - cache rules that differ by file: the hashed bundles may be cached for a
 *   year, `index.html` may not, since it carries no hash and names them; a
 *   device that cached it would keep the previous deployment's bundle names;
 * - compression, since the Material bundle is several hundred kilobytes;
 * - two headers a public origin should carry, and one it should not.
 */
export function serveFrontend(
  app: INestApplication,
  { frontendDir, apiPrefix }: ServeFrontendOptions,
): void {
  // NestFactory.create and the testing module both default to the Express
  // adapter, so the served application is always an Express one.
  const express = app as NestExpressApplication;
  express.getHttpAdapter().getInstance().disable('x-powered-by');

  // Registered before every route, so the API's responses are compressed too.
  app.use(compression());
  app.use(securityHeaders);
  express.useStaticAssets(frontendDir, {
    index: 'index.html',
    setHeaders: cacheHeaders,
  });
  app.use(spaFallback(join(frontendDir, 'index.html'), `/${apiPrefix}`));
}

function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // No guessing at content types, and no framing by another site.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
}

/**
 * Angular's production build appends a content hash to every file it
 * emits except `index.html`: `main-KXSIAK7U.js`, `chunk-BkZTEUh1.js`,
 * `media/fraunces-latin-opsz-normal-5YJQ66G4.woff2`. A changed file is a
 * differently named file, so the hashed ones may be cached indefinitely.
 */
const HASHED = /-[A-Za-z0-9]{8}\.[a-z0-9]+$/;

function cacheHeaders(res: Response, path: string) {
  if (basename(path) === 'index.html') {
    res.setHeader('Cache-Control', 'no-cache');
  } else if (HASHED.test(path)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}

/**
 * Answers a page request for any path outside the API with `index.html`,
 * leaving the router to resolve it. Requests that do not want a page, and
 * anything under the API prefix, pass through to the API and its own 404,
 * so `/api/nothing` still answers in JSON.
 */
function spaFallback(indexFile: string, apiRoot: string) {
  const isApi = (path: string) =>
    path === apiRoot || path.startsWith(`${apiRoot}/`);
  return (req: Request, res: Response, next: NextFunction) => {
    const wantsPage =
      (req.method === 'GET' || req.method === 'HEAD') && req.accepts('html');
    if (!wantsPage || isApi(req.path)) {
      next();
      return;
    }
    res.sendFile(indexFile, { headers: { 'Cache-Control': 'no-cache' } }, next);
  };
}
