import request from 'supertest';
import { BootedApp, bootApp } from '../../testing/boot-app';

/**
 * Seam 2 (spec.md, Testing Decisions): the HTTP API, exercised through the
 * running application. These cases cover the read path: the list, and a
 * single User by id.
 */
let booted: BootedApp;

beforeAll(async () => {
  booted = await bootApp();
});

afterAll(async () => {
  await booted.close();
});

describe('GET /api/users', () => {
  it('returns every User when called with no parameters', async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users',
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(100);
  });

  it('carries each User with id, names, email and Role', async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users',
    );

    expect(response.body).toContainEqual({
      id: 7,
      firstName: 'Sarah',
      lastName: 'Russell',
      email: 'xmills@david.org',
      phoneNumber: '(986)712-7166x03230',
      birthDate: '2002-03-18',
      role: 'admin',
    });
  });

  it('lists a Legacy Record with its absent fields absent, not blanked', async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users',
    );
    const user = response.body.find((u: { id: unknown }) => u.id === 25);

    expect(user).toMatchObject({ firstName: 'Amanda', lastName: 'Miller' });
    expect(user).not.toHaveProperty('email');
    expect(user).not.toHaveProperty('birthDate');
  });
});

describe('GET /api/users/:id', () => {
  it('returns the User holding that id', async () => {
    // User 74's id is text in the Seed Data; fetching it by number proves
    // the conversion ticket 04 deferred to this endpoint.
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users/74',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 74,
      firstName: 'Phillip',
      lastName: 'Ayers',
      email: 'brian15@yahoo.com',
      phoneNumber: '+1-438-200-3046x31310',
      birthDate: '1979-01-20',
      role: 'admin',
    });
  });

  it('responds not found for an id no User holds', async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users/101',
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ statusCode: 404 });
    expect(response.body.message).toContain('101');
  });

  it('rejects an id that is not a number rather than treating it as absent', async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users/seven',
    );

    expect(response.status).toBe(400);
  });
});
