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
} from '@nestjs/common';
import { PreventiveMaintenanceService } from './preventive-maintenance.service';
import {
  CreatePMScheduleDto,
  UpdatePMScheduleDto,
} from './dto/pm-schedule.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('preventive-maintenance')
export class PreventiveMaintenanceController {
  constructor(private readonly pmService: PreventiveMaintenanceService) {}

  @RequirePermissions(Permission.CREATE_PM)
  @Post()
  create(@Body() createPMScheduleDto: CreatePMScheduleDto) {
    return this.pmService.create(createPMScheduleDto);
  }

  @RequirePermissions(Permission.READ_PM)
  @Get()
  findAll() {
    return this.pmService.findAll();
  }

  @RequirePermissions(Permission.READ_PM)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pmService.findOne(id);
  }

  @RequirePermissions(Permission.UPDATE_PM)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePMScheduleDto: UpdatePMScheduleDto,
  ) {
    return this.pmService.update(id, updatePMScheduleDto);
  }

  @RequirePermissions(Permission.DELETE_PM)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pmService.remove(id);
  }

  @RequirePermissions(Permission.UPDATE_PM)
  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `pm-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  addAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.pmService.addAttachment(id, file);
  }

  @RequirePermissions(Permission.UPDATE_PM)
  @Delete(':id/attachments/:fileId')
  removeAttachment(@Param('id') id: string, @Param('fileId') fileId: string) {
    return this.pmService.removeAttachment(id, fileId);
  }

  @RequirePermissions(Permission.CREATE_PM)
  @Post('trigger-process')
  triggerProcess() {
    return this.pmService.processDueSchedules();
  }
}
