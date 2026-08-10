import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

/**
 * PERMISSION MANIFEST: The canonical set of permissions for each built-in role.
 * On every server startup, AppService.onModuleInit() ensures ALL organizations'
 * roles have AT LEAST these permissions — never less.
 * This prevents permissions from going stale when new features are added.
 */
const ROLE_PERMISSION_MANIFEST: Record<string, string[]> = {
  ADMIN: [
    'assets.read', 'assets.create', 'assets.update', 'assets.delete',
    'locations.read', 'locations.create', 'locations.update', 'locations.delete',
    'settings.manage',
    'vendors.read', 'vendors.create', 'vendors.update', 'vendors.delete',
    'customers.read', 'customers.create', 'customers.update', 'customers.delete',
    'parts.read', 'parts.create', 'parts.update', 'parts.delete',
    'purchase-orders.read', 'purchase-orders.create', 'purchase-orders.update', 'purchase-orders.delete',
    'checklists.read', 'checklists.create', 'checklists.update', 'checklists.delete',
    'pm.read', 'pm.create', 'pm.update', 'pm.delete',
    'requests.read', 'requests.create', 'requests.update', 'requests.delete',
    'reports.view',
    'data.import-export',
    'work-orders.read', 'work-orders.read-all', 'work-orders.create', 'work-orders.update', 'work-orders.delete', 'work-orders.complete', 'work-orders.assign', 'work-orders.manage-costs',
    'dashboard.access',
  ],
  'Maintenance Manager': [
    'assets.read', 'assets.create', 'assets.update', 'assets.delete',
    'locations.read', 'locations.create', 'locations.update', 'locations.delete',
    'settings.manage',
    'vendors.read', 'vendors.create', 'vendors.update', 'vendors.delete',
    'customers.read', 'customers.create', 'customers.update', 'customers.delete',
    'parts.read', 'parts.create', 'parts.update', 'parts.delete',
    'purchase-orders.read', 'purchase-orders.create', 'purchase-orders.update', 'purchase-orders.delete',
    'checklists.read', 'checklists.create', 'checklists.update', 'checklists.delete',
    'pm.read', 'pm.create', 'pm.update', 'pm.delete',
    'requests.read', 'requests.create', 'requests.update', 'requests.delete',
    'reports.view',
    'data.import-export',
    'work-orders.read', 'work-orders.read-all', 'work-orders.create', 'work-orders.update', 'work-orders.delete', 'work-orders.complete', 'work-orders.assign', 'work-orders.manage-costs',
    'dashboard.access',
  ],
  TECHNICIAN: [
    'dashboard.access',
    'assets.read',
    'locations.read',
    'vendors.read',
    'customers.read',
    'parts.read', 'parts.update',
    'purchase-orders.read',
    'checklists.read',
    'pm.read',
    'requests.read', 'requests.update',
    'work-orders.read', 'work-orders.create', 'work-orders.update', 'work-orders.complete',
    'reports.view',
  ],
  LIMITED_TECHNICIAN: [
    'dashboard.access',
    'assets.read',
    'locations.read',
    'vendors.read',
    'customers.read',
    'parts.read',
    'purchase-orders.read',
    'checklists.read',
    'pm.read',
    'requests.read',
    'work-orders.read', 'work-orders.update',
  ],
  MANAGER: [
    'dashboard.access',
    'assets.read', 'assets.create', 'assets.update',
    'locations.read', 'locations.create', 'locations.update',
    'vendors.read',
    'customers.read',
    'parts.read', 'parts.create', 'parts.update',
    'purchase-orders.read',
    'checklists.read', 'checklists.create', 'checklists.update',
    'pm.read', 'pm.create', 'pm.update',
    'requests.read', 'requests.create', 'requests.update',
    'reports.view',
    'work-orders.read', 'work-orders.read-all', 'work-orders.create', 'work-orders.update', 'work-orders.delete', 'work-orders.complete', 'work-orders.assign', 'work-orders.manage-costs',
  ],
  VIEWER: [
    'dashboard.access',
    'assets.read',
    'locations.read',
    'work-orders.read',
    'parts.read',
    'pm.read',
  ],
  REQUESTER: [
    'dashboard.access',
    'assets.read',
    'locations.read',
    'requests.read', 'requests.create',
    'work-orders.read',
  ],
};

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * On every server boot, sync permissions for all system roles across all orgs.
   * This is idempotent (safe to run multiple times) and ensures role permissions
   * never go stale when new features are added.
   */
  async onModuleInit() {
    try {
      this.logger.log('Starting role permission sync...');
      let syncCount = 0;

      for (const [roleName, requiredPermissions] of Object.entries(ROLE_PERMISSION_MANIFEST)) {
        // Find all roles with this name across all organizations
        const roles = await (this.prisma as any).role.findMany({
          where: { name: roleName },
          include: { permissions: { select: { key: true } } },
        });

        for (const role of roles) {
          const existingKeys = new Set(role.permissions.map((p: any) => p.key));
          const missingKeys = requiredPermissions.filter(k => !existingKeys.has(k));

          if (missingKeys.length === 0) continue;

          // Ensure all missing permissions exist in the Permission table
          for (const key of missingKeys) {
            await (this.prisma as any).permission.upsert({
              where: { key },
              update: {},
              create: { key, name: key },
            });
          }

          // Connect missing permissions to the role
          await (this.prisma as any).role.update({
            where: { id: role.id },
            data: {
              permissions: {
                connect: missingKeys.map(key => ({ key })),
              },
            },
          });

          this.logger.log(`Synced ${missingKeys.length} missing permissions to role "${roleName}" (org: ${role.organizationId}): ${missingKeys.join(', ')}`);
          syncCount++;
        }
      }

      this.logger.log(`Role permission sync complete. ${syncCount} roles updated.`);
    } catch (err) {
      // Non-fatal: log error but don't crash the server
      this.logger.error('Role permission sync failed (non-fatal):', err?.message);
    }
  }
}
