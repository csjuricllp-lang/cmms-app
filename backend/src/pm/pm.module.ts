import { Module, Global } from '@nestjs/common';
import { PMService } from './pm.service';
import { PMController } from './pm.controller';
import { PMScheduler } from './pm.scheduler';
import { WorkOrdersModule } from '../work-orders/work-orders.module';

@Global()
@Module({
  imports: [WorkOrdersModule],
  providers: [
    { provide: 'BullQueue_pm', useValue: { add: async () => ({}) } },
    PMService,
    PMScheduler,
  ],
  controllers: [PMController],
  exports: [PMService],
})
export class PMModule {}
