export enum Permission {
  // Asset Permissions
  CREATE_ASSET = 'assets.create',
  READ_ASSET = 'assets.read',
  UPDATE_ASSET = 'assets.update',
  DELETE_ASSET = 'assets.delete',

  // Location Permissions
  CREATE_LOCATION = 'locations.create',
  READ_LOCATION = 'locations.read',
  UPDATE_LOCATION = 'locations.update',
  DELETE_LOCATION = 'locations.delete',

  // Settings Permissions
  MANAGE_SETTINGS = 'settings.manage',

  // Vendor Permissions
  CREATE_VENDOR = 'vendors.create',
  READ_VENDOR = 'vendors.read',
  UPDATE_VENDOR = 'vendors.update',
  DELETE_VENDOR = 'vendors.delete',

  // Customer Permissions
  CREATE_CUSTOMER = 'customers.create',
  READ_CUSTOMER = 'customers.read',
  UPDATE_CUSTOMER = 'customers.update',
  DELETE_CUSTOMER = 'customers.delete',

  // Part / Inventory Permissions
  CREATE_PART = 'parts.create',
  READ_PART = 'parts.read',
  UPDATE_PART = 'parts.update',
  DELETE_PART = 'parts.delete',

  // Purchase Order Permissions
  CREATE_PO = 'po.create',
  READ_PO = 'po.read',
  UPDATE_PO = 'po.update',
  DELETE_PO = 'po.delete',

  // Checklist Permissions
  CREATE_CHECKLIST = 'checklists.create',
  READ_CHECKLIST = 'checklists.read',
  UPDATE_CHECKLIST = 'checklists.update',
  DELETE_CHECKLIST = 'checklists.delete',

  // Preventive Maintenance Permissions
  CREATE_PM = 'pm.create',
  READ_PM = 'pm.read',
  UPDATE_PM = 'pm.update',
  DELETE_PM = 'pm.delete',

  // Maintenance Request Permissions
  CREATE_REQUEST = 'requests.create',
  READ_REQUEST = 'requests.read',
  UPDATE_REQUEST = 'requests.update',
  DELETE_REQUEST = 'requests.delete',

  // Analytics Permissions
  VIEW_ANALYTICS = 'analytics.view',

  // Import/Export Permissions
  MANAGE_DATA_IMPORT_EXPORT = 'data.manage',

  // Work Order Permissions
  CREATE_WORK_ORDER = 'work-orders.create',
  READ_WORK_ORDER = 'work-orders.read',
  READ_ALL_WORK_ORDERS = 'work-orders.read-all',
  UPDATE_WORK_ORDER = 'work-orders.update',
  DELETE_WORK_ORDER = 'work-orders.delete',

  // Base Access
  ACCESS_DASHBOARD = 'dashboard.access',

  // People & Teams
  MANAGE_USERS = 'users.manage',
  MANAGE_ROLES = 'roles.manage',
}
