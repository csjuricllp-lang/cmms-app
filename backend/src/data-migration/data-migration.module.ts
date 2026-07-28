import { Module } from '@nestjs/common';
import { DataMigrationController } from './data-migration.controller';
import { DataMigrationService } from './data-migration.service';

@Module({
  controllers: [DataMigrationController],
  providers: [DataMigrationService],
})
export class DataMigrationModule {}
