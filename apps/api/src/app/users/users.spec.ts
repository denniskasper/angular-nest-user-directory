import request from 'supertest';
import { BootedApp, bootApp } from '../../testing/boot-app';

/**
 * Seam 2 (spec.md, Testing Decisions): the HTTP API, exercised through the
 * running application. These cases cover the read path for the list.
 */
describe('GET /api/users', () => {
  let booted: BootedApp;

  beforeAll(async () => {
    booted = await bootApp();
  });

  afterAll(async () => {
    await booted.close();
  });

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
