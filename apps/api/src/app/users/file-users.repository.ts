import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { storedUserSchema, User } from '@pdr-cloud/shared';
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
 */
@Injectable()
export class FileUsersRepository
  extends UsersRepository
  implements OnModuleInit
{
  private readonly logger = new Logger(FileUsersRepository.name);
  private users: readonly User[] = [];

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

  /** Writes to a temporary file and moves it into place, so an interrupted write never leaves a partial store. */
  private async writeStore(users: readonly User[]): Promise<void> {
    await mkdir(dirname(this.storePath), { recursive: true });
    const temporary = `${this.storePath}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(users, null, 2) + '\n', 'utf8');
    await rename(temporary, this.storePath);
  }
}
