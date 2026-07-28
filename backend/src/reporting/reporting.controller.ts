import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import * as express from 'express';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permissions } from '../auth/permissions/permissions.constants';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @RequirePermissions(Permissions.REPORTS.VIEW)
  @Get('dashboard')
  getDashboard() {
    return this.reportingService.getDashboardStats();
  }

  @RequirePermissions(Permissions.REPORTS.VIEW)
  @Get('mttr')
  getMTTR(@Query('days') days?: number) {
    return this.reportingService.getMTTR(days || 30);
  }

  @RequirePermissions(Permissions.REPORTS.VIEW)
  @Get('costs')
  getCosts(@Query('days') days?: number) {
    return this.reportingService.getCostAnalytics(days || 30);
  }

  @RequirePermissions(Permissions.REPORTS.VIEW)
  @Get('downtime')
  getTopDowntime() {
    return this.reportingService.getTopDowntimeAssets();
  }

  @RequirePermissions(Permissions.REPORTS.VIEW)
  @Get('reliability-report/pdf')
  async getReliabilityPdf(@Res() res: express.Response) {
    return this.reportingService.generateReliabilityReport(res as any);
  }
}
