import { Controller, Get, Query, UseGuards, Request, Post, Patch, Body, Delete, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @RequirePermissions(Permission.READ_ASSET)
  @Get()
  findAll(@Request() req, @Query('type') type?: CategoryType) {
    const organizationId = req.user.organizationId;
    return this.categoriesService.findAll(organizationId, type);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Post()
  create(@Request() req, @Body() data: any) {
    const organizationId = req.user.organizationId;
    return this.categoriesService.create(organizationId, data);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() data: any) {
    const organizationId = req.user.organizationId;
    return this.categoriesService.update(id, organizationId, data);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.categoriesService.delete(id, organizationId);
  }
}
