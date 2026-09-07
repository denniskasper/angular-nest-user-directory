import { Controller, Get } from '@nestjs/common';
import { User } from '@pdr-cloud/shared';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Listing with no parameters returns the complete list. */
  @Get()
  list(): Promise<readonly User[]> {
    return this.users.findAll();
  }
}
