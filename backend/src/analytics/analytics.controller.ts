import { Controller, Get, UseGuards, Logger, Req, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CheckPermissions } from '../auth/decorators/check-permissions.decorator';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @CheckPermissions('analytics.read')
  @Get('dashboard')
  async getDashboardStats(@Req() req: any, @Query() filters: any) {
    const organizationId = req.user.organizationId;
    console.log(`[AnalyticsController] GET /dashboard - User: ${req.user.userId}, Org: ${organizationId}`);
    console.log(`[AnalyticsController] Filters: ${JSON.stringify(filters)}`);

    const stats = await this.analyticsService.getDashboardStats(organizationId, filters);

    return {
      status: 'success',
      message: 'Access Granted: PBAC/JWT verified.',
      timestamp: new Date().toISOString(),
      user: {
        id: req.user.userId,
        orgId: organizationId,
        permissions: req.user.permissions,
      },
      data: stats,
    };
  }
}
