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
import { motion } from 'framer-motion';

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
        pmComplianceRate: 0,
        assetAvailability: 0,
        totalStockValue: 0,
        totalCosts: 0,
        lotoComplianceRate: 0
    };

    const statusMap = stats?.data?.workOrderStatus || [];

    const getTrendClass = (trendType: string) => {
        return 'bg-white/20 text-white shadow-sm backdrop-blur-md border border-white/10';
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
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-red-600/[0.50] to-red-500/[0.30] border-red-400/50 shadow-[0_8px_30px_-12px_rgba(220,38,38,0.2)]",
            textColor: "text-red-950 dark:text-red-50",
            labelColor: "text-red-900/80 dark:text-red-100/70",
            path: "/work-orders" 
        },
        { 
            label: "Repair MTTR", 
            value: `${overview.mttrHours}h`, 
            trend: mttrTrend, 
            trendType: getTrendType(mttrTrend, true),
            icon: Clock, 
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-violet-600/[0.50] to-fuchsia-600/[0.30] border-violet-400/50 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.2)]",
            textColor: "text-violet-950 dark:text-violet-50",
            labelColor: "text-violet-900/80 dark:text-violet-100/70",
            path: "/analytics" 
        },
        { 
            label: "LOTO Safety", 
            value: `${overview.lotoComplianceRate}%`, 
            trend: lotoTrend, 
            trendType: getTrendType(lotoTrend),
            icon: ShieldCheck, 
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-rose-500/[0.50] to-pink-500/[0.30] border-rose-400/50 shadow-[0_8px_30px_-12px_rgba(244,63,94,0.2)]",
            textColor: "text-rose-950 dark:text-rose-50",
            labelColor: "text-rose-900/80 dark:text-rose-100/70",
            path: "/checklists" 
        },
        { 
            label: "PM Precision", 
            value: `${overview.pmComplianceRate}%`, 
            trend: pmTrend, 
            trendType: getTrendType(pmTrend),
            icon: TrendingUp, 
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-amber-500/[0.50] to-orange-500/[0.30] border-amber-400/50 shadow-[0_8px_30px_-12px_rgba(245,158,11,0.2)]",
            textColor: "text-amber-950 dark:text-amber-50",
            labelColor: "text-amber-900/80 dark:text-amber-100/70",
            path: "/pm" 
        },
        { 
            label: "Wait Time (MWT)", 
            value: `${overview.mwtHours || 0}h`, 
            trend: mwtTrend, 
            trendType: getTrendType(mwtTrend, true),
            icon: Clock, 
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-emerald-500/[0.50] to-teal-500/[0.30] border-emerald-400/50 shadow-[0_8px_30px_-12px_rgba(16,185,129,0.2)]",
            textColor: "text-emerald-950 dark:text-emerald-50",
            labelColor: "text-emerald-900/80 dark:text-emerald-100/70",
            path: "/analytics" 
        },
    ] : [
        { 
            label: "Completed", 
            value: stats?.data?.workOrderStatus?.find((s: any) => s.status === 'COMPLETED')?._count || 0, 
            trend: "Done", 
            trendType: "up",
            icon: CircleCheck, 
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-emerald-500/[0.50] to-teal-500/[0.30] border-emerald-400/50 shadow-[0_8px_30px_-12px_rgba(16,185,129,0.2)]",
            textColor: "text-emerald-950 dark:text-emerald-50",
            labelColor: "text-emerald-900/80 dark:text-emerald-100/70",
            path: "/work-orders?status=COMPLETED" 
        },
        { 
            label: "Total Logged", 
            value: overview.totalWorkOrders || 0, 
            trend: "All", 
            trendType: "blue",
            icon: Clock, 
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-violet-600/[0.50] to-fuchsia-600/[0.30] border-violet-400/50 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.2)]",
            textColor: "text-violet-950 dark:text-violet-50",
            labelColor: "text-violet-900/80 dark:text-violet-100/70",
            path: "/work-orders" 
        },
        { 
            label: "Active Missions", 
            value: (stats?.data?.workOrderStatus?.find((s: any) => s.status === 'OPEN')?._count || 0) + (stats?.data?.workOrderStatus?.find((s: any) => s.status === 'IN_PROGRESS')?._count || 0), 
            trend: "Priority", 
            trendType: "default",
            icon: Activity, 
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-red-600/[0.50] to-red-500/[0.30] border-red-400/50 shadow-[0_8px_30px_-12px_rgba(220,38,38,0.2)]",
            textColor: "text-red-950 dark:text-red-50",
            labelColor: "text-red-900/80 dark:text-red-100/70",
            path: "/work-orders" 
        },
        { 
            label: "Field Requests", 
            value: overview.totalRequests || 0, 
            trend: "New", 
            trendType: "down",
            icon: AlertCircle, 
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-rose-500/[0.50] to-pink-500/[0.30] border-rose-400/50 shadow-[0_8px_30px_-12px_rgba(244,63,94,0.2)]",
            textColor: "text-rose-950 dark:text-rose-50",
            labelColor: "text-rose-900/80 dark:text-rose-100/70",
            path: "/requests" 
        },
        { 
            label: "SLA Targets", 
            value: `${stats?.data?.complianceMetrics?.scheduleCompliance || 0}%`, 
            trend: stats?.data?.complianceMetrics?.summary?.total > 0 ? "On Time" : "No SLA", 
            trendType: "secure",
            icon: BarChart, 
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-amber-500/[0.50] to-orange-500/[0.30] border-amber-400/50 shadow-[0_8px_30px_-12px_rgba(245,158,11,0.2)]",
            textColor: "text-amber-950 dark:text-amber-50",
            labelColor: "text-amber-900/80 dark:text-amber-100/70",
            path: "/performance" 
        },
        { 
            label: "Avg Wait Time", 
            value: `${overview.mwtHours || 0}h`, 
            trend: "Assigned", 
            trendType: "up",
            icon: Clock, 
            iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner", 
            cardBg: "bg-gradient-to-br from-cyan-500/[0.50] to-blue-500/[0.30] border-cyan-400/50 shadow-[0_8px_30px_-12px_rgba(6,182,212,0.2)]",
            textColor: "text-cyan-950 dark:text-cyan-50",
            labelColor: "text-cyan-900/80 dark:text-cyan-100/70",
            path: "/work-orders" 
        },
    ];

    return (
        <div className="glass-dashboard-container space-y-10 pb-20 min-h-screen transition-colors duration-500">            <div className="relative z-10 space-y-10">
                {/* Header: Command Center Pulse */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase">
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
                    {displayStats.map((stat, i) => (
                        <div key={stat.label} className="relative group">
                            {/* Massive Pulsing Glow Behind the Card */}
                            <motion.div 
                                className={cn("absolute inset-0 rounded-[28px] blur-2xl z-0", stat.cardBg)}
                                animate={{ opacity: [0.15, 0.75, 0.15], scale: [0.95, 1.05, 0.95] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                            />
                            
                            <motion.div 
                                onClick={() => navigate(stat.path)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: [0, -6, 0] }}
                                transition={{ 
                                    opacity: { duration: 0.5, delay: i * 0.1 },
                                    y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }
                                }}
                                whileHover={{ scale: 1.02, y: -8 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "backdrop-blur-xl border shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] rounded-[28px] p-5 xl:p-6 relative overflow-hidden cursor-pointer h-full z-10",
                                    stat.cardBg
                                )}
                            >
                                {/* Premium Sweep Shine on Hover */}
                                <div className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-10 skew-x-12" />

                                <div className="flex items-start justify-between relative z-30">
                                    <div className={cn("w-[52px] h-[52px] flex items-center justify-center rounded-[16px] transition-colors", stat.iconBg)}>
                                        <stat.icon className="w-6 h-6" strokeWidth={2.5} />
                                    </div>
                                    <div className={cn("flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider transition-all duration-300", getTrendClass(stat.trendType))}>
                                        {stat.trend}
                                    </div>
                                </div>
                                <div className="mt-8 relative z-30">
                                    <p className={cn("text-[36px] xl:text-[44px] leading-none font-black tracking-tighter truncate", stat.textColor)}>{statsLoading ? '...' : stat.value}</p>
                                    <p className={cn("text-[10px] xl:text-[11px] font-black mt-2 uppercase tracking-widest italic leading-snug", stat.labelColor)}>{stat.label}</p>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column: Facility Intelligence */}
                    <div className="xl:col-span-8 space-y-8">
                        
                        {/* Facility Nodes Grid */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-2xl font-black italic tracking-tight uppercase text-primary">Facility Nodes</h3>
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
                                            className="bg-gradient-to-br from-blue-500/[0.12] to-blue-500/[0.02] backdrop-blur-xl border border-primary/80/20 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.1)] rounded-[1.5rem] p-6 group cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02] hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)]"
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
                        <section className="group bg-gradient-to-br from-cyan-500/[0.12] to-cyan-500/[0.02] backdrop-blur-xl border border-cyan-500/20 shadow-[0_8px_30px_-12px_rgba(6,182,212,0.15)] hover:shadow-[0_8px_40px_-12px_rgba(6,182,212,0.3)] hover:border-cyan-500/40 transition-all duration-500 rounded-[40px] p-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black italic tracking-tight text-cyan-500">MISSION WORKLOAD</h3>
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
                            
                            <div className="h-3 w-full bg-muted dark:bg-white/5 rounded-full overflow-hidden flex border border-border dark:border-white/5">
                                {statusMap.map((s: any) => (
                                    <div 
                                        key={s.status}
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            s.status === "OPEN" ? "bg-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]" :
                                            s.status === "IN_PROGRESS" ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" :
                                            s.status === "COMPLETED" ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-slate-200 dark:bg-white/10"
                                        )}
                                        style={{ width: `${(s._count / (overview.totalWorkOrders || 1)) * 100}%` }}
                                    />
                                ))}
                            </div>

                            <div className="grid grid-cols-1 gap-8 pt-4">
                                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-cyan-100/60 to-cyan-50/20 border border-cyan-200/60 space-y-5 shadow-[inset_0_2px_20px_rgba(6,182,212,0.05),0_8px_20px_-10px_rgba(6,182,212,0.1)] group-hover:shadow-[inset_0_2px_20px_rgba(6,182,212,0.05),0_12px_30px_-10px_rgba(6,182,212,0.2)] transition-all duration-500">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black italic uppercase text-cyan-800/60 tracking-widest">Fleet Availability</span>
                                        <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 drop-shadow-sm">{overview.assetAvailability}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-cyan-100/50 dark:bg-white/5 rounded-full overflow-hidden shadow-inner border border-cyan-200/30">
                                         <div className="h-full bg-cyan-500 transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${overview.assetAvailability}%` }} />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Pulse & Intelligence */}
                    <div className="xl:col-span-4 space-y-8">
                        
                        {/* Procurement Approval Hub (Manager Only) */}
                        {isManager && (
                            <section className="group bg-gradient-to-br from-amber-500/[0.12] to-amber-500/[0.02] backdrop-blur-xl border border-amber-500/30 shadow-[0_8px_30px_-12px_rgba(245,158,11,0.15)] hover:shadow-[0_8px_40px_-12px_rgba(245,158,11,0.3)] hover:border-amber-500/50 transition-all duration-500 rounded-[40px] p-8 space-y-8 animate-in slide-in-from-right-8">
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
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-white border border-amber-300/50 shadow-[0_8px_20px_-6px_rgba(245,158,11,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(245,158,11,0.6)] hover:-translate-y-0.5 transition-all duration-300 text-[9px] font-black uppercase tracking-widest italic"
                                    >
                                        View Full Manifest ({pendingPOs.length})
                                    </button>
                                )}
                            </section>
                        )}

                        {/* Live Mission Pulse */}
                        <section className="group bg-gradient-to-br from-fuchsia-500/[0.12] to-fuchsia-500/[0.02] backdrop-blur-xl border border-fuchsia-500/30 shadow-[0_8px_30px_-12px_rgba(217,70,239,0.15)] hover:shadow-[0_8px_40px_-12px_rgba(217,70,239,0.3)] hover:border-fuchsia-500/50 transition-all duration-500 rounded-[40px] p-8 space-y-8 flex flex-col">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black italic tracking-tight uppercase text-fuchsia-500">Mission Pulse</h3>
                                <Activity className="w-5 h-5 text-fuchsia-500 animate-pulse" />
                            </div>

                            <div className="space-y-6 flex-1 custom-scrollbar overflow-y-auto pr-2 max-h-[600px]">
                                {activity?.pages?.flatMap(p => p.items)?.filter((log: any) => 
                                    !globalSearch || 
                                    log.action?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                                    log.user?.name?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                                    log.model?.toLowerCase().includes(globalSearch.toLowerCase())
                                ).map((log: any) => (
                                    <div key={log.id} className="relative pl-6 border-l border-border dark:border-white/10 group">
                                        <div className="absolute top-1 -left-[5px] w-2 h-2 rounded-full bg-fuchsia-500 ring-4 ring-background group-hover:scale-125 transition-all" />
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest">{log.action?.replace(/_/g, ' ')}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground opacity-50 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(log.createdAt))} ago
                                                </p>
                                            </div>
                                            <p className="text-xs font-bold text-foreground dark:text-white leading-relaxed group-hover:text-fuchsia-500/90 transition-colors">
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

                            <div className="pt-6 border-t border-border dark:border-white/5">
                                <button 
                                    onClick={handleGenerateReport}
                                    className="w-full py-5 rounded-[24px] bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white border border-fuchsia-400/50 shadow-[0_8px_20px_-6px_rgba(217,70,239,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(217,70,239,0.6)] hover:-translate-y-0.5 transition-all duration-300 text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3"
                                >
                                    <Dna className="w-4 h-4" /> Audit Operation
                                </button>
                            </div>
                        </section>

                        {/* Cost Drain Card */}
                        <section className="group bg-gradient-to-br from-amber-500/[0.12] to-amber-500/[0.02] backdrop-blur-xl border border-amber-500/30 shadow-[0_8px_30px_-12px_rgba(245,158,11,0.15)] hover:shadow-[0_8px_40px_-12px_rgba(245,158,11,0.3)] hover:border-amber-500/50 transition-all duration-500 rounded-[40px] p-8 space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black italic tracking-tight text-amber-500">CASH DRAIN</h3>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40 italic">Top Resource Consumers (30d)</p>
                            </div>

                            <div className="space-y-4">
                                {stats?.data?.topAssetsByCost?.map((asset: any, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-transparent dark:hover:bg-white/[0.02] transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5 group">
                                        <div className="w-10 h-10 rounded-xl bg-muted dark:bg-white/5 flex items-center justify-center font-black italic text-xs text-foreground/40 dark:text-white/10 group-hover:text-amber-500/30 transition-all">
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
                                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-white border border-amber-300/50 shadow-[0_8px_20px_-6px_rgba(245,158,11,0.4)] hover:shadow-[0_8px_25px_-4px_rgba(245,158,11,0.6)] hover:-translate-y-0.5 transition-all duration-300 text-[9px] font-black uppercase tracking-widest italic"
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

