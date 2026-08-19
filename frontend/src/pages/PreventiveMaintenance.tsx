import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    ArrowUpDown,
    Columns,
    Check,
    Trash2,
    MoreVertical,
    Flag,
    Activity,
    ChevronLeft,
    SlidersHorizontal,
    ChevronDown,
    Star,
    X as XIcon,
    Calendar,
    Clock,
    TrendingUp,
    MapPin
} from 'lucide-react';
import { CreatePMModal } from '../components/CreatePMModal';
import { PriorityBadge } from '../components/PriorityBadge';
import { 
    useUsers, 
    useLocations, 
    usePreventiveMaintenance, 
    useInfinitePreventiveMaintenance,
    useAssets, 
    useTeams, 
    useSavedViews, 
    useCategories 
} from '../hooks/useData';
import type { PMSchedule } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { EmptyState } from '../components/EmptyState';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobilePreventiveMaintenance } from './MobilePreventiveMaintenance';

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


export const PreventiveMaintenancePage = () => {
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const { bulkDelete, deletePM } = usePreventiveMaintenance();
    const { data: usersData } = useUsers();
    const { data: locationsData } = useLocations();

    const users = (Array.isArray(usersData) ? usersData : (usersData as any)?.items || []) as any[];
    const locations = (Array.isArray(locationsData) ? locationsData : (locationsData as any)?.items || []) as any[];

    const { data: assetsData } = useAssets();
    const { data: teamsData } = useTeams();
    const { data: categoriesData } = useCategories();
    const assets = (Array.isArray(assetsData) ? assetsData : (assetsData as any)?.items || []) as any[];
    const teams = (Array.isArray(teamsData) ? teamsData : (teamsData as any)?.items || []) as any[];
    const categories = (Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.items || []) as any[];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<PMSchedule | null>(null);

    // Filter States
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

    // Dropdown open states
    const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
    const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

    const { 
        data: infiniteData, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        isLoading 
    } = useInfinitePreventiveMaintenance({
        search: searchQuery || undefined,
        priority: selectedPriorities.length > 0 ? selectedPriorities.join(',') : undefined,
        locationId: selectedLocationIds.length > 0 ? selectedLocationIds.join(',') : undefined,
        assignedToId: selectedAssigneeIds.length > 0 ? selectedAssigneeIds.join(',') : undefined,
        assetId: selectedAssetIds.length > 0 ? selectedAssetIds.join(',') : undefined,
        categoryId: selectedCategoryIds.length > 0 ? selectedCategoryIds.join(',') : undefined,
        assignedTeamId: selectedTeamIds.length > 0 ? selectedTeamIds.join(',') : undefined,
        limit: 50,
    });

    const schedules = useMemo(() => infiniteData?.pages.flatMap(p => p.items) || [], [infiniteData]);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
    const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{ field: string; value: any }[]>([]);

    // Staging states
    const [stagedPriorities, setStagedPriorities] = useState<string[]>([]);
    const [stagedLocationIds, setStagedLocationIds] = useState<string[]>([]);
    const [stagedAssigneeIds, setStagedAssigneeIds] = useState<string[]>([]);

    // Sort states
    const sortOptions = ['Name', 'Work Order Title', 'Priority', 'Date Created'];
    const [sortBy, setSortBy] = useState('Date Created');
    const [sortOrder] = useState<'asc' | 'desc'>('desc');

    // Column Visibility
    const allColumns = [
        'ID', 'Work Order Title', 'Work Order Description', 'Image', 
        'Assets & Locations', 'Category', 'Priority', 'Paused', 
        'Checklist', 'Checklist ID', 'Date Created'
    ];
    const visibleColumns = allColumns;

    // --- STATS LOGIC ---
    const activeSchedules = useMemo(() => (schedules || []).filter((s: PMSchedule) => s.status === 'ACTIVE'), [schedules]);
    
    const statsData = useMemo(() => {
        // Nearest Trigger
        const nextTriggerDates = activeSchedules
            .map((s: PMSchedule) => s.nextDueDate ? new Date(s.nextDueDate).getTime() : 0)
            .filter((d: number) => d > 0)
            .sort((a: number, b: number) => a - b);
        
        let nearestTriggerStr = '--';
        let nearestTriggerCount = 0;
        if (nextTriggerDates.length > 0) {
            const nearestTime = nextTriggerDates[0];
            nearestTriggerStr = new Date(nearestTime).toLocaleDateString('en-US');
            nearestTriggerCount = activeSchedules.filter((s: PMSchedule) => {
                if (!s.nextDueDate) return false;
                return new Date(s.nextDueDate).toLocaleDateString('en-US') === nearestTriggerStr;
            }).length;
        }

        // Average Frequency
        let totalDays = 0;
        let frequencyCount = 0;
        const typeFreq: Record<string, number> = {};

        activeSchedules.forEach((s: PMSchedule) => {
            if (!s.frequencyValue || !s.frequencyType) return;
            const val = s.frequencyValue;
            const type = s.frequencyType.toUpperCase();
            frequencyCount++;
            
            typeFreq[type] = (typeFreq[type] || 0) + 1;

            if (type === 'DAYS') totalDays += val;
            else if (type === 'WEEKS') totalDays += val * 7;
            else if (type === 'MONTHS') totalDays += val * 30;
            else if (type === 'YEARS') totalDays += val * 365;
        });

        let avgFreqStr = '--';
        let avgFreqDesc = '--';
        if (frequencyCount > 0) {
            const avgDays = totalDays / frequencyCount;
            if (avgDays < 7) {
                avgFreqStr = `~${Math.round(avgDays)} days`;
            } else if (avgDays < 30) {
                avgFreqStr = `~${Math.round(avgDays / 7)} wks`;
            } else if (avgDays < 365) {
                avgFreqStr = `~${Math.round(avgDays / 30)} mos`;
            } else {
                avgFreqStr = `~${Math.round(avgDays / 365)} yrs`;
            }

            const typeNames: Record<string, string> = { DAYS: 'Daily', WEEKS: 'Weekly', MONTHS: 'Monthly', YEARS: 'Yearly' };
            const sortedTypes = Object.entries(typeFreq).sort((a, b) => b[1] - a[1]);
            if (sortedTypes.length > 0) {
                avgFreqDesc = sortedTypes.slice(0, 2).map(([type]) => typeNames[type] || type).join(' + ');
            }
        }

        return { nearestTriggerStr, nearestTriggerCount, avgFreqStr, avgFreqDesc };
    }, [activeSchedules]);
    // --- END STATS LOGIC ---

    const filteredSchedules = useMemo(() => {
        return [...schedules].sort((a, b) => {
            if (sortBy === 'Priority') {
                const weights: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'NONE': 0 };
                const weightA = weights[a.priority] || 0;
                const weightB = weights[b.priority] || 0;
                const res = weightA < weightB ? -1 : weightA > weightB ? 1 : 0;
                return sortOrder === 'asc' ? res : -res;
            }

            let valA: any, valB: any;
            switch (sortBy) {
                case 'Name': 
                    valA = (a.name || '').toLowerCase(); 
                    valB = (b.name || '').toLowerCase(); 
                    break;
                case 'Work Order Title': 
                    valA = (a.woTitle || '').toLowerCase(); 
                    valB = (b.woTitle || '').toLowerCase(); 
                    break;
                case 'Date Created': 
                    valA = new Date(a.createdAt || 0).getTime(); 
                    valB = new Date(b.createdAt || 0).getTime(); 
                    break;
                default: 
                    valA = a.createdAt; 
                    valB = b.createdAt;
            }
            if (!valA && !valB) return 0;
            const res = valA < valB ? -1 : valA > valB ? 1 : 0;
            return sortOrder === 'asc' ? res : -res;
        });
    }, [schedules, sortBy, sortOrder]);

    const toggleRow = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedRows.length === filteredSchedules.length && filteredSchedules.length > 0) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredSchedules.map(s => s.id));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedRows.length === 0) return;
        if (!window.confirm(`Are you sure you want to PERMANENTLY de-commission these ${selectedRows.length} protocols?`)) return;
        
        try {
            await bulkDelete.mutateAsync(selectedRows);
            setSelectedRows([]);
            toast.success(`${selectedRows.length} protocols removed from mission control.`);
        } catch (error) {
            toast.error("Failed to execute batch deletion protocol.");
        }
    };

    const renderHeader = () => (
        <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-100 z-[60] shrink-0 py-2">
            <div className="flex items-center gap-6">
                <button 
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 group"
                >
                    <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Dashboard</span>
                </button>
                <div className="h-6 w-px bg-slate-100 mx-1" />
                <h1 className="text-[20px] font-black text-slate-900 tracking-tight">Preventive Maintenance</h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search PMs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 rounded-2xl text-[13px] font-bold outline-none w-64 transition-all"
                    />
                </div>
                {selectedRows.length > 0 && (
                    <button 
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-[13px] font-black hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete ({selectedRows.length})
                    </button>
                )}
                <button 
                    onClick={() => { setEditingSchedule(null); setIsCreateModalOpen(true); }}
                    className="flex items-center gap-2 bg-primary hover:opacity-90 text-white px-6 py-2.5 rounded-full text-[14px] font-black shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Create PM
                </button>
            </div>
        </div>
    );

    const renderFilterBar = () => (
        <div className="flex flex-col bg-white border-b border-slate-200 z-[50] shrink-0">
            {/* Top Row: Results & Columns */}
            <div className="h-12 flex items-center justify-between px-6 border-b border-slate-100/60">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black text-slate-900">{filteredSchedules.length} Results Returned</span>
                </div>
            </div>

            {/* Bottom Row: Filters & Reset */}
            <div className="h-14 flex items-center justify-between px-6 py-2 relative">
                <div className="flex items-center gap-3 w-full">
                    <button 
                        onClick={() => setIsAdvancedFiltersOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                        Filters
                    </button>

                    <div className="w-px h-6 bg-slate-200 mx-1" />



                <FilterDropdown 
                    label="Priority" 
                    icon={Flag} 
                    isOpen={isPriorityDropdownOpen} 
                    onToggle={() => { setIsPriorityDropdownOpen(!isPriorityDropdownOpen); setStagedPriorities(selectedPriorities); }}
                    badgeValue={selectedPriorities.length}
                    onApply={() => { setSelectedPriorities(stagedPriorities); setIsPriorityDropdownOpen(false); }}
                    onCancel={() => setIsPriorityDropdownOpen(false)}
                >
                    {['HIGH', 'MEDIUM', 'LOW', 'NONE'].map(p => (
                        <button
                            key={p}
                            onClick={() => setStagedPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                            className={cn("w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left rounded-xl", stagedPriorities.includes(p) ? "text-primary bg-primary/5 font-black" : "text-slate-700 font-bold")}
                        >
                            <span className="text-[14px]">{p}</span>
                            {stagedPriorities.includes(p) && <Check className="w-4 h-4 text-primary" />}
                        </button>
                    ))}
                </FilterDropdown>

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
                                className={cn("w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left rounded-xl", stagedLocationIds.includes(l.id) ? "text-primary bg-primary/5 font-black" : "text-slate-700 font-bold")}
                            >
                                <span className="text-[14px]">{l.name}</span>
                                {stagedLocationIds.includes(l.id) && <Check className="w-4 h-4 text-primary" />}
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
                                key={u.userOrgId || u.id}
                                onClick={() => setStagedAssigneeIds(prev => prev.includes(u.userOrgId || u.id) ? prev.filter(x => x !== (u.userOrgId || u.id)) : [...prev, (u.userOrgId || u.id)])}
                                className={cn("w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left rounded-xl", stagedAssigneeIds.includes(u.userOrgId || u.id) ? "text-primary bg-primary/5 font-black" : "text-slate-700 font-bold")}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">{(u.name || '?')[0]}</div>
                                    <span className="text-[14px]">{u.name || 'Unknown User'}</span>
                                </div>
                                {stagedAssigneeIds.includes(u.userOrgId || u.id) && <Check className="w-4 h-4 text-primary" />}
                            </button>
                        ))}
                    </div>
                </FilterDropdown>

                {(selectedPriorities.length > 0 || selectedLocationIds.length > 0 || selectedAssigneeIds.length > 0 || searchQuery) && (
                    <button 
                        onClick={() => {
                            setSelectedPriorities([]);
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
                    

                    <div className="relative ml-2">
                        <button 
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all", isSortDropdownOpen ? "bg-primary/10 text-primary" : "hover:bg-slate-50 text-slate-600")}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Sort: {sortBy}
                        </button>
                        {isSortDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[110]" onClick={() => setIsSortDropdownOpen(false)} />
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-[120] py-2 overflow-hidden border border-slate-100">
                                    <div className="px-4 py-2 border-b border-slate-50 bg-white">
                                        <span className="text-[12px] font-bold">Sort By</span>
                                    </div>
                                    {sortOptions.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => { setSortBy(opt); setIsSortDropdownOpen(false); }}
                                            className={cn("w-full px-4 py-2 text-left text-[12px] font-bold transition-colors hover:bg-slate-50", sortBy === opt ? "text-primary bg-primary/5" : "text-slate-600")}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Advanced Filters Modal */}
            <AnimatePresence>
                {isAdvancedFiltersOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAdvancedFiltersOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl flex flex-col"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-[20px] font-black text-slate-900">Filters</h3>
                                <button 
                                    onClick={() => setIsAdvancedFiltersOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <Plus className="w-6 h-6 text-slate-400 rotate-45" />
                                </button>
                            </div>

                            <div className="p-8 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {activeFilters.length > 0 ? (
                                    <div className="space-y-4">
                                        {activeFilters.map((filter, index) => {
                                            const updateValue = (val: string) => {
                                                const newFilters = [...activeFilters];
                                                newFilters[index].value = val;
                                                setActiveFilters(newFilters);
                                            };

                                            const fieldLabels: Record<string, string> = {
                                                name: 'Name', category: 'Category', asset: 'Asset',
                                                assignee: 'Assigned To', workers: 'Additional Workers',
                                                team: 'Team', location: 'Location', priority: 'Priority',
                                                files: 'Files', archived: 'Archived'
                                            };

                                            let valueControl: React.ReactNode;

                                            if (filter.field === 'location') {
                                                valueControl = (
                                                    <select
                                                        value={filter.value}
                                                        onChange={e => updateValue(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary/30 cursor-pointer"
                                                    >
                                                        <option value="">— Select Location —</option>
                                                        {locations.map((loc: any) => (
                                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                        ))}
                                                    </select>
                                                );
                                            } else if (filter.field === 'assignee' || filter.field === 'workers') {
                                                valueControl = (
                                                    <select
                                                        value={filter.value}
                                                        onChange={e => updateValue(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary/30 cursor-pointer"
                                                    >
                                                        <option value="">— Select User —</option>
                                                        {users.map((u: any) => (
                                                            <option key={u.userOrgId || u.id} value={u.userOrgId || u.id}>{u.name || 'Unknown User'}</option>
                                                        ))}
                                                    </select>
                                                );
                                            } else if (filter.field === 'priority') {
                                                valueControl = (
                                                    <select
                                                        value={filter.value}
                                                        onChange={e => updateValue(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary/30 cursor-pointer"
                                                    >
                                                        <option value="">— Select Priority —</option>
                                                        {['Critical', 'High', 'Medium', 'Low', 'None'].map(p => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                );
                                            } else if (filter.field === 'category') {
                                                valueControl = (
                                                    <select
                                                        value={filter.value}
                                                        onChange={e => updateValue(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary/30 cursor-pointer"
                                                    >
                                                        <option value="">— Select Category —</option>
                                                        {['Damage', 'Electrical', 'Inspection', 'Meter Reading', 'None', 'Preventative', 'Project', 'Safety', 'Upgrade'].map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                );
                                            } else if (filter.field === 'asset') {
                                                valueControl = (
                                                    <select
                                                        value={filter.value}
                                                        onChange={e => updateValue(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary/30 cursor-pointer"
                                                    >
                                                        <option value="">— Select Asset —</option>
                                                        {assets.map((a: any) => (
                                                            <option key={a.id} value={a.id}>{a.name}</option>
                                                        ))}
                                                    </select>
                                                );
                                            } else if (filter.field === 'team') {
                                                valueControl = (
                                                    <select
                                                        value={filter.value}
                                                        onChange={e => updateValue(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary/30 cursor-pointer"
                                                    >
                                                        <option value="">— Select Team —</option>
                                                        {teams.map((t: any) => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                );
                                            } else if (filter.field === 'archived') {
                                                valueControl = (
                                                    <select
                                                        value={filter.value}
                                                        onChange={e => updateValue(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary/30 cursor-pointer"
                                                    >
                                                        <option value="">— Select —</option>
                                                        <option value="true">Yes (Archived)</option>
                                                        <option value="false">No (Active)</option>
                                                    </select>
                                                );
                                            } else {
                                                valueControl = (
                                                    <input
                                                        type="text"
                                                        value={filter.value}
                                                        onChange={e => updateValue(e.target.value)}
                                                        placeholder={`Filter by ${fieldLabels[filter.field] || filter.field}...`}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary/30"
                                                    />
                                                );
                                            }

                                            return (
                                            <div key={index} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group animate-in fade-in slide-in-from-top-2">
                                                <div className="min-w-[110px]">
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">Field</span>
                                                    <span className="text-[13px] font-black text-slate-900 capitalize">{fieldLabels[filter.field] || filter.field}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1">Value</span>
                                                    {valueControl}
                                                </div>
                                                <button 
                                                    onClick={() => setActiveFilters(prev => prev.filter((_, i) => i !== index))}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Plus className="w-4 h-4 rotate-45" />
                                                </button>
                                            </div>
                                            );
                                        })}
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
                                                        { id: 'name', label: 'Name' },
                                                        { id: 'category', label: 'Category' },
                                                        { id: 'asset', label: 'Asset' },
                                                        { id: 'assignee', label: 'Assigned To' },
                                                        { id: 'workers', label: 'Additional Workers' },
                                                        { id: 'team', label: 'Team' },
                                                        { id: 'location', label: 'Location' },
                                                        { id: 'priority', label: 'Priority' },
                                                        { id: 'files', label: 'Files' },
                                                        { id: 'archived', label: 'Archived' }
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

    const renderStatsBar = () => (
        <div className="px-6 py-2 flex gap-3 bg-white border-b border-slate-100 z-30 shrink-0">
            {/* Card 1: Total Schedules */}
            <div className="bg-white rounded-xl px-4 py-2 flex-1 min-w-[180px] border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center gap-3 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="w-8 h-8 rounded-lg bg-indigo-50/70 text-indigo-600 border border-indigo-100/30 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none mb-0.5">TOTAL SCHEDULES</div>
                    <div className="text-base font-black text-slate-900 leading-none tracking-tight">{schedules?.length || 0}</div>
                    <div className="text-[9px] font-bold text-slate-400 leading-none mt-0.5 truncate">Currently tracked</div>
                </div>
            </div>
            
            {/* Card 2: Active */}
            <div className="bg-white rounded-xl px-4 py-2 flex-1 min-w-[180px] border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center gap-3 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="w-8 h-8 rounded-lg bg-emerald-50/70 text-emerald-600 border border-emerald-100/30 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none mb-0.5">ACTIVE</div>
                    <div className="text-base font-black text-emerald-600 leading-none tracking-tight">{activeSchedules.length}</div>
                    <div className="text-[9px] font-bold text-slate-400 leading-none mt-0.5 truncate">{activeSchedules.length === (schedules?.length || 0) && activeSchedules.length > 0 ? 'All running' : 'Currently active'}</div>
                </div>
            </div>

            {/* Card 3: Next Trigger */}
            <div className="bg-white rounded-xl px-4 py-2 flex-1 min-w-[180px] border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center gap-3 transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="w-8 h-8 rounded-lg bg-blue-50/70 text-blue-600 border border-blue-100/30 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none mb-0.5">NEXT TRIGGER</div>
                    <div className="text-[13px] font-black text-blue-600 leading-none tracking-tight truncate">{statsData.nearestTriggerStr}</div>
                    <div className="text-[9px] font-bold text-slate-400 leading-none mt-0.5 truncate">{statsData.nearestTriggerCount} {statsData.nearestTriggerCount === 1 ? 'schedule' : 'schedules'}</div>
                </div>
            </div>

        </div>
    );



    if (isMobile) {
        return (
            <>
                <MobilePreventiveMaintenance
                    schedules={schedules || []}
                    filteredSchedules={filteredSchedules}
                    isLoading={isLoading}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setIsCreateModalOpen={setIsCreateModalOpen}
                    setEditingSchedule={setEditingSchedule}
                    locations={locations}
                    users={users}
                    selectedPriorities={selectedPriorities}
                    setSelectedPriorities={setSelectedPriorities}
                    selectedLocationIds={selectedLocationIds}
                    setSelectedLocationIds={setSelectedLocationIds}
                    selectedAssigneeIds={selectedAssigneeIds}
                    setSelectedAssigneeIds={setSelectedAssigneeIds}
                    selectedAssetIds={selectedAssetIds}
                    setSelectedAssetIds={setSelectedAssetIds}
                    selectedCategoryIds={selectedCategoryIds}
                    setSelectedCategoryIds={setSelectedCategoryIds}
                    selectedTeamIds={selectedTeamIds}
                    setSelectedTeamIds={setSelectedTeamIds}
                    assets={assets}
                    teams={teams}
                    categories={categories}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    deletePM={deletePM}
                />
                <CreatePMModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingSchedule(null); }} schedule={editingSchedule || undefined} />
            </>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            {renderHeader()}
            {renderStatsBar()}
            {renderFilterBar()}



            <div className="flex-1 overflow-hidden flex flex-col p-6">
                <div className="flex-1 min-h-0 bg-white rounded-[32px] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing Mission Protocols...</span>
                        </div>
                    ) : filteredSchedules.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <EmptyState
                                variant="pm"
                                title="Zero Protocols Found"
                                description="Adjust your frequency filters"
                                size="lg"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-0 min-w-max">
                                <thead>
                                    <tr className="bg-white border-b border-slate-200">
                                        <th className="w-[64px] min-w-[64px] max-w-[64px] px-6 py-4 sticky top-0 left-0 z-[40] bg-white border-b border-r border-slate-200">
                                            <div 
                                                onClick={toggleAll}
                                                className={cn(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                                                    selectedRows.length === filteredSchedules.length && filteredSchedules.length > 0 ? "bg-primary border-primary" : "border-slate-300 bg-white"
                                                )}
                                            >
                                                {selectedRows.length === filteredSchedules.length && filteredSchedules.length > 0 && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                                            </div>
                                        </th>
                                        <th className="w-[240px] min-w-[240px] max-w-[240px] px-6 py-4 sticky top-0 left-[64px] z-[40] bg-white border-b border-r border-slate-200">
                                            <span className="text-[13px] font-bold text-slate-600">Name</span>
                                        </th>
                                        
                                        {visibleColumns.includes('ID') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 min-w-[100px]">
                                                <span className="text-[13px] font-bold text-slate-600">ID</span>
                                            </th>
                                        )}

                                        {visibleColumns.includes('Work Order Title') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 min-w-[180px]">
                                                <span className="text-[13px] font-bold text-slate-600">Work Order Title</span>
                                            </th>
                                        )}

                                        {visibleColumns.includes('Work Order Description') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 min-w-[200px]">
                                                <span className="text-[13px] font-bold text-slate-600">Work Order Description</span>
                                            </th>
                                        )}

                                        {visibleColumns.includes('Image') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 text-center min-w-[80px]">
                                                <span className="text-[13px] font-bold text-slate-600">Image</span>
                                            </th>
                                        )}

                                        {visibleColumns.includes('Assets & Locations') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 min-w-[180px]">
                                                <span className="text-[13px] font-bold text-slate-600">Assets & Locations</span>
                                            </th>
                                        )}

                                        {visibleColumns.includes('Category') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 min-w-[140px]">
                                                <span className="text-[13px] font-bold text-slate-600">Category</span>
                                            </th>
                                        )}

                                        {visibleColumns.includes('Priority') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 text-center min-w-[100px]">
                                                <span className="text-[13px] font-bold text-slate-600">Priority</span>
                                            </th>
                                        )}

                                        {visibleColumns.includes('Paused') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 text-center min-w-[80px]">
                                                <span className="text-[13px] font-bold text-slate-600">Paused</span>
                                            </th>
                                        )}

                                        {visibleColumns.includes('Checklist') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 min-w-[140px]">
                                                <span className="text-[13px] font-bold text-slate-600">Checklist</span>
                                            </th>
                                        )}

                                        {visibleColumns.includes('Checklist ID') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 min-w-[120px]">
                                                <span className="text-[13px] font-bold text-slate-600">Checklist ID</span>
                                            </th>
                                        )}

                                        {visibleColumns.includes('Date Created') && (
                                            <th className="px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200 min-w-[140px] whitespace-nowrap">
                                                <span className="text-[13px] font-bold text-slate-600">Date Created <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-slate-400" /></span>
                                            </th>
                                        )}
                                        <th className="w-12 px-6 py-4 sticky top-0 bg-white z-12 border-b border-slate-200" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSchedules.map((row) => (
                                        <tr 
                                            key={row.id}
                                            className={cn(
                                                "group hover:bg-slate-50 transition-colors cursor-pointer",
                                                selectedRows.includes(row.id) && "bg-primary/[0.02]"
                                            )}
                                            onClick={() => navigate(`/pm/${row.id}`)}
                                        >
                                            <td 
                                                onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}
                                                className="w-[64px] min-w-[64px] max-w-[64px] px-6 py-4 sticky left-0 z-[30] bg-white group-hover:bg-slate-50 border-r border-slate-100 transition-colors cursor-pointer"
                                            >
                                                <div 
                                                    className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                        selectedRows.includes(row.id) ? "bg-primary border-primary" : "border-slate-300 bg-white group-hover:border-slate-400"
                                                    )}
                                                >
                                                    {selectedRows.includes(row.id) && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                                                </div>
                                            </td>
                                            
                                            <td 
                                                className="w-[240px] min-w-[240px] max-w-[240px] px-6 py-4 sticky left-[64px] z-[30] bg-white group-hover:bg-slate-50 border-r border-slate-100 transition-colors"
                                            >
                                                <span className="text-[13px] font-semibold text-slate-900 group-hover:text-primary transition-colors block truncate" title={row.name}>
                                                    {row.name}
                                                </span>
                                            </td>

                                            {visibleColumns.includes('ID') && (
                                                <td className="px-6 py-4">
                                                    <span className="text-[13px] font-medium text-slate-500 font-mono">{row.id.substring(0, 8)}</span>
                                                </td>
                                            )}

                                            {visibleColumns.includes('Work Order Title') && (
                                                <td className="px-6 py-4">
                                                    <span className="text-[13px] font-medium text-slate-700">{row.woTitle || '-'}</span>
                                                </td>
                                            )}

                                            {visibleColumns.includes('Work Order Description') && (
                                                <td className="px-6 py-4">
                                                    <div className="text-[13px] font-medium text-slate-500 max-w-[200px] truncate" title={row.woDescription}>
                                                        {row.woDescription || '-'}
                                                    </div>
                                                </td>
                                            )}

                                            {visibleColumns.includes('Image') && (
                                                <td className="px-6 py-4 text-center">
                                                    {row.imageUrl ? (
                                                        <img src={row.imageUrl} className="w-8 h-8 rounded-lg object-cover mx-auto border border-slate-200" alt="PM" />
                                                    ) : (
                                                        <span className="text-[13px] text-slate-400">-</span>
                                                    )}
                                                </td>
                                            )}

                                            {visibleColumns.includes('Assets & Locations') && (
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[13px] font-medium text-slate-700">
                                                            {row.assets && row.assets.length > 1 ? `${row.assets.length} Assets Linked` : (row.asset?.name || 'Global Schedule')}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">
                                                            {row.asset?.location?.name || 'Multi-Location'}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}

                                            {visibleColumns.includes('Category') && (
                                                <td className="px-6 py-4">
                                                    <span className="text-[13px] font-medium text-slate-700">
                                                        {row.category?.name || '-'}
                                                    </span>
                                                </td>
                                            )}

                                            {visibleColumns.includes('Priority') && (
                                                <td className="px-6 py-4 text-center">
                                                    {row.priority ? (
                                                        <PriorityBadge priority={row.priority} />
                                                    ) : (
                                                        <span className="text-[13px] font-medium text-slate-400">-</span>
                                                    )}
                                                </td>
                                            )}

                                            {visibleColumns.includes('Paused') && (
                                                <td className="px-6 py-4 text-center">
                                                    {row.status === 'PAUSED' ? (
                                                        <span className="text-[13px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Yes</span>
                                                    ) : (
                                                        <span className="text-[13px] font-medium text-slate-400">-</span>
                                                    )}
                                                </td>
                                            )}

                                            {visibleColumns.includes('Checklist') && (
                                                <td className="px-6 py-4">
                                                    <span className="text-[13px] font-medium text-slate-700">
                                                        {row.checklist?.title || '-'}
                                                    </span>
                                                </td>
                                            )}

                                            {visibleColumns.includes('Checklist ID') && (
                                                <td className="px-6 py-4">
                                                    <span className="text-[13px] font-medium text-slate-500 font-mono">
                                                        {row.checklistId ? row.checklistId.substring(0, 8) : '-'}
                                                    </span>
                                                </td>
                                            )}

                                            {visibleColumns.includes('Date Created') && (
                                                <td className="px-6 py-4">
                                                    <span className="text-[13px] font-medium text-slate-700">
                                                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
                                                    </span>
                                                </td>
                                            )}

                                            <td className="px-6 py-4 text-right">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingSchedule(row); setIsCreateModalOpen(true); }} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-700">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {hasNextPage && (
                            <div className="py-8 flex justify-center">
                                <button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-black text-slate-600 hover:border-primary hover:text-primary transition-all disabled:opacity-50 shadow-sm"
                                >
                                    {isFetchingNextPage ? 'Loading more...' : 'Load More Protocols'}
                                </button>
                            </div>
                        )}
                    </>
                )}
                </div>
            </div>

            <CreatePMModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingSchedule(null); }} schedule={editingSchedule || undefined} />
        </div>
    );
};

const MoreHorizontal = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
);

export default PreventiveMaintenancePage;
