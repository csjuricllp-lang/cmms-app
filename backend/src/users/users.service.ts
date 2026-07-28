import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TenancyContext } from '../common/tenancy.context';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async findAll(status?: string) {
    const organizationId = TenancyContext.organizationId;
    const whereClause: any = { 
      organizationId,
      user: { deletedAt: null }
    };

    if (status === 'active') {
      whereClause.user.isActive = true;
    } else if (status === 'inactive') {
      whereClause.user.isActive = false;
    }

    const userOrgs = await this.prisma.userOrganization.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            isActive: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            workOrders: {
              where: { status: 'OPEN' as any },
            },
          },
        },
      } as any,
    });

    const userOrgIds = userOrgs.map((uo: any) => uo.id);

    // Batch query for all completed work orders across all users in this org (1 query instead of N queries)
    const allCompletedWOs = await this.prisma.workOrder.findMany({
      where: {
        organizationId,
        assignedToId: { in: userOrgIds },
        status: 'COMPLETED',
      },
      select: {
        assignedToId: true,
        completedAt: true,
        dueDate: true,
      },
    });

    // Group completed WOs by assignedToId
    const wosByUser = new Map<string, Array<{ completedAt: Date | null; dueDate: Date | null }>>();
    for (const wo of allCompletedWOs) {
      if (!wo.assignedToId) continue;
      const userWos = wosByUser.get(wo.assignedToId) || [];
      userWos.push(wo);
      wosByUser.set(wo.assignedToId, userWos);
    }

    return userOrgs.map((uo: any) => {
      const completedWOs = wosByUser.get(uo.id) || [];

      const compliantCount = completedWOs.filter(
        (wo: any) => !wo.dueDate || (wo.completedAt && new Date(wo.completedAt) <= new Date(wo.dueDate))
      ).length;

      const complianceRate = completedWOs.length > 0
        ? Math.round((compliantCount / completedWOs.length) * 100)
        : 100;

      return {
        ...uo.user,
        userOrgId: uo.id,
        roleId: uo.roleId,
        roleName: uo.role?.name || 'Technician',
        hourlyRate: uo.hourlyRate,
        skills: uo.skills,
        activeWoCount: uo._count?.workOrders || 0,
        compliance: complianceRate,
      };
    });
  }

  async findOne(id: string) {
    const organizationId = TenancyContext.organizationId;

    // Tenant-scoped lookup: verify the user belongs to the current organization.
    // We fetch via UserOrganization so we only expose data for this tenant.
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: id, organizationId } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            phone: true,
            jobTitle: true,
            department: true,
            avatarUrl: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        role: { include: { permissions: true } },
        teams: { include: { team: true } },
      },
    });

    if (!membership) {
      // Return same error message as before to avoid user-enumeration
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Return a flat, org-scoped profile (does NOT expose other orgs the user belongs to)
    return {
      ...membership.user,
      userOrgId: membership.id,
      roleId: membership.roleId,
      roleName: membership.role?.name,
      hourlyRate: membership.hourlyRate,
      skills: membership.skills,
      customPermissions: membership.customPermissions,
      assignedLocationIds: membership.assignedLocationIds,
      organizations: [{ organizationId, role: membership.role?.name }], // scoped to current org only
    };
  }

  async findWithOrganization(userId: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        deletedAt: true,
        organizations: {
          where: { organizationId },
          include: {
            organization: true,
            role: {
              include: { permissions: true },
            },
            teams: {
              include: { team: true },
            },
          },
        },
      },
    });

    if (!user) return null;
    const userOrg = user.organizations[0];
    if (!userOrg) return null;

    return {
      ...user,
      userOrg,
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        organizations: {
          include: {
            organization: true,
            role: {
              include: { permissions: true },
            },
            teams: {
              include: { team: true },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const organizationId = TenancyContext.organizationId;

    // Verify the target user is a member of the current organization before allowing edits.
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: id, organizationId } },
      include: { role: true, user: true },
    });
    if (!membership) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { hourlyRate, companyRate, ...userData } = updateUserDto;
    const data: any = { ...userData };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    if (data.isActive === false && membership.user?.isActive !== false) {
      if (id === TenancyContext.userId) {
        throw new BadRequestException('You cannot deactivate your own account.');
      }

      const roleName = membership.role?.name?.toUpperCase();
      if (roleName === 'OWNER' || roleName === 'ADMIN' || roleName === 'ADMINISTRATOR' || roleName === 'MAINTENANCE MANAGER') {
        const activeAdminsCount = await this.prisma.userOrganization.count({
          where: {
            organizationId,
            user: { isActive: true, deletedAt: null },
            role: { name: { in: ['OWNER', 'ADMIN', 'ADMINISTRATOR', 'MAINTENANCE MANAGER', 'Owner', 'Admin', 'Administrator', 'Maintenance Manager', 'owner', 'admin', 'administrator', 'maintenance manager'] } }
          }
        });
        if (activeAdminsCount <= 1) {
          throw new BadRequestException('Cannot deactivate the last active administrator.');
        }
      }

      data.deactivatedById = TenancyContext.userId;
      data.deactivatedAt = new Date();
      // deactivationReason is passed directly in data

      // Revoke sessions
      await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
      
      // Cancel pending invitations
      if (membership.user?.email) {
        await this.prisma.invitation.deleteMany({ where: { email: membership.user.email } });
      }
    } else if (data.isActive === true) {
      data.deactivatedById = null;
      data.deactivatedAt = null;
      data.deactivationReason = null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    if (hourlyRate !== undefined || companyRate !== undefined) {
      const organizationId = TenancyContext.organizationId;
      const updateData: any = {};
      if (hourlyRate !== undefined) updateData.hourlyRate = Number(hourlyRate);
      if (companyRate !== undefined) updateData.companyRate = Number(companyRate);
      
      await this.prisma.userOrganization.update({
        where: {
          userId_organizationId: {
            userId: id,
            organizationId,
          },
        },
        data: updateData,
      });
    }

    const { password: _, ...result } = updatedUser;
    return result;
  }

  async remove(id: string) {
    if (id === TenancyContext.userId) {
      throw new BadRequestException('You cannot delete your own account.');
    }

    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: id, organizationId: TenancyContext.organizationId } },
      include: { role: true, user: true },
    });

    const roleName = membership?.role?.name?.toUpperCase();
    if (roleName === 'OWNER' || roleName === 'ADMIN' || roleName === 'ADMINISTRATOR' || roleName === 'MAINTENANCE MANAGER') {
      const activeAdminsCount = await this.prisma.userOrganization.count({
        where: {
          organizationId: TenancyContext.organizationId,
          user: { isActive: true, deletedAt: null },
          role: { name: { in: ['OWNER', 'ADMIN', 'ADMINISTRATOR', 'MAINTENANCE MANAGER', 'Owner', 'Admin', 'Administrator', 'Maintenance Manager', 'owner', 'admin', 'administrator', 'maintenance manager'] } }
        }
      });
      if (activeAdminsCount <= 1) {
        throw new BadRequestException('Cannot delete the last active administrator.');
      }
    }

    // Soft delete the user by deactivating them
    await this.prisma.user.update({
      where: { id },
      data: { 
        isActive: false, 
        deletedAt: new Date(), 
        deactivatedById: TenancyContext.userId, 
        deactivatedAt: new Date() 
      }
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    if (membership?.user?.email) {
      await this.prisma.invitation.deleteMany({ where: { email: membership.user.email } });
    }
    
    return { message: 'User deleted successfully' };
  }

  /**
   * Managed Location-Based Access Control (LBAC).
   * Restricts the user's visibility to specific locations.
   */
  async updateLocationAccess(
    userId: string,
    organizationId: string,
    locationIds: string[],
  ) {
    return this.prisma.userOrganization.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      data: { assignedLocationIds: locationIds },
    });
  }
}
