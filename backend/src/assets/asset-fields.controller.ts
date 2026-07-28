import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AssetFieldsService } from './asset-fields.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';
import { TenancyContext } from '../common/tenancy.context';

@Controller('asset-fields')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AssetFieldsController {
  constructor(private readonly assetFieldsService: AssetFieldsService) {}

  @RequirePermissions(Permission.READ_ASSET)
  @Get()
  findAll(@Query('entityType') entityType?: string) {
    const organizationId = TenancyContext.organizationId;
    return this.assetFieldsService.findAll(organizationId, entityType || 'ASSET');
  }

  @RequirePermissions(Permission.UPDATE_ASSET)
  @Post()
  create(@Body() data: any) {
    const organizationId = TenancyContext.organizationId;
    return this.assetFieldsService.create(organizationId, data);
  }

  @RequirePermissions(Permission.UPDATE_ASSET)
  @Delete(':id')
  remove(@Param('id') id: string) {
    const organizationId = TenancyContext.organizationId;
    return this.assetFieldsService.remove(id, organizationId);
  }
}
