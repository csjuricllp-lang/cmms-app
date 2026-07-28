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
import { WorkOrderQueryDto } from './dto/work-order-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';
import { AddWorkOrderCommentDto } from './dto/add-comment.dto';
import { AddWorkOrderPartDto } from './dto/add-part.dto';
import { AddWorkOrderPartsDto } from './dto/add-parts.dto';
import { AddTimeLogDto } from './dto/add-time-log.dto';
import { AddExpenseDto } from './dto/add-expense.dto';
import { AddChecklistResponseDto } from './dto/add-checklist-response.dto';
import { AddLOTODto } from './dto/add-loto.dto';
import { BulkUpdateWorkOrdersDto } from './dto/bulk-update.dto';
import { AddLinkDto } from './dto/add-link.dto';
import { ProcessApprovalDto } from './dto/process-approval.dto';
import { SmartScheduleDto } from './dto/smart-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permissions } from '../auth/permissions/permissions.constants';
import { FeatureFlagGuard } from '../feature-flags/guards/feature-flag.guard';
import { Public } from '../auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard, FeatureFlagGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @RequirePermissions(Permissions.WORK_ORDERS.CREATE)
  @Post()
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.READ)
  @Get()
  findAll(@Query() query: WorkOrderQueryDto) {
    return this.workOrdersService.findAll(query);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/share')
  share(@Param('id') id: string) {
    return this.workOrdersService.share(id);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Delete(':id/share')
  unshare(@Param('id') id: string) {
    return this.workOrdersService.unshare(id);
  }

  @Public()
  @Get('public/:token')
  findShared(@Param('token') token: string) {
    return this.workOrdersService.findShared(token);
  }

  @Public()
  @Patch('public/:token/status')
  updatePublicStatus(
    @Param('token') token: string,
    @Body('status') status: string,
  ) {
    return this.workOrdersService.updateSharedStatus(token, status);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/review')
  reviewWorkOrder(
    @Param('id') id: string,
    @Body() body: { status: 'CLOSED' | 'IN_PROGRESS'; notes: string },
  ) {
    return this.workOrdersService.reviewWorkOrder(id, body.status, body.notes);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.DELETE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }

  // ── ENTERPRISE MODULE ENDPOINTS ─────────────────────────────────────────

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/timer/start')
  startTimer(@Param('id') id: string) {
    return this.workOrdersService.startTimerExternal(id);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/timer/pause')
  pauseTimer(@Param('id') id: string) {
    return this.workOrdersService.pauseTimerExternal(id);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/time-logs')
  addTimeLog(@Param('id') id: string, @Body() dto: AddTimeLogDto) {
    return this.workOrdersService.addTimeLog(id, dto);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() dto: AddWorkOrderCommentDto) {
    return this.workOrdersService.addComment(id, dto);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/checklist-responses')
  addChecklistResponse(
    @Param('id') id: string,
    @Body() dto: AddChecklistResponseDto,
  ) {
    return this.workOrdersService.addChecklistResponse(id, dto);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/parts')
  consumePart(@Param('id') id: string, @Body() dto: AddWorkOrderPartDto) {
    return this.workOrdersService.consumePart(id, dto);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/batch-parts')
  consumeParts(@Param('id') id: string, @Body() dto: AddWorkOrderPartsDto) {
    return this.workOrdersService.consumeParts(id, dto);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.READ)
  @Get(':id/history')
  getStatusHistory(@Param('id') id: string) {
    return this.workOrdersService.getStatusHistory(id);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `wo-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  addFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.workOrdersService.addFile(id, file);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Delete(':id/files/:fileId')
  removeFile(@Param('fileId') fileId: string) {
    return this.workOrdersService.removeFile(fileId);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/loto')
  addLOTO(@Param('id') id: string, @Body() data: AddLOTODto) {
    return this.workOrdersService.addLOTO(id, data);
  }
  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ProcessApprovalDto,
  ) {
    return this.workOrdersService.processApproval(id, dto.status, dto.notes);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/expenses')
  addExpense(@Param('id') id: string, @Body() dto: AddExpenseDto) {
    return this.workOrdersService.addExpense(id, dto);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post('bulk-update')
  bulkUpdate(
    @Body() dto: BulkUpdateWorkOrdersDto,
  ) {
    return this.workOrdersService.bulkUpdate(dto.updates);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post('smart-schedule')
  smartSchedule(@Body() dto: SmartScheduleDto) {
    return this.workOrdersService.smartSchedule(dto);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/links')
  addLink(@Param('id') id: string, @Body() dto: AddLinkDto) {
    return this.workOrdersService.addLink(id, dto);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Delete('links/:linkId')
  removeLink(@Param('linkId') linkId: string) {
    return this.workOrdersService.removeLink(linkId);
  }

  @RequirePermissions(Permissions.WORK_ORDERS.UPDATE)
  @Post(':id/apply-template')
  applyTemplate(@Param('id') id: string, @Body('templateId') templateId: string) {
    return this.workOrdersService.applyTemplate(id, templateId);
  }
}
