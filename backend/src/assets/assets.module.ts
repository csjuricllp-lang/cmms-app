import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetFieldsController } from './asset-fields.controller';
import { AssetFieldsService } from './asset-fields.service';
import { AssetSchedulesController } from './asset-schedules.controller';
import { AssetSchedulesService } from './asset-schedules.service';

@Module({
  controllers: [AssetsController, AssetFieldsController, AssetSchedulesController],
  providers: [AssetsService, AssetFieldsService, AssetSchedulesService],
  exports: [AssetsService, AssetFieldsService, AssetSchedulesService],
})
export class AssetsModule {}
