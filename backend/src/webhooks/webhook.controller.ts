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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permissions } from '../auth/permissions/permissions.constants';
import { TenancyContext } from '../common/tenancy.context';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WebhookController {
  constructor(private prisma: PrismaService) {}

  @RequirePermissions(Permissions.REPORTS.VIEW)
  @Get()
  async getSubscriptions() {
    const orgId = TenancyContext.organizationId;
    return this.prisma.webhookSubscription.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @RequirePermissions(Permissions.REPORTS.VIEW)
  @Post()
  async createSubscription(
    @Body() data: { url: string; event: string; secret?: string },
  ) {
    const orgId = TenancyContext.organizationId || '';
    return this.prisma.webhookSubscription.create({
      data: { ...data, organizationId: orgId },
    });
  }

  @RequirePermissions(Permissions.REPORTS.VIEW)
  @Delete(':id')
  async deleteSubscription(@Param('id') id: string) {
    return this.prisma.webhookSubscription.delete({
      where: { id },
    });
  }
}
