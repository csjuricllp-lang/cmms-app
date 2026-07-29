import { Injectable } from '@nestjs/common';
import { CategoryType } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class OnboardingService {
  /**
   * Initializes a new organization with standard industrial defaults.
   * Uses batch inserts and connectOrCreate to maximize speed and resilience.
   */
  async initializeOrganization(organizationId: string, tx: any) {
    console.log(`🚀 Initializing SaaS environment for Org: ${organizationId}`);

    // 1. Batch create categories (skipDuplicates for idempotency)
    await tx.category.createMany({
      data: [
        { name: 'Damage',       color: '#EF4444', type: CategoryType.WORK_ORDER, organizationId },
        { name: 'Electrical',   color: '#F59E0B', type: CategoryType.WORK_ORDER, organizationId },
        { name: 'Meter Reading',color: '#10B981', type: CategoryType.WORK_ORDER, organizationId },
        { name: 'Inspection',   color: '#3B82F6', type: CategoryType.WORK_ORDER, organizationId },
        { name: 'Preventative', color: '#6366F1', type: CategoryType.WORK_ORDER, organizationId },
        { name: 'Project',      color: '#8B5CF6', type: CategoryType.WORK_ORDER, organizationId },
        { name: 'Safety',       color: '#F43F5E', type: CategoryType.WORK_ORDER, organizationId },
        { name: 'Upgrade',      color: '#06B6D4', type: CategoryType.WORK_ORDER, organizationId },
      ],
      skipDuplicates: true,
    });

    // 2. Batch create default settings
    const defaultTimers = [
      { id: 't1', name: 'Other Time' },
      { id: 't2', name: 'Drive Time' },
      { id: 't3', name: 'Vendor Time' },
      { id: 't4', name: 'Wrench Time' },
      { id: 't5', name: 'Inspection Time' },
    ];

    await tx.setting.createMany({
      data: [
        { key: 'wo.autoUpdateTimer',            value: 'true',                          organizationId },
        { key: 'wo.startNumber',                value: '1001',                          organizationId },
        { key: 'wo.conf.create.priority',       value: 'Required',                      organizationId },
        { key: 'wo.conf.create.description',    value: 'Required',                      organizationId },
        { key: 'wo.conf.complete.closeoutNotes',value: 'Required',                      organizationId },
        { key: 'wo.timer.types',                value: JSON.stringify(defaultTimers),    organizationId },
      ],
      skipDuplicates: true,
    });

    // 3. Define all permission keys used by standard roles
    const allPermissionKeys = [
      'assets.read', 'assets.create', 'assets.update', 'assets.delete',
      'pm.read', 'pm.create', 'pm.update', 'pm.delete',
      'work-orders.read', 'work-orders.read-all', 'work-orders.create', 'work-orders.update', 'work-orders.delete',
      'requests.read', 'requests.create', 'requests.update', 'requests.delete',
      'locations.read', 'locations.create', 'locations.update', 'locations.delete',
      'parts.read', 'parts.create', 'parts.update', 'parts.delete',
      'analytics.view', 'analytics.read', 'dashboard.access',
      'checklists.read', 'checklists.create', 'checklists.update', 'checklists.delete',
      'po.read', 'po.create', 'po.update', 'po.delete',
      'vendors.read', 'vendors.create', 'vendors.update', 'vendors.delete',
      'customers.read', 'customers.create', 'customers.update', 'customers.delete',
      'data.manage', 'workflows.manage', 'workflows.read', 'users.manage', 'roles.manage',
    ];

    // Ensure all permissions exist (upsert in batch — safe & idempotent)
    await tx.permission.createMany({
      data: allPermissionKeys.map(key => ({
        id: randomUUID(),
        key,
        name: key,
        description: key,
        priority: 100,
      })),
      skipDuplicates: true,
    });

    // 4. Provision standard roles with permissions
    const standardRoles = [
      {
        name: 'Maintenance Manager',
        description: 'Full access to manage maintenance operations, work orders, assets, and teams',
        permissions: ['assets.read', 'assets.create', 'assets.update', 'assets.delete', 'pm.read', 'pm.create', 'pm.update', 'pm.delete', 'work-orders.read', 'work-orders.read-all', 'work-orders.create', 'work-orders.update', 'work-orders.delete', 'requests.read', 'requests.create', 'requests.update', 'requests.delete', 'locations.read', 'locations.create', 'locations.update', 'locations.delete', 'parts.read', 'parts.create', 'parts.update', 'parts.delete', 'analytics.view', 'analytics.read', 'dashboard.access', 'checklists.read', 'checklists.create', 'checklists.update', 'checklists.delete', 'po.read', 'po.create', 'po.update', 'po.delete', 'vendors.read', 'vendors.create', 'vendors.update', 'vendors.delete', 'customers.read', 'customers.create', 'customers.update', 'customers.delete', 'data.manage', 'workflows.manage', 'workflows.read', 'users.manage', 'roles.manage']
      },
      {
        name: 'Customer Department Manager',
        description: 'Submit work requests and monitor status for their department',
        permissions: ['requests.create', 'requests.read', 'assets.read', 'locations.read', 'dashboard.access']
      },
      {
        name: 'Technician',
        description: 'Industrial maintenance staff focusing on task execution',
        permissions: ['assets.read', 'work-orders.read', 'work-orders.update', 'pm.read', 'requests.create', 'requests.read']
      },
      {
        name: 'Limited Technician',
        description: 'Can only see work orders assigned to them',
        permissions: ['assets.read', 'work-orders.read', 'work-orders.update', 'pm.read', 'requests.create', 'requests.read']
      },
      {
        name: 'Requester',
        description: 'Facility staff or guests who can submit maintenance requests',
        permissions: ['requests.create', 'requests.read', 'dashboard.access']
      }
    ];

    for (const roleDef of standardRoles) {
      await tx.role.upsert({
        where: { name_organizationId: { name: roleDef.name, organizationId } },
        update: {},
        create: {
          name: roleDef.name,
          description: roleDef.description,
          isSystem: true,
          organizationId,
          permissions: {
            connect: roleDef.permissions.map(key => ({ key })),
          },
        },
      });
    }

    console.log(`✅ Onboarding complete for Org: ${organizationId}`);
  }
}
