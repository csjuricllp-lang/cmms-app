import { 
    Users, 
    TrendingUp, 
    Clock, 
    Activity, 
    ShieldAlert, 
    BarChart as BarChartIcon, 
    Calendar, 
    LayoutGrid, 
    AlertCircle, 
    RefreshCcw 
} from 'lucide-react';
import type { Dashboard } from './types';

export const CHART_COLORS = ['#6366F1', '#F43F5E', '#10B981', '#F59E0B', '#60A5FA', '#F97316'];

export const ALL_DASHBOARDS: Dashboard[] = [
    { id: 'Performance', label: 'Team Performance', category: 'General', icon: Users, recommended: true },
    { id: 'Cost', label: 'Cost of Maintenance', category: 'General', icon: TrendingUp, recommended: true },
    { id: 'Uptime', label: 'Asset Downtime and Utilization', category: 'Assets', icon: Clock, recommended: true },
    { id: 'Adoption', label: 'Juric Adoption Metrics', category: 'General', icon: Activity },
    { id: 'Compliance', label: 'Maintenance Compliance', category: 'Work Orders', icon: ShieldAlert },
    { id: 'StatusReport', label: 'Status Report', category: 'Work Orders', icon: BarChartIcon },
    { id: 'TimeAndCost', label: 'Time & Cost', category: 'Work Orders', icon: Clock },
    { id: 'WOAging', label: 'Work Order Aging', category: 'Work Orders', icon: Calendar },
    { id: 'WOAnalysis', label: 'Work Order Analysis', category: 'Work Orders', icon: LayoutGrid },
    { id: 'Reliability', label: 'Reliability Dashboard', category: 'Assets', icon: TrendingUp },
    { id: 'TotalCost', label: 'Total Maintenance Cost', category: 'Assets', icon: TrendingUp },
    { id: 'UsefulLife', label: 'Useful Life', category: 'Assets', icon: Activity },
    { id: 'Meters', label: 'Meters', category: 'Meters', icon: Activity },
    { id: 'PartsConsumption', label: 'Parts Consumption', category: 'Parts', icon: LayoutGrid },
    { id: 'PartsInventory', label: 'Parts in Inventory', category: 'Parts', icon: LayoutGrid },
    { id: 'Requests', label: 'Requests', category: 'Requests', icon: AlertCircle },
    { id: 'ItemizedTime', label: 'Itemized Time Report', category: 'Users', icon: Clock },
    { id: 'UserLogin', label: 'User Login', category: 'Users', icon: Users },
    { id: 'AssetAudit', label: 'Asset Audit Trail', category: 'Audit Trail', icon: RefreshCcw },
    { id: 'CustomReport', label: 'Ad-Hoc Report Builder', category: 'General', icon: LayoutGrid, recommended: true },
];
