import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowService } from './workflow.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkflowListener {
  private readonly logger = new Logger(WorkflowListener.name);

  constructor(
    private workflowService: WorkflowService,
    private prisma: PrismaService,
  ) {}

  @OnEvent('workorder.created')
  async handleWorkOrderCreated(payload: any) {
    this.logger.log(`Evaluating workflows for NEW WorkOrder #${payload.id}`);
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: payload.id },
    });
    if (workOrder) {
      await this.workflowService.evaluateRules(
        'WorkOrder',
        'CREATED',
        workOrder,
      );
    }
  }

  @OnEvent('workorder.status.updated')
  async handleWorkOrderStatusUpdated(payload: any) {
    this.logger.log(
      `Evaluating workflows for WorkOrder #${payload.id} (STATUS_CHANGED)`,
    );

    // Fetch full WO data to evaluate conditions as payload is partial
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: payload.id },
    });

    if (workOrder) {
      await this.workflowService.evaluateRules(
        'WorkOrder',
        'STATUS_CHANGED',
        workOrder,
      );
    }
  }

  @OnEvent('asset.created')
  async handleAssetCreated(payload: any) {
    await this.workflowService.evaluateRules(
      'Asset',
      'CREATED',
      payload,
    );
  }

  @OnEvent('asset.status.updated')
  async handleAssetStatusUpdated(payload: any) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: payload.id },
    });
    if (asset) {
      await this.workflowService.evaluateRules(
        'Asset',
        'STATUS_CHANGED',
        asset,
      );
    }
  }

  @OnEvent('part.low_stock')
  async handleLowStock(payload: any) {
    await this.workflowService.evaluateRules(
      'Part',
      'LOW_STOCK',
      payload,
    );
  }
}
