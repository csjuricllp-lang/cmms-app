import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { AssetQueryDto } from './dto/asset-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateMeterReadingDto } from './dto/create-meter-reading.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @RequirePermissions(Permission.CREATE_ASSET)
  @Post()
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create(createAssetDto);
  }

  @RequirePermissions(Permission.READ_ASSET)
  @Get()
  findAll(@Query() query: AssetQueryDto) {
    return this.assetsService.findAll(query);
  }

  /** QR / Barcode scan — used by mobile apps in the field */
  @RequirePermissions(Permission.READ_ASSET)
  @Get('scan/:code')
  findByCode(@Param('code') code: string) {
    return this.assetsService.findByCode(code);
  }

  @RequirePermissions(Permission.READ_ASSET)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @RequirePermissions(Permission.READ_ASSET)
  @Get(':id/history')
  getStatusHistory(@Param('id') id: string) {
    return this.assetsService.getStatusHistory(id);
  }

  @RequirePermissions(Permission.READ_ASSET)
  @Get(':id/metrics')
  getMetrics(@Param('id') id: string) {
    return this.assetsService.getReliabilityMetrics(id);
  }

  @RequirePermissions(Permission.UPDATE_ASSET)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetsService.update(id, updateAssetDto);
  }

  /** Upload a photo / document attachment to an asset */
  @RequirePermissions(Permission.UPDATE_ASSET)
  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `asset-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  addAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assetsService.addAttachment(id, file);
  }

  /** Remove an attachment from an asset */
  @RequirePermissions(Permission.UPDATE_ASSET)
  @Delete(':id/attachments/:fileId')
  removeAttachment(@Param('id') id: string, @Param('fileId') fileId: string) {
    return this.assetsService.removeAttachment(id, fileId);
  }

  /** Log a meter reading — auto-triggers PM Work Order if threshold exceeded */
  @RequirePermissions(Permission.UPDATE_ASSET)
  @Post(':id/meters/:meterId/readings')
  logMeterReading(
    @Param('id') id: string,
    @Param('meterId') meterId: string,
    @Body() dto: CreateMeterReadingDto,
  ) {
    return this.assetsService.logMeterReading(
      id,
      meterId,
      dto.value,
      dto.notes,
    );
  }

  @RequirePermissions(Permission.DELETE_ASSET)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
