import { PrismaClient } from '@prisma/client';
import { Permissions } from '../auth/permissions/permissions.constants';

const prisma = new PrismaClient();

export async function seedRoles(organizationId: string) {
  const roles = [
    {
      name: 'ADMIN',
      description: 'Full system access',
      permissions: Object.values(Permissions).flatMap((group) =>
        Object.values(group),
      ),
      isSystem: true,
      organizationId,
    },
    {
      name: 'Maintenance Manager',
      description: 'Maintenance Manager has full access to manage maintenance operations, work orders, assets, and teams',
      permissions: Object.values(Permissions).flatMap((group) =>
        Object.values(group),
      ),
      isSystem: true,
      organizationId,
    },
    {
      name: 'Customer Department Manager',
      description: 'Customer Department Manager can submit work requests and monitor status for their department',
      permissions: [
        'requests.create',
        'requests.read',
        'assets.read',
        'locations.read',
      ],
      isSystem: true,
      organizationId,
    },
    {
      name: 'MANAGER',
      description: 'Manage assets, locations, and work orders',
      permissions: [
        'assets.read',
        'assets.create',
        'assets.update',
        'locations.read',
        'locations.create',
        'locations.update',
        'work-orders.read',
        'work-orders.read-all',
        'work-orders.manage-costs',
        'work-orders.create',
        'work-orders.update',
        'work-orders.complete',
        'work-orders.assign',
        'parts.read',
        'parts.create',
        'parts.update',
        'pm.read',
        'pm.create',
        'pm.update',
        'requests.read',
        'requests.create',
        'requests.update',
        'vendors.read',
        'vendors.create',
        'vendors.update',
        'reports.view',
      ],
      isSystem: true,
      organizationId,
    },
    {
      name: 'TECHNICIAN',
      description: 'Execute work orders',
      permissions: [
        'assets.read',
        'locations.read',
        'work-orders.read',
        'work-orders.update',
        'work-orders.complete',
        'parts.read',
        'pm.read',
        'reports.view',
      ],
      isSystem: true,
      organizationId,
    },
    {
      name: 'VIEWER',
      description: 'Read-only access',
      permissions: [
        'assets.read',
        'locations.read',
        'work-orders.read',
        'parts.read',
        'pm.read',
      ],
      isSystem: true,
      organizationId,
    },
  ];

  // 1. Seed Permissions first
  const allPermissions = Array.from(
    new Set(roles.flatMap((r) => r.permissions)),
  );
  for (const pKey of allPermissions) {
    await prisma.permission.upsert({
      where: { key: pKey },
      update: { name: pKey },
      create: { key: pKey, name: pKey },
    });
  }

  // 2. Seed Roles and link permissions
  for (const role of roles) {
    await (prisma as any).role.upsert({
      where: {
        name_organizationId: {
          name: role.name,
          organizationId: role.organizationId,
        },
      },
      update: {
        description: role.description,
        permissions: {
          set: role.permissions.map((key) => ({ key })),
        },
      },
      create: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        organizationId: role.organizationId,
        permissions: {
          connect: role.permissions.map((key) => ({ key })),
        },
      },
    });
  }
}
