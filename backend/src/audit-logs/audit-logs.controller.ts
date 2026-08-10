import { Controller, Get, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AllowAnyRole } from '../auth/decorators/allow-any-role.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Get()
  findAll(
    @Request() req,
    @Query('model') model?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const role = req.user?.role?.toUpperCase();
    if (role !== 'OWNER' && role !== 'ADMIN' && role !== 'ADMINISTRATOR') {
      throw new ForbiddenException('Only owners and administrators can view the audit log.');
    }
    return this.auditLogsService.findAll(model, userId, action, search, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @AllowAnyRole() // Allow any authenticated user to see historical entity activity
  @Get('entity')
  findByEntity(@Query('model') model: string, @Query('id') id: string) {
    return this.auditLogsService.findByEntity(model, id);
  }
}
