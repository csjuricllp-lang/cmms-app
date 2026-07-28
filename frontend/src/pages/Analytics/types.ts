export type DashboardCategory = 'General' | 'Work Orders' | 'Assets' | 'Meters' | 'Parts' | 'Requests' | 'Users' | 'Audit Trail';

export type Dashboard = {
    id: string;
    label: string;
    category: DashboardCategory;
    icon: any;
    recommended?: boolean;
};

export type DateFilter = {
    id: number;
    operator: string;
    value: string;
    unit: string;
    startDate?: string;
    endDate?: string;
};

export type AnalyticsData = {
    overview?: any;
    teamPerformance?: any;
    costMaintenance?: any;
    assetDowntime?: any;
    adoptionMetrics?: any;
    complianceMetrics?: any;
    statusReport?: any;
    timeAndCost?: any;
    woAging?: any;
    reliability?: any;
    parts?: any;
    requests?: any;
    metadata?: any;
};
