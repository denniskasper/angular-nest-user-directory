import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppModule } from '../app/app.module';
import { configureApp } from '../app/configure-app';
import { USERS_STORE_PATH } from '../app/users/users-store-path';

export interface BootedApp {
  app: INestApplication;
  /** The directory holding this instance's store. */
  dataDir: string;
  /** Closes the application and removes the store directory it was given. */
  close(): Promise<void>;
}

/**
 * Boots the whole application the way main.ts does — Seam 2 tests go
 * through this and nothing lower — against a store in a fresh temporary
 * directory, so specs never touch the real data directory or each other.
 * Pass `dataDir` to boot again against a store an earlier boot wrote.
 *
 * The application listens on an ephemeral port, so requests made in
 * parallel share one server rather than each starting and stopping it.
 */
export async function bootApp(dataDir?: string): Promise<BootedApp> {
  const dir = dataDir ?? (await mkdtemp(join(tmpdir(), 'pdr-cloud-')));
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(USERS_STORE_PATH)
    .useValue(join(dir, 'users.json'))
    .compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.listen(0);

  return {
    app,
    dataDir: dir,
    async close() {
      await app.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}
