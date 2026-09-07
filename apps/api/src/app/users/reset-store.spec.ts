import { Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { access, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import request from 'supertest';
import { BootedApp, bootApp } from '../../testing/boot-app';

/** The reset script as `npm run reset` runs it, from the workspace root. */
const RESET_SCRIPT = resolve(
  import.meta.dirname,
  '../../../../..',
  'tools/reset-store.mjs',
);

const ada = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.org',
  role: 'viewer',
};

/** Runs the reset script against the store directory a booted application was given. */
async function reset(dataDir: string) {
  return promisify(execFile)(process.execPath, [RESET_SCRIPT], {
    env: { ...process.env, DATA_DIR: dataDir },
  });
}

/**
 * Seam 2 (spec.md, Testing Decisions): the reset script is proved through
 * the application that starts after it, not by inspecting the file it
 * removes. After a reset, the next start runs Normalization from the Seed
 * Data again and whatever was created before is gone.
 */
describe('Resetting the store', () => {
  let booted: BootedApp;

  beforeEach(async () => {
    booted = await bootApp();
  });

  afterEach(async () => {
    await booted.close();
  });

  const listUsers = async () => {
    const response = await request(booted.app.getHttpServer()).get(
      '/api/users',
    );
    expect(response.status).toBe(200);
    return response.body as { id: number }[];
  };

  it('returns the directory to the 100 Seed Data Users on the next start', async () => {
    const created = await request(booted.app.getHttpServer())
      .post('/api/users')
      .send(ada);
    expect(created.status).toBe(201);
    expect(await listUsers()).toHaveLength(101);
    await booted.app.close();

    const { stdout } = await reset(booted.dataDir);
    const log = vi.spyOn(Logger.prototype, 'log');
    try {
      await booted.restart();

      expect(stdout).toContain(join(booted.dataDir, 'users.json'));
      const users = await listUsers();
      expect(users).toHaveLength(100);
      expect(users.find((u) => u.id === created.body.id)).toBe(undefined);
      // The Normalization report at startup is what shows the store was rebuilt from the Seed Data.
      const reports = log.mock.calls
        .map(([message]) => String(message))
        .filter((m) => m.startsWith('Normalization'));
      expect(reports).toHaveLength(1);
    } finally {
      log.mockRestore();
    }
  });

  it('removes a temporary file an interrupted write left behind', async () => {
    const stray = join(booted.dataDir, 'users.json.12345.tmp');
    await writeFile(stray, '[', 'utf8');
    await booted.app.close();

    await reset(booted.dataDir);

    await expect(access(stray)).rejects.toMatchObject({ code: 'ENOENT' });
    await booted.restart();
    expect(await listUsers()).toHaveLength(100);
  });

  it('succeeds and says so when there is nothing to remove', async () => {
    await booted.app.close();
    await reset(booted.dataDir);

    const { stdout } = await reset(booted.dataDir);

    expect(stdout.toLowerCase()).toContain('nothing to remove');
  });
});
