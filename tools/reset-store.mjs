#!/usr/bin/env node
/**
 * Resets the Users store to a clean starting state, so the next start of the
 * API runs Normalization from the Seed Data again (ADR-0001).
 *
 * The store is `$DATA_DIR/users.json`, `data/users.json` by default, the
 * same place the API reads it from (apps/api/src/app/users/users-store-path.ts).
 * Only the store and any temporary file an interrupted write left beside it
 * (`users.json.<pid>.tmp`, as FileUsersRepository names them) are removed;
 * the directory itself and anything else in it are kept, and the Seed Data
 * asset is never touched.
 *
 * Usage: `npm run reset`, or `DATA_DIR=somewhere npm run reset`.
 */
import { readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const STORE_FILE = 'users.json';

const dataDir = resolve(process.env.DATA_DIR ?? 'data');
const store = join(dataDir, STORE_FILE);

let entries;
try {
  entries = await readdir(dataDir);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  entries = [];
}

const isInterruptedWrite = (name) =>
  name.startsWith(`${STORE_FILE}.`) && name.endsWith('.tmp');
const removable = entries.filter(
  (name) => name === STORE_FILE || isInterruptedWrite(name),
);

if (removable.length === 0) {
  console.log(`Nothing to remove: no store at ${store}`);
} else {
  for (const name of removable) {
    await rm(join(dataDir, name));
    console.log(`Removed ${join(dataDir, name)}`);
  }
  console.log(
    'The next start of the API will run Normalization from the Seed Data.',
  );
}
