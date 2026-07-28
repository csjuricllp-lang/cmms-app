import { Injectable } from '@nestjs/common';
import { CategoryType, Permission } from '@prisma/client';

@Injectable()
export class OnboardingService {
  /**
   * Initializes a new organization with standard industrial defaults.
   * This ensures a high-fidelity "Day 1" experience for new SaaS tenants.
   */
  async initializeOrganization(organizationId: string, tx: any) {
    console.log(`🚀 Initializing SaaS environment for Org: ${organizationId}`);

    // 1. Core Maintenance Classifications (Idempotent Upsert)
    const defaultCategories = [
      { name: 'Damage', color: '#EF4444' },
      { name: 'Electrical', color: '#F59E0B' },
      { name: 'Meter Reading', color: '#10B981' },
      { name: 'Inspection', color: '#3B82F6' },
      { name: 'Preventative', color: '#6366F1' },
      { name: 'Project', color: '#8B5CF6' },
      { name: 'Safety', color: '#F43F5E' },
      { name: 'Upgrade', color: '#06B6D4' },
    ];

    for (const cat of defaultCategories) {
      await tx.category.upsert({
        where: {
          name_organizationId_type: {
            name: cat.name,
            organizationId,
            type: CategoryType.WORK_ORDER,
          },
        },
        update: { color: cat.color },
        create: {
          name: cat.name,
          color: cat.color,
          type: CategoryType.WORK_ORDER,
          organizationId,
        },
      });
    }

    // 2. Default Operational Settings (Idempotent Upsert)
    const defaultSettings = [
      { key: 'wo.autoUpdateTimer', value: 'true' },
      { key: 'wo.startNumber', value: '1001' },
      { key: 'wo.conf.create.priority', value: 'Required' },
      { key: 'wo.conf.create.description', value: 'Required' },
      { key: 'wo.conf.complete.closeoutNotes', value: 'Required' },
    ];

    for (const setting of defaultSettings) {
      await tx.setting.upsert({
        where: {
          key_organizationId: {
            key: setting.key,
            organizationId,
          },
        },
        update: { value: setting.value },
        create: {
          key: setting.key,
          value: setting.value,
          organizationId,
        },
      });
    }

    // 3. Default Timer Types (Labor Classifications)
    const defaultTimers = [
      { id: 't1', name: 'Other Time', createdAt: new Date().toISOString() },
      { id: 't2', name: 'Drive Time', createdAt: new Date().toISOString() },
      { id: 't3', name: 'Vendor Time', createdAt: new Date().toISOString() },
      { id: 't4', name: 'Wrench Time', createdAt: new Date().toISOString() },
      { id: 't5', name: 'Inspection Time', createdAt: new Date().toISOString() },
    ];

    await tx.setting.upsert({
      where: { key_organizationId: { key: 'wo.timer.types', organizationId } },
      update: { value: JSON.stringify(defaultTimers) },
      create: {
        key: 'wo.timer.types',
        value: JSON.stringify(defaultTimers),
        organizationId,
      },
    });

    // 4. Provision Standard SaaS Roles (Technician, Requester)
    // We connect them to existing global permissions by their unique 'key'
    const standardRoles = [
      {
        name: 'Maintenance Manager',
        description: 'Maintenance Manager has full access to manage maintenance operations, work orders, assets, and teams',
        permissions: ['assets.read', 'assets.create', 'assets.update', 'assets.delete', 'pm.read', 'pm.create', 'pm.update', 'pm.delete', 'work-orders.read', 'work-orders.read-all', 'work-orders.create', 'work-orders.update', 'work-orders.delete', 'requests.read', 'requests.create', 'requests.update', 'requests.delete', 'locations.read', 'locations.create', 'locations.update', 'locations.delete', 'parts.read', 'parts.create', 'parts.update', 'parts.delete', 'analytics.view', 'analytics.read', 'dashboard.access', 'checklists.read', 'checklists.create', 'checklists.update', 'checklists.delete', 'po.read', 'po.create', 'po.update', 'po.delete', 'vendors.read', 'vendors.create', 'vendors.update', 'vendors.delete', 'customers.read', 'customers.create', 'customers.update', 'customers.delete', 'data.manage', 'workflows.manage', 'workflows.read', 'users.manage', 'roles.manage']
      },
      {
        name: 'Customer Department Manager',
        description: 'Customer Department Manager can submit work requests and monitor status for their department',
        permissions: ['requests.create', 'requests.read', 'assets.read', 'locations.read', 'dashboard.access']
      },
      {
        name: 'Technician',
        description: 'Industrial maintenance staff focusing on task execution',
        permissions: ['assets.read', 'work-orders.read', 'work-orders.update', 'pm.read', 'requests.create', 'requests.read']
      },
      {
        name: 'Limited Technician',
        description: 'Limited technicians can only see work orders assigned to them',
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
        where: {
          name_organizationId: {
            name: roleDef.name,
            organizationId
          }
        },
        update: {},
        create: {
          name: roleDef.name,
          description: roleDef.description,
          isSystem: true,
          organizationId,
          permissions: {
            connect: roleDef.permissions.map(key => ({ key }))
          }
        }
      });
    }

    console.log(`✅ Onboarding complete for Org: ${organizationId}`);
  }
}
