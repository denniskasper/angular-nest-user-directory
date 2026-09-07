import { Injectable, NotFoundException } from '@nestjs/common';
import { fullName, User, UserPage, USERS_PAGE_SIZE } from '@pdr-cloud/shared';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  findAll(): Promise<readonly User[]> {
    return this.users.findAll();
  }

  /**
   * One page of the Users whose Full Name contains `search`, ignoring case.
   * The search narrows first and the page is cut from the matches, so
   * `total` counts matches rather than the whole directory.
   */
  async findPage(page: number, search = ''): Promise<UserPage> {
    const term = search.toLowerCase();
    const matches = (await this.users.findAll()).filter((user) =>
      fullName(user).toLowerCase().includes(term),
    );
    const start = (page - 1) * USERS_PAGE_SIZE;

    return {
      items: matches.slice(start, start + USERS_PAGE_SIZE),
      total: matches.length,
      page,
      pageSize: USERS_PAGE_SIZE,
    };
  }

  /** Fetching an id no User holds is a not-found, distinguishable from a broken request. */
  async findById(id: number): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException(`No User with id ${id}`);
    return user;
  }
}
