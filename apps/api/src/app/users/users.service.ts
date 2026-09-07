import { Injectable } from '@nestjs/common';
import { User } from '@pdr-cloud/shared';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  findAll(): Promise<readonly User[]> {
    return this.users.findAll();
  }
}
