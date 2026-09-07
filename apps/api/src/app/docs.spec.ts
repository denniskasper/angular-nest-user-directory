import request from 'supertest';
import { BootedApp, bootApp } from '../testing/boot-app';

/**
 * Seam 2 (spec.md, Testing Decisions): the HTTP API, exercised through the
 * running application. These cases cover the API documentation: that it is
 * served, that it lists every endpoint, and that what it says about a
 * User comes from the shared schemas rather than being written separately.
 */
let booted: BootedApp;

beforeAll(async () => {
  booted = await bootApp();
});

afterAll(async () => {
  await booted.close();
});

type Schema = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

interface Operation {
  parameters: { name: string; in: string; required: boolean }[];
  requestBody: { content: Record<string, { schema: Schema }> };
  responses: Record<string, { content?: Record<string, { schema: Schema }> }>;
}

interface Document {
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, Schema> };
}

async function document(): Promise<Document> {
  const response = await request(booted.app.getHttpServer()).get(
    '/api/docs-json',
  );
  expect(response.status).toBe(200);
  return response.body;
}

/** The schema itself, following a reference into the document's components. */
function resolve(doc: Document, schema: Schema): Schema {
  const ref: string | undefined = schema.$ref;
  if (ref === undefined) return schema;
  return doc.components.schemas[ref.replace('#/components/schemas/', '')];
}

function jsonBody(
  doc: Document,
  holder: { content?: Record<string, { schema: Schema }> },
) {
  return resolve(doc, holder.content!['application/json'].schema);
}

describe('GET /api/docs', () => {
  it('serves browsable documentation', async () => {
    const response = await request(booted.app.getHttpServer()).get('/api/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('swagger-ui');
  });
});

describe('GET /api/docs-json', () => {
  it('lists every endpoint the directory uses', async () => {
    const { paths } = await document();

    expect(Object.keys(paths['/api'])).toEqual(['get']);
    expect(Object.keys(paths['/api/users']).sort()).toEqual(['get', 'post']);
    expect(Object.keys(paths['/api/users/{id}'])).toEqual(['get']);
  });

  it('documents the list parameters', async () => {
    const { paths } = await document();

    expect(
      paths['/api/users'].get.parameters.map((p) => [p.name, p.in, p.required]),
    ).toEqual([
      ['page', 'query', false],
      ['search', 'query', false],
    ]);
  });

  it('documents a new User from the shared creation schema', async () => {
    const doc = await document();
    const body = jsonBody(doc, doc.paths['/api/users'].post.requestBody);

    expect(Object.keys(body.properties)).toEqual([
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'birthDate',
      'role',
    ]);
    expect(body.required).toEqual(['firstName', 'lastName', 'email', 'role']);
    expect(body.properties.role.enum).toEqual(['admin', 'editor', 'viewer']);
    expect(body.properties.email.format).toBe('email');
    expect(body.properties.birthDate.format).toBe('date');
  });

  it('reflects the Conditional Requirement by Role', async () => {
    const doc = await document();
    const body = jsonBody(doc, doc.paths['/api/users'].post.requestBody);

    expect(body.allOf).toEqual([
      {
        if: { properties: { role: { enum: ['admin'] } } },
        then: { required: ['phoneNumber', 'birthDate'] },
      },
      {
        if: { properties: { role: { enum: ['editor'] } } },
        then: { required: ['phoneNumber'] },
      },
    ]);
    expect(body.description).toContain(
      'An admin must have a phone number and a birth date.',
    );
    expect(body.description).toContain('An editor must have a phone number.');
    expect(body.properties.phoneNumber.description).toBe(
      'Required for an admin or an editor',
    );
    expect(body.properties.birthDate.description).toBe('Required for an admin');
  });

  it('documents the responses from the shared schemas', async () => {
    const doc = await document();
    const { paths } = doc;

    const user = jsonBody(doc, paths['/api/users/{id}'].get.responses['200']);
    expect(user.required).toEqual(['id', 'firstName', 'lastName', 'role']);
    expect(user.properties.role.enum).toEqual(['admin', 'editor', 'viewer']);
    expect(paths['/api/users/{id}'].get.responses['404']).toBeDefined();

    const created = jsonBody(doc, paths['/api/users'].post.responses['201']);
    expect(created).toBe(user);

    const rejected = jsonBody(doc, paths['/api/users'].post.responses['400']);
    expect(Object.keys(rejected.properties)).toEqual([
      'statusCode',
      'error',
      'message',
      'fields',
    ]);

    const listed = jsonBody(doc, paths['/api/users'].get.responses['200']);
    expect(listed.anyOf).toHaveLength(2);
    const [array, page] = listed.anyOf.map((s: Schema) => resolve(doc, s));
    expect(resolve(doc, array.items)).toBe(user);
    expect(page.required).toEqual(['items', 'total', 'page', 'pageSize']);
    expect(page.properties.pageSize.enum).toEqual([25]);
  });
});
