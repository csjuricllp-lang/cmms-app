import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Main entry point for rule evaluation
   */
  async evaluateRules(
    entity: string,
    trigger: string,
    data: { id: string; [key: string]: any },
  ): Promise<void> {
    // 1. Fetch active rules for this entity and trigger
    const rules = await this.prisma.workflowRule.findMany({
      where: {
        entity,
        trigger,
        isActive: true,
      },
    });

    for (const rule of rules) {
      const isMatch = this.checkConditions(rule.conditions as any[], data);

      if (isMatch) {
        this.logger.log(
          `Workflow rule "${rule.name}" matched for ${entity} #${data.id}`,
        );
        await this.executeActions(
          rule.actions as any[],
          entity,
          data,
        );
      }
    }
  }

  private checkConditions(conditions: any[], data: any): boolean {
    if (!conditions || conditions.length === 0) return true;

    // Simple AND logic for all conditions
    return conditions.every((cond) => {
      const actualValue = data[cond.field];
      const targetValue = cond.value;

      switch (cond.operator) {
        case 'equals':
          return actualValue === targetValue;
        case 'not_equals':
          return actualValue !== targetValue;
        case 'gt':
          return actualValue > targetValue;
        case 'lt':
          return actualValue < targetValue;
        case 'contains':
          return (
            Array.isArray(actualValue) && actualValue.includes(targetValue)
          );
        default:
          return false;
      }
    });
  }

  private async executeActions(
    actions: any[],
    entity: string,
    data: { id: string; [key: string]: any },
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'UPDATE_FIELD': {
            const modelKey = (entity.charAt(0).toLowerCase() + entity.slice(1)) as keyof PrismaService;
            const model = this.prisma[modelKey] as any;
            if (model && typeof model.update === 'function') {
              await model.update({
                where: { id: data.id },
                data: { [action.field]: action.value },
              });
            }
            break;
          }

          case 'NOTIFY_USER':
            // Assuming action.value is userId
            await this.notificationsService.create({
              type: 'WORKFLOW_ALERT',
              title: `Workflow Rule Triggered`,
              content: `Automated action performed on ${entity} #${data.id}`,
              userId: action.value,
              organizationId: data.organizationId,
            });
            break;

          case 'ASSIGN_TEAM':
            if (entity === 'WorkOrder') {
              await this.prisma.workOrder.update({
                where: { id: data.id },
                data: { assignedTeamId: action.value },
              });
            }
            break;

          default:
            this.logger.warn(`Unknown action type: ${action.type}`);
        }
      } catch (err) {
        this.logger.error(
          `Failed to execute action ${action.type}: ${err.message}`,
        );
      }
    }
  }
}
