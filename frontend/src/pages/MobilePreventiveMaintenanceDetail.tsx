import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, 
    Edit2, 
    Clock, 
    MapPin, 
    FileText, 
    Settings, 
    AlertCircle, 
    Calendar,
    Activity,
    Plus,
    Search,
    X,
    CheckCircle2,
    ArrowUpRight,
    History
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PriorityBadge } from '../components/PriorityBadge';

interface MobilePreventiveMaintenanceDetailProps {
    pm: any;
    workOrders: any[];
    isWOLoading: boolean;
    setIsEditModalOpen: (open: boolean) => void;
    setIsAddAssetModalOpen: (open: boolean) => void;
    // New props for parity
    entityLogs?: any[];
}

export const MobilePreventiveMaintenanceDetail: React.FC<MobilePreventiveMaintenanceDetailProps> = ({
    pm,
    workOrders,
    isWOLoading,
    setIsEditModalOpen,
    setIsAddAssetModalOpen,
    entityLogs = [],
}) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'assets' | 'details' | 'work-orders'>('assets');

    // Asset filters
    const [assetSearch, setAssetSearch] = useState('');

    // Work order filters
    const [woSearch, setWoSearch] = useState('');
    const [woStatusFilter, setWoStatusFilter] = useState('ALL');

    const tabs = [
        { id: 'assets', label: 'Assets & Locations', icon: MapPin },
        { id: 'details', label: 'Details', icon: FileText },
        { id: 'work-orders', label: 'Work Orders', icon: Activity },
    ];

    const allAssets = useMemo(() => {
        if (!pm) return [];
        const list: any[] = [];
        if (pm.asset) list.push({ ...pm, id: pm.id, asset: pm.asset, isPrimary: true });
        if (pm.assets) {
            pm.assets.forEach((a: any) => list.push({ ...pm, ...a, isPrimary: false }));
        }
        return list;
    }, [pm]);

    const filteredAssets = useMemo(() => {
        if (!assetSearch) return allAssets;
        const q = assetSearch.toLowerCase();
        return allAssets.filter((a: any) =>
            a.asset?.name?.toLowerCase().includes(q) ||
            a.asset?.location?.name?.toLowerCase().includes(q) ||
            a.id?.toLowerCase().includes(q)
        );
    }, [allAssets, assetSearch]);

    const filteredWOs = useMemo(() => {
        let result = workOrders;
        if (woStatusFilter !== 'ALL') {
            result = result.filter((wo: any) => wo.status === woStatusFilter);
        }
        if (woSearch) {
            const q = woSearch.toLowerCase();
            result = result.filter((wo: any) =>
                wo.title?.toLowerCase().includes(q) ||
                (wo.woNumber || '').toString().includes(q)
            );
        }
        return result;
    }, [workOrders, woSearch, woStatusFilter]);

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
            case 'PAUSED': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
            default: return 'bg-muted border-border text-muted-foreground';
        }
    };

    const getWOStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
            case 'IN_PROGRESS': return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
            case 'OPEN': return 'bg-slate-500/10 border-slate-500/20 text-slate-500';
            default: return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
        }
    };

    const WO_STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Sticky Navigation Header */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
                <div className="px-4 py-3 flex items-center justify-between">
                    <button 
                        onClick={() => navigate('/pm')}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-[13px] font-bold">PMs</span>
                    </button>
                    
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-xl text-[12px] font-black uppercase tracking-tight text-foreground transition-all active:scale-95"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                    </button>
                </div>

                {/* Title & Status */}
                <div className="px-4 pb-3 space-y-1">
                    <h1 className="text-lg font-black leading-tight text-foreground">{pm.name}</h1>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", getStatusStyle(pm.status))}>
                            {pm.status || 'ACTIVE'}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                            Created {format(new Date(pm.createdAt), 'MMM d, yyyy')}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-0 border-t border-border overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-1 min-w-[70px] flex items-center justify-center gap-1 py-2.5 text-[11px] font-black uppercase tracking-tight border-b-2 transition-all whitespace-nowrap px-2",
                                activeTab === tab.id
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5 shrink-0" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Contents */}
            <div className="px-4 py-4">
                <AnimatePresence mode="wait">
                    {/* ── DETAILS TAB ── */}
                    {activeTab === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Scheduling Card */}
                            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                                <h3 className="text-[13px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Settings className="w-4 h-4 text-primary" />
                                    Scheduling Strategy
                                </h3>
                                <div className="divide-y divide-border space-y-0">
                                    {[
                                        { label: 'Frequency', value: `Every ${pm.frequencyValue} ${pm.frequencyType?.toLowerCase()}` },
                                        { label: 'Type', value: pm.isFloating ? 'Floating Trigger' : 'Fixed Trigger' },
                                        { label: 'Notice Period', value: `${pm.advanceNoticeDays ?? '—'} Days Ahead` },
                                        { label: 'Start Date', value: pm.startDate ? format(new Date(pm.startDate), 'MMM d, yyyy') : '—' },
                                        { label: 'End Date', value: pm.endDate ? format(new Date(pm.endDate), 'MMM d, yyyy') : '—' },
                                        { label: 'Next Due', value: pm.nextDueDate ? format(new Date(pm.nextDueDate), 'MMM d, yyyy') : '—' },
                                        { label: 'Last Trigger', value: pm.lastGenerated ? format(new Date(pm.lastGenerated), 'MMM d, yyyy') : 'Never' },
                                    ].map(row => (
                                        <div key={row.label} className="flex items-center justify-between text-[13px] py-2.5">
                                            <span className="text-muted-foreground font-medium">{row.label}</span>
                                            <span className="font-bold text-foreground text-right">{row.value}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between text-[13px] py-2.5">
                                        <span className="text-muted-foreground font-medium">Assigned To</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary">
                                                {pm.assignedTo?.user?.name?.[0] || 'U'}
                                            </div>
                                            <span className="font-bold text-foreground text-[12px]">{pm.assignedTo?.user?.name || 'Unassigned'}</span>
                                        </div>
                                    </div>
                                    {pm.team && (
                                        <div className="flex items-center justify-between text-[13px] py-2.5">
                                            <span className="text-muted-foreground font-medium">Team</span>
                                            <span className="font-bold text-foreground">{pm.team?.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Work Order Template Card */}
                            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                                <h3 className="text-[13px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Work Order Template
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Generated Title</label>
                                        <div className="text-[14px] font-bold text-foreground bg-muted/30 px-3 py-2.5 rounded-xl border border-border">
                                            {pm.woTitle || '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Instructions / Description</label>
                                        <div className="text-[13px] font-medium text-muted-foreground bg-muted/20 px-3 py-2.5 rounded-xl border border-border whitespace-pre-wrap leading-relaxed min-h-[60px]">
                                            {pm.woDescription || pm.description || 'No description provided.'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Category</label>
                                            <div className="text-[12px] font-bold text-foreground bg-muted/30 px-3 py-2 rounded-xl border border-border flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pm.category?.color || '#cbd5e1' }} />
                                                <span className="truncate">{pm.category?.name || 'General'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Priority</label>
                                            <div className="bg-muted/30 px-3 py-2 rounded-xl border border-border flex items-center justify-center">
                                                <PriorityBadge priority={pm.priority || 'MEDIUM'} />
                                            </div>
                                        </div>
                                    </div>
                                    {pm.checklist && (
                                        <div>
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Checklist</label>
                                            <div className="text-[13px] font-bold text-foreground bg-muted/30 px-3 py-2.5 rounded-xl border border-border">
                                                {pm.checklist?.title || '—'}
                                            </div>
                                        </div>
                                    )}
                                    {pm.imageUrl && (
                                        <div>
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Image</label>
                                            <img src={pm.imageUrl} alt="PM" className="w-full h-40 object-cover rounded-xl border border-border" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── ASSETS TAB ── */}
                    {activeTab === 'assets' && (
                        <motion.div
                            key="assets"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Header + search */}
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                                    <span className="text-foreground">{filteredAssets.length}</span> / {allAssets.length} Assets
                                </span>
                                <button
                                    onClick={() => setIsAddAssetModalOpen(true)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Asset
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={assetSearch}
                                    onChange={(e) => setAssetSearch(e.target.value)}
                                    placeholder="Search assets or locations..."
                                    className="w-full h-10 pl-10 pr-9 bg-muted border border-border rounded-xl text-[13px] focus:outline-none focus:border-primary/40 transition-all"
                                />
                                {assetSearch && (
                                    <button onClick={() => setAssetSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                )}
                            </div>

                            {filteredAssets.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredAssets.map((assetItem: any, index: number) => (
                                        <div key={index} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[14px] font-black text-foreground">{assetItem.asset?.name || 'Global'}</span>
                                                {assetItem.isPrimary && (
                                                    <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-widest px-2 py-0.5 rounded">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                            <div className="divide-y divide-border text-[12px]">
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Location</span>
                                                    <span className="font-bold text-foreground">{assetItem.asset?.location?.name || '—'}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Next Due</span>
                                                    <span className="font-bold text-foreground">{pm.nextDueDate ? format(new Date(pm.nextDueDate), 'MM/dd/yyyy') : '—'}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Last Trigger</span>
                                                    <span className="font-bold text-foreground">{pm.lastGenerated ? format(new Date(pm.lastGenerated), 'MM/dd/yyyy') : 'Never'}</span>
                                                </div>
                                                {(assetItem.assignedTo?.user?.name) && (
                                                    <div className="flex items-center justify-between py-2">
                                                        <span className="text-muted-foreground">Assigned To</span>
                                                        <span className="font-bold text-foreground">{assetItem.assignedTo.user.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 border-2 border-dashed border-border rounded-3xl">
                                    <AlertCircle className="w-8 h-8 text-muted-foreground opacity-30" />
                                    <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">No assets linked</span>
                                    <button
                                        onClick={() => setIsAddAssetModalOpen(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-[12px] font-black uppercase tracking-tight shadow-md shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Asset
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── WORK ORDERS TAB ── */}
                    {activeTab === 'work-orders' && (
                        <motion.div
                            key="work-orders"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {/* Search + Status filter */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={woSearch}
                                    onChange={(e) => setWoSearch(e.target.value)}
                                    placeholder="Search work orders..."
                                    className="w-full h-10 pl-10 pr-9 bg-muted border border-border rounded-xl text-[13px] focus:outline-none focus:border-primary/40 transition-all"
                                />
                                {woSearch && (
                                    <button onClick={() => setWoSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                )}
                            </div>

                            {/* Status chips */}
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                {WO_STATUSES.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setWoStatusFilter(s)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 border",
                                            woStatusFilter === s
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : "bg-card text-muted-foreground border-border"
                                        )}
                                    >
                                        {s.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            <div className="text-[11px] font-black text-muted-foreground uppercase">
                                <span className="text-foreground">{filteredWOs.length}</span> / {workOrders.length} Work Orders
                            </div>

                            {isWOLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fetching work orders...</span>
                                </div>
                            ) : filteredWOs.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredWOs.map((wo: any) => (
                                        <div
                                            key={wo.id}
                                            onClick={() => navigate(`/work-orders/${wo.id}`)}
                                            className="bg-card rounded-2xl border border-border p-4 space-y-3 cursor-pointer transition-all active:scale-[0.98]"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <span className="text-[11px] font-bold text-muted-foreground font-mono">
                                                        #{wo.woNumber || wo.id.substring(0, 8).toUpperCase()}
                                                    </span>
                                                    <h4 className="text-[14px] font-black text-foreground truncate mt-0.5">{wo.title}</h4>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", getWOStatusStyle(wo.status))}>
                                                        {wo.status?.replace('_', ' ') || 'OPEN'}
                                                    </span>
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                                                <span>Triggered: {format(new Date(wo.createdAt), 'MMM d, yyyy')}</span>
                                                <PriorityBadge priority={wo.priority || 'MEDIUM'} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 gap-3 border-2 border-dashed border-border rounded-3xl">
                                    <AlertCircle className="w-8 h-8 text-muted-foreground opacity-30" />
                                    <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">No work orders found</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
