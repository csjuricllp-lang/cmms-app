import { Controller, Get, Param, Query, UseGuards, Patch, Body } from '@nestjs/common';
import { OrganizationsAdminService } from '../services/organizations-admin.service';
import { SystemAdminGuard } from '../guards/system-admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('system/organizations')
@UseGuards(JwtAuthGuard, SystemAdminGuard)
export class OrganizationsAdminController {
  constructor(private readonly orgAdminService: OrganizationsAdminService) {}

  @Get()
  async findAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.orgAdminService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orgAdminService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION',
    @Body('reason') reason?: string
  ) {
    return this.orgAdminService.updateStatus(id, status, reason);
  }

  @Patch(':id/tier')
  async updateTier(
    @Param('id') id: string,
    @Body('planId') planId: string
  ) {
    return this.orgAdminService.updateTier(id, planId);
  }
}
