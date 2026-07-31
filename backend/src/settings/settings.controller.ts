import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AllowAnyRole } from '../auth/decorators/allow-any-role.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Post()
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(createSettingDto);
  }

  @AllowAnyRole()
  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @AllowAnyRole()
  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Patch(':key')
  update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.update(key, updateSettingDto);
  }

  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}
