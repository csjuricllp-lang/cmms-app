import { Controller, Get, Patch, Param, UseGuards, Post, Body, Headers } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenancyContext } from '../common/tenancy.context';

import { AllowAnyRole } from '../auth/decorators/allow-any-role.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService
  ) {}

  @AllowAnyRole()
  @Get()
  async findAll() {
    const userId = TenancyContext.userOrgId;
    const organizationId = TenancyContext.organizationId || '';
    return this.notificationsService.findAllForUser(userId, organizationId);
  }

  @AllowAnyRole()
  @Post('push-subscribe')
  async subscribe(
    @Body() subscription: any,
    @Headers('x-device-id') deviceId: string
  ) {
    const userId = TenancyContext.userOrgId;
    const organizationId = TenancyContext.organizationId || '';
    return this.pushNotificationService.subscribe(userId, organizationId, deviceId, subscription);
  }

  @AllowAnyRole()
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    const userId = TenancyContext.userOrgId;
    return this.notificationsService.markAsRead(id, userId);
  }

  @AllowAnyRole()
  @Patch('read-all')
  async markAllAsRead() {
    const userId = TenancyContext.userOrgId;
    return this.notificationsService.markAllAsRead(userId);
  }
}
