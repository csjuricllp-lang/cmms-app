import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictResolutionResult, SyncOperationPayload } from './types';

@Injectable()
export class ConflictResolverService {
  private readonly logger = new Logger(ConflictResolverService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Resolves conflicts between client payload and server state using PBAC rules.
   */
  async resolve(
    entityType: string,
    entityId: string,
    clientPayload: SyncOperationPayload,
    clientVersion: number,
    serverState: any,
    userId: string,
    organizationId: string,
  ): Promise<ConflictResolutionResult> {
    const resolvedPayload = { ...serverState };
    const conflicts: any[] = [];
    const rejectedFields: string[] = [];

    // 1. Get User Permissions with Priorities
    const userPermissions = await this.getUserPermissions(
      userId,
      organizationId,
    );

    // 2. Identify fields being updated
    const updatedFields = Object.keys(clientPayload).filter(
      (key) => clientPayload[key] !== serverState[key],
    );

    for (const field of updatedFields) {
      const permissionKey = `${entityType.toLowerCase()}.${field}.update`;
      const userPermission = userPermissions.find(
        (p) =>
          p.key === permissionKey ||
          p.key === `${entityType.toLowerCase()}.full_control`,
      );

      // LAYER 1: Field-Level Permission Check
      if (!userPermission) {
        this.logger.warn(
          `User ${userId} lacks permission to update ${field} on ${entityType}`,
        );
        rejectedFields.push(field);
        continue;
      }

      // If client version is current, no conflict, just apply (Layer 2 implicit)
      if (clientVersion >= serverState.version) {
        resolvedPayload[field] = clientPayload[field];
        continue;
      }

      // LAYER 3: Permission Priority Resolution
      // Fetch the permission used by the server's last updater (if archived/logged)
      // For this implementation, we compare against a default server priority or the priority of the last updater
      const serverPriority = await this.getServerLastUpdatePriority(
        entityType,
        entityId,
      );

      if (userPermission.priority > serverPriority) {
        // Client Wins
        resolvedPayload[field] = clientPayload[field];
      } else if (userPermission.priority < serverPriority) {
        // Server Wins
        conflicts.push({
          field,
          clientValue: clientPayload[field],
          serverValue: serverState[field],
          result: 'SERVER_WON',
        });
      } else {
        // LAYER 4: Last Write Wins (Fallback)
        // If priorities are equal, compare timestamps
        const clientTime = new Date(
          clientPayload.updatedAt || Date.now(),
        ).getTime();
        const serverTime = new Date(serverState.updatedAt).getTime();

        if (clientTime > serverTime) {
          resolvedPayload[field] = clientPayload[field];
        } else {
          conflicts.push({
            field,
            clientValue: clientPayload[field],
            serverValue: serverState[field],
            result: 'SERVER_WON_LWW',
          });
        }
      }
    }

    // LAYER 5: Log unresolved/important conflicts for manual review if needed
    if (conflicts.length > 0) {
      await this.logConflicts(entityType, entityId, conflicts, organizationId);
    }

    return {
      resolvedData: resolvedPayload,
      hasConflict: conflicts.length > 0,
      rejectedFields,
    };
  }

  private async getUserPermissions(userId: string, organizationId: string) {
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { role: { include: { permissions: true } } },
    });

    return (userOrg as any)?.role?.permissions || [];
  }

  private async getServerLastUpdatePriority(
    entityType: string,
    entityId: string,
  ): Promise<number> {
    // In a full production system, we'd store the priority of the last updater in the record or ChangeLog.
    // For now, we assume a base priority of 100 or lookup the last ChangeLog entry.
    const lastLog = await this.prisma.changeLog.findFirst({
      where: { entityType, entityId },
      orderBy: { changedAt: 'desc' },
    });

    // We'd ideally link ChangeLog to the user's highest permission priority at the time
    return 100; // Default
  }

  private async logConflicts(
    entityType: string,
    entityId: string,
    conflicts: { field: string; clientValue: any; serverValue: any }[],
    organizationId: string,
  ): Promise<void> {
    for (const conflict of conflicts) {
      await this.prisma.syncConflict.create({
        data: {
          entityType,
          entityId,
          field: conflict.field,
          clientValue: conflict.clientValue,
          serverValue: conflict.serverValue,
          organizationId,
        },
      });
    }
  }
}
