import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const shifts = await this.prisma.shift.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shifts.map((s) => ({
      id: s.id,
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      workDays: s.workDays,
      usersCount: s._count.users,
    }));
  }

  async findOne(id: string, organizationId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }

    return {
      id: shift.id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      workDays: shift.workDays,
      usersCount: shift._count.users,
    };
  }

  async create(organizationId: string, data: { name: string; startTime: string; endTime: string; workDays: number[] }) {
    const shift = await this.prisma.shift.create({
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        workDays: data.workDays,
        organizationId,
      },
    });
    return {
      ...shift,
      usersCount: 0,
    };
  }

  async update(
    id: string,
    organizationId: string,
    data: { name?: string; startTime?: string; endTime?: string; workDays?: number[] },
  ) {
    await this.findOne(id, organizationId);
    const updated = await this.prisma.shift.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    return {
      id: updated.id,
      name: updated.name,
      startTime: updated.startTime,
      endTime: updated.endTime,
      workDays: updated.workDays,
      usersCount: updated._count.users,
    };
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    // Unset shiftId for assigned users first to avoid constraint/referential issues if any
    await this.prisma.userOrganization.updateMany({
      where: { shiftId: id, organizationId },
      data: { shiftId: null },
    });
    return this.prisma.shift.delete({
      where: { id },
    });
  }
}
