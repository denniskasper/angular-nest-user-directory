import { Module } from '@nestjs/common';
import { SeedUsersRepository } from './seed-users.repository';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: UsersRepository, useClass: SeedUsersRepository },
  ],
})
export class UsersModule {}
