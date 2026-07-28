import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenancyContext } from '../common/tenancy.context';

import { AllowAnyRole } from '../auth/decorators/allow-any-role.decorator';

@Controller('sync')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * Batched offline changes push.
   */
  @AllowAnyRole()
  @Post('push')
  push(@Body() payload: any[], @Headers('x-device-id') deviceId: string) {
    if (!deviceId) throw new UnauthorizedException('Device ID required');
    const userId = TenancyContext.userOrgId; // Or userId, depending on mapping

    return this.syncService.push(payload, deviceId, userId);
  }

  /**
   * Delta pull: Retrieves changes since last sync.
   */
  @AllowAnyRole()
  @Get('pull')
  pull(
    @Query('lastSyncAt') lastSyncAt: string,
    @Headers('x-device-id') deviceId: string,
  ) {
    if (!deviceId) throw new UnauthorizedException('Device ID required');

    // Default to 1 day ago if not provided
    const date = lastSyncAt
      ? new Date(lastSyncAt)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.syncService.pull(date, deviceId);
  }
}
