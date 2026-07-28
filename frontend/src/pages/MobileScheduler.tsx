import React, { useState } from 'react';
import { 
    Search, Calendar, Clock, RefreshCcw, Loader2, AlertCircle, 
    ArrowLeft, ArrowRight, UserPlus, Trash2, Edit3, Eye,
    ArrowUpDown, Filter, Check, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { PriorityBadge } from '../components/PriorityBadge';
import { useAssets, useLocations, useTeams, useCategories } from '../hooks/useData';

interface MobileSchedulerProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    users: any[];
    workOrders: any[];
    isLoading: boolean;
    updateAssignment: any;
    smartSchedule: any;
    refetchWorkOrders: () => void;
    setSelectedWo: (wo: any) => void;
    setEditingWo: (wo: any) => void;
}

export const MobileScheduler: React.FC<MobileSchedulerProps> = ({
    currentDate,
    setCurrentDate,
    users = [],
    workOrders = [],
    isLoading,
    updateAssignment,
    smartSchedule,
    refetchWorkOrders,
    setSelectedWo,
    setEditingWo
}) => {
    const [activeTab, setActiveTab] = useState<'timeline' | 'backlog'>('timeline');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAssignWo, setSelectedAssignWo] = useState<any | null>(null);
    const [selectedManageWo, setSelectedManageWo] = useState<any | null>(null);
    const [assigneeId, setAssigneeId] = useState('');
    const [assignHour, setAssignHour] = useState('09:00');

    // Fetch lists for filter selectors
    const { data: assets = [] } = useAssets();
    const { data: locations = [] } = useLocations();
    const { data: teams = [] } = useTeams();
    const { data: categories = [] } = useCategories('WORK_ORDER');

    // Drawer visibility
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Active Applied Filter & Sort states
    const [woSortField, setWoSortField] = useState<string>('Priority');
    const [woPriorityFilter, setWoPriorityFilter] = useState<string>('');
    const [woAssigneeFilter, setWoAssigneeFilter] = useState<string>('');
    const [woCategoryFilter, setWoCategoryFilter] = useState<string>('');
    const [woAssetFilter, setWoAssetFilter] = useState<string>('');
    const [woLocationFilter, setWoLocationFilter] = useState<string>('');
    const [woStatusFilter, setWoStatusFilter] = useState<string>('');
    const [woDueDateFilter, setWoDueDateFilter] = useState<string>('');
    const [woTeamFilter, setWoTeamFilter] = useState<string>('');

    // Local / Temporary Filter & Sort states inside the Drawer modal
    const [localWoSortField, setLocalWoSortField] = useState<string>('Priority');
    const [localWoPriorityFilter, setLocalWoPriorityFilter] = useState<string>('');
    const [localWoAssigneeFilter, setLocalWoAssigneeFilter] = useState<string>('');
    const [localWoCategoryFilter, setLocalWoCategoryFilter] = useState<string>('');
    const [localWoAssetFilter, setLocalWoAssetFilter] = useState<string>('');
    const [localWoLocationFilter, setLocalWoLocationFilter] = useState<string>('');
    const [localWoStatusFilter, setLocalWoStatusFilter] = useState<string>('');
    const [localWoDueDateFilter, setLocalWoDueDateFilter] = useState<string>('');
    const [localWoTeamFilter, setLocalWoTeamFilter] = useState<string>('');

    const handleOpenFilters = () => {
        setLocalWoSortField(woSortField);
        setLocalWoPriorityFilter(woPriorityFilter);
        setLocalWoAssigneeFilter(woAssigneeFilter);
        setLocalWoCategoryFilter(woCategoryFilter);
        setLocalWoAssetFilter(woAssetFilter);
        setLocalWoLocationFilter(woLocationFilter);
        setLocalWoStatusFilter(woStatusFilter);
        setLocalWoDueDateFilter(woDueDateFilter);
        setLocalWoTeamFilter(woTeamFilter);
        setIsFilterDrawerOpen(true);
    };

    const handleApplyFilters = () => {
        setWoSortField(localWoSortField);
        setWoPriorityFilter(localWoPriorityFilter);
        setWoAssigneeFilter(localWoAssigneeFilter);
        setWoCategoryFilter(localWoCategoryFilter);
        setWoAssetFilter(localWoAssetFilter);
        setWoLocationFilter(localWoLocationFilter);
        setWoStatusFilter(localWoStatusFilter);
        setWoDueDateFilter(localWoDueDateFilter);
        setWoTeamFilter(localWoTeamFilter);
        setIsFilterDrawerOpen(false);
    };

    const handleResetFilters = () => {
        setLocalWoSortField('Priority');
        setLocalWoPriorityFilter('');
        setLocalWoAssigneeFilter('');
        setLocalWoCategoryFilter('');
        setLocalWoAssetFilter('');
        setLocalWoLocationFilter('');
        setLocalWoStatusFilter('');
        setLocalWoDueDateFilter('');
        setLocalWoTeamFilter('');
    };

    const activeFilterCount = [
        woPriorityFilter,
        woAssigneeFilter,
        woCategoryFilter,
        woAssetFilter,
        woLocationFilter,
        woStatusFilter,
        woDueDateFilter,
        woTeamFilter
    ].filter(Boolean).length;

    // Get 7 days of the week for date picker
    const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeekDate, i));

    // Get unscheduled work orders
    const unscheduledWOs = React.useMemo(() => {
        return workOrders.filter(wo => !wo.startDate || !wo.assignedToId);
    }, [workOrders]);

    // Get scheduled work orders for selected day
    const scheduledWOs = React.useMemo(() => {
        return workOrders.filter(wo => {
            if (!wo.startDate || !wo.assignedToId) return false;
            return isSameDay(new Date(wo.startDate), currentDate);
        });
    }, [workOrders, currentDate]);

    // Group scheduled work orders by technician
    const scheduledByTechnician = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        users.forEach(u => {
            groups[u.userOrgId || u.id] = [];
        });

        scheduledWOs.forEach(wo => {
            const techId = wo.assignedToId;
            if (techId && groups[techId]) {
                groups[techId].push(wo);
            } else if (techId) {
                // If technician is not in users list, create a group for them dynamically
                groups[techId] = [wo];
            }
        });

        return groups;
    }, [scheduledWOs, users]);

    // Filter and Sort unscheduled backlog
    const filteredBacklog = React.useMemo(() => {
        let items = [...unscheduledWOs];

        // 1. Text Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(wo => 
                (wo.title || '').toLowerCase().includes(query) ||
                (wo.assetName || '').toLowerCase().includes(query) ||
                (wo.id || '').toLowerCase().includes(query) ||
                (wo.woNumber || '').toString().toLowerCase().includes(query)
            );
        }

        // 2. Priority Filter
        if (woPriorityFilter) {
            items = items.filter(wo => (wo.priority || '').toUpperCase() === woPriorityFilter.toUpperCase());
        }

        // 3. Assigned To Filter
        if (woAssigneeFilter) {
            items = items.filter(wo => wo.assignedToId === woAssigneeFilter);
        }

        // 4. Category Filter
        if (woCategoryFilter) {
            items = items.filter(wo => wo.category === woCategoryFilter);
        }

        // 5. Asset Filter
        if (woAssetFilter) {
            items = items.filter(wo => wo.assetId === woAssetFilter);
        }

        // 6. Location Filter
        if (woLocationFilter) {
            items = items.filter(wo => wo.locationId === woLocationFilter);
        }

        // 7. Work Order Status Filter
        if (woStatusFilter) {
            items = items.filter(wo => {
                const s = wo.status;
                if (woStatusFilter === 'Complete') return s === 'COMPLETED' || s === 'Complete';
                if (woStatusFilter === 'Pending Approval') return s === 'PENDING_APPROVAL' || s === 'Pending Approval';
                return s === woStatusFilter;
            });
        }

        // 8. Due Date range filter
        if (woDueDateFilter) {
            if (woDueDateFilter === 'Not Set') {
                items = items.filter(wo => !wo.dueDate);
            } else if (woDueDateFilter === 'Overdue') {
                items = items.filter(wo => wo.dueDate && new Date(wo.dueDate).getTime() < Date.now() && wo.status !== 'Complete' && wo.status !== 'COMPLETED');
            } else if (woDueDateFilter === 'Today') {
                items = items.filter(wo => wo.dueDate && isSameDay(new Date(wo.dueDate), new Date()));
            } else if (woDueDateFilter === 'This Week') {
                const now = new Date();
                const nextWeek = addDays(now, 7);
                items = items.filter(wo => wo.dueDate && new Date(wo.dueDate) >= now && new Date(wo.dueDate) <= nextWeek);
            } else if (woDueDateFilter === 'This Month') {
                const now = new Date();
                const nextMonth = addDays(now, 30);
                items = items.filter(wo => wo.dueDate && new Date(wo.dueDate) >= now && new Date(wo.dueDate) <= nextMonth);
            }
        }

        // 9. Team Filter
        if (woTeamFilter) {
            items = items.filter(wo => wo.assignedTeamId === woTeamFilter);
        }

        // 10. Sorting
        items.sort((a, b) => {
            if (woSortField === 'Priority') {
                const rank = (p?: string) => p === 'Critical' || p === 'CRITICAL' ? 4 : p === 'High' || p === 'HIGH' ? 3 : p === 'Medium' || p === 'MEDIUM' ? 2 : 1;
                return rank(b.priority) - rank(a.priority);
            }
            if (woSortField === 'Due Date') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (woSortField === 'Duration') {
                return (Number(b.estimatedHours) || 0) - (Number(a.estimatedHours) || 0);
            }
            if (woSortField === 'Work Order Number') {
                return (Number(b.woNumber) || 0) - (Number(a.woNumber) || 0);
            }
            // default
            return 0;
        });

        return items;
    }, [unscheduledWOs, searchQuery, woSortField, woPriorityFilter, woAssigneeFilter, woCategoryFilter, woAssetFilter, woLocationFilter, woStatusFilter, woDueDateFilter, woTeamFilter]);

    const handleAssignWo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssignWo || !assigneeId) return;

        const dateString = format(currentDate, 'yyyy-MM-dd');
        const localDate = new Date(`${dateString}T${assignHour || '00:00'}:00`);
        const isoStartDate = !isNaN(localDate.getTime()) ? localDate.toISOString() : new Date().toISOString();

        updateAssignment.mutate({
            id: selectedAssignWo.id,
            assigneeId: assigneeId,
            startDate: isoStartDate
        });

        setSelectedAssignWo(null);
        setAssigneeId('');
    };

    const handleUnschedule = (woId: string) => {
        updateAssignment.mutate({
            id: woId,
            assigneeId: null,
            startDate: null
        });
        setSelectedManageWo(null);
    };

    const handleReassign = (wo: any) => {
        setSelectedAssignWo(wo);
        setAssigneeId(wo.assignedToId || '');
        if (wo.startDate) {
            setAssignHour(format(new Date(wo.startDate), 'HH:mm'));
        }
        setSelectedManageWo(null);
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* Navigation Header */}
            <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md px-4 py-3 border-b border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
                        Scheduler
                    </h1>

                    <div className="flex items-center gap-2">
                        <button 
                            disabled={smartSchedule.isPending}
                            onClick={() => {
                                smartSchedule.mutate(currentDate.toISOString());
                            }}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-[11px] font-black uppercase tracking-tight shadow-md transition-all active:scale-95 disabled:opacity-50"
                            )}
                        >
                            {smartSchedule.isPending ? 'Optimizing...' : 'Smart Schedule'}
                        </button>
                        <button 
                            onClick={refetchWorkOrders}
                            className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground active:scale-95 transition-all border border-white/5 bg-card"
                            title="Refresh List"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Week Day Picker Scroller */}
                <div className="flex items-center justify-between gap-1 pt-1">
                    <button 
                        onClick={() => setCurrentDate(addDays(currentDate, -1))}
                        className="p-1 hover:bg-white/5 rounded text-muted-foreground active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="flex-1 flex items-center justify-around gap-1 overflow-x-auto scrollbar-none">
                        {weekDays.map((day) => {
                            const isSelected = isSameDay(day, currentDate);
                            const isToday = isSameDay(day, new Date());
                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => setCurrentDate(day)}
                                    className={cn(
                                        "flex flex-col items-center justify-center w-10 py-1.5 rounded-xl transition-all",
                                        isSelected 
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 font-bold" 
                                            : "hover:bg-white/5 text-muted-foreground"
                                    )}
                                >
                                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                                        {format(day, 'E')[0]}
                                    </span>
                                    <span className={cn(
                                        "text-[14px] font-black leading-none mt-1.5",
                                        isToday && !isSelected && "text-primary border-b border-primary"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        onClick={() => setCurrentDate(addDays(currentDate, 1))}
                        className="p-1 hover:bg-white/5 rounded text-muted-foreground active:scale-95"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Selected Date Header */}
                <div className="flex justify-between items-center px-1">
                    <span className="text-[12px] font-extrabold text-muted-foreground">
                        {format(currentDate, 'EEEE, MMM d, yyyy')}
                    </span>
                    <button 
                        onClick={() => setCurrentDate(new Date())}
                        className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
                    >
                        Go to Today
                    </button>
                </div>

                {/* Tabs Indicator */}
                <div className="flex items-center gap-1.5 border-t border-white/5 pt-2">
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-black uppercase tracking-tight rounded-xl transition-all",
                            activeTab === 'timeline' 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Timeline ({scheduledWOs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('backlog')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-black uppercase tracking-tight rounded-xl transition-all",
                            activeTab === 'backlog' 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        Backlog ({unscheduledWOs.length})
                    </button>
                </div>
            </div>

            {/* List Containers */}
            <div className="px-4 py-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Hydrating Scheduler...</span>
                    </div>
                ) : activeTab === 'timeline' ? (
                    /* Timeline tab - scheduled per technician */
                    <div className="space-y-6">
                        {users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 border-2 border-dashed border-border rounded-3xl bg-muted/5">
                                <AlertCircle className="w-8 h-8 text-muted-foreground opacity-30" />
                                <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">No technicians found</span>
                                <p className="text-[11px] text-muted-foreground text-center px-4 max-w-[280px]">
                                    Verify your team configuration in Settings or check your account permissions.
                                </p>
                            </div>
                        ) : (
                            users.filter(u => {
                                // Filter out technicians that don't have tasks assigned to them today unless they have tasks
                                const hasTasks = (scheduledByTechnician[u.userOrgId || u.id] || []).length > 0;
                                return hasTasks || true; // Show all to allow scheduling
                            }).map(user => {
                                const techId = user.userOrgId || user.id;
                                const tasks = scheduledByTechnician[techId] || [];

                            return (
                                <div key={techId} className="space-y-2.5">
                                    {/* Technician Row Header */}
                                    <div className="flex items-center gap-2.5 px-1">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                            {(user.name || '?')[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-black text-foreground">{user.name}</h4>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none mt-0.5">
                                                {tasks.length} {tasks.length === 1 ? 'Job' : 'Jobs'} Assigned
                                            </p>
                                        </div>
                                    </div>

                                    {/* Technician Tasks cards */}
                                    <div className="space-y-3 pl-2 border-l border-white/5 ml-3.5">
                                        {tasks.length > 0 ? (
                                            tasks.map(wo => (
                                                <div
                                                    key={wo.id}
                                                    onClick={() => setSelectedManageWo(wo)}
                                                    className="bg-card rounded-2xl border border-border p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all active:scale-[0.98] flex flex-col gap-2 cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-bold text-muted-foreground font-mono">
                                                                #{wo.woNumber || wo.id.substring(0, 8).toUpperCase()}
                                                            </span>
                                                            <h5 className="text-[14px] font-black text-foreground truncate mt-0.5">
                                                                {wo.title}
                                                            </h5>
                                                        </div>
                                                        <PriorityBadge priority={wo.priority || 'MEDIUM'} />
                                                    </div>

                                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 border-t border-white/5 pt-2">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 opacity-70" />
                                                            {wo.startDate ? format(new Date(wo.startDate), 'h:mm a') : 'Not Set'}
                                                        </span>
                                                        <span className="truncate max-w-[150px]">{wo.assetName || 'Global'}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-4 px-4 border border-dashed border-border rounded-2xl flex items-center gap-2 text-muted-foreground bg-muted/10">
                                                <AlertCircle className="w-4 h-4 opacity-40" />
                                                <span className="text-[11px] font-bold">No tasks scheduled for today.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                            })
                        )}
                    </div>
                ) : (
                    /* Backlog tab - unscheduled tasks list */
                    <div className="space-y-4">
                        {/* Search Bar inside backlog */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search backlog..."
                                className="w-full h-10 pl-10 pr-4 bg-muted border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:bg-background focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
                            />
                        </div>

                        {/* Combined Filter & Sort Action Bar */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleOpenFilters}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-[11px] font-black uppercase tracking-tight active:scale-95 transition-all whitespace-nowrap",
                                    activeFilterCount > 0 || woSortField !== 'Priority'
                                        ? "bg-primary/10 border-primary/30 text-primary"
                                        : "bg-muted border-border text-foreground"
                                )}
                            >
                                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                                Filter & Sort {(activeFilterCount > 0 || woSortField !== 'Priority') && `(${activeFilterCount + (woSortField !== 'Priority' ? 1 : 0)})`}
                            </button>

                            {(activeFilterCount > 0 || woSortField !== 'Priority') && (
                                <button
                                    onClick={() => {
                                        setWoSortField('Priority');
                                        setWoPriorityFilter('');
                                        setWoAssigneeFilter('');
                                        setWoCategoryFilter('');
                                        setWoAssetFilter('');
                                        setWoLocationFilter('');
                                        setWoStatusFilter('');
                                        setWoDueDateFilter('');
                                        setWoTeamFilter('');
                                    }}
                                    className="text-[10px] font-black uppercase tracking-wider text-rose-500 hover:underline active:scale-95 shrink-0 ml-2"
                                >
                                    Reset
                                </button>
                            )}
                        </div>

                        {filteredBacklog.length > 0 ? (
                            <div className="space-y-3">
                                {filteredBacklog.map(wo => (
                                    <div
                                        key={wo.id}
                                        onClick={() => setSelectedWo(wo)}
                                        className="bg-card rounded-2xl border border-border p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all active:scale-[0.98] flex flex-col gap-2 cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <span className="text-[10px] font-bold text-muted-foreground font-mono">
                                                    #{wo.woNumber || wo.id.substring(0, 8).toUpperCase()}
                                                </span>
                                                <h5 className="text-[14px] font-black text-foreground truncate mt-0.5">
                                                    {wo.title}
                                                </h5>
                                            </div>
                                            <PriorityBadge priority={wo.priority || 'MEDIUM'} />
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 border-t border-white/5 pt-2">
                                            <span className="truncate max-w-[150px]">{wo.assetName || 'Global'}</span>
                                            <button 
                                                className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-wider animate-in fade-in"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedAssignWo(wo);
                                                }}
                                            >
                                                <UserPlus className="w-3 h-3" />
                                                Assign
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 border-2 border-dashed border-border rounded-3xl bg-muted/5">
                                <AlertCircle className="w-8 h-8 text-muted-foreground opacity-30" />
                                <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest text-center px-4">No matching backlog items</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* High-Fidelity Desktop-Style Filter & Sort Drawer Modal */}
            <AnimatePresence>
                {isFilterDrawerOpen && (
                    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0">
                        {/* Backdrop overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterDrawerOpen(false)}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                        />

                        {/* Drawer content */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            className="relative w-full h-[85vh] bg-card rounded-t-[32px] border-t border-border flex flex-col overflow-hidden shadow-2xl z-10 text-foreground"
                        >
                            {/* Drawer Header */}
                            <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between shrink-0">
                                <h3 className="text-[15px] font-black text-foreground uppercase tracking-widest">Filter & Sort</h3>
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="px-4 py-1.5 bg-white border border-slate-200 text-blue-600 rounded-xl text-[12px] font-black hover:bg-slate-50 transition-all active:scale-95 shadow-sm dark:bg-muted dark:border-white/5 dark:text-blue-400"
                                    >
                                        Reset
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleApplyFilters}
                                        className="px-6 py-1.5 bg-primary text-white rounded-xl text-[13px] font-black shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Body - Split into Sort Left, Filters Right */}
                            <div className="flex flex-1 overflow-hidden">
                                {/* Sort Column (Left 38%) */}
                                <div className="w-[38%] bg-muted/40 p-4 border-r border-border flex flex-col space-y-2 overflow-y-auto">
                                    <h4 className="text-[12px] font-black text-muted-foreground uppercase tracking-widest mb-2 pl-1">Sort</h4>
                                    
                                    {[
                                        { id: 'Priority', label: 'Priority' },
                                        { id: 'Due Date', label: 'Due Date' },
                                        { id: 'Duration', label: 'Duration' },
                                        { id: 'Work Order Number', label: 'Work Order Number' }
                                    ].map((opt) => {
                                        const isSelected = localWoSortField === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setLocalWoSortField(opt.id)}
                                                className={cn(
                                                    "w-full px-3 py-3 rounded-xl text-[12px] font-bold text-left transition-all flex items-center justify-between",
                                                    isSelected
                                                        ? "bg-blue-50/50 text-blue-600 border border-blue-100/40 shadow-sm dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400"
                                                        : "text-muted-foreground hover:bg-muted/60"
                                                )}
                                            >
                                                <span>{opt.label}</span>
                                                <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground/60 transition-transform", isSelected && "rotate-180 text-blue-600 dark:text-blue-400")} />
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Filters Column (Right 62%) */}
                                <div className="w-[62%] p-4 overflow-y-auto space-y-4 pb-36">
                                    <h4 className="text-[12px] font-black text-muted-foreground uppercase tracking-widest mb-2">Filters</h4>

                                    {/* 1. Priority */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">Priority</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => {
                                                const isSelected = localWoPriorityFilter === p;
                                                return (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setLocalWoPriorityFilter(isSelected ? '' : p)}
                                                        className={cn(
                                                            "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all",
                                                            isSelected 
                                                                ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
                                                                : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                                                        )}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 2. Assigned To */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">Assigned To</label>
                                        <select 
                                            value={localWoAssigneeFilter}
                                            onChange={(e) => setLocalWoAssigneeFilter(e.target.value)}
                                            className="w-full h-10 px-3 bg-muted border border-border rounded-xl text-[12px] font-bold text-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
                                        >
                                            <option value="">Select Assigned To</option>
                                            {users.map(u => <option key={u.userOrgId || u.id} value={u.userOrgId || u.id}>{u.name}</option>)}
                                        </select>
                                    </div>

                                    {/* 3. Category */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">Category</label>
                                        <select 
                                            value={localWoCategoryFilter}
                                            onChange={(e) => setLocalWoCategoryFilter(e.target.value)}
                                            className="w-full h-10 px-3 bg-muted border border-border rounded-xl text-[12px] font-bold text-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    {/* 4. Asset */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">Asset</label>
                                        <select 
                                            value={localWoAssetFilter}
                                            onChange={(e) => setLocalWoAssetFilter(e.target.value)}
                                            className="w-full h-10 px-3 bg-muted border border-border rounded-xl text-[12px] font-bold text-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
                                        >
                                            <option value="">Select Asset</option>
                                            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>

                                    {/* 5. Location */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">Location</label>
                                        <select 
                                            value={localWoLocationFilter}
                                            onChange={(e) => setLocalWoLocationFilter(e.target.value)}
                                            className="w-full h-10 px-3 bg-muted border border-border rounded-xl text-[12px] font-bold text-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
                                        >
                                            <option value="">Select Location</option>
                                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>

                                    {/* 6. Status */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">Work Order Status</label>
                                        <select 
                                            value={localWoStatusFilter}
                                            onChange={(e) => setLocalWoStatusFilter(e.target.value)}
                                            className="w-full h-10 px-3 bg-muted border border-border rounded-xl text-[12px] font-bold text-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
                                        >
                                            <option value="">Select Work Order Status</option>
                                            {['Open', 'In Progress', 'On Hold', 'Complete', 'Pending Approval'].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 7. Due Date */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">Due Date</label>
                                        <select 
                                            value={localWoDueDateFilter}
                                            onChange={(e) => setLocalWoDueDateFilter(e.target.value)}
                                            className="w-full h-10 px-3 bg-muted border border-border rounded-xl text-[12px] font-bold text-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
                                        >
                                            <option value="">Select Due Date</option>
                                            {['Today', 'This Week', 'This Month', 'Overdue', 'Not Set'].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 8. Team */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">Team</label>
                                        <select 
                                            value={localWoTeamFilter}
                                            onChange={(e) => setLocalWoTeamFilter(e.target.value)}
                                            className="w-full h-10 px-3 bg-muted border border-border rounded-xl text-[12px] font-bold text-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
                                        >
                                            <option value="">Select Team</option>
                                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal 1: Assign Backlog Work Order Action Drawer */}
            <AnimatePresence>
                {selectedAssignWo && (
                    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0">
                        {/* Backdrop overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAssignWo(null)}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                        />

                        {/* Modal sheet */}
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="relative w-full bg-card rounded-t-[32px] shadow-2xl p-6 border-t border-white/10 z-10 space-y-4 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">Schedule Work Order</span>
                                <h3 className="text-[16px] font-black text-foreground leading-tight">
                                    {selectedAssignWo.title}
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground font-mono">
                                    WO #{selectedAssignWo.woNumber || selectedAssignWo.id.substring(0,8).toUpperCase()}
                                </p>
                            </div>

                            <form onSubmit={handleAssignWo} className="space-y-4">
                                {/* Tech selection */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Assign Technician</label>
                                    <select
                                        required
                                        value={assigneeId}
                                        onChange={(e) => setAssigneeId(e.target.value)}
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-[14px] font-bold text-foreground outline-none focus:border-primary/40 cursor-pointer"
                                    >
                                        <option value="">— Select Technician —</option>
                                        {users.map(u => (
                                            <option key={u.userOrgId || u.id} value={u.userOrgId || u.id}>
                                                {u.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Scheduled hour */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Start Time ({format(currentDate, 'MMM d')})</label>
                                    <input
                                        type="time"
                                        required
                                        value={assignHour}
                                        onChange={(e) => setAssignHour(e.target.value)}
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-[14px] font-bold text-foreground outline-none focus:border-primary/40"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedAssignWo(null)}
                                        className="flex-1 py-3 bg-muted hover:bg-muted/80 rounded-xl text-[12px] font-black uppercase tracking-wider text-muted-foreground transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-[12px] font-black uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95"
                                    >
                                        Confirm Schedule
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal 2: Manage Scheduled Work Order Action Drawer */}
            <AnimatePresence>
                {selectedManageWo && (
                    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0">
                        {/* Backdrop overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedManageWo(null)}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
                        />

                        {/* Modal sheet */}
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="relative w-full bg-card rounded-t-[32px] shadow-2xl p-6 border-t border-white/10 z-10 space-y-4"
                        >
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">Manage Assignment</span>
                                <h3 className="text-[16px] font-black text-foreground leading-tight">
                                    {selectedManageWo.title}
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground font-mono">
                                    WO #{selectedManageWo.woNumber || selectedManageWo.id.substring(0,8).toUpperCase()}
                                </p>
                            </div>

                            {/* Options Buttons */}
                            <div className="grid grid-cols-1 gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setSelectedWo(selectedManageWo);
                                        setSelectedManageWo(null);
                                    }}
                                    className="w-full py-3.5 px-4 bg-muted hover:bg-muted/80 rounded-xl flex items-center gap-3 text-[13px] font-black uppercase tracking-wider transition-all"
                                >
                                    <Eye className="w-5 h-5 text-blue-500" />
                                    View Full Details
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setEditingWo(selectedManageWo);
                                        setSelectedManageWo(null);
                                    }}
                                    className="w-full py-3.5 px-4 bg-muted hover:bg-muted/80 rounded-xl flex items-center gap-3 text-[13px] font-black uppercase tracking-wider transition-all"
                                >
                                    <Edit3 className="w-5 h-5 text-amber-500" />
                                    Edit Fields
                                </button>

                                <button
                                    onClick={() => handleReassign(selectedManageWo)}
                                    className="w-full py-3.5 px-4 bg-muted hover:bg-muted/80 rounded-xl flex items-center gap-3 text-[13px] font-black uppercase tracking-wider transition-all"
                                >
                                    <UserPlus className="w-5 h-5 text-primary" />
                                    Reassign / Reschedule
                                </button>

                                <button
                                    onClick={() => handleUnschedule(selectedManageWo.id)}
                                    className="w-full py-3.5 px-4 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl flex items-center gap-3 text-[13px] font-black uppercase tracking-wider text-rose-500 transition-all"
                                >
                                    <Trash2 className="w-5 h-5 text-rose-500" />
                                    Unschedule / Backlog
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedManageWo(null)}
                                className="w-full py-3.5 mt-2 bg-muted hover:bg-muted/80 rounded-xl text-[12px] font-black uppercase tracking-wider text-muted-foreground transition-all"
                            >
                                Close Menu
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
