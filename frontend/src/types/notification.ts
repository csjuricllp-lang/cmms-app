export interface AppNotification {
    id: string;
    type: string;
    title: string;
    content: string;
    isRead: boolean;
    userId: string;
    organizationId: string;
    metaData?: {
        workOrderId?: string;
        entityId?: string;
        [key: string]: any;
    };
    createdAt: string;
}
