import { Controller, Get, Post, Patch, Body, Param, Delete, Query, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { SavedViewsService } from './saved-views.service';
import { CreateSavedViewDto, UpdateSavedViewDto } from './dto/saved-view.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

import { AllowAnyRole } from '../auth/decorators/allow-any-role.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('saved-views')
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @AllowAnyRole()
  @Post()
  create(@Request() req, @Body() createSavedViewDto: CreateSavedViewDto) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) throw new UnauthorizedException('User identity is required.');
    return this.savedViewsService.create(userId, userRole, createSavedViewDto);
  }

  @AllowAnyRole()
  @Get()
  findAll(@Request() req, @Query('entityType') entityType: string) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User identity is required.');
    return this.savedViewsService.findAll(userId, entityType);
  }

  @AllowAnyRole()
  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateSavedViewDto) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) throw new UnauthorizedException('User identity is required.');
    return this.savedViewsService.update(userId, userRole, id, updateDto);
  }

  @AllowAnyRole()
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) throw new UnauthorizedException('User identity is required.');
    return this.savedViewsService.remove(userId, userRole, id);
  }
}
