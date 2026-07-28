import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApprovalChainsService } from './approval-chains.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('approval-chains')
export class ApprovalChainsController {
  constructor(private readonly approvalChainsService: ApprovalChainsService) {}

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Get()
  findAll(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.approvalChainsService.findAll(organizationId);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.approvalChainsService.findOne(id, organizationId);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Post()
  create(
    @Request() req,
    @Body()
    data: {
      name: string;
      description?: string;
      module: 'WORK_ORDER' | 'PURCHASE_ORDER';
      triggerAmount?: number;
      steps: { role: string; order: number }[];
    },
  ) {
    const organizationId = req.user.organizationId;
    return this.approvalChainsService.create(organizationId, data);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      description?: string;
      module?: 'WORK_ORDER' | 'PURCHASE_ORDER';
      triggerAmount?: number;
      steps?: { role: string; order: number }[];
    },
  ) {
    const organizationId = req.user.organizationId;
    return this.approvalChainsService.update(id, organizationId, data);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.approvalChainsService.delete(id, organizationId);
  }
}
