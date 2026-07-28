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
import { PartQueryDto } from './dto/part-query.dto';
import { PartsService } from './parts.service';
import { 
  CreatePartDto, 
  UpdatePartDto, 
  AdjustStockDto, 
  AddInventoryLineDto, 
  UpdateInventoryLineDto 
} from './dto/part.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';
import { FilesService } from '../files/files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { TenancyContext } from '../common/tenancy.context';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('parts')
export class PartsController {
  constructor(
    private readonly partsService: PartsService,
    private readonly filesService: FilesService,
  ) {}

  @RequirePermissions(Permission.CREATE_PART)
  @Post()
  create(@Body() createPartDto: CreatePartDto) {
    return this.partsService.create(createPartDto);
  }

  @RequirePermissions(Permission.READ_PART)
  @Get()
  findAll(@Query() query: PartQueryDto) {
    return this.partsService.findAll(query);
  }

  @RequirePermissions(Permission.READ_PART)
  @Get('barcode/:code')
  findByBarcode(@Param('code') code: string) {
    return this.partsService.findByBarcode(code);
  }

  @RequirePermissions(Permission.READ_PART)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartDto: UpdatePartDto) {
    return this.partsService.update(id, updatePartDto);
  }

  @RequirePermissions(Permission.DELETE_PART)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partsService.remove(id);
  }

  @RequirePermissions(Permission.READ_PART)
  @Get(':id/transactions')
  getTransactions(@Param('id') id: string) {
    return this.partsService.getTransactions(id);
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Post(':id/adjust')
  adjustStock(
    @Param('id') id: string,
    @Body() body: AdjustStockDto,
  ) {
    return this.partsService.adjustStock(
      id,
      body.quantity,
      body.type,
      body.referenceId,
      body.notes,
    );
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Post(':id/inventory-lines')
  addInventoryLine(@Param('id') id: string, @Body() body: AddInventoryLineDto) {
    return this.partsService.addInventoryLine(id, body);
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Patch('inventory-lines/:lineId')
  updateInventoryLine(@Param('lineId') id: string, @Body() body: UpdateInventoryLineDto) {
    return this.partsService.updateInventoryLine(id, body);
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Delete('inventory-lines/:lineId')
  removeInventoryLine(@Param('lineId') id: string) {
    return this.partsService.removeInventoryLine(id);
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Post(':id/assets')
  linkAsset(
    @Param('id') id: string,
    @Body() body: { assetId: string; inventoryLineId?: string },
  ) {
    return this.partsService.linkAsset(id, body.assetId, body.inventoryLineId);
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Delete('assets/:linkId')
  unlinkAsset(@Param('linkId') id: string) {
    return this.partsService.unlinkAsset(id);
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  async addFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileInfo = await this.filesService.uploadFile(file, `parts/${id}`);
    return this.partsService.addFile(id, fileInfo);
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Delete('files/:fileId')
  async removeFile(@Param('fileId') fileId: string) {
    return this.partsService.removeFile(fileId);
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Post('auto-group')
  async autoGroup() {
    const organizationId = TenancyContext.organizationId;
    if (!organizationId) {
      throw new Error('Organization context is missing.');
    }
    return this.partsService.autoGroupParts(organizationId);
  }

  @RequirePermissions(Permission.READ_PART)
  @Get(':id/purchase-history')
  async getPurchaseHistory(@Param('id') id: string) {
    const organizationId = TenancyContext.organizationId;
    if (!organizationId) {
      throw new Error('Organization context is missing.');
    }
    return this.partsService.getPurchaseHistory(id, organizationId);
  }

  @RequirePermissions(Permission.UPDATE_PART)
  @Post('sync-allocated')
  async syncAllocated() {
    const organizationId = TenancyContext.organizationId;
    if (!organizationId) {
      throw new Error('Organization context is missing.');
    }
    return this.partsService.syncAllocatedQuantities(organizationId);
  }
}
