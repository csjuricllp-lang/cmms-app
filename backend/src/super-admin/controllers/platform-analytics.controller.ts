import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformAnalyticsService } from '../services/platform-analytics.service';
import { SystemAdminGuard } from '../guards/system-admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('system/metrics')
@UseGuards(JwtAuthGuard, SystemAdminGuard)
export class PlatformAnalyticsController {
  constructor(private readonly platformAnalyticsService: PlatformAnalyticsService) {}

  @Get()
  async getMetrics() {
    return this.platformAnalyticsService.getMetricsSnapshot();
  }
}
