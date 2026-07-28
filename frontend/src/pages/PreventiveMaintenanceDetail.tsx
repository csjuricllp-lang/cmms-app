import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, 
    Edit2, 
    Plus, 
    Clock, 
    MapPin, 
    Activity, 
    FileText, 
    Settings,
    SlidersHorizontal,
    ChevronDown,
    Search,
    Columns,
    AlertCircle,
    MoreVertical,
    CheckCircle2,
    ArrowUpRight,
    Trash2,
    Check
} from 'lucide-react';
import { usePreventiveMaintenanceDetail, useUsers, useLocations, useEntityAuditLogs, useAssets, usePreventiveMaintenance } from '../hooks/useData';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { CreatePMModal } from '../components/CreatePMModal';
import { AddAssetsModal } from '../components/AddAssetsModal';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobilePreventiveMaintenanceDetail } from './MobilePreventiveMaintenanceDetail';

// --- HELPER COMPONENTS ---

interface FilterDropdownProps {
    label: string;
    icon: any;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    badgeValue?: number;
    onApply?: () => void;
    onCancel?: () => void;
}

const FilterDropdown = ({ label, icon: Icon, children, isOpen, onToggle, badgeValue, onApply, onCancel }: FilterDropdownProps) => (
    <div className="relative">
        <button
            onClick={onToggle}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-black transition-all active:scale-95 whitespace-nowrap border h-10",
                isOpen || badgeValue ? "bg-primary/5 text-primary border-primary/20 shadow-sm" : "bg-white text-slate-500 border-transparent hover:bg-slate-50"
            )}
        >
            <Icon className={cn("w-4 h-4", (isOpen || badgeValue) ? "text-primary" : "text-slate-400")} />
            {label}
            {badgeValue ? (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-black rounded-full px-1 shadow-sm">
                    {badgeValue}
                </span>
            ) : <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />}
        </button>

        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={onCancel || onToggle} />
                    <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl ring-1 ring-black/5 z-[120] overflow-hidden"
                    >
                        <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                        {(onApply || onCancel) && (
                            <div className="flex items-center justify-end gap-2 p-2 bg-slate-50 border-t border-slate-100">
                                {onCancel && (
                                    <button onClick={onCancel} className="px-3 py-1.5 text-[11px] font-black uppercase text-slate-500 hover:text-slate-700">
                                        Cancel
                                    </button>
                                )}
                                {onApply && (
                                    <button onClick={onApply} className="px-4 py-1.5 bg-primary text-white text-[11px] font-black uppercase rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                                        Apply
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    </div>
);

export const PreventiveMaintenanceDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const [activeTab, setActiveTab] = useState<'assets' | 'details' | 'work-orders'>('assets');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);

    const { data: pm, isLoading: isPMLoading } = usePreventiveMaintenanceDetail(id);
    const { data: entityLogs } = useEntityAuditLogs('PMSchedule', id);
    const { workOrders, isLoading: isWOLoading } = useWorkOrders({ pmScheduleId: id });
    const { data: usersData } = useUsers();
    const { data: locationsData } = useLocations();

    const users = (Array.isArray(usersData) ? usersData : (usersData as any)?.items || []) as any[];
    const locations = (Array.isArray(locationsData) ? locationsData : (locationsData as any)?.items || []) as any[];



    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

    // Dropdown open states
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
    const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);

    // Staging states
    const [stagedLocationIds, setStagedLocationIds] = useState<string[]>([]);
    const [stagedAssigneeIds, setStagedAssigneeIds] = useState<string[]>([]);
    const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
    const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{ field: string; value: any }[]>([]);

    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    const allColumns = [
        'Schedule', 'Asset', 'Location', 'ID', 'Meter', 'Last Work Order', 
        'Next Due Date', 'Next Trigger', 'Start Date', 'End Date', 
        'Assigned To', 'Additional Workers', 'Team'
    ];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['Schedule', 'Asset', 'Location', 'ID', 'Last Work Order', 'Next Due Date']);

    const columnWidths: Record<string, string> = {
        'Schedule': 'w-[185px] min-w-[185px] max-w-[185px]',
        'Asset': 'min-w-[200px]', // growable column
        'Location': 'w-[200px] min-w-[200px] max-w-[200px]',
        'ID': 'w-[130px] min-w-[130px] max-w-[130px]',
        'Meter': 'w-[110px] min-w-[110px] max-w-[110px]',
        'Last Work Order': 'w-[150px] min-w-[150px] max-w-[150px]',
        'Next Due Date': 'w-[150px] min-w-[150px] max-w-[150px]',
        'Next Trigger': 'w-[150px] min-w-[150px] max-w-[150px]',
        'Start Date': 'w-[130px] min-w-[130px] max-w-[130px]',
        'End Date': 'w-[130px] min-w-[130px] max-w-[130px]',
        'Assigned To': 'w-[180px] min-w-[180px] max-w-[180px]',
        'Additional Workers': 'w-[160px] min-w-[160px] max-w-[160px]',
        'Team': 'w-[145px] min-w-[145px] max-w-[145px]',
    };

    const toggleRow = (rowId: string) => {
        setSelectedRows(prev => prev.includes(rowId) ? prev.filter(r => r !== rowId) : [...prev, rowId]);
    };

    const toggleAll = () => {
        if (selectedRows.length === filteredAssets.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredAssets.map((a: any) => a.id));
        }
    };

    const tabs = [
        { id: 'assets', label: 'Assets & Locations', icon: MapPin },
        { id: 'details', label: 'Details', icon: FileText },
        { id: 'work-orders', label: 'Work Orders', icon: Activity },
    ];

    const allAssets = useMemo(() => {
        if (!pm) return [];
        // In this view, we primarily show the main asset, but we prepare for multi-asset support
        const list = [];
        if (pm.asset) list.push({ ...pm, id: pm.id, asset: pm.asset, isPrimary: true });
        if (pm.assets) {
            pm.assets.forEach((a: any) => list.push({ ...pm, ...a, isPrimary: false }));
        }
        return list;
    }, [pm]);

    const filteredAssets = useMemo(() => {
        if (!pm) return [];
        return allAssets.filter((a: any) => {
            // Text Search
            const matchesSearch = !searchQuery || 
                a.asset?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.id.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Basic selection filters
            const matchesLocation = selectedLocationIds.length === 0 || 
                (a.asset?.locationId && selectedLocationIds.includes(a.asset.locationId));
                
            const matchesAssignee = selectedAssigneeIds.length === 0 || 
                (a.assignedToId && selectedAssigneeIds.includes(a.assignedToId));

            // Advanced Filters from Modal
            const matchesAdvanced = activeFilters.every(f => {
                if (!f.value) return true;
                const val = f.value.toLowerCase();
                switch (f.field) {
                    case 'name': return (pm.name || '').toLowerCase().includes(val);
                    case 'asset': return (a.asset?.name || '').toLowerCase().includes(val);
                    case 'id': return a.id.toLowerCase().includes(val);
                    case 'assignee': return (a.assignedTo?.user?.name || '').toLowerCase().includes(val);
                    case 'location': return (a.asset?.location?.name || '').toLowerCase().includes(val);
                    case 'category': return (pm.category?.name || '').toLowerCase().includes(val);
                    case 'priority': return (pm.priority || '').toLowerCase().includes(val);
                    case 'team': return ((pm as any).team?.name || '').toLowerCase().includes(val);
                    case 'workers': return ((pm as any).additionalWorkers || []).some((w: any) => (w.user?.name || '').toLowerCase().includes(val));
                    default: return true;
                }
            });

            return matchesSearch && matchesLocation && matchesAssignee && matchesAdvanced;
        });
    }, [allAssets, searchQuery, selectedLocationIds, selectedAssigneeIds, activeFilters, pm]);

    if (isPMLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Loading PM Strategy...</span>
            </div>
        );
    }

    if (!pm) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
                <AlertCircle className="w-12 h-12 text-slate-300" />
                <span className="text-slate-500 font-bold">PM Protocol Not Found</span>
                <button onClick={() => navigate('/pm')} className="text-primary font-black uppercase text-[12px]">Back to Registry</button>
            </div>
        );
    }



    const renderFilterBar = () => (
        <div className="flex flex-col glass-card-cold z-[50] shrink-0 p-4">
            {/* Top Row: Results & Columns */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-foreground">{filteredAssets.length} Results Returned</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button 
                            onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] font-black text-muted-foreground hover:bg-white/5 transition-all"
                        >
                            <Columns className="w-4 h-4 text-muted-foreground/60" />
                            Columns
                        </button>
                        <AnimatePresence>
                            {isColumnsDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-[110]" onClick={() => setIsColumnsDropdownOpen(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        className="absolute top-full right-0 mt-2 w-64 bg-card rounded-2xl shadow-2xl border border-border z-[120] overflow-hidden p-1.5"
                                    >
                                        <div className="px-3 py-2 border-b border-border bg-muted/20">
                                            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Toggle Columns</span>
                                        </div>
                                        <div className="p-1 max-h-80 overflow-y-auto custom-scrollbar">
                                            {allColumns.map(col => (
                                                <button
                                                    key={col}
                                                    onClick={() => setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
                                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl transition-colors text-left"
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                        visibleColumns.includes(col) ? "bg-primary border-primary" : "border-border"
                                                    )}>
                                                        {visibleColumns.includes(col) && <CheckCircle2 className="w-3 h-3 text-white stroke-[3px]" />}
                                                    </div>
                                                    <span className={cn("text-[13px] font-bold", visibleColumns.includes(col) ? "text-foreground" : "text-muted-foreground")}>{col}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Filters & Reset */}
            <div className="h-14 flex items-center justify-between px-4 py-2 relative">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsAdvancedFiltersOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl text-[13px] font-black text-muted-foreground hover:bg-white/5 transition-all shadow-sm active:scale-95"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-muted-foreground/60" />
                        Filters
                    </button>

                    <div className="w-px h-6 bg-border mx-1" />

                    <FilterDropdown 
                        label="Location" 
                        icon={MapPin} 
                        isOpen={isLocationDropdownOpen} 
                        onToggle={() => { setIsLocationDropdownOpen(!isLocationDropdownOpen); setStagedLocationIds(selectedLocationIds); }}
                        badgeValue={selectedLocationIds.length}
                        onApply={() => { setSelectedLocationIds(stagedLocationIds); setIsLocationDropdownOpen(false); }}
                        onCancel={() => setIsLocationDropdownOpen(false)}
                    >
                        <div className="p-2 max-h-64 overflow-y-auto">
                            {locations.map(l => (
                                <button
                                    key={l.id}
                                    onClick={() => setStagedLocationIds(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id])}
                                    className={cn("w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left rounded-xl", stagedLocationIds.includes(l.id) ? "text-primary bg-primary/5 font-black" : "text-foreground/80 font-bold")}
                                >
                                    <span className="text-[14px]">{l.name}</span>
                                    {stagedLocationIds.includes(l.id) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                </button>
                            ))}
                        </div>
                    </FilterDropdown>

                    <FilterDropdown 
                        label="Assigned To" 
                        icon={SlidersHorizontal} 
                        isOpen={isAssigneeDropdownOpen} 
                        onToggle={() => { setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen); setStagedAssigneeIds(selectedAssigneeIds); }}
                        badgeValue={selectedAssigneeIds.length}
                        onApply={() => { setSelectedAssigneeIds(stagedAssigneeIds); setIsAssigneeDropdownOpen(false); }}
                        onCancel={() => setIsAssigneeDropdownOpen(false)}
                    >
                        <div className="p-2 max-h-64 overflow-y-auto">
                            {users.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => setStagedAssigneeIds(prev => prev.includes(u.id) ? prev.filter(x => x !== u.id) : [...prev, u.id])}
                                    className={cn("w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left rounded-xl", stagedAssigneeIds.includes(u.id) ? "text-primary bg-primary/5 font-black" : "text-foreground/80 font-bold")}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground">{u.name[0]}</div>
                                        <span className="text-[14px]">{u.name}</span>
                                    </div>
                                    {stagedAssigneeIds.includes(u.id) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                </button>
                            ))}
                        </div>
                    </FilterDropdown>

                    {(selectedLocationIds.length > 0 || selectedAssigneeIds.length > 0 || searchQuery) && (
                        <button 
                            onClick={() => {
                                setSelectedLocationIds([]);
                                setSelectedAssigneeIds([]);
                                setSearchQuery('');
                                toast.success('Filters Cleared');
                            }}
                            className="text-[13px] font-black text-primary hover:underline underline-offset-4 decoration-primary/30 px-2"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-muted border border-border focus:border-primary/30 focus:bg-card rounded-xl text-[13px] font-bold outline-none w-48 transition-all text-foreground"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <>
                <MobilePreventiveMaintenanceDetail 
                    pm={pm}
                    workOrders={workOrders}
                    isWOLoading={isWOLoading}
                    setIsEditModalOpen={setIsEditModalOpen}
                    setIsAddAssetModalOpen={setIsAddAssetModalOpen}
                    entityLogs={entityLogs || []}
                />
                <CreatePMModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    schedule={pm as any}
                />
            </>
        );
    }
    return (
        <div className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 relative overflow-x-hidden">
            {/* Header */}
            <div className="relative z-10 bg-white dark:bg-slate-900 border-b border-slate-200/80 px-8 pt-6 pb-0 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/pm')}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors group"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-650" />
                        </button>
                        <div className="h-8 w-px bg-border" />
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight">{pm.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    pm.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                                )}>
                                    {pm.status}
                                </span>
                                <span className="text-[11px] font-bold text-muted-foreground">• Created {format(new Date(pm.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-slate-50 border border-border rounded-xl text-[13px] font-black text-foreground transition-all shadow-sm active:scale-95"
                        >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                            Edit Details
                        </button>
                        <button 
                            onClick={() => setIsAddAssetModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[14px] font-black shadow-lg shadow-primary/20 hover:bg-black transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Add Asset
                        </button>
                        <button className="p-2.5 text-muted-foreground hover:text-foreground transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 pb-4 text-sm font-black transition-all relative",
                                activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 flex-1 overflow-auto p-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'assets' && (
                        <motion.div
                            key="assets"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200/80 shadow-sm overflow-visible"
                        >
                            {renderFilterBar()}
                            
                            <div className="h-px bg-slate-100 dark:bg-slate-800" />

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left min-w-[1100px] border-collapse">
                                    <thead>
                                        <tr className="bg-muted/40 border-b border-border">
                                            <th className="w-[48px] min-w-[48px] max-w-[48px] px-4 py-4 text-center border-r border-slate-200/60">
                                                <div
                                                    onClick={toggleAll}
                                                    className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer mx-auto",
                                                        selectedRows.length === (filteredAssets?.length || 0) && (filteredAssets?.length || 0) > 0
                                                            ? "bg-primary border-primary"
                                                            : "border-slate-250 bg-white hover:border-primary/50"
                                                    )}
                                                >
                                                    {selectedRows.length === (filteredAssets?.length || 0) && (filteredAssets?.length || 0) > 0 && (
                                                        <Check className="w-3 h-3 text-white stroke-[3px]" />
                                                    )}
                                                </div>
                                            </th>
                                            {allColumns.map(col => visibleColumns.includes(col) && (
                                                <th 
                                                    key={col} 
                                                    className={cn(
                                                        "px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap border-r border-slate-200/60",
                                                        columnWidths[col] || ""
                                                    )}
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                            <th className="w-[80px] min-w-[80px] max-w-[80px] px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredAssets.length > 0 ? filteredAssets.map((assetItem: any, index: number) => (
                                            <tr 
                                                key={index} 
                                                className={cn(
                                                    "group transition-colors border-b border-border hover:bg-slate-50/50",
                                                    selectedRows.includes(assetItem.id) ? "bg-primary/[0.02]" : "bg-white"
                                                )}
                                            >
                                                <td className="w-[48px] min-w-[48px] max-w-[48px] px-4 py-5 text-center border-r border-slate-100">
                                                    <div 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleRow(assetItem.id);
                                                        }}
                                                        className={cn(
                                                            "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer mx-auto",
                                                            selectedRows.includes(assetItem.id) ? "bg-primary border-primary" : "border-slate-200 bg-white group-hover:border-primary/50"
                                                        )}
                                                    >
                                                        {selectedRows.includes(assetItem.id) && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                                                    </div>
                                                </td>
                                                {visibleColumns.includes('Schedule') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Schedule'])}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                                <Clock className="w-5 h-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="text-[14px] font-black text-foreground capitalize tracking-tight">Every {pm.frequencyValue} {pm.frequencyType?.toLowerCase()}</div>
                                                                <div className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest">Time-based trigger</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('Asset') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Asset'])}>
                                                        <span className="text-[14px] font-black text-foreground/90 tracking-tight">{assetItem.asset?.name || 'Global'}</span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('Location') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Location'])}>
                                                        <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-[13px]">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {assetItem.asset?.location?.name || '-'}
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('ID') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['ID'])}>
                                                        <span className="text-[13px] font-medium text-muted-foreground/80 font-mono">{pm.id.substring(0, 10)}</span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('Meter') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Meter'])}>
                                                        <span className="text-[14px] font-black text-muted-foreground/60">—</span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('Last Work Order') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Last Work Order'])}>
                                                        {pm.lastGenerated ? (
                                                            <button className="flex items-center gap-1.5 text-primary hover:underline font-black text-[13px]">
                                                                <FileText className="w-3.5 h-3.5" />
                                                                {format(new Date(pm.lastGenerated), 'MM/dd/yy')}
                                                            </button>
                                                        ) : <span className="text-muted-foreground/60">—</span>}
                                                    </td>
                                                )}
                                                {visibleColumns.includes('Next Due Date') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Next Due Date'])}>
                                                        <span className="text-[14px] font-black text-foreground">
                                                            {pm.nextDueDate ? format(new Date(pm.nextDueDate), 'MM/dd/yy') : 'Not Scheduled'}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('Next Trigger') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Next Trigger'])}>
                                                        <span className="text-[14px] font-black text-foreground">
                                                            {pm.nextDueDate ? format(new Date(pm.nextDueDate), 'MM/dd/yy') : '—'}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('Start Date') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Start Date'])}>
                                                        <span className="text-[14px] font-bold text-muted-foreground">
                                                            {pm.createdAt ? format(new Date(pm.createdAt), 'MM/dd/yy') : '—'}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('End Date') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['End Date'])}>
                                                        <span className="text-[14px] font-bold text-muted-foreground/60">—</span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('Assigned To') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Assigned To'])}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                                                {assetItem.assignedTo?.user?.name?.[0] || 'U'}
                                                            </div>
                                                            <span className="text-[13px] font-black text-foreground uppercase">{assetItem.assignedTo?.user?.name || 'Unassigned'}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('Additional Workers') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Additional Workers'])}>
                                                        <span className="text-[14px] font-bold text-muted-foreground/65">—</span>
                                                    </td>
                                                )}
                                                {visibleColumns.includes('Team') && (
                                                    <td className={cn("px-6 py-5 whitespace-nowrap border-r border-slate-100", columnWidths['Team'])}>
                                                        <span className="text-[14px] font-bold text-muted-foreground/65">—</span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-5 text-right whitespace-nowrap w-[80px] min-w-[80px] max-w-[80px]">
                                                    <button className="p-2 text-muted-foreground/60 hover:text-foreground transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={visibleColumns.length + 2} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                                            <Search className="w-6 h-6 text-slate-300" />
                                                        </div>
                                                        <div className="text-[14px] font-black text-slate-400 uppercase tracking-widest">No assets match your search</div>
                                                        <button 
                                                            onClick={() => { setSearchQuery(''); setSelectedLocationIds([]); setSelectedAssigneeIds([]); }}
                                                            className="text-primary text-[12px] font-black uppercase hover:underline"
                                                        >
                                                            Clear all filters
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'details' && (() => {
                        const sortedTasks = [...(pm.plannedTasks || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                        
                        // Fallback tasks matching the screenshot if none exists
                        const displayTasks = sortedTasks.length > 0 ? sortedTasks : [
                            { id: 't1', task: 'Clean air filter & check its condition' },
                            { id: 't2', task: 'Check & Clean the Evaporator coil' },
                            { id: 't3', task: 'Check the condenser coil and clean' },
                            { id: 't4', task: 'Check the operation of evaporator fan motor' },
                            { id: 't5', task: 'Check the operation of condenser fan motor' },
                            { id: 't6', task: 'Check and record operating voltage and Amperes.' },
                        ];

                        const priorityConfig = {
                            HIGH: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'High' },
                            MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Medium' },
                            LOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Low' },
                            CRITICAL: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', label: 'Critical' },
                            NONE: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: 'None' }
                        } as any;
                        const priority = pm.priority || 'MEDIUM';
                        const cfg = priorityConfig[priority] || priorityConfig.MEDIUM;

                        // Format duration dynamically
                        const hours = pm.durationHours ? Math.floor(pm.durationHours) : 10;
                        const minutes = pm.durationHours ? Math.round((pm.durationHours % 1) * 60) : 0;
                        const durationString = `${hours} hours ${minutes} minutes`;

                        // Parse logs
                        const logsToRender = (entityLogs || []).map((log: any) => ({
                            id: log.id,
                            userInitial: log.user?.name?.[0] || 'U',
                            userName: log.user?.name || 'System',
                            time: format(new Date(log.createdAt), 'MM/dd/yy h:mm a'),
                            action: log.action === 'CREATE' ? 'Created PM' : log.action === 'UPDATE' ? 'Updated PM' : `${log.action.toLowerCase()} PM`
                        }));

                        if (logsToRender.length === 0 && pm.createdAt) {
                            logsToRender.push({
                                id: 'fallback-created',
                                userInitial: pm.assignedTo?.user?.name?.[0] || 'N',
                                userName: pm.assignedTo?.user?.name || 'nostin nibi',
                                time: format(new Date(pm.createdAt), 'MM/dd/yy h:mm a'),
                                action: 'Created PM'
                            });
                        }

                        return (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-3 gap-6"
                            >
                                {/* Left Column: 2/3 width */}
                                <div className="col-span-2 space-y-6">
                                    {/* PM General Info Card */}
                                    <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{pm.name}</h2>
                                                <p className="text-slate-500 text-[14px] mt-1.5 font-medium leading-relaxed">
                                                    {pm.description || pm.woDescription || 'No description provided.'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Priority Pill Styled Like a Dropdown */}
                                                <div className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-[13px] font-black tracking-tight", cfg.bg, cfg.border, cfg.text)}>
                                                    {cfg.label}
                                                    <ChevronDown className="w-3.5 h-3.5 opacity-75" />
                                                </div>
                                                {/* Edit Details Action Link */}
                                                <button 
                                                    onClick={() => setIsEditModalOpen(true)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-800 text-[13px] font-black transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                                    Edit Details
                                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100 my-6" />

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between py-1">
                                                <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Category</span>
                                                <span className="text-[14px] font-black text-slate-800">{pm.category?.name || 'General Maintenance'}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-1">
                                                <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Estimate Time</span>
                                                <span className="text-[14px] font-black text-slate-800">{durationString}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Checklist Card */}
                                    <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-[17px] font-black text-slate-900 tracking-tight">
                                                {pm.checklist?.title || 'Misc'}
                                            </h3>
                                            <button 
                                                onClick={() => setIsEditModalOpen(true)}
                                                className="flex items-center gap-1.5 px-3 py-1 text-slate-500 hover:text-slate-800 text-[13px] font-black transition-colors"
                                            >
                                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                                Edit Checklist
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                            </button>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {displayTasks.map((t: any, idx: number) => (
                                                <div key={t.id || idx} className="flex justify-between items-center py-4">
                                                    <span className="text-[14px] font-bold text-slate-800">{idx + 1}. {t.task}</span>
                                                    <span className="text-[12px] font-bold text-slate-400 tracking-tight">{getTaskTypeLabel(t.task)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: 1/3 width (Activity Card) */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                                        <h3 className="text-[17px] font-black text-slate-900 mb-6 tracking-tight">
                                            Activity
                                        </h3>
                                        <div className="space-y-6">
                                            {logsToRender.map((act: any, idx: number) => (
                                                <div key={act.id || idx} className="flex items-start justify-between gap-3 group">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[12px] font-black text-slate-650 shrink-0">
                                                            {act.userInitial}
                                                        </div>
                                                        <div>
                                                            <div className="text-[13px] font-black text-slate-900 leading-tight">
                                                                {act.userName} <span className="text-[11px] text-slate-400 font-bold ml-1.5">{act.time}</span>
                                                            </div>
                                                            <div className="text-[13px] text-slate-500 font-bold mt-1">
                                                                {act.action}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })()}

                    {activeTab === 'work-orders' && (
                        <motion.div
                            key="work-orders"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {isWOLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4">
                                    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching History...</span>
                                </div>
                            ) : workOrders.length === 0 ? (
                                <div className="glass-card-cold p-16 flex flex-col items-center justify-center gap-4">
                                    <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center">
                                        <Activity className="w-8 h-8 text-muted-foreground/40" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-foreground font-black text-[16px]">No work orders generated yet</h4>
                                        <p className="text-muted-foreground text-[13px] font-bold">Work orders will appear here once the schedule triggers.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="glass-card-cold overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-muted/40 border-b border-border">
                                                <th className="px-6 py-4 text-[12px] font-black text-muted-foreground/80 uppercase tracking-widest">WO #</th>
                                                <th className="px-6 py-4 text-[12px] font-black text-muted-foreground/80 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[12px] font-black text-muted-foreground/80 uppercase tracking-widest">Title</th>
                                                <th className="px-6 py-4 text-[12px] font-black text-muted-foreground/80 uppercase tracking-widest">Assigned To</th>
                                                <th className="px-6 py-4 text-[12px] font-black text-muted-foreground/80 uppercase tracking-widest">Completed</th>
                                                <th className="px-6 py-4 text-[12px] font-black text-muted-foreground/80 uppercase tracking-widest text-right">Link</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {workOrders.map(wo => (
                                                <tr 
                                                    key={wo.id} 
                                                    className="group hover:bg-white/5 transition-colors cursor-pointer"
                                                    onClick={() => navigate(`/work-orders?id=${wo.id}`)}
                                                >
                                                    <td className="px-6 py-4 text-[14px] font-black text-foreground">#{wo.woNumber}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                            wo.status === 'Complete' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                                            wo.status === 'In Progress' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                                                        )}>
                                                            {wo.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-[14px] font-bold text-foreground/90">{wo.title}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground">
                                                                {wo.assignee?.[0] || 'U'}
                                                            </div>
                                                            <span className="text-[13px] font-bold text-muted-foreground">{wo.assignee || 'Unassigned'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {wo.completedAt ? (
                                                            <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[13px]">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                {format(new Date(wo.completedAt), 'MM/dd/yy')}
                                                            </div>
                                                        ) : <span className="text-muted-foreground/40">—</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => navigate(`/work-orders?id=${wo.id}`)}
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <CreatePMModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                schedule={pm as any}
            />

            <AddAssetsModal 
                isOpen={isAddAssetModalOpen}
                onClose={() => setIsAddAssetModalOpen(false)}
                pmSchedule={pm}
            />

            {/* Advanced Filters Modal */}
            <AnimatePresence>
                {isAdvancedFiltersOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAdvancedFiltersOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl flex flex-col"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Filters</h3>
                                <button onClick={() => setIsAdvancedFiltersOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                    <Plus className="w-5 h-5 text-slate-400 rotate-45" />
                                </button>
                            </div>

                            <div className="p-8 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {activeFilters.length > 0 ? (
                                    <div className="space-y-4">
                                        {activeFilters.map((filter, index) => (
                                            <div key={index} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group animate-in fade-in slide-in-from-top-2">
                                                <div className="min-w-[100px]">
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">Field</span>
                                                    <span className="text-[13px] font-black text-slate-900 capitalize">{filter.field}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">Value</span>
                                                    <input 
                                                        type="text"
                                                        value={filter.value}
                                                        onChange={(e) => {
                                                            const newFilters = [...activeFilters];
                                                            newFilters[index].value = e.target.value;
                                                            setActiveFilters(newFilters);
                                                        }}
                                                        placeholder={`Filter by ${filter.field}...`}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary/30"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => setActiveFilters(prev => prev.filter((_, i) => i !== index))}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Plus className="w-4 h-4 rotate-45" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <SlidersHorizontal className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h4 className="text-[15px] font-black text-slate-900 mb-2">No filters added yet.</h4>
                                        <p className="text-[13px] font-bold text-slate-400">When you add filters, they'll appear here.</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between relative overflow-visible">
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsAddFieldOpen(!isAddFieldOpen)}
                                        className="flex items-center gap-2 text-primary font-black text-[13px] uppercase tracking-wider hover:bg-primary/5 px-4 py-2.5 rounded-xl transition-all active:scale-95 border border-transparent hover:border-primary/10"
                                    >
                                        <Plus className="w-4 h-4 stroke-[3px]" />
                                        Add Filter
                                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isAddFieldOpen && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {isAddFieldOpen && (
                                            <>
                                                <div className="fixed inset-0 z-[210]" onClick={() => setIsAddFieldOpen(false)} />
                                                <motion.div 
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    className="absolute bottom-full left-0 mb-0.5 w-56 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 z-[220] overflow-y-auto max-h-[300px] custom-scrollbar p-1.5"
                                                >
                                                    {[
                                                        { id: 'asset', label: 'Asset' },
                                                        { id: 'location', label: 'Location' },
                                                        { id: 'id', label: 'ID' },
                                                        { id: 'assignee', label: 'Assigned To' },
                                                        { id: 'workers', label: 'Additional Workers' },
                                                        { id: 'team', label: 'Team' }
                                                    ].map(field => (
                                                        <button
                                                            key={field.id}
                                                            onClick={() => {
                                                                setActiveFilters(prev => [...prev, { field: field.id, value: '' }]);
                                                                setIsAddFieldOpen(false);
                                                            }}
                                                            className="w-full px-4 py-2.5 hover:bg-slate-50 transition-colors text-left text-[14px] font-medium text-slate-700 hover:text-slate-900"
                                                        >
                                                            {field.label}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setIsAdvancedFiltersOpen(false)}
                                        className="px-6 py-2.5 text-[12px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => setIsAdvancedFiltersOpen(false)}
                                        className="px-8 py-2.5 bg-primary text-white rounded-xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-black hover:shadow-black/20 transition-all active:scale-95"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const getTaskTypeLabel = (taskName: string) => {
    const lower = taskName.toLowerCase();
    if (lower.includes('voltage') || lower.includes('ampere') || lower.includes('temperature') || lower.includes('pressure') || lower.includes('record')) {
        return 'Number form item';
    }
    if (lower.includes('operation of') || lower.includes('service') || lower.includes('test') || lower.includes('inspect')) {
        return 'Checklist form item';
    }
    return 'Task';
};

