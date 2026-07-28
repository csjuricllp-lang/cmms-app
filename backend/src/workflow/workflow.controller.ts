import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permissions } from '../auth/permissions/permissions.constants';
import { TenancyContext } from '../common/tenancy.context';

@Controller('workflow-rules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkflowController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.workflowRule.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @RequirePermissions(Permissions.WORKFLOWS.MANAGE)
  @Post()
  create(@Body() data: any) {
    const organizationId = TenancyContext.organizationId || '';
    return this.prisma.workflowRule.create({
      data: { ...data, organizationId },
    });
  }

  @RequirePermissions(Permissions.WORKFLOWS.MANAGE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.prisma.workflowRule.update({
      where: { id },
      data,
    });
  }

  @RequirePermissions(Permissions.WORKFLOWS.MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.workflowRule.delete({
      where: { id },
    });
  }
}
