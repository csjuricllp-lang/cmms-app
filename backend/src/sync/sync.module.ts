import { Module, Global } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SyncProcessor } from './sync.processor';
import { ConflictResolverService } from './conflict-resolver.service';
import { ChangeLogService } from './change-log.service';
import { BullModule } from '@nestjs/bullmq';

@Global()
@Module({
  providers: [
    { provide: 'BullQueue_sync-queue', useValue: { add: async () => ({}) } },
    SyncService,
    ConflictResolverService,
    ChangeLogService,
  ],
  controllers: [SyncController],
  exports: [SyncService, ConflictResolverService, ChangeLogService],
})
export class SyncModule {}
