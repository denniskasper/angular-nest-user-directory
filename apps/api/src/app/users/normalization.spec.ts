import { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import request from 'supertest';
import { BootedApp, bootApp } from '../../testing/boot-app';

const SEED_ASSET = `${import.meta.dirname}/../../assets/seed/users.json`;
/** Read before any spec boots the application, so a first-start mutation could not hide in the baseline. */
const seedAssetBeforeAnyStart = readFile(SEED_ASSET, 'utf8');

/**
 * Seam 2 (spec.md, Testing Decisions): Normalization is proved through the
 * HTTP API after starting against the provided Seed Data. No separate seam
 * is opened on the normalizer or the store.
 */
describe('Normalization of the Seed Data', () => {
  let booted: BootedApp;

  beforeAll(async () => {
    booted = await bootApp();
  });

  afterAll(async () => {
    await booted.close();
  });

  const listUsers = async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users',
    );
    expect(response.status).toBe(200);
    return response.body as Record<string, unknown>[];
  };

  it('lists a first name held under a misspelled field name as firstName', async () => {
    const users = await listUsers();

    expect(users.find((u) => u.id === 5)).toEqual({
      id: 5,
      firstName: 'Kevin',
      lastName: 'Taylor',
      email: 'patriciaconley@gmail.com',
      phoneNumber: 'invalid-number',
      role: 'editor',
    });
  });

  it('lists a birth date held under a misspelled field name as birthDate', async () => {
    const users = await listUsers();

    expect(users.find((u) => u.id === 2)).toMatchObject({
      firstName: 'Sheila',
      birthDate: '1967-04-24',
    });
    expect(users.find((u) => u.id === 2)).not.toHaveProperty('birthDtae');
  });

  it('lists an id held as text as a number', async () => {
    const users = await listUsers();

    expect(users.find((u) => u.id === 74)).toMatchObject({
      id: 74,
      firstName: 'Phillip',
      lastName: 'Ayers',
    });
  });

  it('keeps a User whose email and birth date cannot be salvaged, with those fields absent', async () => {
    const users = await listUsers();

    expect(users.find((u) => u.id === 8)).toEqual({
      id: 8,
      firstName: 'Jack',
      lastName: 'Hanson',
      birthDate: '1997-06-03',
      role: 'viewer',
    });
    expect(users.find((u) => u.id === 1)).toEqual({
      id: 1,
      firstName: 'Cynthia',
      lastName: 'Long',
      email: 'kaufmanadam@burnett.org',
      role: 'viewer',
    });
  });

  it('leaves the Seed Data asset untouched', async () => {
    expect(await readFile(SEED_ASSET, 'utf8')).toBe(
      await seedAssetBeforeAnyStart,
    );
  });
});

describe('Normalization runs once', () => {
  it('reports the repairs at first start and serves the store as-is on later starts', async () => {
    const log = vi.spyOn(Logger.prototype, 'log');
    try {
      const first = await bootApp();
      await first.app.close();
      const second = await bootApp(first.dataDir);
      const response = await request(second.app.getHttpServer()).get(
        '/api/users',
      );
      await second.close();

      // The startup report is the observable the ticket asks for: how many
      // records, which fields, which ids. Its exact wording is not.
      const reports = log.mock.calls
        .map(([message]) => String(message))
        .filter((m) => m.startsWith('Normalization'));
      expect(reports).toHaveLength(1);
      expect(reports[0]).toContain('12 of 100');
      expect(reports[0]).toMatch(/#1\b.*birthDate/);
      expect(reports[0]).toMatch(/#8\b.*email/);
      expect(reports[0]).toMatch(/#5\b.*firstName/);
      expect(reports[0]).toMatch(/#74\b.*\bid\b/);
      expect(response.body).toHaveLength(100);
    } finally {
      log.mockRestore();
    }
  });
});
