import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { Permission } from '../auth/permissions/permission.enum';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/permissions/permissions.constants';

@Controller('feature-flags')
@UseGuards(PermissionsGuard)
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Get(':key/enabled')
  async isEnabled(@Param('key') key: string) {
    const enabled = await this.featureFlagService.isEnabled(key);
    return { key, enabled };
  }

  @Post(':key')
  @RequirePermissions(Permissions.FEATURE_FLAGS.MANAGE)
  async updateFlag(
    @Param('key') key: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.featureFlagService.updateFlag(key, enabled);
  }
}
