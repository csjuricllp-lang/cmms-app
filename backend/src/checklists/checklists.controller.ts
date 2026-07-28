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
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto, UpdateChecklistDto } from './dto/checklist.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @RequirePermissions(Permission.CREATE_CHECKLIST)
  @Post()
  create(@Body() createChecklistDto: CreateChecklistDto) {
    return this.checklistsService.create(createChecklistDto);
  }

  @RequirePermissions(Permission.CREATE_CHECKLIST)
  @Post('generate')
  generateSmartChecklist(@Body() body: { prompt: string; assetId?: string }) {
    return this.checklistsService.generateSmartChecklist(body.prompt, body.assetId);
  }

  @RequirePermissions(Permission.READ_CHECKLIST)
  @Get()
  findAll() {
    return this.checklistsService.findAll();
  }

  @RequirePermissions(Permission.READ_CHECKLIST)
  @Get('templates')
  getTemplates() {
    return this.checklistsService.getTemplates();
  }

  @RequirePermissions(Permission.READ_CHECKLIST)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checklistsService.findOne(id);
  }

  @RequirePermissions(Permission.UPDATE_CHECKLIST)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ) {
    return this.checklistsService.update(id, updateChecklistDto);
  }

  @RequirePermissions(Permission.DELETE_CHECKLIST)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklistsService.remove(id);
  }
}
