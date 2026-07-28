import { Module } from '@nestjs/common';
import { CustomStatusesController } from './custom-statuses.controller';
import { CustomStatusesService } from './custom-statuses.service';

@Module({
  controllers: [CustomStatusesController],
  providers: [CustomStatusesService],
  exports: [CustomStatusesService],
})
export class CustomStatusesModule {}
