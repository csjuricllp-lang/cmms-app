import Dexie, { type Table } from 'dexie';

export interface WorkOrderSync {
    id: string; // matches backend UUID
    woNumber: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    category?: string;
    asset?: string;
    assetId?: string;
    assetName?: string;
    location?: string;
    locationId?: string;
    locationName?: string;
    startDate?: string;
    dueDate?: string;
    assignedTo?: string;
    assignedToId?: string;
    assignee?: string;
    createdAt?: string;
    updatedAt: string;
    completedAt?: string | null;
    archived?: boolean;
    teamName?: string;
    requestedBy?: string;
    assignedTeamId?: string | null;
    isReactive?: boolean;
    isRepeating?: boolean;
    isBookmarked?: boolean;
    isDirty: number; // 0 or 1
    isNew: number;   // 0 or 1
    requiresLOTO?: boolean;
    lotoVerified?: boolean;
    lotoAudit?: any;
    estimatedHours?: number;
    requiresSignature?: boolean;
    purchaseOrderId?: string | null;

    // Advanced Enterprise Data
    checklist?: any;
    checklistResponses?: any[];
    tasks?: any[];
    comments?: any[];
    timeLogs?: any[];
    files?: any[];
    partsUsed?: any[];
    statusHistory?: any[];
    technicians?: any[];
    linkedWorkOrders?: any[];
    linkedFromOrders?: any[];
    isShared?: boolean;
    shareToken?: string;
    laborEstMinutes?: number;
    resolutionNotes?: string;
    isEscalated?: boolean;
    responseTimeTarget?: string;
    resolutionTimeTarget?: string;
    escalatedAt?: string;
    request?: any;
    requestId?: string | null;
}

export interface SyncQueue {
    id?: number;
    entity: 'work-order' | 'request' | 'part' | 'reading';
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    payload: any;
    timestamp: number;
}

export interface MediaSync {
    id: string;
    workOrderId?: string;
    requestId?: string;
    pmScheduleId?: string;
    file: Blob;
    fileName: string;
    fileType: string;
    timestamp: number;
}

export class EliteDB extends Dexie {
    workOrders!: Table<WorkOrderSync>;
    syncQueue!: Table<SyncQueue>;
    mediaQueue!: Table<MediaSync>;

    constructor() {
        super('EliteCMMS_DB');
        this.version(4).stores({
            workOrders: 'id, status, assetName, isDirty, requiresLOTO',
            syncQueue: '++id, entity, action',
            mediaQueue: 'id, workOrderId, requestId, pmScheduleId'
        });
    }
}

export const db = new EliteDB();
