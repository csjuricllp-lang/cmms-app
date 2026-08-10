import { Module } from '@nestjs/common';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrderLifecycleService } from './work-order-lifecycle.service';
import { WorkOrderFinanceService } from './work-order-finance.service';
import { WorkOrderCollaborationService } from './work-order-collaboration.service';
import { WorkOrderSchedulerService } from './work-order-scheduler.service';
import { SLAModule } from '../sla/sla.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ChecklistsModule } from '../checklists/checklists.module';
import { SettingsModule } from '../settings/settings.module';
import { FailureCodesController } from './failure-codes.controller';
import { FailureCodesService } from './failure-codes.service';

import { DeferredMaintenanceScheduler } from './deferred-maintenance.scheduler';

@Module({
  imports: [SLAModule, EventsModule, NotificationsModule, InventoryModule, ChecklistsModule, SettingsModule],
  controllers: [FailureCodesController, WorkOrdersController],
  providers: [
    WorkOrdersService,
    WorkOrderLifecycleService,
    WorkOrderFinanceService,
    WorkOrderCollaborationService,
    WorkOrderSchedulerService,
    FailureCodesService,
    DeferredMaintenanceScheduler,
  ],
  exports: [WorkOrdersService, FailureCodesService],
})
export class WorkOrdersModule {}
