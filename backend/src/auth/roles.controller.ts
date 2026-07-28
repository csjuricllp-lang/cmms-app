import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenancyContext } from '../common/tenancy.context';
import { AllowAnyRole } from '../auth/decorators/allow-any-role.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private prisma: PrismaService) {}

  @AllowAnyRole()
  @Get()
  async findAll() {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.role.findMany({
      where: {
        OR: [{ organizationId }, { isSystem: true }],
      },
      include: {
        permissions: true,
      },
    });
  }

  @AllowAnyRole()
  @Get('permissions')
  async findAllPermissions() {
    return this.prisma.permission.findMany();
  }

  @RequirePermissions(Permission.MANAGE_ROLES)
  @Post()
  async create(@Body() data: any) {
    const organizationId = TenancyContext.organizationId || '';
    const { permissionIds, ...roleData } = data;
    
    return this.prisma.role.create({
      data: {
        ...roleData,
        organizationId,
        permissions: {
          connect: permissionIds?.map((id: string) => ({ id })) || [],
        },
      },
    });
  }

  @RequirePermissions(Permission.MANAGE_ROLES)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    const { permissionIds, ...roleData } = data;
    
    return this.prisma.role.update({
      where: { id },
      data: {
        ...roleData,
        permissions: {
          set: permissionIds?.map((id: string) => ({ id })) || [],
        },
      },
    });
  }

  @RequirePermissions(Permission.MANAGE_ROLES)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.role.delete({
      where: { id },
    });
  }
}
