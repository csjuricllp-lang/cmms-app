import { Module } from '@nestjs/common';
import { MetersController } from './meters.controller';
import { MetersService } from './meters.service';
import { PreventiveMaintenanceModule } from '../preventive-maintenance/preventive-maintenance.module';

@Module({
  imports: [PreventiveMaintenanceModule],
  controllers: [MetersController],
  providers: [MetersService],
})
export class MetersModule {}
