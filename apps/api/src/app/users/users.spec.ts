import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../configure-app';

/**
 * Seam 2 (spec.md, Testing Decisions): the HTTP API, exercised through the
 * running application. These cases cover the read path for the list.
 */
describe('GET /api/users', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns every User when called with no parameters', async () => {
    const response = await request(app.getHttpServer()).get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(100);
  });

  it('carries each User with id, names, email and Role', async () => {
    const response = await request(app.getHttpServer()).get('/api/users');

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
    const response = await request(app.getHttpServer()).get('/api/users');
    const user = response.body.find((u: { id: unknown }) => u.id === 25);

    expect(user).toMatchObject({ firstName: 'Amanda', lastName: 'Miller' });
    expect(user).not.toHaveProperty('email');
    expect(user).not.toHaveProperty('birthDate');
  });
});
