import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { BootedApp, bootApp } from '../testing/boot-app';

/**
 * Seam 2 (spec.md, Testing Decisions): the application booted the way the
 * container image boots it, with a built frontend beside the API. What is
 * proved is what a browser and a proxy depend on — the page on any route,
 * the API untouched, the cache rules and the compression — against a stand-in
 * for the build with the file names Angular emits.
 */
let booted: BootedApp;
let frontendDir: string;

/** Long enough for compression to bother; it leaves small bodies alone. */
const bundle = `console.log(${JSON.stringify('x'.repeat(4096))});`;

beforeAll(async () => {
  frontendDir = await mkdtemp(join(tmpdir(), 'pdr-cloud-frontend-'));
  await mkdir(join(frontendDir, 'media'));
  await writeFile(
    join(frontendDir, 'index.html'),
    '<!doctype html><html><body><app-root></app-root></body></html>',
  );
  await writeFile(join(frontendDir, 'main-KXSIAK7U.js'), bundle);
  await writeFile(join(frontendDir, 'media', 'font-5YJQ66G4.woff2'), 'font');
  await writeFile(join(frontendDir, 'favicon.ico'), 'icon');
  booted = await bootApp({ frontendDir });
});

afterAll(async () => {
  await booted.close();
  await rm(frontendDir, { recursive: true, force: true });
});

const server = () => request(booted.app.getHttpServer());

describe('the page', () => {
  it('is served at the root', async () => {
    const response = await server().get('/');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('<app-root>');
  });

  it('is served on a deep route, so a link into the router resolves', async () => {
    const response = await server().get('/users/7').set('Accept', 'text/html');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<app-root>');
  });

  it('is never cached, since it names the hashed files', async () => {
    const root = await server().get('/');
    const deep = await server().get('/smiley').set('Accept', 'text/html');

    expect(root.headers['cache-control']).toBe('no-cache');
    expect(deep.headers['cache-control']).toBe('no-cache');
  });
});

describe('the built files', () => {
  it('are served with their content type', async () => {
    const response = await server().get('/main-KXSIAK7U.js');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/javascript/);
  });

  it('may be cached for a year when their name carries a hash', async () => {
    const script = await server().get('/main-KXSIAK7U.js');
    const font = await server().get('/media/font-5YJQ66G4.woff2');

    expect(script.headers['cache-control']).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(font.headers['cache-control']).toBe(
      'public, max-age=31536000, immutable',
    );
  });

  it('may not be cached for a year when their name carries none', async () => {
    const response = await server().get('/favicon.ico');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).not.toContain('immutable');
  });

  it('are compressed for a client that accepts it', async () => {
    const response = await server()
      .get('/main-KXSIAK7U.js')
      .set('Accept-Encoding', 'gzip');

    expect(response.headers['content-encoding']).toBe('gzip');
    expect(response.headers['vary']).toMatch(/Accept-Encoding/i);
    expect(response.text).toBe(bundle);
  });
});

describe('the API beside it', () => {
  it('still answers under its prefix', async () => {
    const response = await server().get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(100);
  });

  it('answers an unknown route under its prefix itself, not with the page', async () => {
    const response = await server()
      .get('/api/nothing')
      .set('Accept', 'text/html');

    expect(response.status).toBe(404);
    expect(response.text).not.toContain('<app-root>');
  });

  it('answers a missing User in JSON, as it does without a frontend', async () => {
    const response = await server()
      .get('/api/users/999999')
      .set('Accept', 'text/html');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/json/);
  });

  it('answers a request that does not want a page with a 404, not the page', async () => {
    const response = await server()
      .get('/users/7')
      .set('Accept', 'application/json');

    expect(response.status).toBe(404);
    expect(response.text).not.toContain('<app-root>');
  });

  it('is compressed too', async () => {
    const response = await server()
      .get('/api/users')
      .set('Accept-Encoding', 'gzip');

    expect(response.headers['content-encoding']).toBe('gzip');
    expect(response.body).toHaveLength(100);
  });
});

describe('every response', () => {
  it('carries the content-type and framing headers and names no server', async () => {
    for (const path of ['/', '/main-KXSIAK7U.js', '/api/users']) {
      const response = await server().get(path);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-powered-by']).toBeUndefined();
    }
  });
});

describe('without a frontend directory', () => {
  it('serves no page, as in development and in the other specs', async () => {
    const plain = await bootApp();
    try {
      const response = await request(plain.app.getHttpServer()).get('/');

      expect(response.status).toBe(404);
      expect(response.headers['x-powered-by']).toBeDefined();
    } finally {
      await plain.close();
    }
  });
});
