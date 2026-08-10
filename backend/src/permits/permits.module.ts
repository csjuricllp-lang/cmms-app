import { Module } from '@nestjs/common';
import { PermitsController } from './permits.controller';
import { PermitsService } from './permits.service';
import { PermitsScheduler } from './permits.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationsModule,
    AuditLogsModule,
  ],
  controllers: [PermitsController],
  providers: [PermitsService, PermitsScheduler],
  exports: [PermitsService],
})
export class PermitsModule {}
