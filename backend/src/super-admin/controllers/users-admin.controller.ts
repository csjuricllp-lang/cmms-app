import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersAdminService } from '../services/users-admin.service';
import { SystemAdminGuard } from '../guards/system-admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('system/users')
@UseGuards(JwtAuthGuard, SystemAdminGuard)
export class UsersAdminController {
  constructor(private readonly usersAdminService: UsersAdminService) {}

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    return this.usersAdminService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }
}
