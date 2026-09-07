import { Controller, Get } from '@nestjs/common';
import { USER_ROLES } from '@pdr-cloud/shared';

@Controller()
export class AppController {
  @Get()
  getRoles() {
    return { roles: USER_ROLES };
  }
}
