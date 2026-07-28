import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TenancyInterceptor } from './common/tenancy.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LocationsModule } from './locations/locations.module';
import { SettingsModule } from './settings/settings.module';
import { FilesModule } from './files/files.module';
import { AssetsModule } from './assets/assets.module';
import { MetersModule } from './meters/meters.module';
import { VendorsModule } from './vendors/vendors.module';
import { CustomersModule } from './customers/customers.module';
import { PartsModule } from './parts/parts.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { PMModule } from './pm/pm.module';
import { RequestsModule } from './requests/requests.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DataMigrationModule } from './data-migration/data-migration.module';
import { TeamsModule } from './teams/teams.module';
import { InvitationsModule } from './invitations/invitations.module';
import { MailModule } from './mail/mail.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SLAModule } from './sla/sla.module';
import { EventsModule } from './events/events.module';
import { QueuesModule } from './queues/queues.module';
import { FeatureFlagModule } from './feature-flags/feature-flag.module';
import { InventoryModule } from './inventory/inventory.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ReportingModule } from './reporting/reporting.module';
import { ApiModule } from './api/api.module';
import { WebhookModule } from './webhooks/webhook.module';
import { SyncModule } from './sync/sync.module';
import { PreventiveMaintenanceModule } from './preventive-maintenance/preventive-maintenance.module';
import { CategoriesModule } from './categories/categories.module';
import { SavedViewsModule } from './saved-views/saved-views.module';
import { CustomStatusesModule } from './custom-statuses/custom-statuses.module';
import { ImportModule } from './import/import.module';
import { SearchModule } from './search/search.module';
import { CommonModule } from './common/common.module';
import { ShiftsModule } from './shifts/shifts.module';
import { SsoModule } from './sso/sso.module';
import { ApprovalChainsModule } from './approval-chains/approval-chains.module';

import { ThrottlerModule } from '@nestjs/throttler';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLER_TTL || '60000', 10),
        limit: parseInt(process.env.THROTTLER_LIMIT || '10', 10),
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    LocationsModule,
    SettingsModule,
    FilesModule,
    AssetsModule,
    MetersModule,
    VendorsModule,
    CustomersModule,
    PartsModule,
    PurchaseOrdersModule,
    ChecklistsModule,
    WorkOrdersModule,
    PMModule,
    RequestsModule,
    AnalyticsModule,
    DataMigrationModule,
    TeamsModule,
    InvitationsModule,
    MailModule,
    AuditLogsModule,
    NotificationsModule,
    SLAModule,
    EventsModule,
    QueuesModule,
    FeatureFlagModule,
    InventoryModule,
    WorkflowModule,
    ReportingModule,
    ApiModule,
    WebhookModule,
    SyncModule,
    PreventiveMaintenanceModule,
    CategoriesModule,
    SavedViewsModule,
    CustomStatusesModule,
    ImportModule,
    SearchModule,
    CommonModule,
    ShiftsModule,
    ApprovalChainsModule,
    SsoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenancyInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
