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
  /** Stops the application and starts it again against the same store. */
  restart(): Promise<void>;
  /** Closes the application and removes the store directory it was given. */
  close(): Promise<void>;
}

/**
 * Boots the whole application the way main.ts does — Seam 2 tests go
 * through this and nothing lower — against a store in a fresh temporary
 * directory, so specs never touch the real data directory or each other.
 *
 * The application listens on an ephemeral port, so requests made in
 * parallel share one server rather than each starting and stopping it.
 */
export async function bootApp(): Promise<BootedApp> {
  const dataDir = await mkdtemp(join(tmpdir(), 'pdr-cloud-'));
  const booted: BootedApp = {
    app: await start(dataDir),
    dataDir,
    async restart() {
      await booted.app.close();
      booted.app = await start(dataDir);
    },
    async close() {
      await booted.app.close();
      await rm(dataDir, { recursive: true, force: true });
    },
  };
  return booted;
}

async function start(dataDir: string): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(USERS_STORE_PATH)
    .useValue(join(dataDir, 'users.json'))
    .compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.listen(0);
  return app;
}
