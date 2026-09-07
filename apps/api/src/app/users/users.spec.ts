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

describe('GET /api/users?page=&search=', () => {
  it('returns 25 Users per page together with the total', async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users?page=2',
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 100, page: 2, pageSize: 25 });
    expect(response.body.items).toHaveLength(25);
    expect(response.body.items[0]).toMatchObject({
      id: 26,
      firstName: 'Heather',
      lastName: 'Kidd',
    });
    expect(response.body.items[24]).toMatchObject({ id: 50 });
  });

  it('reports an empty page, with the total, beyond the last one', async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users?page=5',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
      total: 100,
      page: 5,
      pageSize: 25,
    });
  });

  it('matches a search across the first and last name joined by a space, ignoring case', async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users?search=SARAH%20r',
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 1, page: 1 });
    expect(response.body.items).toEqual([
      expect.objectContaining({ id: 7, firstName: 'Sarah', lastName: 'Russell' }),
    ]);
  });

  it('applies the search before paging, so the total counts matches', async () => {
    // 29 of the 100 Full Names contain "an" (counted from the Seed Data);
    // the second page of 25 therefore holds the remaining 4.
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users?search=an&page=2',
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 29, page: 2 });
    expect(response.body.items).toHaveLength(4);
    for (const user of response.body.items) {
      expect(`${user.firstName} ${user.lastName}`.toLowerCase()).toContain(
        'an',
      );
    }
  });

  it('reports no matches for a search nothing contains', async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users?search=zz',
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ items: [], total: 0 });
  });

  it('rejects a page that is not a positive whole number', async () => {
    for (const page of ['0', '-1', '1.5', 'two']) {
      const response = await request(booted.app.getHttpServer()).get(
        `/api/users?page=${page}`,
      );

      expect(response.status, `page=${page}`).toBe(400);
      expect(Object.keys(response.body.fields)).toEqual(['page']);
    }
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
