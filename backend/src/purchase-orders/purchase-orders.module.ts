import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PublicPurchaseOrdersController } from './public-purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

import { AutoReorderService } from './auto-reorder.service';

@Module({
  controllers: [PurchaseOrdersController, PublicPurchaseOrdersController],
  providers: [PurchaseOrdersService, AutoReorderService],
})
export class PurchaseOrdersModule {}
