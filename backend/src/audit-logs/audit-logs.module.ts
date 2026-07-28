import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '../files/files.module';

import { AuditArchiverService } from './audit-archiver.service';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditArchiverService],
  exports: [AuditLogsService, AuditArchiverService],
})
export class AuditLogsModule {}
