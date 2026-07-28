import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DataMigrationService } from './data-migration.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('data-migration')
export class DataMigrationController {
  constructor(private readonly migrationService: DataMigrationService) {}

  @RequirePermissions(Permission.MANAGE_DATA_IMPORT_EXPORT)
  @Get('export/assets')
  exportAssets() {
    return this.migrationService.exportAssets();
  }

  @RequirePermissions(Permission.MANAGE_DATA_IMPORT_EXPORT)
  @Post('import/assets')
  importAssets(@Body() assetsData: any[]) {
    return this.migrationService.importAssets(assetsData);
  }
}
