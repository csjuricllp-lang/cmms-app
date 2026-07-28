import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalChainsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const chains = await this.prisma.approvalChain.findMany({
      where: { organizationId },
      include: {
        steps: {
          include: {
            role: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return chains.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      module: c.entityType,
      triggerAmount: c.minCost ? Number(c.minCost) : 0,
      isActive: c.isActive,
      steps: c.steps.map((s) => ({
        id: s.id,
        role: s.role.name,
        order: s.order,
      })),
    }));
  }

  async findOne(id: string, organizationId: string) {
    const chain = await this.prisma.approvalChain.findFirst({
      where: { id, organizationId },
      include: {
        steps: {
          include: {
            role: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!chain) {
      throw new NotFoundException(`Approval chain with ID ${id} not found`);
    }

    return {
      id: chain.id,
      name: chain.name,
      description: chain.description,
      module: chain.entityType,
      triggerAmount: chain.minCost ? Number(chain.minCost) : 0,
      isActive: chain.isActive,
      steps: chain.steps.map((s) => ({
        id: s.id,
        role: s.role.name,
        order: s.order,
      })),
    };
  }

  async create(
    organizationId: string,
    data: {
      name: string;
      description?: string;
      module: 'WORK_ORDER' | 'PURCHASE_ORDER';
      triggerAmount?: number;
      steps: { role: string; order: number }[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const chain = await tx.approvalChain.create({
        data: {
          name: data.name,
          description: data.description,
          entityType: data.module,
          minCost: data.triggerAmount ?? 0,
          organizationId,
        },
      });

      if (data.steps && data.steps.length > 0) {
        for (const step of data.steps) {
          // Find or create role
          let role = await tx.role.findFirst({
            where: { name: step.role, organizationId },
          });
          if (!role) {
            role = await tx.role.create({
              data: { name: step.role, organizationId },
            });
          }
          await tx.approvalStep.create({
            data: {
              approvalChainId: chain.id,
              roleId: role.id,
              order: step.order,
            },
          });
        }
      }

      // Re-fetch to return full object
      const fullChain = await tx.approvalChain.findUnique({
        where: { id: chain.id },
        include: {
          steps: {
            include: { role: true },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!fullChain) {
        throw new NotFoundException('Approval chain not found');
      }

      return {
        id: fullChain.id,
        name: fullChain.name,
        description: fullChain.description,
        module: fullChain.entityType,
        triggerAmount: fullChain.minCost ? Number(fullChain.minCost) : 0,
        isActive: fullChain.isActive,
        steps: fullChain.steps.map((s) => ({
          id: s.id,
          role: s.role.name,
          order: s.order,
        })),
      };
    });
  }

  async update(
    id: string,
    organizationId: string,
    data: {
      name?: string;
      description?: string;
      module?: 'WORK_ORDER' | 'PURCHASE_ORDER';
      triggerAmount?: number;
      steps?: { role: string; order: number }[];
    },
  ) {
    // Check if chain exists
    await this.findOne(id, organizationId);

    return this.prisma.$transaction(async (tx) => {
      // Update Chain details
      await tx.approvalChain.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.module && { entityType: data.module }),
          ...(data.triggerAmount !== undefined && { minCost: data.triggerAmount }),
        },
      });

      // Update steps if provided
      if (data.steps !== undefined) {
        // Delete all existing steps
        await tx.approvalStep.deleteMany({
          where: { approvalChainId: id },
        });

        // Insert new steps
        for (const step of data.steps) {
          let role = await tx.role.findFirst({
            where: { name: step.role, organizationId },
          });
          if (!role) {
            role = await tx.role.create({
              data: { name: step.role, organizationId },
            });
          }
          await tx.approvalStep.create({
            data: {
              approvalChainId: id,
              roleId: role.id,
              order: step.order,
            },
          });
        }
      }

      // Re-fetch to return full object
      const fullChain = await tx.approvalChain.findUnique({
        where: { id },
        include: {
          steps: {
            include: { role: true },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!fullChain) {
        throw new NotFoundException('Approval chain not found');
      }

      return {
        id: fullChain.id,
        name: fullChain.name,
        description: fullChain.description,
        module: fullChain.entityType,
        triggerAmount: fullChain.minCost ? Number(fullChain.minCost) : 0,
        isActive: fullChain.isActive,
        steps: fullChain.steps.map((s) => ({
          id: s.id,
          role: s.role.name,
          order: s.order,
        })),
      };
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.approvalChain.delete({
      where: { id },
    });
  }
}
