import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { Prisma, Team } from '@prisma/client';
import { TenancyContext } from '../common/tenancy.context';

const TEAM_INCLUDES = {
  users: {
    include: { userOrg: { include: { user: true } } },
  },
} as const;

export type TeamWithMembers = Prisma.TeamGetPayload<{
  include: typeof TEAM_INCLUDES;
}>;

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto): Promise<TeamWithMembers> {
    const { userIds, ...data } = createTeamDto;
    const organizationId = TenancyContext.organizationId || '';

    return this.prisma.team.create({
      data: {
        ...data,
        organizationId,
        users: {
          create: userIds?.map((userOrgId) => ({
            userOrg: { connect: { id: userOrgId } },
          })),
        },
      },
      include: TEAM_INCLUDES,
    });
  }

  async findAll(): Promise<TeamWithMembers[]> {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.team.findMany({
      where: { organizationId },
      include: {
        ...TEAM_INCLUDES,
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async findOne(id: string): Promise<TeamWithMembers> {
    const organizationId = TenancyContext.organizationId;
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId },
      include: TEAM_INCLUDES,
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto): Promise<TeamWithMembers> {
    await this.findOne(id);
    const { userIds, ...data } = updateTeamDto;

    const updateData: any = { ...data };

    if (userIds) {
      updateData.users = {
        deleteMany: {}, // Clear existing
        create: userIds.map((userOrgId) => ({
          userOrg: { connect: { id: userOrgId } },
        })),
      };
    }

    return this.prisma.team.update({
      where: { id },
      data: updateData,
      include: TEAM_INCLUDES,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.team.delete({ where: { id } });
    return { message: 'Team deleted successfully' };
  }
}
