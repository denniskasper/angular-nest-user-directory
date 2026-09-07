import request from 'supertest';
import { BootedApp, bootApp } from '../../testing/boot-app';

/**
 * Seam 2 (spec.md, Testing Decisions): the HTTP API, exercised through the
 * running application. These cases cover the write path. Each creates
 * against its own store, so no case sees another's Users.
 */
const ada = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.org',
  phoneNumber: '+44 20 7946 0958',
  birthDate: '1815-12-10',
  role: 'editor',
};

describe('POST /api/users', () => {
  let booted: BootedApp;

  beforeEach(async () => {
    booted = await bootApp();
  });

  afterEach(async () => {
    await booted.close();
  });

  it('creates the User, assigns the next id, and returns it', async () => {
    const created = await request(booted.app.getHttpServer())
      .post('/api/users')
      .send(ada);

    expect(created.status).toBe(201);
    expect(created.body).toEqual({ id: 101, ...ada });

    const fetched = await request(booted.app.getHttpServer()).get(
      '/api/users/101',
    );
    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual({ id: 101, ...ada });

    const listed = await request(booted.app.getHttpServer()).get('/api/users');
    expect(listed.body).toHaveLength(101);
  });

  it('keeps the User across a restart', async () => {
    await request(booted.app.getHttpServer()).post('/api/users').send(ada);
    await booted.restart();

    const fetched = await request(booted.app.getHttpServer()).get(
      '/api/users/101',
    );
    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual({ id: 101, ...ada });
  });

  it('assigns distinct ids under concurrent creation and persists every User', async () => {
    const responses = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        request(booted.app.getHttpServer())
          .post('/api/users')
          .send({ ...ada, firstName: `Ada${i}` }),
      ),
    );

    for (const response of responses) expect(response.status).toBe(201);
    const ids = responses.map((r) => r.body.id as number).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 20 }, (_, i) => 101 + i));

    await booted.restart();
    const listed = await request(booted.app.getHttpServer()).get('/api/users');
    expect(listed.body).toHaveLength(120);
    expect(listed.body.map((u: { id: number }) => u.id).slice(100)).toEqual(
      ids,
    );
  });

  it('rejects input the form would reject, naming every field at fault', async () => {
    const response = await request(booted.app.getHttpServer())
      .post('/api/users')
      .send({ ...ada, firstName: '', email: 'not-an-email', role: 'owner' });

    expect(response.status).toBe(400);
    const messages = response.body.message as string[];
    expect(messages).toHaveLength(3);
    expect(messages.join('\n')).toMatch(/firstName/);
    expect(messages.join('\n')).toMatch(/email/);
    expect(messages.join('\n')).toMatch(/role/);

    const listed = await request(booted.app.getHttpServer()).get('/api/users');
    expect(listed.body).toHaveLength(100);
  });

  it('never stores an id a client sends', async () => {
    const created = await request(booted.app.getHttpServer())
      .post('/api/users')
      .send({ id: 7, ...ada });

    expect(created.status).toBe(201);
    expect(created.body.id).toBe(101);
  });
});
