import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import * as express from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';
import { ImportService } from './import.service';

@Controller('import')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) { }

  @RequirePermissions(Permission.MANAGE_DATA_IMPORT_EXPORT)
  @Post('teams-personnel')
  @UseInterceptors(FileInterceptor('file'))
  async importTeamsAndPersonnel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.importService.processTeamsAndPersonnel(file);
  }

  @RequirePermissions(Permission.MANAGE_DATA_IMPORT_EXPORT)
  @Post('assets')
  @UseInterceptors(FileInterceptor('file'))
  async importAssets(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.importService.processAssets(file);
  }

  @Post('export-teams')
  async exportTeams(@Res() res: express.Response) {
    const buffer = await this.importService.generateTeamsExport();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="teams_export.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('download-template')
  async downloadTemplate(@Res() res: express.Response) {
    const buffer = await this.importService.generateTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="migration_template.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
