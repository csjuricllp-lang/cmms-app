import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Filter, PanelTop, Zap, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DraggableCard } from './DraggableCard';
import { type WorkOrderSync } from '../../lib/db';
import { type User } from '../../hooks/useUsers';
import { getPriorityColors } from '../PriorityBadge';
import { type TagConfig } from './ConfigureTagsModal';

interface UnscheduledSectionProps {
    unscheduledWOs: WorkOrderSync[];
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    
    // Sort & Filters
    woSortField: string;
    setWoSortField: (s: string) => void;
    woPriorityFilter: string;
    setWoPriorityFilter: (s: string) => void;
    woAssigneeFilter: string;
    setWoAssigneeFilter: (s: string) => void;
    woCategoryFilter: string;
    setWoCategoryFilter: (s: string) => void;
    woAssetFilter: string;
    setWoAssetFilter: (s: string) => void;
    woLocationFilter: string;
    setWoLocationFilter: (s: string) => void;
    woStatusFilter: string;
    setWoStatusFilter: (s: string) => void;
    woDueDateFilter: string;
    setWoDueDateFilter: (s: string) => void;
    woTeamFilter: string;
    setWoTeamFilter: (s: string) => void;
    
    assets: any[];
    categories: string[];
    locations: any[];
    teams: any[];
    users: User[];

    tagConfig: TagConfig[];
    onOpenTagsModal: () => void;
    isHidden: boolean;
    setIsHidden: (hidden: boolean) => void;
    onRefetch: () => void;
    onSelectWo: (wo: WorkOrderSync) => void;
    onEditWo: (wo: WorkOrderSync) => void;
}

const CARDS_PER_ROW = 4;

export const UnscheduledSection = ({
    unscheduledWOs,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    showFilters,
    setShowFilters,
    woSortField,
    setWoSortField,
    woPriorityFilter,
    setWoPriorityFilter,
    woAssigneeFilter,
    setWoAssigneeFilter,
    woCategoryFilter,
    setWoCategoryFilter,
    woAssetFilter,
    setWoAssetFilter,
    woLocationFilter,
    setWoLocationFilter,
    woStatusFilter,
    setWoStatusFilter,
    woDueDateFilter,
    setWoDueDateFilter,
    woTeamFilter,
    setWoTeamFilter,
    assets,
    categories,
    locations,
    teams,
    users,
    tagConfig,
    onOpenTagsModal,
    isHidden,
    setIsHidden,
    onRefetch,
    onSelectWo,
    onEditWo
}: UnscheduledSectionProps) => {
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        }
        if (showFilters) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showFilters, setShowFilters]);

    // Local UI states for the Work Order Filters & Sort
    const [localWoSortField, setLocalWoSortField] = useState<string>(woSortField);
    const [localWoPriorityFilter, setLocalWoPriorityFilter] = useState<string>(woPriorityFilter);
    const [localWoAssigneeFilter, setLocalWoAssigneeFilter] = useState<string>(woAssigneeFilter);
    const [localWoCategoryFilter, setLocalWoCategoryFilter] = useState<string>(woCategoryFilter);
    const [localWoAssetFilter, setLocalWoAssetFilter] = useState<string>(woAssetFilter);
    const [localWoLocationFilter, setLocalWoLocationFilter] = useState<string>(woLocationFilter);
    const [localWoStatusFilter, setLocalWoStatusFilter] = useState<string>(woStatusFilter);
    const [localWoDueDateFilter, setLocalWoDueDateFilter] = useState<string>(woDueDateFilter);
    const [localWoTeamFilter, setLocalWoTeamFilter] = useState<string>(woTeamFilter);

    useEffect(() => {
        if (showFilters) {
            setLocalWoSortField(woSortField);
            setLocalWoPriorityFilter(woPriorityFilter);
            setLocalWoAssigneeFilter(woAssigneeFilter);
            setLocalWoCategoryFilter(woCategoryFilter);
            setLocalWoAssetFilter(woAssetFilter);
            setLocalWoLocationFilter(woLocationFilter);
            setLocalWoStatusFilter(woStatusFilter);
            setLocalWoDueDateFilter(woDueDateFilter);
            setLocalWoTeamFilter(woTeamFilter);
        }
    }, [showFilters, woSortField, woPriorityFilter, woAssigneeFilter, woCategoryFilter, woAssetFilter, woLocationFilter, woStatusFilter, woDueDateFilter, woTeamFilter]);
    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-[18px] font-black text-[#1E293B]">Unscheduled Work Orders</h2>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[12px] font-black">{unscheduledWOs.length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={onRefetch} 
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-all active:scale-95 border-l border-slate-100"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    
                    <div ref={filterRef} className="flex bg-white border border-gray-100 rounded-xl p-1 shadow-sm items-center relative">
                        <button 
                            onClick={() => setShowFilters(!showFilters)} 
                            className={cn("p-2 rounded-lg text-gray-400 hover:text-primary transition-all active:scale-95", showFilters && "bg-primary/10 text-primary")}
                            title="Filter & Sort"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                        
                        {showFilters && (
                            <div className="absolute top-full right-0 mt-3 w-[640px] bg-white border border-slate-100 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-[100] overflow-hidden animate-in fade-in zoom-in slide-in-from-top-2 duration-300">
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                                    <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-widest">Filter & Sort</h3>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => {
                                                setLocalWoSortField('Priority');
                                                setLocalWoPriorityFilter('');
                                                setLocalWoAssigneeFilter('');
                                                setLocalWoCategoryFilter('');
                                                setLocalWoAssetFilter('');
                                                setLocalWoLocationFilter('');
                                                setLocalWoStatusFilter('');
                                                setLocalWoDueDateFilter('');
                                                setLocalWoTeamFilter('');
                                                
                                                setWoSortField('Priority');
                                                setWoPriorityFilter('');
                                                setWoAssigneeFilter('');
                                                setWoCategoryFilter('');
                                                setWoAssetFilter('');
                                                setWoLocationFilter('');
                                                setWoStatusFilter('');
                                                setWoDueDateFilter('');
                                                setWoTeamFilter('');
                                                setShowFilters(false);
                                            }}
                                            className="px-4 py-1.5 bg-white border border-slate-200 text-blue-600 rounded-xl text-[12px] font-black hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                        >
                                            Reset
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setWoSortField(localWoSortField);
                                                setWoPriorityFilter(localWoPriorityFilter);
                                                setWoAssigneeFilter(localWoAssigneeFilter);
                                                setWoCategoryFilter(localWoCategoryFilter);
                                                setWoAssetFilter(localWoAssetFilter);
                                                setWoLocationFilter(localWoLocationFilter);
                                                setWoStatusFilter(localWoStatusFilter);
                                                setWoDueDateFilter(localWoDueDateFilter);
                                                setWoTeamFilter(localWoTeamFilter);
                                                setShowFilters(false);
                                            }}
                                            className="px-6 py-1.5 bg-primary text-white rounded-xl text-[13px] font-black shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                                <div className="flex h-[380px]">
                                    {/* Sort Column */}
                                    <div className="w-[40%] p-6 border-r border-slate-100 bg-slate-50/30 flex flex-col">
                                        <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-4">Sort</h3>
                                        <div className="space-y-2 flex-1">
                                            {['Priority', 'Due Date', 'Duration', 'Work Order Number'].map((field) => {
                                                const isSelected = localWoSortField === field;
                                                return (
                                                    <button 
                                                        key={field}
                                                        onClick={() => setLocalWoSortField(field)}
                                                        className={cn(
                                                            "w-full px-4 py-3 rounded-xl text-[13px] font-bold text-left transition-all flex items-center justify-between group",
                                                            isSelected 
                                                                ? "bg-blue-50/50 text-blue-600 border border-blue-100/50 shadow-sm" 
                                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                                        )}
                                                    >
                                                        <span>{field}</span>
                                                        <ChevronDown className={cn("w-4 h-4 text-slate-300 transform transition-transform", isSelected && "rotate-180 text-blue-600")} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Filters Column */}
                                    <div className="w-[60%] p-6 flex flex-col h-full">
                                        <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-4">Filters</h3>
                                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                            {/* Priority Filter */}
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Priority</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Low', 'Medium', 'High', 'Critical'].map(p => {
                                                        const isSelected = localWoPriorityFilter === p;
                                                        return (
                                                            <button
                                                                key={p}
                                                                onClick={() => setLocalWoPriorityFilter(isSelected ? '' : p)}
                                                                className={cn(
                                                                    "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-all",
                                                                    isSelected 
                                                                        ? getPriorityColors(p) + " shadow-sm ring-2 ring-offset-1 ring-primary/20"
                                                                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                                                )}
                                                            >
                                                                {p}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Assigned To Filter */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned To</label>
                                                <select 
                                                    value={localWoAssigneeFilter}
                                                    onChange={(e) => setLocalWoAssigneeFilter(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-primary/20 outline-none transition-all"
                                                >
                                                    <option value="">Select Assigned To</option>
                                                    {users?.map(u => <option key={u.userOrgId} value={u.userOrgId}>{u.name}</option>)}
                                                </select>
                                            </div>

                                            {/* Category Filter */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                                <select 
                                                    value={localWoCategoryFilter}
                                                    onChange={(e) => setLocalWoCategoryFilter(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-primary/20 outline-none transition-all"
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories?.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>

                                            {/* Asset Filter */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset</label>
                                                <select 
                                                    value={localWoAssetFilter}
                                                    onChange={(e) => setLocalWoAssetFilter(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-primary/20 outline-none transition-all"
                                                >
                                                    <option value="">Select Asset</option>
                                                    {assets?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                            </div>

                                            {/* Location Filter */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                                                <select 
                                                    value={localWoLocationFilter}
                                                    onChange={(e) => setLocalWoLocationFilter(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-primary/20 outline-none transition-all"
                                                >
                                                    <option value="">Select Location</option>
                                                    {locations?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                </select>
                                            </div>

                                            {/* Work Order Status Filter */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Order Status</label>
                                                <select 
                                                    value={localWoStatusFilter}
                                                    onChange={(e) => setLocalWoStatusFilter(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-primary/20 outline-none transition-all"
                                                >
                                                    <option value="">Select Work Order Status</option>
                                                    {['Open', 'In Progress', 'On Hold', 'Complete', 'Pending Approval'].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            {/* Due Date Filter */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
                                                <select 
                                                    value={localWoDueDateFilter}
                                                    onChange={(e) => setLocalWoDueDateFilter(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-primary/20 outline-none transition-all"
                                                >
                                                    <option value="">Select Due Date</option>
                                                    {['Today', 'This Week', 'This Month', 'Overdue', 'Not Set'].map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>

                                            {/* Team Filter */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Team</label>
                                                <select 
                                                    value={localWoTeamFilter}
                                                    onChange={(e) => setLocalWoTeamFilter(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-700 focus:bg-white focus:border-primary/20 outline-none transition-all"
                                                >
                                                    <option value="">Select Team</option>
                                                    {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={onOpenTagsModal} 
                            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-all active:scale-95"
                            title="Configure Tags"
                        >
                            <PanelTop className="w-4 h-4" />
                        </button>
                         <button 
                            onClick={() => setIsHidden(!isHidden)}
                            className="px-3 py-1.5 hover:bg-gray-50 rounded-lg text-[13px] font-bold text-gray-600 flex items-center gap-2 border-l border-gray-50 ml-1 transition-all active:bg-gray-100"
                        >
                            <Zap className={cn("w-3.5 h-3.5", isHidden ? "text-primary fill-primary/20" : "text-gray-400")} />
                            {isHidden ? "Show Section" : "Hide Section"}
                        </button>
                    </div>

                    <div className="flex bg-white border border-gray-100 rounded-xl p-1 shadow-sm items-center relative">
                        <span className="px-4 py-1.5 text-[13px] font-black text-slate-600">
                            {unscheduledWOs.length} Unscheduled
                        </span>
                    </div>
                </div>
            </div>

            {!isHidden && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {unscheduledWOs.length === 0 ? (
                        <div className="col-span-4 py-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400 font-bold italic">
                            No unscheduled work orders found.
                        </div>
                    ) : (
                        unscheduledWOs.map((wo: WorkOrderSync) => (
                            <DraggableCard 
                                key={wo.id} 
                                wo={wo} 
                                onClick={() => onSelectWo(wo)} 
                                onEdit={() => onEditWo(wo)}
                                tagConfig={tagConfig}
                            />
                        ))
                    )}
                </div>
            )}
            
            {hasNextPage && !isHidden && (
                <div className="mt-6 flex justify-center">
                    <button 
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-500 font-bold text-[14px] rounded-xl hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isFetchingNextPage ? 'Loading more...' : 'Load More Unscheduled'}
                    </button>
                </div>
            )}
        </section>
    );
};
