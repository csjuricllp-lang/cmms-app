import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Calendar, Clock, Loader2, AlertCircle, Plus, MapPin, Box,
    SlidersHorizontal, X, Check, Activity, TrendingUp, Trash2, MoreVertical,
    ChevronDown, Flag, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { PriorityBadge } from '../components/PriorityBadge';

interface MobilePreventiveMaintenanceProps {
    schedules: any[];
    filteredSchedules: any[];
    isLoading: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    setIsCreateModalOpen: (open: boolean) => void;
    setEditingSchedule: (schedule: any) => void;
    // Filter props
    locations: any[];
    users: any[];
    selectedPriorities: string[];
    setSelectedPriorities: (v: string[]) => void;
    selectedLocationIds: string[];
    setSelectedLocationIds: (v: string[]) => void;
    selectedAssigneeIds: string[];
    setSelectedAssigneeIds: (v: string[]) => void;
    selectedAssetIds: string[];
    setSelectedAssetIds: (v: string[]) => void;
    selectedCategoryIds: string[];
    setSelectedCategoryIds: (v: string[]) => void;
    selectedTeamIds: string[];
    setSelectedTeamIds: (v: string[]) => void;
    assets: any[];
    teams: any[];
    categories: any[];
    sortBy: string;
    setSortBy: (v: string) => void;
    // Bulk delete
    deletePM: any;
}

const SORT_OPTIONS = ['Date Created', 'Name', 'Work Order Title', 'Priority'];
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW', 'NONE'];

export const MobilePreventiveMaintenance: React.FC<MobilePreventiveMaintenanceProps> = ({
    schedules,
    filteredSchedules,
    isLoading,
    searchQuery,
    setSearchQuery,
    setIsCreateModalOpen,
    setEditingSchedule,
    locations,
    users,
    selectedPriorities,
    setSelectedPriorities,
    selectedLocationIds,
    setSelectedLocationIds,
    selectedAssigneeIds,
    setSelectedAssigneeIds,
    selectedAssetIds,
    setSelectedAssetIds,
    selectedCategoryIds,
    setSelectedCategoryIds,
    selectedTeamIds,
    setSelectedTeamIds,
    assets,
    teams,
    categories,
    sortBy,
    setSortBy,
    deletePM,
}) => {
    const navigate = useNavigate();
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Staged filter state (apply on confirm)
    const [stagedPriorities, setStagedPriorities] = useState<string[]>(selectedPriorities);
    const [stagedLocationIds, setStagedLocationIds] = useState<string[]>(selectedLocationIds);
    const [stagedAssigneeIds, setStagedAssigneeIds] = useState<string[]>(selectedAssigneeIds);
    const [stagedAssetIds, setStagedAssetIds] = useState<string[]>(selectedAssetIds);
    const [stagedCategoryIds, setStagedCategoryIds] = useState<string[]>(selectedCategoryIds);
    const [stagedTeamIds, setStagedTeamIds] = useState<string[]>(selectedTeamIds);

    const activeSchedules = useMemo(() => (schedules || []).filter((s: any) => s.status === 'ACTIVE'), [schedules]);

    const statsData = useMemo(() => {
        const nextTriggerDates = activeSchedules
            .map((s: any) => s.nextDueDate ? new Date(s.nextDueDate).getTime() : 0)
            .filter((d: number) => d > 0)
            .sort((a: number, b: number) => a - b);
        let nearestTriggerStr = '--';
        let nearestTriggerCount = 0;
        if (nextTriggerDates.length > 0) {
            const nearestTime = nextTriggerDates[0];
            nearestTriggerStr = new Date(nearestTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            nearestTriggerCount = activeSchedules.filter((s: any) => {
                if (!s.nextDueDate) return false;
                return new Date(s.nextDueDate).toLocaleDateString('en-US') === new Date(nearestTime).toLocaleDateString('en-US');
            }).length;
        }
        let totalDays = 0;
        let frequencyCount = 0;
        activeSchedules.forEach((s: any) => {
            if (!s.frequencyValue || !s.frequencyType) return;
            const val = s.frequencyValue;
            const type = s.frequencyType.toUpperCase();
            frequencyCount++;
            if (type === 'DAYS') totalDays += val;
            else if (type === 'WEEKS') totalDays += val * 7;
            else if (type === 'MONTHS') totalDays += val * 30;
            else if (type === 'YEARS') totalDays += val * 365;
        });
        let avgFreqStr = '--';
        if (frequencyCount > 0) {
            const avgDays = totalDays / frequencyCount;
            if (avgDays < 7) avgFreqStr = `~${Math.round(avgDays)}d`;
            else if (avgDays < 30) avgFreqStr = `~${Math.round(avgDays / 7)}wk`;
            else if (avgDays < 365) avgFreqStr = `~${Math.round(avgDays / 30)}mo`;
            else avgFreqStr = `~${Math.round(avgDays / 365)}yr`;
        }
        return { nearestTriggerStr, nearestTriggerCount, avgFreqStr };
    }, [activeSchedules]);

    const totalActiveFilters = selectedPriorities.length + selectedLocationIds.length + selectedAssigneeIds.length + selectedAssetIds.length + selectedCategoryIds.length + selectedTeamIds.length;

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
            case 'PAUSED': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
            case 'DRAFT': return 'bg-slate-500/10 border-slate-500/20 text-slate-500';
            default: return 'bg-muted border-border text-muted-foreground';
        }
    };

    const openFilterDrawer = () => {
        setStagedPriorities(selectedPriorities);
        setStagedLocationIds(selectedLocationIds);
        setStagedAssigneeIds(selectedAssigneeIds);
        setStagedAssetIds(selectedAssetIds);
        setStagedCategoryIds(selectedCategoryIds);
        setStagedTeamIds(selectedTeamIds);
        setIsFilterDrawerOpen(true);
    };

    const applyFilters = () => {
        setSelectedPriorities(stagedPriorities);
        setSelectedLocationIds(stagedLocationIds);
        setSelectedAssigneeIds(stagedAssigneeIds);
        setSelectedAssetIds(stagedAssetIds);
        setSelectedCategoryIds(stagedCategoryIds);
        setSelectedTeamIds(stagedTeamIds);
        setIsFilterDrawerOpen(false);
    };

    const clearFilters = () => {
        setSelectedPriorities([]);
        setSelectedLocationIds([]);
        setSelectedAssigneeIds([]);
        setSelectedAssetIds([]);
        setSelectedCategoryIds([]);
        setSelectedTeamIds([]);
        setSearchQuery('');
        setStagedPriorities([]);
        setStagedLocationIds([]);
        setStagedAssigneeIds([]);
        setStagedAssetIds([]);
        setStagedCategoryIds([]);
        setStagedTeamIds([]);
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
                {/* Title row */}
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="text-xl font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
                        PM Protocols
                    </h1>
                    <div className="flex items-center gap-2">
                        {/* Sort button */}
                        <div className="relative">
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-xl text-xs font-bold text-muted-foreground active:scale-95 transition-all"
                            >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                {sortBy.replace('Date Created', 'Date')}
                            </button>
                            <AnimatePresence>
                                {isSortOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[100]" onClick={() => setIsSortOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-1 w-48 bg-card border border-border rounded-2xl shadow-2xl z-[110] py-1.5 overflow-hidden"
                                        >
                                            {SORT_OPTIONS.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => { setSortBy(opt); setIsSortOpen(false); }}
                                                    className={cn("w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-bold transition-colors text-left", sortBy === opt ? "text-primary bg-primary/5" : "text-foreground hover:bg-muted")}
                                                >
                                                    {opt}
                                                    {sortBy === opt && <Check className="w-3.5 h-3.5 text-primary" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                        {/* Filter button */}
                        <button
                            onClick={openFilterDrawer}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all active:scale-95",
                                totalActiveFilters > 0
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-muted border-border text-muted-foreground"
                            )}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Filters
                            {totalActiveFilters > 0 && (
                                <span className="ml-0.5 min-w-[16px] h-4 flex items-center justify-center bg-primary text-white text-[9px] font-black rounded-full px-1">
                                    {totalActiveFilters}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search PM schedules, assets..."
                            className="w-full h-10 pl-10 pr-9 bg-muted border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:bg-background focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="px-4 pb-3 grid grid-cols-4 gap-2">
                    {[
                        { label: 'Total', value: schedules?.length || 0, color: 'text-indigo-500', icon: <Calendar className="w-3.5 h-3.5" /> },
                        { label: 'Active', value: activeSchedules.length, color: 'text-emerald-500', icon: <Activity className="w-3.5 h-3.5" /> },
                        { label: 'Next Due', value: statsData.nearestTriggerStr, color: 'text-blue-500', icon: <Clock className="w-3.5 h-3.5" /> },
                        { label: 'Avg Freq', value: statsData.avgFreqStr, color: 'text-amber-500', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                    ].map(stat => (
                        <div key={stat.label} className="bg-card border border-border rounded-xl p-2 flex flex-col gap-0.5">
                            <div className={cn("w-5 h-5 rounded-md flex items-center justify-center", stat.color, "bg-current/10")}>
                                <span className={stat.color}>{stat.icon}</span>
                            </div>
                            <div className={cn("text-[13px] font-black leading-none", stat.color)}>{stat.value}</div>
                            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Result count + active filter chips */}
                <div className="px-4 pb-2 flex items-center justify-between">
                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                        <span className="text-foreground">{filteredSchedules.length}</span> Results
                    </span>
                    {(totalActiveFilters > 0 || searchQuery) && (
                        <button onClick={clearFilters} className="text-[11px] font-black text-primary underline underline-offset-2">
                            Reset All
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="px-4 py-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Loading PMs...</span>
                    </div>
                ) : filteredSchedules.length > 0 ? (
                    <div className="space-y-3">
                        {filteredSchedules.map((schedule: any) => (
                            <motion.div
                                key={schedule.id}
                                layoutId={schedule.id}
                                className="bg-card rounded-2xl border border-border shadow-sm flex flex-col gap-0 overflow-visible relative"
                            >
                                {/* Card clickable area */}
                                <div
                                    onClick={() => navigate(`/pm/${schedule.id}`)}
                                    className="p-4 flex flex-col gap-3 cursor-pointer active:opacity-80 transition-opacity"
                                >
                                    {/* Title and Status */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="text-[15px] font-black leading-tight text-foreground truncate">
                                                {schedule.name}
                                            </h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5 tracking-tight">
                                                ID: {schedule.id.substring(0, 8).toUpperCase()}
                                            </p>
                                        </div>
                                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0", getStatusStyle(schedule.status))}>
                                            {schedule.status || 'ACTIVE'}
                                        </span>
                                    </div>

                                    {/* Frequency / Asset / Due date */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                            <span className="text-[12px] font-bold text-foreground">
                                                Every {schedule.frequencyValue} {schedule.frequencyType?.toLowerCase()}
                                            </span>
                                            {schedule.isFloating && (
                                                <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 rounded">Floating</span>
                                            )}
                                        </div>
                                        {schedule.woTitle && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Box className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                                <span className="text-[11px] font-bold truncate text-foreground/80">{schedule.woTitle}</span>
                                            </div>
                                        )}
                                        {schedule.asset?.name && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                                                <Box className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                                <span className="text-[11px] font-bold truncate">{schedule.asset.name}</span>
                                                {schedule.asset?.location?.name && (
                                                    <>
                                                        <span className="text-muted-foreground/30">•</span>
                                                        <MapPin className="w-3 h-3 shrink-0 opacity-70" />
                                                        <span className="text-[11px] font-medium truncate">{schedule.asset.location.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        {schedule.nextDueDate && (
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 shrink-0 opacity-70 text-muted-foreground" />
                                                <span className="text-[11px] font-bold text-muted-foreground">
                                                    Next Due: <span className="text-foreground">{format(new Date(schedule.nextDueDate), 'MMM d, yyyy')}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer row */}
                                    <div className="flex items-center justify-between border-t border-border/50 pt-2">
                                        <span className="text-[11px] font-bold text-muted-foreground/75">
                                            {schedule.category?.name || 'General Maintenance'}
                                        </span>
                                        {schedule.priority && <PriorityBadge priority={schedule.priority} />}
                                    </div>
                                </div>

                                {/* Three dot menu */}
                                <div className="absolute top-3 right-12">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === schedule.id ? null : schedule.id); }}
                                        className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    <AnimatePresence>
                                        {openMenuId === schedule.id && (
                                            <>
                                                <div className="fixed inset-0 z-[100]" onClick={() => setOpenMenuId(null)} />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                                    className="absolute top-full right-0 mt-1 w-44 bg-card border border-border rounded-2xl shadow-2xl z-[110] overflow-hidden py-1.5"
                                                >
                                                    <button
                                                        onClick={() => { setEditingSchedule(schedule); setIsCreateModalOpen(true); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-foreground hover:bg-muted transition-colors text-left"
                                                    >
                                                        Edit PM
                                                    </button>
                                                    <div className="h-px bg-border mx-2" />
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Delete this PM schedule?')) {
                                                                deletePM.mutate(schedule.id);
                                                            }
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-rose-500 hover:bg-rose-50 transition-colors text-left"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Delete
                                                    </button>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 border-2 border-dashed border-border rounded-3xl">
                        <AlertCircle className="w-8 h-8 text-muted-foreground opacity-30" />
                        <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">No matching schedules</span>
                        {(totalActiveFilters > 0 || searchQuery) && (
                            <button onClick={clearFilters} className="text-xs font-black text-primary underline">Clear Filters</button>
                        )}
                    </div>
                )}
            </div>

            {/* Floating Create Button */}
            <button
                onClick={() => { setEditingSchedule(null); setIsCreateModalOpen(true); }}
                className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all z-40"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Filter Bottom Drawer */}
            <AnimatePresence>
                {isFilterDrawerOpen && (
                    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full max-h-[85vh] bg-background border-t border-border rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl"
                        >
                            {/* Drawer Header */}
                            <div className="px-4 py-4 border-b border-border bg-card flex items-center justify-between shrink-0">
                                <h2 className="text-[17px] font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                                    Filter Registry
                                </h2>
                                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Filter Body */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0">
                                {/* Priority */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                        <Flag className="w-3.5 h-3.5" /> Priority
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PRIORITIES.map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setStagedPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2.5 rounded-xl border text-[12px] font-bold transition-all",
                                                    stagedPriorities.includes(p)
                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                        : "bg-card border-border text-foreground"
                                                )}
                                            >
                                                {p}
                                                {stagedPriorities.includes(p) && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" /> Location
                                    </label>
                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                        {locations.map((l: any) => (
                                            <button
                                                key={l.id}
                                                onClick={() => setStagedLocationIds(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id])}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-[12px] font-bold transition-all text-left",
                                                    stagedLocationIds.includes(l.id)
                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                        : "bg-card border-border text-foreground"
                                                )}
                                            >
                                                {l.name}
                                                {stagedLocationIds.includes(l.id) && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                        {locations.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-4">No locations available</p>
                                        )}
                                    </div>
                                </div>                                 {/* Assigned To */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                        Assigned To
                                    </label>
                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                        {users.map((u: any) => (
                                            <button
                                                key={u.userOrgId || u.id}
                                                onClick={() => {
                                                    const uid = u.userOrgId || u.id;
                                                    setStagedAssigneeIds(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[12px] font-bold transition-all text-left",
                                                    stagedAssigneeIds.includes(u.userOrgId || u.id)
                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                        : "bg-card border-border text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground shrink-0">
                                                        {(u.name || '?')[0].toUpperCase()}
                                                    </div>
                                                    <span>{u.name || 'Unknown User'}</span>
                                                </div>
                                                {stagedAssigneeIds.includes(u.userOrgId || u.id) && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                        {users.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-4">No users available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Asset */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                        Asset
                                    </label>
                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                        {assets.map((a: any) => (
                                            <button
                                                key={a.id}
                                                onClick={() => setStagedAssetIds(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[12px] font-bold transition-all text-left",
                                                    stagedAssetIds.includes(a.id)
                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                        : "bg-card border-border text-foreground"
                                                )}
                                            >
                                                <span className="truncate">{a.name}</span>
                                                {stagedAssetIds.includes(a.id) && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                        {assets.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-4">No assets available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                        Category
                                    </label>
                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                        {categories.map((c: any) => (
                                            <button
                                                key={c.id}
                                                onClick={() => setStagedCategoryIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[12px] font-bold transition-all text-left",
                                                    stagedCategoryIds.includes(c.id)
                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                        : "bg-card border-border text-foreground"
                                                )}
                                            >
                                                <span className="truncate">{c.name}</span>
                                                {stagedCategoryIds.includes(c.id) && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                        {categories.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-4">No categories available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Team */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                        Team
                                    </label>
                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                        {teams.map((t: any) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setStagedTeamIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[12px] font-bold transition-all text-left",
                                                    stagedTeamIds.includes(t.id)
                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                        : "bg-card border-border text-foreground"
                                                )}
                                            >
                                                <span className="truncate">{t.name}</span>
                                                {stagedTeamIds.includes(t.id) && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                        {teams.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-4">No teams available</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border bg-card flex gap-2 shrink-0">
                                <button
                                    onClick={() => {
                                        setStagedPriorities([]);
                                        setStagedLocationIds([]);
                                        setStagedAssigneeIds([]);
                                        setStagedAssetIds([]);
                                        setStagedCategoryIds([]);
                                        setStagedTeamIds([]);
                                    }}
                                    className="flex-1 py-3 bg-muted border border-border text-foreground text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={applyFilters}
                                    className="flex-1 py-3 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-primary/20 transition-all"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
