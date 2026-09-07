import { USER_ROLES } from '@pdr-cloud/shared';
import request from 'supertest';
import { BootedApp, bootApp } from '../testing/boot-app';

describe('GET /api', () => {
  let booted: BootedApp;

  beforeAll(async () => {
    booted = await bootApp();
  });

  afterAll(async () => {
    await booted.close();
  });

  it('reports the Roles the directory knows', async () => {
    const response = await request(booted.app.getHttpServer()).get('/api');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ roles: [...USER_ROLES] });
  });
});
