import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateUser, storedUserSchema, User } from '@pdr-cloud/shared';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import seed from '../../assets/seed/users.json';
import { z } from 'zod';
import { describeReport, normalizeSeedData } from './normalization';
import { UsersRepository } from './users.repository';
import { USERS_STORE_PATH } from './users-store-path';

const storeSchema = z.array(storedUserSchema);

/**
 * Holds the Users in memory as the source of truth for reads, backed by a
 * JSON file. On first start, when no store exists, the Seed Data is
 * normalized once and written as the store; every later start reads the
 * store as it is, validated against the stored schema (ADR-0001) so a
 * corrupt or hand-edited store fails at startup rather than serving
 * malformed Users. The Seed Data asset itself is only ever read.
 *
 * Every write runs through one queue, so two creations cannot interleave
 * and the id assigned inside that queue cannot collide; each flush is
 * written to a temporary file and moved into place, so an interrupted write
 * cannot leave a partial store (spec.md, Persistence).
 */
@Injectable()
export class FileUsersRepository
  extends UsersRepository
  implements OnModuleInit
{
  private readonly logger = new Logger(FileUsersRepository.name);
  private users: readonly User[] = [];
  /** The tail of the write queue: each write waits for the one before it. */
  private writes: Promise<unknown> = Promise.resolve();

  constructor(@Inject(USERS_STORE_PATH) private readonly storePath: string) {
    super();
  }

  async onModuleInit(): Promise<void> {
    const stored = await this.readStore();
    if (stored) {
      this.users = stored;
      this.logger.log(`Loaded ${stored.length} Users from ${this.storePath}`);
      return;
    }

    const { users, report } = normalizeSeedData(seed);
    await this.writeStore(users);
    this.users = users;
    this.logger.log(describeReport(report, this.storePath));
  }

  async findAll(): Promise<readonly User[]> {
    return this.users;
  }

  async findById(id: number): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  create(input: CreateUser): Promise<User> {
    const write = this.writes.then(async () => {
      const id =
        this.users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
      const user: User = { id, ...input };
      const users = [...this.users, user];
      await this.writeStore(users);
      this.users = users;
      return user;
    });
    // A failed write must not stall the queue behind it; the caller gets the rejection.
    this.writes = write.catch(() => undefined);
    return write;
  }

  /** The stored Users, or undefined when no store has been written yet. */
  private async readStore(): Promise<User[] | undefined> {
    let raw: string;
    try {
      raw = await readFile(this.storePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }

    try {
      return storeSchema.parse(JSON.parse(raw));
    } catch (error) {
      throw new Error(
        `The Users store at ${this.storePath} is not readable (${(error as Error).message}). ` +
          'Remove it to run Normalization again from the Seed Data.',
      );
    }
  }

  /**
   * Writes to a temporary file and moves it into place, so an interrupted
   * write never leaves a partial store. `tools/reset-store.mjs` removes any
   * temporary file left behind by this name.
   */
  private async writeStore(users: readonly User[]): Promise<void> {
    await mkdir(dirname(this.storePath), { recursive: true });
    const temporary = `${this.storePath}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(users, null, 2) + '\n', 'utf8');
    await rename(temporary, this.storePath);
  }
}
