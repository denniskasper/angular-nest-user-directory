import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@pdr-cloud/shared';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  findAll(): Promise<readonly User[]> {
    return this.users.findAll();
  }

  /** Fetching an id no User holds is a not-found, distinguishable from a broken request. */
  async findById(id: number): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException(`No User with id ${id}`);
    return user;
  }
}
