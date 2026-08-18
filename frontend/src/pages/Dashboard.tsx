import { useDashboardStats, useLocations, useAuditLogs, usePurchaseOrders } from '../hooks/useData';
import { useWorkOrders } from '../hooks/useWorkOrders';
// Types are imported but currently using any for simplicity in this view
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
    Activity,
    AlertCircle,
    Clock,
    TrendingUp,
    ShieldCheck,
    Dna,
    MapPin,
    Boxes,
    ChevronRight,
    Hammer,
    LayoutGrid,
    Search,
    CircleCheck,
    BarChart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';

import { useState } from 'react';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [isCreateWoModalOpen, setIsCreateWoModalOpen] = useState(false);
    const [globalSearch, setGlobalSearch] = useState('');
    
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    let userRole = (user?.roleName || '').toUpperCase();
    if (!userRole && user?.organizations?.[0]?.role) {
        userRole = user.organizations[0].role.toUpperCase();
    }
    
    const isManager = ['OWNER', 'ADMINISTRATOR', 'MANAGER', 'ADMIN', 'MISSION SPECIALIST', 'MAINTENANCE MANAGER'].includes(userRole);
    const isActualManager = ['OWNER', 'ADMINISTRATOR', 'MANAGER', 'ADMIN', 'MAINTENANCE MANAGER'].includes(userRole);

    // 1. Core Analytics
    const { data: stats, isLoading: statsLoading } = useDashboardStats();

    // 2. Facility Nodes (Locations)
    const { data: locations, isLoading: locationsLoading } = useLocations();

    // 3. Mission Pulse (Audit Logs)
    const { data: activity } = useAuditLogs();

    // 4. My Tasks (For Technicians)
    const { workOrders: myTasks } = useWorkOrders({
        assignedToId: !isManager ? user?.userOrgId : undefined,
        status: !isManager ? 'OPEN' : undefined
    });

    const { data: pendingPOs, isLoading: pendingPOsLoading } = usePurchaseOrders();

    const handleGenerateReport = async () => {
        try {
            const response = await api.get('/analytics/reliability-report/pdf', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Operation_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Report Engine Error:', error);
        }
    };

    const overview = stats?.data?.overview || {
        totalWorkOrders: 0,
        totalRequests: 0,
        mttrHours: "0.00",
        pmComplianceRate: 100,
        assetAvailability: 100,
        totalStockValue: 0,
        totalCosts: 0,
        lotoComplianceRate: 0
    };

    const statusMap = stats?.data?.workOrderStatus || [];

    const getTrendClass = (trendType: string) => {
        switch (trendType) {
            case 'up':
                return 'text-emerald-700 bg-emerald-50';
            case 'down':
                return 'text-[#D97706] bg-[#FFF8EB]';
            case 'secure':
            case 'elite':
                return 'text-rose-700 bg-rose-50';
            default:
                return 'text-blue-700 bg-blue-50';
        }
    };

    const woTrend = overview.trends?.workOrders || "+0%";
    const mttrTrend = overview.trends?.mttr || "0%";
    const lotoTrend = overview.trends?.loto || "Secure";
    const pmTrend = overview.trends?.pm || "+0%";
    const mwtTrend = overview.trends?.mwt || "0%";

    const getTrendType = (val: string, reverse = false) => {
        if (val === 'Secure') return 'secure';
        if (val.startsWith('+')) return reverse ? 'down' : 'up';
        if (val.startsWith('-')) return reverse ? 'up' : 'down';
        return 'default';
    };

    const displayStats = isManager ? [
        { 
            label: "Fleet Work Orders", 
            value: overview.totalWorkOrders, 
            trend: woTrend, 
            trendType: getTrendType(woTrend),
            icon: Activity, 
            iconBg: "bg-[#EFF6FF] text-blue-600", 
            path: "/work-orders" 
        },
        { 
            label: "Repair MTTR", 
            value: `${overview.mttrHours}h`, 
            trend: mttrTrend, 
            trendType: getTrendType(mttrTrend, true),
            icon: Clock, 
            iconBg: "bg-[#F5F3FF] text-violet-600", 
            path: "/analytics" 
        },
        { 
            label: "LOTO Safety", 
            value: `${overview.lotoComplianceRate}%`, 
            trend: lotoTrend, 
            trendType: getTrendType(lotoTrend),
            icon: ShieldCheck, 
            iconBg: "bg-[#FFF1F2] text-rose-600", 
            path: "/checklists" 
        },
        { 
            label: "PM Precision", 
            value: `${overview.pmComplianceRate}%`, 
            trend: pmTrend, 
            trendType: getTrendType(pmTrend),
            icon: TrendingUp, 
            iconBg: "bg-[#FFFbeb] text-amber-600", 
            path: "/pm" 
        },
        { 
            label: "Wait Time (MWT)", 
            value: `${overview.mwtHours || 0}h`, 
            trend: mwtTrend, 
            trendType: getTrendType(mwtTrend, true),
            icon: Clock, 
            iconBg: "bg-[#F0FDF4] text-emerald-600", 
            path: "/analytics" 
        },
    ] : [
        { 
            label: "Completed", 
            value: stats?.data?.workOrderStatus?.find((s: any) => s.status === 'COMPLETED')?._count || 0, 
            trend: "Done", 
            trendType: "up",
            icon: CircleCheck, 
            iconBg: "bg-[#F0FDF4] text-emerald-600", 
            path: "/work-orders?status=COMPLETED" 
        },
        { 
            label: "Total Logged", 
            value: overview.totalWorkOrders || 0, 
            trend: "All", 
            trendType: "blue",
            icon: Clock, 
            iconBg: "bg-[#F5F3FF] text-violet-600", 
            path: "/work-orders" 
        },
        { 
            label: "Active Missions", 
            value: (stats?.data?.workOrderStatus?.find((s: any) => s.status === 'OPEN')?._count || 0) + (stats?.data?.workOrderStatus?.find((s: any) => s.status === 'IN_PROGRESS')?._count || 0), 
            trend: "Priority", 
            trendType: "default",
            icon: Activity, 
            iconBg: "bg-[#EFF6FF] text-blue-600", 
            path: "/work-orders" 
        },
        { 
            label: "Field Requests", 
            value: overview.totalRequests || 0, 
            trend: "Status", 
            trendType: "neutral",
            icon: AlertCircle, 
            iconBg: "bg-[#EEF2FF] text-indigo-600", 
            path: "/requests" 
        },
        { 
            label: "Assets Assigned", 
            value: overview.totalAssets || 0, 
            trend: "Health", 
            trendType: "up",
            icon: Boxes, 
            iconBg: "bg-[#F0FDF4] text-emerald-600", 
            path: "/assets" 
        },
        { 
            label: "SLA Targets", 
            value: `${stats?.data?.complianceMetrics?.scheduleCompliance || 0}%`, 
            trend: stats?.data?.complianceMetrics?.summary?.total > 0 ? "On Time" : "No SLA", 
            trendType: "secure",
            icon: BarChart, 
            iconBg: "bg-[#F5F3FF] text-violet-600", 
            path: "/performance" 
        },
        { 
            label: "Avg Wait Time", 
            value: `${overview.mwtHours || 0}h`, 
            trend: "Assigned", 
            trendType: "up",
            icon: Clock, 
            iconBg: "bg-[#F0FDF4] text-emerald-600", 
            path: "/work-orders" 
        },
    ];

    return (
        <div className="glass-dashboard-container space-y-10 pb-20">
            {/* Glowing cold auroral background blobs */}
            <div className="cold-glow-1" />
            <div className="cold-glow-2" />
            <div className="cold-glow-3" />

            {/* Futuristic glossy grid lines overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

            <div className="relative z-10 space-y-10">
                {/* Header: Command Center Pulse */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground font-bold tracking-widest text-xs uppercase opacity-70">
                            <LayoutGrid className="w-4 h-4" />
                            Live Operational Stream
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Global Search Interface */}
                        <div className="relative group min-w-[300px]">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="SEARCH SITES / ASSETS..."
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                                className="w-full h-12 bg-muted/50 border border-border rounded-2xl pl-12 pr-6 text-[10px] font-black text-foreground placeholder:text-muted-foreground uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/40 transition-all italic"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                 onClick={() => setIsCreateWoModalOpen(true)}
                                 className="flex items-center gap-3 px-8 h-12 rounded-[24px] bg-primary hover:bg-black text-white transition-all font-black italic text-[11px] tracking-widest uppercase shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                 <Hammer className="w-4 h-4" /> Create Work Order
                            </button>
                        </div>
                    </div>
                </header>

                <CreateWorkOrderModal 
                    isOpen={isCreateWoModalOpen} 
                    onClose={() => setIsCreateWoModalOpen(false)} 
                />

                {/* Core Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                    {displayStats.map((stat) => (
                        <div 
                            key={stat.label} 
                            onClick={() => navigate(stat.path)}
                            className="bg-white border border-slate-200/60 rounded-[28px] p-5 xl:p-6 group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] active:scale-[0.98] cursor-pointer"
                        >
                            <div className="flex items-start justify-between relative z-10">
                                <div className={cn("w-[52px] h-[52px] flex items-center justify-center rounded-[16px] transition-colors", stat.iconBg)}>
                                    <stat.icon className="w-6 h-6" strokeWidth={2.5} />
                                </div>
                                <div className={cn("flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider transition-all duration-300", getTrendClass(stat.trendType))}>
                                    {stat.trend}
                                </div>
                            </div>
                            <div className="mt-8 relative z-10">
                                <p className="text-[36px] xl:text-[44px] leading-none font-black tracking-tighter text-slate-900 truncate">{statsLoading ? '...' : stat.value}</p>
                                <p className="text-[10px] xl:text-[11px] font-black text-slate-400 mt-2 uppercase tracking-widest italic leading-snug">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column: Facility Intelligence */}
                    <div className="xl:col-span-8 space-y-8">
                        
                        {/* Facility Nodes Grid */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-2xl font-black italic tracking-tight uppercase">Facility Nodes</h3>
                                <button 
                                    onClick={() => navigate('/assets')}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                                >
                                    Explorer Fleet
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {locationsLoading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-40 glass-card-cold animate-pulse" />)
                                ) : (
                                    (locations || [])
                                        .filter((loc: any) => 
                                            !globalSearch || 
                                            loc.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                                            loc.type?.toLowerCase().includes(globalSearch.toLowerCase())
                                        )
                                        .slice(0, 6).map((loc: any) => (
                                        <div 
                                            key={loc.id}
                                            onClick={() => navigate(`/assets?locationId=${loc.id}`)}
                                            className="glass-card-cold p-6 group cursor-pointer hover:border-primary/40 transition-all"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black tracking-tight">{loc._count?.assets || 0}</p>
                                                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-50">Assets</p>
                                                </div>
                                            </div>
                                            <div className="mt-6 flex items-center justify-between">
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-black italic uppercase truncate">{loc.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{loc.type}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Mission Workload Map */}
                        <section className="glass-card-cold rounded-[40px] p-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black italic tracking-tight">MISSION WORKLOAD</h3>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60 mt-1">Live Status Distribution</p>
                                </div>
                                <div className="flex gap-4">
                                    {statusMap.map((s: any) => (
                                        <div key={s.status} className="flex flex-col items-end">
                                            <span className="text-lg font-black">{s._count}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{s.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex border border-slate-200 dark:border-white/5">
                                {statusMap.map((s: any) => (
                                    <div 
                                        key={s.status}
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            s.status === "OPEN" ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" :
                                            s.status === "IN_PROGRESS" ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" :
                                            s.status === "COMPLETED" ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-slate-200 dark:bg-white/10"
                                        )}
                                        style={{ width: `${(s._count / (overview.totalWorkOrders || 1)) * 100}%` }}
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <div className="p-6 rounded-3xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-4 shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black italic uppercase text-muted-foreground tracking-widest">Fleet Availability</span>
                                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{overview.assetAvailability}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                         <div className="h-full bg-emerald-500" style={{ width: `${overview.assetAvailability}%` }} />
                                    </div>
                                </div>
                                <div className="p-6 rounded-3xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-4 shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black italic uppercase text-muted-foreground tracking-widest">PM Precision</span>
                                        <span className="text-2xl font-black text-amber-600 dark:text-amber-500">{overview.pmComplianceRate}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                         <div className="h-full bg-amber-500" style={{ width: `${overview.pmComplianceRate}%` }} />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Pulse & Intelligence */}
                    <div className="xl:col-span-4 space-y-8">
                        
                        {/* Procurement Approval Hub (Manager Only) */}
                        {isManager && (
                            <section className="glass-card-cold rounded-[40px] p-8 border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.05] to-transparent space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            <h3 className="text-xl font-black italic tracking-tight uppercase text-amber-500">
                                                {isActualManager ? 'Procurement Hub' : 'Submission Tracker'}
                                            </h3>
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                                            {isActualManager ? 'Strategic Approval Queue' : 'My Procurement Drafts'}
                                        </p>
                                    </div>
                                    <Boxes className="w-5 h-5 text-amber-500/40" />
                                </div>

                                <div className="space-y-4">
                                    {pendingPOsLoading ? (
                                        <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" /></div>
                                    ) : (pendingPOs || []).filter((po: any) => 
                                        (po.status === 'PENDING_APPROVAL' || po.status === 'DRAFT') &&
                                        (!globalSearch || 
                                         po.number?.toLowerCase().includes(globalSearch.toLowerCase()) || 
                                         po.vendor?.name?.toLowerCase().includes(globalSearch.toLowerCase()))
                                    ).length > 0 ? (
                                        (pendingPOs || []).filter((po: any) => 
                                            (po.status === 'PENDING_APPROVAL' || po.status === 'DRAFT') &&
                                            (!globalSearch || 
                                             po.number?.toLowerCase().includes(globalSearch.toLowerCase()) || 
                                             po.vendor?.name?.toLowerCase().includes(globalSearch.toLowerCase()))
                                        ).slice(0, 3).map((po: any) => (
                                            <div key={po.id} className="group p-5 rounded-[2rem] bg-amber-50/20 dark:bg-white/5 border border-amber-100/50 dark:border-white/10 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">{po.status.replace('_', ' ')}</span>
                                                        <span className="text-sm font-black italic uppercase leading-none mt-1 text-foreground">{po.number}</span>
                                                    </div>
                                                    <span className="text-lg font-black italic text-foreground dark:text-white tracking-tighter">₹{po.totalCost?.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-muted-foreground truncate max-w-[120px]">{po.vendor?.name || 'Standard Supplier'}</p>
                                                    <button 
                                                        onClick={() => navigate('/po')}
                                                        className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black dark:group-hover:text-black transition-all"
                                                    >
                                                        {isActualManager ? 'Authorize' : 'View Status'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 flex flex-col items-center justify-center opacity-30 select-none">
                                            <ShieldCheck className="w-12 h-12 mb-4 stroke-[1]" />
                                            <p className="text-[10px] font-black uppercase tracking-widest italic text-center leading-relaxed">No missions currently<br/>awaiting authorization.</p>
                                        </div>
                                    )}
                                </div>

                                {pendingPOs && pendingPOs.length > 3 && (
                                    <button 
                                        onClick={() => navigate('/po')}
                                        className="w-full py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest italic text-foreground"
                                    >
                                        View Full Manifest ({pendingPOs.length})
                                    </button>
                                )}
                            </section>
                        )}

                        {/* Live Mission Pulse */}
                        <section className="glass-card-cold rounded-[40px] p-8 space-y-8 flex flex-col">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black italic tracking-tight uppercase">Mission Pulse</h3>
                                <Activity className="w-5 h-5 text-primary animate-pulse" />
                            </div>

                            <div className="space-y-6 flex-1 custom-scrollbar overflow-y-auto pr-2 max-h-[600px]">
                                {activity?.pages?.flatMap(p => p.items)?.filter((log: any) => 
                                    !globalSearch || 
                                    log.action?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                                    log.user?.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                                    log.model?.toLowerCase().includes(globalSearch.toLowerCase())
                                ).map((log: any) => (
                                    <div key={log.id} className="relative pl-6 border-l border-slate-200 dark:border-white/10 group">
                                        <div className="absolute top-1 -left-[5px] w-2 h-2 rounded-full bg-primary ring-4 ring-background group-hover:scale-125 transition-all" />
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{log.action?.replace(/_/g, ' ')}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground opacity-50 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(log.createdAt))} ago
                                                </p>
                                            </div>
                                            <p className="text-xs font-bold text-foreground dark:text-white leading-relaxed group-hover:text-primary/90 transition-colors">
                                                {log.user?.name || 'System'} triggered {log.model} event
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!activity?.pages?.[0]?.items || activity.pages[0].items.length === 0) && (
                                    <div className="text-center py-10 opacity-30 italic font-black text-[10px] uppercase tracking-widest">
                                        Awaiting telemetry...
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-slate-200 dark:border-white/5">
                                <button 
                                    onClick={handleGenerateReport}
                                    className="w-full py-5 rounded-[24px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 text-foreground"
                                >
                                    <Dna className="w-4 h-4" /> Audit Operation
                                </button>
                            </div>
                        </section>

                        {/* Cost Drain Card */}
                        <section className="glass-card-cold rounded-[40px] p-8 space-y-6 bg-gradient-to-br from-slate-50 dark:from-white/[0.03] to-transparent">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black italic tracking-tight text-amber-500">CASH DRAIN</h3>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40 italic">Top Resource Consumers (30d)</p>
                            </div>

                            <div className="space-y-4">
                                {stats?.data?.topAssetsByCost?.map((asset: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5 group">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black italic text-xs text-foreground/40 dark:text-white/10 group-hover:text-amber-500/30 transition-all">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-black uppercase italic truncate">{asset.name}</p>
                                            <p className="text-[10px] font-bold text-amber-500/80 mt-0.5">${asset.totalCost?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => navigate('/analytics')}
                                className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-amber-500/30 transition-all text-[9px] font-black uppercase tracking-widest italic text-foreground"
                            >
                                Cost Breakdown
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

