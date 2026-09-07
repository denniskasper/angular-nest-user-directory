import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { USER_ROLES } from '@pdr-cloud/shared';
import request from 'supertest';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

describe('GET /api', () => {
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

  it('reports the Roles the directory knows', async () => {
    const response = await request(app.getHttpServer()).get('/api');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ roles: [...USER_ROLES] });
  });
});
