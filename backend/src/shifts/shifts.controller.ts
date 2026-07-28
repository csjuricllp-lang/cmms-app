import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Get()
  findAll(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.shiftsService.findAll(organizationId);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.shiftsService.findOne(id, organizationId);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Post()
  create(@Request() req, @Body() data: { name: string; startTime: string; endTime: string; workDays: number[] }) {
    const organizationId = req.user.organizationId;
    return this.shiftsService.create(organizationId, data);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() data: { name?: string; startTime?: string; endTime?: string; workDays?: number[] },
  ) {
    const organizationId = req.user.organizationId;
    return this.shiftsService.update(id, organizationId, data);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.shiftsService.delete(id, organizationId);
  }
}
