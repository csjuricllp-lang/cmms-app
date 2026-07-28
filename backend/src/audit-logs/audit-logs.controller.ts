import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(
    @Query('model') model?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.auditLogsService.findAll(model, userId, action);
  }

  @RequirePermissions() // Allow any authenticated user to see historical entity activity
  @Get('entity')
  findByEntity(@Query('model') model: string, @Query('id') id: string) {
    return this.auditLogsService.findByEntity(model, id);
  }
}
