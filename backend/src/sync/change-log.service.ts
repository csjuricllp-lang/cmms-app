import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class ChangeLogService {
  private readonly logger = new Logger(ChangeLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Records a change in the server log for downstream client sync.
   */
  async record(
    entityType: string,
    entityId: string,
    operation: string,
    version: number,
    changedFields: string[] = [],
    organizationId?: string,
  ) {
    const orgId = organizationId || TenancyContext.organizationId;
    if (!orgId) return;

    await this.prisma.changeLog.create({
      data: {
        entityType,
        entityId,
        operation,
        version,
        changedFields,
        organizationId: orgId,
      },
    });
  }
}
