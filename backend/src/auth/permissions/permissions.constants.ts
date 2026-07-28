export const Permissions = {
  ASSETS: {
    CREATE: 'assets.create',
    READ: 'assets.read',
    UPDATE: 'assets.update',
    DELETE: 'assets.delete',
  },
  LOCATIONS: {
    CREATE: 'locations.create',
    READ: 'locations.read',
    UPDATE: 'locations.update',
    DELETE: 'locations.delete',
  },
  WORK_ORDERS: {
    CREATE: 'work-orders.create',
    READ: 'work-orders.read',
    READ_ALL: 'work-orders.read-all',
    MANAGE_COSTS: 'work-orders.manage-costs',
    UPDATE: 'work-orders.update',
    DELETE: 'work-orders.delete',
    COMPLETE: 'work-orders.complete',
    ASSIGN: 'work-orders.assign',
  },
  PARTS: {
    CREATE: 'parts.create',
    READ: 'parts.read',
    UPDATE: 'parts.update',
    DELETE: 'parts.delete',
  },
  PREVENTIVE_MAINTENANCE: {
    CREATE: 'pm.create',
    READ: 'pm.read',
    UPDATE: 'pm.update',
    DELETE: 'pm.delete',
    MANAGE: 'pm.manage',
  },
  REQUESTS: {
    CREATE: 'requests.create',
    READ: 'requests.read',
    UPDATE: 'requests.update',
    DELETE: 'requests.delete',
  },
  VENDORS: {
    CREATE: 'vendors.create',
    READ: 'vendors.read',
    UPDATE: 'vendors.update',
    DELETE: 'vendors.delete',
  },
  CUSTOMERS: {
    CREATE: 'customers.create',
    READ: 'customers.read',
    UPDATE: 'customers.update',
    DELETE: 'customers.delete',
  },
  TEAMS: {
    MANAGE: 'teams.manage',
  },
  USERS: {
    MANAGE: 'users.manage',
  },
  REPORTS: {
    VIEW: 'reports.view',
    EXPORT: 'reports.export',
  },
  FEATURE_FLAGS: {
    MANAGE: 'feature-flags.manage',
  },
  SLA: {
    MANAGE: 'sla.manage',
  },
  WORKFLOWS: {
    MANAGE: 'workflows.manage',
    READ: 'workflows.read',
  },
} as const;

export type PermissionType =
  (typeof Permissions)[keyof typeof Permissions][keyof (typeof Permissions)[keyof typeof Permissions]];
