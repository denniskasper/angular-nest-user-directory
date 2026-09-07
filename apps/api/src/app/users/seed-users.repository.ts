import { Injectable } from '@nestjs/common';
import { User } from '@pdr-cloud/shared';
import seed from '../../assets/seed/users.json';
import { UsersRepository } from './users.repository';

/**
 * Serves the Seed Data as-is from the committed asset.
 *
 * Until Normalization lands (ticket 04) this is a deliberate lie: a handful
 * of Legacy Records still carry misspelled field names and text ids, so not
 * every record satisfies `storedUserSchema`. The cast below is what makes
 * that visible; remove it when the repository reads the normalized store.
 */
@Injectable()
export class SeedUsersRepository extends UsersRepository {
  private readonly users = seed as unknown as readonly User[];

  async findAll(): Promise<readonly User[]> {
    return this.users;
  }
}
