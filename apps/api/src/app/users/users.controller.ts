import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
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

  /** A single User by id; an id that is not a number is rejected, not treated as absent. */
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.users.findById(id);
  }
}
