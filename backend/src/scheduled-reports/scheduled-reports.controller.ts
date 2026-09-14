import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ScheduledReportsService } from './scheduled-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';
import { AllowAnyRole } from '../auth/decorators/allow-any-role.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('scheduled-reports')
export class ScheduledReportsController {
  constructor(private readonly scheduledReportsService: ScheduledReportsService) {}

  @RequirePermissions(Permission.VIEW_ANALYTICS)
  @Post()
  create(@Request() req, @Body() createDto: any) {
    return this.scheduledReportsService.create(req.user.organizationId, createDto);
  }

  @AllowAnyRole()
  @Get()
  findAll(@Request() req) {
    return this.scheduledReportsService.findAll(req.user.organizationId);
  }

  @AllowAnyRole()
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.scheduledReportsService.findOne(req.user.organizationId, id);
  }

  @RequirePermissions(Permission.VIEW_ANALYTICS)
  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateDto: any) {
    return this.scheduledReportsService.update(req.user.organizationId, id, updateDto);
  }

  @RequirePermissions(Permission.VIEW_ANALYTICS)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.scheduledReportsService.remove(req.user.organizationId, id);
  }
}
