import { Controller, Post, Body } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('public-portal/purchase-orders')
export class PublicPurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Public()
  @Post()
  async createPublicPO(@Body() body: any) {
    return this.purchaseOrdersService.createPublic(body);
  }
}
