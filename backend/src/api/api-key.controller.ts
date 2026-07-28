import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permissions } from '../auth/permissions/permissions.constants';
import { TenancyContext } from '../common/tenancy.context';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApiKeyController {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly prisma: PrismaService,
  ) {}

  @RequirePermissions(Permissions.REPORTS.VIEW) // Add dedicated permission for keys or use proxy
  @Get()
  async getKeys() {
    const orgId = TenancyContext.organizationId;
    return this.prisma.apiKey.findMany({
      where: { organizationId: orgId, deletedAt: null },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  @RequirePermissions(Permissions.REPORTS.VIEW)
  @Post()
  async createKey(@Body() data: { name: string; scopes: string[] }) {
    const orgId = TenancyContext.organizationId || '';
    return this.apiKeyService.createKey(data.name, orgId, data.scopes);
  }

  @RequirePermissions(Permissions.REPORTS.VIEW)
  @Delete(':id')
  async revokeKey(@Param('id') id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
