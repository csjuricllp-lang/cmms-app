import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CustomStatusesService } from './custom-statuses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('custom-statuses')
export class CustomStatusesController {
  constructor(private readonly statusesService: CustomStatusesService) {}

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Get()
  findAll(@Request() req) {
    return this.statusesService.findAll(req.user.organizationId);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Post()
  create(@Request() req, @Body() data: any) {
    return this.statusesService.create(req.user.organizationId, data);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.statusesService.delete(id, req.user.organizationId);
  }
}
