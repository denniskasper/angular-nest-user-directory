import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateUser,
  createUserSchema,
  User,
  UserPage,
} from '@pdr-cloud/shared';
import { ListUsersQuery, listUsersQuerySchema } from './list-users-query';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * Listing with no parameters returns the complete list; with a page or a
   * search term it returns that page of matches together with their total.
   */
  @Get()
  list(
    @Query({ schema: listUsersQuerySchema }) query: ListUsersQuery,
  ): Promise<readonly User[] | UserPage> {
    if (query.page === undefined && query.search === undefined) {
      return this.users.findAll();
    }
    return this.users.findPage(query);
  }

  /** A single User by id; an id that is not a number is rejected, not treated as absent. */
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.users.findById(id);
  }

  /**
   * Creates a User from a body validated against the shared creation schema —
   * the same rules the form applies — assigns the next id and returns it.
   */
  @Post()
  create(@Body({ schema: createUserSchema }) input: CreateUser): Promise<User> {
    return this.users.create(input);
  }
}
