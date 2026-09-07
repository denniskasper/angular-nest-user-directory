import { Module } from '@nestjs/common';
import { FileUsersRepository } from './file-users.repository';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { USERS_STORE_PATH, usersStorePathFromEnv } from './users-store-path';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USERS_STORE_PATH, useFactory: usersStorePathFromEnv },
    { provide: UsersRepository, useClass: FileUsersRepository },
  ],
})
export class UsersModule {}
