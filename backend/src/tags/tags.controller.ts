import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AllowAnyRole } from '../auth/decorators/allow-any-role.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @AllowAnyRole()
  @Get()
  findAll(@Request() req, @Query('model') model?: string) {
    return this.tagsService.findAll(req.user.organizationId, model);
  }

  @AllowAnyRole()
  @Post()
  create(@Request() req, @Body() data: any) {
    return this.tagsService.create(req.user.organizationId, {
      ...data,
      model: data.model || 'WORK_ORDER'
    });
  }

  @AllowAnyRole()
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.tagsService.delete(id, req.user.organizationId);
  }
}
