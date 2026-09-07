import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { USER_ROLES } from '@pdr-cloud/shared';
import { z } from 'zod';

@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'The Roles the directory knows' })
  @ApiOkResponse({
    description: 'The three Roles',
    standardSchema: z.object({ roles: z.array(z.enum(USER_ROLES)) }),
  })
  getRoles() {
    return { roles: USER_ROLES };
  }
}
