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
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  CreateUser,
  createUserSchema,
  storedUserSchema,
  User,
  UserPage,
  userPageSchema,
  validationFailureSchema,
} from '@pdr-cloud/shared';
import { z } from 'zod';
import { ListUsersQuery, listUsersQuerySchema } from './list-users-query';
import { UsersService } from './users.service';

/** What the list answers with: every User, or one page of matches. */
const listing = z.union([z.array(storedUserSchema), userPageSchema]);

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * Listing with no parameters returns the complete list; with a page or a
   * search term it returns that page of matches together with their total.
   */
  @Get()
  @ApiOperation({
    summary: 'List every User, or one page of those matching a search',
    description:
      'With no parameters, every User as an array. With page or search, one page of the Users whose Full Name contains the search term, ignoring case, together with the total number of matches.',
  })
  @ApiOkResponse({
    description: 'Every User, or one page of matches',
    standardSchema: listing,
  })
  @ApiBadRequestResponse({
    description: 'page is not a positive whole number',
    standardSchema: validationFailureSchema,
  })
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
  @ApiOperation({ summary: 'Fetch one User by id' })
  @ApiOkResponse({ description: 'The User', standardSchema: storedUserSchema })
  @ApiBadRequestResponse({ description: 'The id is not a number' })
  @ApiNotFoundResponse({ description: 'No User holds that id' })
  get(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.users.findById(id);
  }

  /**
   * Creates a User from a body validated against the shared creation schema —
   * the same rules the form applies — assigns the next id and returns it.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a User',
    description:
      'Validates the body against the shared creation schema, assigns the next id, and returns the created User.',
  })
  @ApiCreatedResponse({
    description: 'The created User, with its id',
    standardSchema: storedUserSchema,
  })
  @ApiBadRequestResponse({
    description: 'The body does not satisfy the creation schema',
    standardSchema: validationFailureSchema,
  })
  create(@Body({ schema: createUserSchema }) input: CreateUser): Promise<User> {
    return this.users.create(input);
  }
}
