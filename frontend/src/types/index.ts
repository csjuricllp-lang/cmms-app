export interface Location {
    id: string;
    name: string;
    type: string;
    address?: string;
    description?: string;
    parentId?: string;
    parent?: { id: string, name: string };
    latitude?: number;
    longitude?: number;
    _count?: { children: number, assets: number, workers: number, teams: number, vendors: number, customers: number };
    createdAt: string;
    workers?: User[];
    teams?: Team[];
    vendors?: Vendor[];
    customers?: Customer[];
    assets?: Asset[];
    workOrders?: any[];
    parts?: any[];
    children?: { id: string, name: string, type: string }[];
    files?: { id: string; filename: string; url: string; mimeType: string; size: number }[];
}

export interface Asset {
    id: string;
    name: string;
    description?: string;
    status: string;
    criticality: string;
    serialNumber?: string;
    barCode?: string;
    category?: string;
    imageUrl?: string;
    location?: { id: string, name: string; location?: { id: string, name: string } };
    locationId?: string;
    parentId?: string;
    purchasePrice?: number | string;
    purchaseDate?: string;
    usefulLifeYears?: number | string;
    residualValue?: number | string;
    model?: string;
    brand?: string;
    requiresLOTO?: boolean;
    createdAt?: string;
    meters?: Meter[];
    area?: string;
    placedInService?: string;
    warrantyExpiration?: string;
    assignedTo?: { id: string; user: { name: string; avatarUrl?: string } };
    children?: Asset[];
    spareParts?: { part: Part }[];
}

export interface Team {
    id: string;
    name: string;
    _count?: { users: number };
}

export interface User {
    id: string;
    name: string;
    email: string;
    userOrgId: string;
    phone?: string;
    jobTitle?: string;
    hourlyRate?: number;
    companyRate?: number;
    roleName?: string;
    lastLoginAt?: string;
    createdAt?: string;
}

export interface Vendor {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

export interface Checklist {
    id: string;
    title: string;
    description?: string;
    items?: { id: string; task: string; dataType: string; isRequired: boolean }[];
    _count?: { items: number };
}

export interface PurchaseOrder {
    id: string;
    number: string;
    status: string;
    totalCost?: number;
    vendor?: { id: string; name: string };
    workOrderId?: string;
    _count?: { items: number };
}

export interface Category {
    id: string;
    name: string;
    color?: string;
    type: 'ASSET' | 'WORK_ORDER' | 'PART' | 'INVENTORY';
}

export interface Part {
    id: string;
    name: string;
    description: string;
    partNumber: string;
    barcode: string;
    quantity: number;
    minQuantity: number;
    maxQuantity?: number;
    cost: number;
    status: string;
    binLocation?: string;
    location?: { id: string, name: string };
}

export interface PMSchedule {
    id: string;
    name: string;
    description?: string;
    woTitle?: string;
    woDescription?: string;
    imageUrl?: string;
    isActive: boolean;
    advanceNoticeDays: number;
    assetId: string;
    checklistId?: string;
    assignedToId?: string;
    categoryId?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';
    frequencyType?: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS' | 'METER' | 'HYBRID';
    frequencyValue?: number;
    isFloating: boolean;
    isSeasonal?: boolean;
    startMonth?: number;
    endMonth?: number;
    lastGenerated?: string;
    meterId?: string;
    meterInterval?: number;
    nextDueDate?: string;
    nextMeterReading?: number;
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'PAUSED';
    durationHours?: number;
    requiresSignature?: boolean;
    dueDateTime?: string;
    createWOType?: 'AHEAD' | 'ON_DAY';
    meterWODueValue?: number;
    meterWODueUnit?: 'HOURS' | 'DAYS' | 'WEEKS';
    meterTriggerType?: 'INTERVAL' | 'THRESHOLD' | 'RELATIVE';
    assets?: {
        assetId: string;
        locationId?: string;
        meterId?: string;
        startDate?: string;
        assignedToId?: string;
    }[];
    inactivePeriods?: { startDate: string; endDate: string; reason?: string }[];
    plannedParts?: { partId: string; quantity: number }[];
    plannedTasks?: { task: string; order: number }[];
    createNow?: boolean;
    createdAt: string;
    files?: { id: string; filename: string; url: string; mimeType: string; size: number }[];
    asset?: Asset;
    checklist?: Checklist;
    category?: Category;
    assignedTo?: { id: string; user: { name: string; email?: string } };
}

export interface Meter {
    id: string;
    name: string;
    unit: string;
    assetId: string;
    currentValue: number;
    threshold?: number;
    readings?: MeterReading[];
}

export interface MeterReading {
    id: string;
    value: number;
    createdAt: string;
    meterId: string;
    userId: string;
    user?: User;
}

export interface WorkOrder {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    locationId?: string;
    assetId?: string;
    assignedToId?: string;
    teamId?: string;
    categoryId?: string;
    createdAt: string;
    updatedAt: string;
    responseTimeTarget?: string;
    resolutionTimeTarget?: string;
    escalatedAt?: string;
    isEscalated?: boolean;
    _count?: { tasks: number; files: number };
}

export interface Request {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    locationId?: string;
    assetId?: string;
    requesterId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuditLog {
    id: string;
    action: string;
    model: string;
    entityId: string;
    userId: string | null;
    organizationId: string;
    oldData: any | null;
    newData: any | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: string;
    user?: {
        name: string;
        avatarUrl?: string;
    };
}
export * from './notification';
