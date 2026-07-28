import { PrismaClient, Prisma } from '@prisma/client';
import { TenancyContext } from '../common/tenancy.context';
import { SystemRole } from '../auth/constants/system-roles';

export const softDeleteModels = [
  'User',
  'Asset',
  'Location',
  'WorkOrder',
  'Vendor',
  'Customer',
  'Part',
  'PurchaseOrder',
  'Checklist',
  'PMSchedule',
  'MaintenanceRequest',
  'Team',
  'Organization',
];

export const multiTenancyModels = [
  'AuditLog',
  'Role',
  'UserOrganization',
  'Team',
  'Shift',
  'Location',
  'Asset',
  'AssetField',
  'AssetPart',
  'AssetSchedule',
  'AssetTemplate',
  'WorkOrder',
  'WorkOrderLink',
  'WorkOrderLOTO',
  'FeatureFlag',
  'Setting',
  'Vendor',
  'Customer',
  'Part',
  'PartTemplate',
  'InventoryLine',
  'InventoryTransaction',
  'PurchaseOrder',
  'Checklist',
  'ChecklistResponse',
  'PMSchedule',
  'PMScheduleTemplate',
  'MaintenanceRequest',
  'Notification',
  'NotificationTemplate',
  'Category',
  'WorkflowRule',
  'ApiKey',
  'WebhookSubscription',
  'SyncState',
  'SyncQueue',
  'ChangeLog',
  'SyncConflict',
  'CustomStatus',
  'ApprovalChain',
  'ApprovalRecord',
  'WorkOrderPlannedPart',
  'Meter',
  'PushSubscription',
  'SavedView',
  'ScheduledReport',
  'Tag',
];

export const getExtendedClient = (prisma: PrismaClient) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const organizationId = TenancyContext.organizationId;
          const userId = TenancyContext.userId;
          const userOrgId = TenancyContext.userOrgId;
          const role = TenancyContext.role;
          const teamIds = TenancyContext.teamIds;
          const locationIds = TenancyContext.locationIds;

          // Skip for models that don't need isolation
          if (
            model === 'RefreshToken' ||
            model === 'Invitation'
          ) {
            return query(args);
          }

          const isSoftDelete = softDeleteModels.includes(model);
          const isMultiTenant = multiTenancyModels.includes(model);

          // Standardize 'where' clause initialization only for operations that support it
          const supportsWhere = [
            'findFirst',
            'findMany',
            'count',
            'update',
            'updateMany',
            'delete',
            'deleteMany',
            'aggregate',
            'groupBy',
            'findUnique',
            'upsert',
          ].includes(operation);

          if (supportsWhere) {
            args.where = args.where || {};
          }

          // 1. SOFT DELETE: Filter out deleted records for read operations
          if (isSoftDelete && [
            'findFirst',
            'findMany',
            'count',
            'aggregate',
            'groupBy',
            'findUnique', // Note: Prisma 5 might require findFirst for this to work with soft-delete
          ].includes(operation)) {
            args.where = { ...args.where, deletedAt: null };
          }

          // 2. MULTI-TENANCY: Force organizationId scoping
          if (isMultiTenant && organizationId) {
            // SAFEGUARD FOR UNIQUE OPERATIONS:
            // Since Prisma's findUnique/update/delete require unique identifiers and reject organizationId
            // in the where clause, we must manually enforce RLS here by verifying ownership before mutation,
            // or converting to findFirst.
            if (['update', 'delete'].includes(operation)) {
              const record = await (prisma as any)[model].findFirst({
                where: { id: args.where.id, organizationId },
              });
              if (!record) {
                throw new Error(`Record not found or access denied for ${model}`);
              }
              // If we reach here, it exists and is owned by the organization. Let the original operation run.
            } else if (operation === 'findUnique') {
              operation = 'findFirst';
            }

            if ([
              'findFirst',
              'findMany',
              'count',
              'updateMany',
              'deleteMany',
              'aggregate',
              'groupBy',
              'findUnique', // now handled as findFirst
            ].includes(operation)) {
              args.where = { ...args.where, organizationId };

              // RBAC/LBAC Scoping
              if (
                role === SystemRole.LIMITED_TECHNICIAN &&
                ['WorkOrder', 'MaintenanceRequest'].includes(model)
              ) {
                args.where = {
                  ...args.where,
                  OR: [
                    { assignedToId: userOrgId },
                    { assignedTeamId: { in: teamIds } },
                    { requesterId: userOrgId },
                  ],
                };
              }
              if (locationIds && locationIds.length > 0) {
                if (model === 'Asset') {
                  args.where.locationId = { in: locationIds };
                } else if (model === 'Location') {
                  args.where.id = { in: locationIds };
                } else if (model === 'WorkOrder') {
                  // Flatter structure for better indexing
                  const locationFilter = { asset: { locationId: { in: locationIds } } };
                  if (args.where.OR) {
                    args.where.AND = [
                      { OR: args.where.OR },
                      { OR: [locationFilter, { assignedToId: userOrgId }] }
                    ];
                    delete args.where.OR;
                  } else {
                    args.where.OR = [locationFilter, { assignedToId: userOrgId }];
                  }
                }
              }
            }

            if (['create', 'createMany'].includes(operation)) {
              if (Array.isArray(args.data))
                args.data = args.data.map((i: any) => ({
                  ...i,
                  organizationId,
                }));
              else args.data = { ...args.data, organizationId };
            }
            if (operation === 'upsert') {
              args.create = { ...args.create, organizationId };
              args.update = { ...args.update, organizationId };
            }
          }

          // 3. SOFT DELETE: Override delete operations to perform updates instead
          if (isSoftDelete) {
            if (operation === 'delete') {
              const result = await (prisma as any)[model].update({
                where: args.where,
                data: { deletedAt: new Date() },
              });
              
              // Manual Audit for Delete (since it's now an update)
              if (organizationId) {
                (prisma as any).auditLog?.create({
                  data: {
                    action: 'DELETE',
                    model,
                    entityId: result?.id || args?.where?.id,
                    userId,
                    organizationId,
                    oldData: result, // result contains the state after soft-delete, or we could fetch before
                    createdAt: new Date(),
                  },
                }).catch(() => {});
              }
              return result;
            }
            if (operation === 'deleteMany') {
              return (prisma as any)[model].updateMany({
                where: args.where,
                data: { deletedAt: new Date() },
              });
            }
          }

          // 4. PRE-FETCH OLD DATA (For Update Audit)
          let oldData = null;
          if (operation === 'update' && organizationId && model !== 'AuditLog') {
            oldData = await (prisma as any)[model].findUnique({ where: args.where }).catch(() => null);
          }

          // Execute query
          const result = await query(args);

          // 5. AUTOMATED AUDIT LOGGING (Non-blocking)
          if (
            ['create', 'update', 'upsert', 'updateMany'].includes(operation) &&
            model !== 'AuditLog' &&
            organizationId
          ) {
            (prisma as any).auditLog?.create({
              data: {
                action: operation.toUpperCase(),
                model,
                entityId: result?.id || args?.where?.id || 'batch',
                userId,
                organizationId,
                oldData: oldData,
                newData: ['create', 'update', 'upsert'].includes(operation)
                  ? args.data || args.create
                  : null,
                createdAt: new Date(),
              },
            }).catch(() => {});
          }

          return result;
        },
      },
    },
  });
};

export type ExtendedPrismaClient = ReturnType<typeof getExtendedClient>;
