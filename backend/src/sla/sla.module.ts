import { Module } from '@nestjs/common';
import { SLAService } from './sla.service';
import { SLAScheduler } from './sla.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, QueuesModule, ScheduleModule.forRoot(), SettingsModule],
  providers: [SLAService, SLAScheduler],
  exports: [SLAService],
})
export class SLAModule {}
