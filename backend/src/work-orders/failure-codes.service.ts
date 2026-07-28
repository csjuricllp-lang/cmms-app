import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFailureCodeDto } from './dto/create-failure-code.dto';
import { UpdateFailureCodeDto } from './dto/update-failure-code.dto';

@Injectable()
export class FailureCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.failureCode.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' },
    });
  }

  async create(organizationId: string, createDto: CreateFailureCodeDto) {
    return this.prisma.failureCode.create({
      data: {
        ...createDto,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, updateDto: UpdateFailureCodeDto) {
    const existing = await this.prisma.failureCode.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Failure code with ID ${id} not found`);
    }

    return this.prisma.failureCode.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.failureCode.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Failure code with ID ${id} not found`);
    }

    return this.prisma.failureCode.delete({
      where: { id },
    });
  }
}
