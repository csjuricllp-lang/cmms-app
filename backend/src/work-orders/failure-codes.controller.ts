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
import { FailureCodesService } from './failure-codes.service';
import { CreateFailureCodeDto } from './dto/create-failure-code.dto';
import { UpdateFailureCodeDto } from './dto/update-failure-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@Controller('work-orders/failure-codes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FailureCodesController {
  constructor(private readonly failureCodesService: FailureCodesService) {}

  @RequirePermissions(Permission.READ_WORK_ORDER)
  @Get()
  findAll(@Request() req) {
    return this.failureCodesService.findAll(req.user.organizationId);
  }

  @RequirePermissions(Permission.UPDATE_WORK_ORDER)
  @Post()
  create(@Request() req, @Body() createFailureCodeDto: CreateFailureCodeDto) {
    return this.failureCodesService.create(
      req.user.organizationId,
      createFailureCodeDto,
    );
  }

  @RequirePermissions(Permission.UPDATE_WORK_ORDER)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateFailureCodeDto: UpdateFailureCodeDto,
  ) {
    return this.failureCodesService.update(
      id,
      req.user.organizationId,
      updateFailureCodeDto,
    );
  }

  @RequirePermissions(Permission.UPDATE_WORK_ORDER)
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.failureCodesService.remove(id, req.user.organizationId);
  }
}
