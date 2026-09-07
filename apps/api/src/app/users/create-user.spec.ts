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

  it('rejects input the form would reject, keyed by the field at fault', async () => {
    const response = await request(booted.app.getHttpServer())
      .post('/api/users')
      .send({ ...ada, firstName: '', email: 'not-an-email', role: 'owner' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      fields: {
        firstName: ['First name is required'],
        email: ['Enter an email address, like name@example.org'],
        role: ['Choose admin, editor or viewer'],
      },
    });

    const listed = await request(booted.app.getHttpServer()).get('/api/users');
    expect(listed.body).toHaveLength(100);
  });

  it('enforces the Conditional Requirement from the shared definition', async () => {
    const { phoneNumber, birthDate, ...bare } = ada;
    void phoneNumber;
    void birthDate;

    const admin = await request(booted.app.getHttpServer())
      .post('/api/users')
      .send({ ...bare, role: 'admin' });
    expect(admin.status).toBe(400);
    expect(admin.body.fields).toEqual({
      phoneNumber: ['An admin must have a phone number'],
      birthDate: ['An admin must have a birth date'],
    });

    const editor = await request(booted.app.getHttpServer())
      .post('/api/users')
      .send({ ...bare, role: 'editor' });
    expect(editor.status).toBe(400);
    expect(editor.body.fields).toEqual({
      phoneNumber: ['An editor must have a phone number'],
    });

    const viewer = await request(booted.app.getHttpServer())
      .post('/api/users')
      .send({ ...bare, role: 'viewer' });
    expect(viewer.status).toBe(201);
    expect(viewer.body).toEqual({ id: 101, ...bare, role: 'viewer' });

    const listed = await request(booted.app.getHttpServer()).get('/api/users');
    expect(listed.body).toHaveLength(101);
  });

  it('reports a Role-dependent fault alongside an unrelated one', async () => {
    const { phoneNumber, ...withoutPhone } = ada;
    void phoneNumber;

    const response = await request(booted.app.getHttpServer())
      .post('/api/users')
      .send({ ...withoutPhone, email: 'nope', role: 'admin' });

    expect(response.status).toBe(400);
    expect(Object.keys(response.body.fields)).toEqual(['email', 'phoneNumber']);
  });

  it('never stores an id a client sends', async () => {
    const created = await request(booted.app.getHttpServer())
      .post('/api/users')
      .send({ id: 7, ...ada });

    expect(created.status).toBe(201);
    expect(created.body.id).toBe(101);
  });
});
