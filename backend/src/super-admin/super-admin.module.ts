import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformAnalyticsController } from './controllers/platform-analytics.controller';
import { OrganizationsAdminController } from './controllers/organizations-admin.controller';
import { UsersAdminController } from './controllers/users-admin.controller';
import { ImpersonationController } from './controllers/impersonation.controller';
import { PlatformAnalyticsService } from './services/platform-analytics.service';
import { OrganizationsAdminService } from './services/organizations-admin.service';
import { UsersAdminService } from './services/users-admin.service';
import { ImpersonationService } from './services/impersonation.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    PlatformAnalyticsController,
    OrganizationsAdminController,
    UsersAdminController,
    ImpersonationController,
  ],
  providers: [
    PlatformAnalyticsService,
    OrganizationsAdminService,
    UsersAdminService,
    ImpersonationService,
  ],
})
export class SuperAdminModule {}
