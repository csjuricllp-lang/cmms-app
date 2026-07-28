import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
} from './dto/purchase-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @RequirePermissions(Permission.CREATE_PO)
  @Post()
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(createPurchaseOrderDto);
  }

  @RequirePermissions(Permission.READ_PO)
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string | string[],
    @Query('tags') tags?: string | string[],
  ) {
    return this.purchaseOrdersService.findAll({ search, status, tags });
  }

  @RequirePermissions(Permission.READ_PO)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @RequirePermissions(Permission.UPDATE_PO)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(id, updatePurchaseOrderDto);
  }

  /**
   * Fulfillment: Restock inventory when parts are delivered to the warehouse.
   */
  @RequirePermissions(Permission.UPDATE_PO)
  @Post(':id/receive')
  receiveItems(@Param('id') id: string, @Body() dto: ReceivePurchaseOrderDto) {
    return this.purchaseOrdersService.receiveItems(id, dto);
  }

  @RequirePermissions(Permission.UPDATE_PO)
  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.purchaseOrdersService.approve(id);
  }

  @RequirePermissions(Permission.UPDATE_PO)
  @Post(':id/deny')
  deny(@Param('id') id: string) {
    return this.purchaseOrdersService.deny(id);
  }

  @RequirePermissions(Permission.CREATE_PO)
  @Post('bulk-generate')
  bulkGenerate(
    @Body() dto: { partRequests: { partId: string; quantity: number }[] },
  ) {
    return this.purchaseOrdersService.bulkGenerate(dto);
  }

  @RequirePermissions(Permission.UPDATE_PO)
  @Post(':id/sync-quickbooks')
  syncQuickBooks(@Param('id') id: string) {
    return this.purchaseOrdersService.syncQuickBooks(id);
  }

  @RequirePermissions(Permission.UPDATE_PO)
  @Post(':id/send')
  sendToVendor(@Param('id') id: string) {
    return this.purchaseOrdersService.sendToVendor(id);
  }

  @RequirePermissions(Permission.DELETE_PO)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.purchaseOrdersService.remove(id);
  }
}
