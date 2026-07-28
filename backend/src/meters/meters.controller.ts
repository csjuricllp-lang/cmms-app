import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MetersService } from './meters.service';
import { CreateMeterDto } from './dto/create-meter.dto';
import { UpdateMeterDto } from './dto/update-meter.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('meters')
export class MetersController {
  constructor(private readonly metersService: MetersService) {}

  @RequirePermissions(Permission.UPDATE_ASSET) // Managing an asset's meters requires asset update perms
  @Post()
  create(@Body() createMeterDto: CreateMeterDto) {
    return this.metersService.create(createMeterDto);
  }

  @RequirePermissions(Permission.READ_ASSET)
  @Get()
  findAll() {
    return this.metersService.findAll();
  }

  @RequirePermissions(Permission.READ_ASSET)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.metersService.findOne(id);
  }

  @RequirePermissions(Permission.READ_ASSET)
  @Get(':id/readings')
  getReadings(@Param('id') id: string) {
    return this.metersService.getReadings(id);
  }

  @RequirePermissions(Permission.UPDATE_ASSET)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMeterDto: UpdateMeterDto) {
    return this.metersService.update(id, updateMeterDto);
  }

  @RequirePermissions(Permission.UPDATE_ASSET)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.metersService.remove(id);
  }

  @RequirePermissions(Permission.UPDATE_ASSET)
  @Post(':id/readings')
  addReading(
    @Request() req,
    @Param('id') id: string,
    @Body() readingData: { value: number },
  ) {
    return this.metersService.addReading(
      {
        value: readingData.value,
        meterId: id,
      },
      req.user?.userOrgId,
    );
  }
}
