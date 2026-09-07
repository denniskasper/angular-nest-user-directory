import { resolve } from 'node:path';

/** Injection token for the absolute path of the Users store file. */
export const USERS_STORE_PATH = Symbol('USERS_STORE_PATH');

/**
 * Where the store lives when served: `$DATA_DIR/users.json`, defaulting to
 * `data/` under the working directory (git-ignored). `tools/reset-store.mjs`
 * resolves the same path the same way, so the two must change together.
 */
export function usersStorePathFromEnv(): string {
  return resolve(process.env['DATA_DIR'] ?? 'data', 'users.json');
}
