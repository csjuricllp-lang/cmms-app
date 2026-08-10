import { Injectable } from '@nestjs/common';
import { Priority } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';
import { DateService } from '../common/date.service';

@Injectable()
export class SLAService {
  constructor(
    private settingsService: SettingsService,
    private dateService: DateService,
  ) {}

  /**
   * Calculate SLA targets based on priority
   */
  async calculateTargets(
    priority: Priority,
    vendor?: { slaResponseHours?: number; slaResolutionHours?: number },
  ): Promise<{ responseTimeTarget: Date; resolutionTimeTarget: Date }> {
    const now = this.dateService.now();
    let responseHours = 24;
    let resolutionHours = 72;

    switch (priority) {
      case 'CRITICAL':
        responseHours = await this.settingsService.getNumber('sla_critical_response_hours', 1);
        resolutionHours = await this.settingsService.getNumber('sla_critical_resolution_hours', 4);
        break;
      case 'HIGH':
        responseHours = await this.settingsService.getNumber('sla_high_response_hours', 4);
        resolutionHours = await this.settingsService.getNumber('sla_high_resolution_hours', 24);
        break;
      case 'MEDIUM':
        responseHours = await this.settingsService.getNumber('sla_medium_response_hours', 24);
        resolutionHours = await this.settingsService.getNumber('sla_medium_resolution_hours', 72);
        break;
      case 'LOW':
        responseHours = await this.settingsService.getNumber('sla_low_response_hours', 72);
        resolutionHours = await this.settingsService.getNumber('sla_low_resolution_hours', 168); // 7 days
        break;
    }

    // --- VENDOR OVERRIDE: Prioritize Vendor-specific SLAs over defaults ---
    if (vendor?.slaResponseHours) responseHours = vendor.slaResponseHours;
    if (vendor?.slaResolutionHours) resolutionHours = vendor.slaResolutionHours;

    const responseTimeTarget = new Date(
      now.getTime() + responseHours * 60 * 60 * 1000,
    );
    const resolutionTimeTarget = new Date(
      now.getTime() + resolutionHours * 60 * 60 * 1000,
    );

    return { responseTimeTarget, resolutionTimeTarget };
  }

  /**
   * Calculate Mean Waiting Time (MWT) from a list of work orders.
   * Returns the MWT in hours.
   */
  calculateMWT(workOrders: { createdAt: Date; startDate: Date | null }[]): number {
    if (!workOrders || workOrders.length === 0) return 0;
    
    let totalWaitTimeMs = 0;
    let count = 0;

    for (const wo of workOrders) {
      if (wo.startDate && wo.createdAt) {
        const created = new Date(wo.createdAt).getTime();
        const started = new Date(wo.startDate).getTime();
        totalWaitTimeMs += Math.max(0, started - created);
        count++;
      }
    }

    if (count === 0) return 0;
    return Number((totalWaitTimeMs / count / (1000 * 60 * 60)).toFixed(2));
  }
}
