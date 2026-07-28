import { Module, Global } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Global()
@Module({
  providers: [
    { provide: 'BullQueue_inventory', useValue: { add: async () => ({}) } },
    InventoryService,
  ],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
