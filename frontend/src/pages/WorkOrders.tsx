import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import {
    Search,
    Plus,
    ChevronDown,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Columns,
    RefreshCcw,
    Calendar,
    Check,
    X as XIcon,
    Trash2,
    Share2,
    List,
    LayoutGrid,
    Users,
    MapPin,
    MoreVertical,
    Box,
    Link2,
    ChevronLeft,
    ChevronRight,
    Workflow,
    Download,
    Upload,
    TrendingUp,
    Star,
    MoreHorizontal,
    Clock,
    Timer,
    UserCircle,
    SlidersHorizontal,
    Flag,
    Activity,
    CalendarClock
} from 'lucide-react';
import { 
    DndContext, 
    useDraggable, 
    useDroppable, 
    PointerSensor, 
    useSensor, 
    useSensors,
    closestCorners,
    type DragEndEvent
} from '@dnd-kit/core';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useUserRole } from '../hooks/useUserRole';
import { api } from '../lib/api';
import { useUsers, useLocations, useSavedViews, useAssets } from '../hooks/useData';
import * as XLSX from 'xlsx';
import { type WorkOrderSync } from '../lib/db';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '../store/useThemeStore';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';
import { AdvancedFiltersModal } from '../components/AdvancedFiltersModal';
import { WorkOrderDetailModal } from '../components/WorkOrderDetailModal';
import AddTimeModal from '../components/AddTimeModal';
import { EmptyState } from '../components/EmptyState';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileWorkOrders } from './MobileWorkOrders';

// --- TYPES ---
interface FilterDropdownProps {
    label: string;
    icon: React.ElementType;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    badgeValue?: number;
    color?: string;
    onApply?: () => void;
    onCancel?: () => void;
    onClear?: () => void;
}

// --- HELPER COMPONENTS ---

const FilterDropdown = ({ label, icon: Icon, isOpen, onToggle, children, badgeValue, color = "primary", onApply, onCancel, onClear }: FilterDropdownProps) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            let left = rect.left;
            const dropdownWidth = 256; // w-64 is 256px
            if (left + dropdownWidth > window.innerWidth) {
                left = window.innerWidth - dropdownWidth - 16;
            }
            if (left < 16) {
                left = 16;
            }
            setCoords({
                top: rect.bottom,
                left: left
            });
        }
    }, [isOpen]);

    return (
        <div className="relative pointer-events-auto">
            <button
                ref={buttonRef}
                onClick={onToggle}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-black transition-all border shrink-0",
                    badgeValue && badgeValue > 0 
                        ? `bg-${color}/10 border-${color}/20 text-${color} hover:bg-${color}/20` 
                        : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}
            >
                <Icon className="w-4 h-4 opacity-50" />
                <span className="whitespace-nowrap">{label}{badgeValue && badgeValue > 0 ? ` (${badgeValue})` : ''}</span>
                <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-[110]" onClick={onToggle} />
                    <div 
                        className="fixed w-64 popover-solid rounded-2xl z-[120] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{
                            top: `${coords.top + 8}px`,
                            left: `${coords.left}px`,
                        }}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-white">
                            <span className="text-[15px] font-black text-slate-900">{label}</span>
                            <button onClick={onToggle} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-slate-400">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="bg-white">
                            {children}
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100">
                            <div>
                                {onClear && (
                                    <button 
                                        onClick={onClear}
                                        className="text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={onCancel}
                                    className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={onApply}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-black rounded-lg shadow-sm transition-all active:scale-95"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

const KanbanCard = ({ order, onClick, onAddTime }: { order: WorkOrderSync, onClick: () => void, onAddTime: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    // Calculate Checklist Progress
    const checklistItems = order.checklist?.items || [];
    const completedCount = checklistItems.filter((i: any) => i.isCompleted).length;
    const totalCount = checklistItems.length;

    const isOverdue = order.dueDate && (new Date(order.dueDate).getTime() < Date.now());

    return (
        <motion.div 
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            layoutId={order.id}
            className={cn(
                "group relative bg-card rounded-xl border p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_-12px_hsla(var(--primary-raw)/0.12)] transition-all cursor-grab active:cursor-grabbing hover:-translate-y-1",
                isOverdue || order.isEscalated ? "border-rose-200 bg-rose-50/5" : "border-border hover:border-primary/40",
                (isOverdue || order.isEscalated) && "animate-pulse-slow shadow-[0_0_15px_rgba(244,63,94,0.1)]",
                isDragging && "opacity-50 scale-105 shadow-2xl rotate-1 z-[200]"
            )} 
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2 flex-wrap items-center">
                    <span className="px-1.5 py-0.5 bg-slate-50 rounded text-[10px] font-bold text-slate-400 border border-slate-100 uppercase tracking-wider">
                        #{String(order.woNumber || order.id.slice(0, 3)).padStart(3, '0')}
                    </span>
                    <div className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                        order.priority === 'High' ? "bg-rose-100/50 text-rose-700" :
                        order.priority === 'Medium' ? "bg-amber-100/50 text-amber-700" :
                        order.priority === 'Low' ? "bg-emerald-100/50 text-emerald-700" : "bg-slate-100/50 text-slate-700"
                    )}>
                        {order.priority || 'Normal'}
                    </div>
                    {((order as any).request?.id || (order as any).requestId) && (
                        <div className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm" title="Originated from Request">
                            From REQ-{((order as any).request?.id || (order as any).requestId).split('-')[0].toUpperCase()}
                        </div>
                    )}
                    {order.isEscalated ? (
                        <div className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200" title="SLA Breach">
                            SLA BREACH
                        </div>
                    ) : order.resolutionTimeTarget ? (
                        <div className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100" title={`Due: ${new Date(order.resolutionTimeTarget).toLocaleString()}`}>
                            SLA: {new Date(order.resolutionTimeTarget).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    ) : null}
                </div>
                <div className="flex items-center gap-1.5 ml-1">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddTime();
                        }}
                        className="p-2 hover:bg-primary/10 rounded-xl transition-all text-slate-400 hover:text-primary pointer-events-auto active:scale-95"
                        title="Add Time"
                    >
                        <Clock className="w-5 h-5" />
                    </button>
                    <MoreHorizontal className="w-5 h-5 text-slate-300 hover:text-slate-600 transition-colors cursor-pointer" />
                </div>
            </div>

            <h3 className="text-[16px] font-black text-slate-900 leading-[1.2] mb-5 group-hover:text-primary transition-colors">
                {order.title}
            </h3>

            <div className="space-y-3.5">
                <div className="flex items-center gap-2.5 text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-[13px] font-bold">
                        {order.dueDate ? new Date(order.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                    </span>
                    {order.isRepeating && (
                        <RefreshCcw className="w-3.5 h-3.5 text-emerald-500 animate-spin-slow" />
                    )}
                </div>

                {order.assetName && (
                    <div className="flex items-center gap-2.5 text-slate-500 min-w-0">
                        <Box className="w-4 h-4 shrink-0" />
                        <span className="text-[13px] font-bold truncate tracking-tight">{order.assetName}</span>
                    </div>
                )}

                {order.locationName && (
                    <div className="flex items-center gap-2.5 text-slate-500 min-w-0">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="text-[13px] font-bold truncate tracking-tight">{order.locationName}</span>
                    </div>
                )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                {totalCount > 0 ? (
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black border",
                        completedCount === totalCount ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-primary/5 border-primary/10 text-primary"
                    )}>
                        <Check className="w-3 h-3" />
                        {completedCount}/{totalCount} TASKS
                    </div>
                ) : <div />}

                {order.estimatedHours && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md border border-slate-100 text-[10px] font-black text-slate-600">
                        <Timer className="w-3 h-3 text-slate-400" />
                        {order.estimatedHours}H
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const KanbanColumn = ({ id, orders, onCardClick, onAddTime }: { id: string, orders: WorkOrderSync[], onCardClick: (o: WorkOrderSync) => void, onAddTime: (id: string) => void }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div 
            ref={setNodeRef} 
            className={cn(
                "flex flex-col gap-3 min-w-0 transition-all rounded-2xl p-2",
                isOver ? "bg-primary/5 ring-2 ring-primary/20 ring-inset" : "bg-transparent hover:bg-muted/30"
            )}
        >
            {orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map(order => (
                        <KanbanCard key={order.id} order={order} onClick={() => onCardClick(order)} onAddTime={() => onAddTime(order.id)} />
                    ))}
                </div>
            ) : (
                <div className="flex-1 min-h-[120px] border-2 border-dashed border-slate-200 bg-slate-50/30 rounded-2xl hover:border-slate-300 transition-all flex flex-col items-center justify-center p-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No work orders</span>
                    <span className="text-[10px] text-slate-300 mt-1">Drag items here</span>
                </div>
            )}
        </div>
    );
};

const mapStatusToBackend = (status: string) => {
    switch (status) {
        case 'Open': return 'OPEN';
        case 'PENDING_APPROVAL': return 'PENDING_APPROVAL';
        case 'In Progress': return 'IN_PROGRESS';
        case 'On Hold': return 'ON_HOLD';
        case 'Complete': return 'COMPLETED';
        default: return status.toUpperCase().replace(' ', '_');
    }
};

export const WorkOrdersPage = () => {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const { canCreateWorkOrders, canManageData } = useUserRole();
    const filterScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (filterScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = filterScrollRef.current;
            setCanScrollLeft(scrollLeft > 1);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    const scrollFilters = (direction: 'left' | 'right') => {
        if (filterScrollRef.current) {
            const scrollAmount = 200;
            filterScrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery]);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [activeStatuses, setActiveStatuses] = useState<string[]>(['Open', 'PENDING_APPROVAL', 'In Progress', 'On Hold']);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

    // Priority filter dropdown states
    const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

    const [showAllReactiveRepeating, setShowAllReactiveRepeating] = useState<'All' | 'Reactive Only' | 'Repeating Only'>('All');

    const [dateFilter, setDateFilter] = useState<string>('Any Day');
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    
    // Staging states for multi-select with Apply/Cancel
    const [stagedPriorities, setStagedPriorities] = useState<string[]>([]);
    const [stagedLocationIds, setStagedLocationIds] = useState<string[]>([]);
    const [expandedLocationIds, setExpandedLocationIds] = useState<string[]>([]);
    const [stagedAssigneeIds, setStagedAssigneeIds] = useState<string[]>([]);
    const [stagedDateFilter, setStagedDateFilter] = useState<string>('Any Day');
    const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
    const [stagedAssetIds, setStagedAssetIds] = useState<string[]>([]);

    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isSingleDeleteModalOpen, setIsSingleDeleteModalOpen] = useState(false);
    const [workOrderToDelete, setWorkOrderToDelete] = useState<string | null>(null);

    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [isBookmarkedOnly, setIsBookmarkedOnly] = useState(false);

    // Column visibility states
    const allColumns = [
        'Asset',
        'Sector / Location',
        'Assigned To',
        'Labor Est.',
        'Team',
        'Requested By',
        'Date Created',
        'Last Updated',
        'Date Completed',
        'Archived',
        'Closeout Notes',
        'Source Type'
    ];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(allColumns);

    // Sort states
    const sortOptions = [
        'WO #',
        'Work Order Title',
        'Description',
        'Due Date',
        'Start Date',
        'Status',
        'Priority',
        'Category',
        'Asset',
        'Date Created',
        'Last Updated',
        'Date Completed'
    ];
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [sortBy, setSortBy] = useState('Date Created');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [currentView, setCurrentView] = useState<'Table' | 'Column' | 'Calendar'>('Table');
    const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [stagedStatuses, setStagedStatuses] = useState<string[]>(['Open', 'PENDING_APPROVAL', 'In Progress', 'On Hold']);
    const { views: savedViews, createView, deleteView } = useSavedViews('WORK_ORDER');

    const getSortByField = (label: string) => {
        switch (label) {
            case 'Date Created': return 'createdAt';
            case 'Last Updated': return 'updatedAt';
            case 'Date Completed': return 'completedAt';
            case 'Priority': return 'priority';
            case 'Status': return 'status';
            case 'WO #': return 'woNumber';
            case 'Work Order Title': return 'title';
            case 'Description': return 'description';
            case 'Due Date': return 'dueDate';
            case 'Start Date': return 'startDate';
            case 'Category': return 'category';
            default: return 'createdAt';
        }
    };

    // Date Logic Helper
    const getDateParams = () => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        if (dateFilter === 'Today') {
            return { dueDateStart: todayStart.toISOString(), dueDateEnd: todayEnd.toISOString() };
        }
        if (dateFilter === 'Past Due') {
            const yesterdayEnd = new Date(todayStart);
            yesterdayEnd.setMilliseconds(yesterdayEnd.getMilliseconds() - 1);
            return { dueDateEnd: yesterdayEnd.toISOString() };
        }
        if (dateFilter === 'Next 7 Days') {
            const next7DaysEnd = new Date(todayEnd);
            next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
            return { dueDateStart: todayStart.toISOString(), dueDateEnd: next7DaysEnd.toISOString() };
        }
        return {};
    };

    const { workOrders: apiWorkOrders, meta, isLoading } = useWorkOrders({
        page: currentPage,
        limit: (currentView === 'Column' || currentView === 'Calendar') ? 100 : 20,
        search: debouncedSearchQuery,
        status: activeStatuses.length > 0 ? activeStatuses.map(mapStatusToBackend).join(',') : undefined,
        priority: selectedPriorities.length > 0 ? selectedPriorities.map(p => p.toUpperCase()).join(',') : undefined,
        assignedToId: selectedAssigneeIds.length > 0 ? selectedAssigneeIds.join(',') : undefined,
        locationId: selectedLocationIds.length > 0 ? selectedLocationIds.join(',') : undefined,
        assetId: selectedAssetIds.length > 0 ? selectedAssetIds.join(',') : undefined,
        isBookmarked: isBookmarkedOnly || undefined,
        isRepeating: showAllReactiveRepeating === 'Repeating Only' ? true : undefined,
        sortBy: getSortByField(sortBy),
        sortOrder: sortOrder,
        ...getDateParams()
    });

    useEffect(() => {
        checkScroll();
        const timeoutId = setTimeout(checkScroll, 100);

        window.addEventListener('resize', checkScroll);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', checkScroll);
        };
    }, [
        activeStatuses,
        selectedPriorities,
        selectedLocationIds,
        selectedAssetIds,
        selectedAssigneeIds,
        isBookmarkedOnly,
        dateFilter,
        apiWorkOrders
    ]);

    const { data: usersData } = useUsers();
    const { data: locationsData } = useLocations();
    const { data: assetsData } = useAssets();
    
    // Resilience Guard: Ensure variables are always arrays even if backend fails
    const users = (Array.isArray(usersData) ? usersData : (usersData as unknown as { items?: {id: string, name: string}[] })?.items || []) as {id: string, name: string}[];
    const locations = (Array.isArray(locationsData) ? locationsData : (locationsData as unknown as { items?: {id: string, name: string, parentId?: string}[] })?.items || []) as {id: string, name: string, parentId?: string}[];
    const assets = (Array.isArray(assetsData) ? assetsData : (assetsData as any)?.items || []) as {id: string, name: string}[];

    useThemeStore(); // Initialize theme
    const [hideArchived, setHideArchived] = useState(true);

    // Calendar dynamic state
    const [calendarMode, setCalendarMode] = useState<'Month' | 'Week' | 'Day'>('Month');
    const [calendarDate, setCalendarDate] = useState(new Date()); 
    const [isWorkOrderOptionsOpen, setIsWorkOrderOptionsOpen] = useState(false);
    const [showExportSubmenu, setShowExportSubmenu] = useState(false);
    const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);
    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAdvancedFiltersModalOpen, setIsAdvancedFiltersModalOpen] = useState(false);
    
    // Detail Modal State
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderSync | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    // Add Time State
    const [isAddTimeModalOpen, setIsAddTimeModalOpen] = useState(false);
    const [timeLogTargetId, setTimeLogTargetId] = useState<string | null>(null);

    const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
    
    // Global Keyboard Shortcut for 'n'
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'n' && !isCreateModalOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                setIsCreateModalOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCreateModalOpen]);

    // Deep-linking: Open work order if ID is in URL or route params
    useEffect(() => {
        const woId = paramId || searchParams.get('id');
        if (woId) {
            const wo = (apiWorkOrders as WorkOrderSync[] || []).find(o => o.id === woId);
            if (wo) {
                setSelectedWorkOrder(wo);
                setIsDetailModalOpen(true);
            } else {
                // If not in current page/list, fetch directly from API so notifications always open the modal
                api.get(`/work-orders/${woId}`)
                    .then(res => {
                        if (res.data) {
                            setSelectedWorkOrder(res.data);
                            setIsDetailModalOpen(true);
                        }
                    })
                    .catch(err => console.error("Could not fetch deep-linked work order:", err));
            }
        }
    }, [paramId, searchParams, apiWorkOrders]);

    const handleToday = () => setCalendarDate(new Date());
    const handlePrevMonth = () => {
        const d = new Date(calendarDate);
        if (calendarMode === 'Week') {
            d.setDate(d.getDate() - 7);
        } else {
            d.setMonth(d.getMonth() - 1);
        }
        setCalendarDate(d);
    };
    const handleNextMonth = () => {
        const d = new Date(calendarDate);
        if (calendarMode === 'Week') {
            d.setDate(d.getDate() + 7);
        } else {
            d.setMonth(d.getMonth() + 1);
        }
        setCalendarDate(d);
    };

    // Helper to get calendar days
    const getCalendarDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        const days = [];
        // Previous month padding
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, month: 'prev', fullDate: new Date(year, month - 1, prevMonthDays - i) });
        }
        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, month: 'current', fullDate: new Date(year, month, i) });
        }
        // Next month padding
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, month: 'next', fullDate: new Date(year, month + 1, i) });
        }
        return days;
    };

    const getWeekDays = (date: Date) => {
        const currentDayOfWeek = date.getDay();
        const sunday = new Date(date);
        sunday.setDate(date.getDate() - currentDayOfWeek);
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(sunday);
            dayDate.setDate(sunday.getDate() + i);
            days.push({
                day: dayDate.getDate(),
                month: dayDate.getMonth() === date.getMonth() ? 'current' : 'outside',
                fullDate: dayDate
            });
        }
        return days;
    };
    const [isEveryoneDropdownOpen, setIsEveryoneDropdownOpen] = useState(false);


    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);




    const fetchExportData = async () => {
        try {
            const params = {
                limit: 1000, // Large limit for exports
                search: debouncedSearchQuery,
                status: activeStatuses.length > 0 ? activeStatuses.map(mapStatusToBackend).join(',') : undefined,
                priority: selectedPriorities.length > 0 ? selectedPriorities.map(p => p.toUpperCase()).join(',') : undefined,
                assignedToId: selectedAssigneeIds.length > 0 ? selectedAssigneeIds.join(',') : undefined,
                locationId: selectedLocationIds.length > 0 ? selectedLocationIds.join(',') : undefined,
                assetId: selectedAssetIds.length > 0 ? selectedAssetIds.join(',') : undefined,
                isBookmarked: isBookmarkedOnly || undefined,
                isRepeating: showAllReactiveRepeating === 'Repeating Only' ? true : undefined,
                sortBy: getSortByField(sortBy),
                sortOrder: sortOrder,
                ...getDateParams()
            };
            const response = await api.get('/work-orders', { params });
            return response.data?.items || [];
        } catch (error) {
            console.error('Error fetching export data:', error);
            return [];
        }
    };

    const handleExportCSV = async () => {
        const dataToExport = await fetchExportData();
        if (!dataToExport.length) return;
        const headers = ['WO #', 'Title', 'Status', 'Priority', 'Location', 'Asset', 'Due Date'];
        const csvContent = [
            headers.join(','),
            ...dataToExport.map((wo: any) => [
                `"${wo.id.slice(0, 8)}"`,
                `"${wo.title}"`,
                `"${wo.status}"`,
                `"${wo.priority || 'NONE'}"`,
                `"${wo.locationName || 'N/A'}"`,
                `"${wo.assetName || 'N/A'}"`,
                `"${wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : 'N/A'}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `CMMS_WorkOrders_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        setIsWorkOrderOptionsOpen(false);
    };

    const handleExportPDF = () => {
        window.print(); // Industrial standard for quick PDF generation via browser
        setIsWorkOrderOptionsOpen(false);
    };

    const handleExportExcel = async () => {
        const dataToExport = await fetchExportData();
        if (!dataToExport.length) return;
        
        const data = dataToExport.map((wo: any) => ({
            'WO #': wo.id.slice(0, 8),
            'Title': wo.title,
            'Status': wo.status,
            'Priority': wo.priority || 'NONE',
            'Maintenance Type': wo.isReactive ? 'REACTIVE' : wo.isRepeating ? 'PREVENTIVE' : 'MANUAL',
            'Location': wo.locationName || 'N/A',
            'Asset': wo.assetName || 'N/A',
            'Due Date': wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : 'N/A',
            'Date Created': wo.createdAt ? new Date(wo.createdAt).toLocaleDateString() : 'N/A',
            'Description': wo.description || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Orders');
        XLSX.writeFile(workbook, `CMMS_Enterprise_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        setIsWorkOrderOptionsOpen(false);
    };

    const renderMoreOptions = () => (
        <div className="relative">
            <button
                onClick={() => {
                    setIsWorkOrderOptionsOpen(!isWorkOrderOptionsOpen);
                    setShowExportSubmenu(false); // Reset submenu on toggle
                }}
                className={cn(
                    "p-2.5 solid-panel rounded-xl transition-all shadow-sm hover:shadow-md",
                    isWorkOrderOptionsOpen ? "text-primary ring-2 ring-primary/10" : "text-primary"
                )}
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {isWorkOrderOptionsOpen && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setIsWorkOrderOptionsOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-64 popover-solid rounded-2xl z-[120] overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {!showExportSubmenu ? (
                            <>
                                <button
                                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-gray-700 text-left"
                                    onClick={() => setShowExportSubmenu(true)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Upload className="w-5 h-5 text-gray-400" />
                                        <span className="text-[16px] font-medium text-foreground">Export Data</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-500 border-b border-gray-100 text-left"
                                    onClick={() => setShowExportSubmenu(false)}
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                                    <span className="text-[13px] font-bold">Back to Options</span>
                                </button>
                                <button
                                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-gray-700 text-left"
                                    onClick={() => {
                                        handleExportCSV();
                                        setIsWorkOrderOptionsOpen(false);
                                    }}
                                >
                                    <Upload className="w-5 h-5 text-gray-400" />
                                    <span className="text-[16px] font-medium text-foreground">Export to CSV</span>
                                </button>
                                <button
                                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-gray-700 text-left"
                                    onClick={() => {
                                        handleExportExcel();
                                        setIsWorkOrderOptionsOpen(false);
                                    }}
                                >
                                    <List className="w-5 h-5 text-gray-400" />
                                    <span className="text-[16px] font-medium text-foreground">Export to Excel</span>
                                </button>
                                <button
                                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-gray-700 text-left"
                                    onClick={() => {
                                        handleExportPDF();
                                        setIsWorkOrderOptionsOpen(false);
                                    }}
                                >
                                    <Upload className="w-5 h-5 text-gray-400" />
                                    <span className="text-[16px] font-medium text-foreground">Export to PDF</span>
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );

    const renderPageHeader = () => (
        <div className="h-14 flex items-center px-4 bg-card border-b border-border z-[100] shrink-0">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => window.history.back()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg transition-all group shrink-0"
                >
                    <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Dashboard</span>
                </button>
                <div className="h-6 w-px bg-slate-100 mx-1" />
                <div className="flex items-center gap-2">
                    <h1 className="text-[18px] font-black text-foreground tracking-tight whitespace-nowrap">Work Orders</h1>
                </div>


                <div className="h-6 w-px bg-slate-200 mx-3" />
                <div className="relative">
                    <button
                        onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-slate-50 border border-border rounded-xl text-[13px] font-black text-slate-800 transition-all shrink-0 active:scale-95 shadow-sm"
                    >
                        {currentView === 'Table' && <List className="w-4 h-4 text-slate-500" />}
                        {currentView === 'Column' && <LayoutGrid className="w-4 h-4 text-slate-500" />}
                        {currentView === 'Calendar' && <Calendar className="w-4 h-4 text-slate-500" />}
                        <span>{currentView === 'Table' ? 'Table' : currentView === 'Column' ? 'Column' : 'Calendar'}</span>
                        <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform", isViewDropdownOpen && "rotate-180")} />
                    </button>

                    {isViewDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-[110]" onClick={() => setIsViewDropdownOpen(false)} />
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl z-[120] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-1 space-y-0.5">
                                    {[
                                        { id: 'Table', label: 'Table View', icon: List },
                                        { id: 'Column', label: 'Column View', icon: LayoutGrid },
                                        { id: 'Calendar', label: 'Calendar View', icon: Calendar }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                setCurrentView(opt.id as 'Table' | 'Column' | 'Calendar');
                                                setIsViewDropdownOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left rounded-xl text-[13px]",
                                                currentView === opt.id ? "text-primary bg-primary/5 font-black" : "text-slate-700 font-bold"
                                            )}
                                        >
                                            <opt.icon className={cn("w-4 h-4", currentView === opt.id ? "text-primary" : "text-slate-400")} />
                                            <span>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
                {renderSavedViews()}
                <div className="relative group/search">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search assets, work orders..." 
                        className="w-64 h-9 pl-9 pr-4 bg-muted border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:bg-background focus:border-primary/30 transition-all placeholder:text-muted-foreground"
                    />
                </div>
                
                {canCreateWorkOrders && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-xl text-[13px] font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Work Order</span>
                    </button>
                )}

                {renderMoreOptions()}
            </div>
        </div>
    );


    const renderSavedViews = () => (
        <FilterDropdown 
            label="Saved Views" 
            icon={Star} 
            isOpen={isSavedViewsOpen} 
            onToggle={() => setIsSavedViewsOpen(!isSavedViewsOpen)}
            badgeValue={savedViews.length}
        >
            <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar bg-white">
                {savedViews.length === 0 && (
                    <div className="px-4 py-6 text-center">
                        <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No saved views yet</p>
                    </div>
                )}
                {savedViews.map((view: any) => (
                    <div key={view.id} className="group relative">
                        <button
                            onClick={() => {
                                const config = view.config;
                                if (config.activeStatuses) setActiveStatuses(config.activeStatuses);
                                if (config.selectedPriorities) setSelectedPriorities(config.selectedPriorities);
                                if (config.selectedAssigneeIds) setSelectedAssigneeIds(config.selectedAssigneeIds);
                                if (config.selectedLocationIds) setSelectedLocationIds(config.selectedLocationIds);
                                if (config.selectedAssetIds) setSelectedAssetIds(config.selectedAssetIds);
                                if (config.dateFilter) setDateFilter(config.dateFilter);
                                if (config.searchQuery) setSearchQuery(config.searchQuery);
                                if (config.sortBy) setSortBy(config.sortBy);
                                if (config.currentView) setCurrentView(config.currentView);
                                setIsSavedViewsOpen(false);
                                toast.success(`View applied: ${view.name}`);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left rounded-xl pr-10"
                        >
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[14px] font-black text-slate-900">{view.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Created {new Date(view.createdAt).toLocaleDateString()}</span>
                            </div>
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteView.mutate(view.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </FilterDropdown>
    );

    const bulkUpdateMutation = useMutation({
        mutationFn: async ({ status, ids }: { status?: string, ids: string[] }) => {
            const promises = ids.map(id => api.patch(`/work-orders/${id}`, { 
                status,
                ...(status === 'COMPLETED' ? { rootCauseCode: 'MAINTENANCE_COMPLETED' } : {})
            }));
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            setSelectedRows([]);
            toast.success('Bulk update completed');
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            const promises = ids.map(id => api.delete(`/work-orders/${id}`));
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            setSelectedRows([]);
            toast.success('Bulk deletion completed');
        }
    });

    const renderBulkActions = () => {
        if (selectedRows.length === 0) return null;

        return (
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-6 px-8 py-4 bg-slate-900 text-white rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl"
            >
                <div className="flex items-center gap-4 pr-6 border-r border-white/10">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[14px] font-black">
                        {selectedRows.length}
                    </div>
                    <span className="text-[14px] font-black uppercase tracking-widest italic opacity-80 whitespace-nowrap">Selected</span>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => bulkUpdateMutation.mutate({ ids: selectedRows, status: 'IN_PROGRESS' })}
                        className="flex items-center gap-2 px-5 py-2.5 hover:bg-white/10 rounded-xl transition-all text-[12px] font-black uppercase tracking-widest"
                    >
                        <Clock className="w-4 h-4 text-amber-400" />
                        Start
                    </button>
                    <button 
                        onClick={() => bulkUpdateMutation.mutate({ ids: selectedRows, status: 'COMPLETED' })}
                        className="flex items-center gap-2 px-5 py-2.5 hover:bg-white/10 rounded-xl transition-all text-[12px] font-black uppercase tracking-widest"
                    >
                        <Check className="w-4 h-4 text-emerald-400" />
                        Complete
                    </button>
                    <button 
                        onClick={() => setIsBulkDeleteModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-[12px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>

                <div className="w-px h-6 bg-white/10" />

                <button 
                    onClick={() => setSelectedRows([])}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </motion.div>
        );
    };

    // Filters logic
    const getActiveFiltersCount = () => {
        let count = 0;
        const isDefaultStatuses = activeStatuses.length === 4 && 
            activeStatuses.includes('Open') && 
            activeStatuses.includes('PENDING_APPROVAL') && 
            activeStatuses.includes('In Progress') && 
            activeStatuses.includes('On Hold');
        if (!isDefaultStatuses) count++;
        
        if (selectedPriorities.length > 0) count++;
        if (selectedLocationIds.length > 0) count++;
        if (selectedAssetIds.length > 0) count++;
        if (selectedAssigneeIds.length > 0) count++;
        if (isBookmarkedOnly) count++;
        if (dateFilter !== 'Any Day') count++;
        return count;
    };

    const getStatusFilterLabel = () => {
        if (activeStatuses.length === 0) return 'Status: None';
        if (activeStatuses.length === 5) return 'Status: All';
        
        const displayMap: Record<string, string> = {
            'Open': 'Open',
            'PENDING_APPROVAL': 'Pending Approval',
            'In Progress': 'In Progress',
            'On Hold': 'On Hold',
            'Complete': 'Completed'
        };
        const firstStatus = activeStatuses[0];
        const firstLabel = displayMap[firstStatus] || firstStatus;
        if (activeStatuses.length === 1) return `Status: ${firstLabel}`;
        return `Status: ${firstLabel} +${activeStatuses.length - 1}`;
    };

    const handleResetFilters = () => {
        setActiveStatuses(['Open', 'PENDING_APPROVAL', 'In Progress', 'On Hold']);
        setSelectedPriorities([]);
        setSelectedLocationIds([]);
        setSelectedAssetIds([]);
        setSelectedAssigneeIds([]);
        setIsBookmarkedOnly(false);
        setDateFilter('Any Day');
        setSearchQuery('');
        setCurrentPage(1);
        toast.success('All filters cleared');
    };

    // Trust the Backend: The server now handles all filtering, searching, and sorting.
    const filteredWorkOrders = useMemo(() => {
        const items = apiWorkOrders || [];
        if (sortBy === 'Priority') {
            const weights: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'NONE': 0 };
            return [...items].sort((a, b) => {
                const weightA = weights[a.priority as string] || 0;
                const weightB = weights[b.priority as string] || 0;
                // Since parent component uses 'desc' by default for server calls, 
                // we'll follow that for consistency in the weighted sort.
                return weightB - weightA; 
            });
        }
        return items;
    }, [apiWorkOrders, sortBy]);

    const deleteWorkOrder = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/work-orders/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            toast.success('Mission Aborted: Work Order Deleted');
        }
    });

    const shareWorkOrder = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/work-orders/${id}/share`);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['shared-work-orders'] });
            
            const shareUrl = `${window.location.origin}/vendor-portal/${data.shareToken}`;
            navigator.clipboard.writeText(shareUrl);
            
            // Premium feedback alerting the user to the generated link
            toast.success(
                () => (
                    <div className="flex flex-col gap-2">
                        <span className="font-black italic uppercase tracking-tight">Mission Portal Live!</span>
                        <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg border border-white/10 overflow-hidden text-[10px] font-mono break-all opacity-70">
                            {shareUrl}
                        </div>
                        <span className="text-[9px] font-bold text-white/50 italic capitalize">Link copied to clipboard. Send this to your technician.</span>
                    </div>
                ),
                { duration: 6000, style: { background: '#0f172a', color: '#fff', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } }
            );
        }
    });

    const updateWorkOrder = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<WorkOrderSync> }) => {
            const response = await api.patch(`/work-orders/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update mission status');
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const orderId = active.id as string;
        const [targetAssignee, targetStatus] = (over.id as string).replace('droppable-', '').split('--');
        
        const order = filteredWorkOrders.find(o => o.id === orderId);
        if (!order) return;

        // Only update if something changed
        if (order.status !== targetStatus || (order.assignee || 'Unassigned') !== targetAssignee) {
            const apiStatus = mapStatusToBackend(targetStatus);
            
            updateWorkOrder.mutate({ 
                id: orderId, 
                data: { 
                    status: apiStatus,
                    // Map assignee back if changed
                    assignedToId: targetAssignee === 'Unassigned' ? undefined : (users.find(u => u.name === targetAssignee)?.id || order.assignedToId)
                } 
            });
            toast.success(`Mission moved to ${targetStatus}`);
        }
    };

    const copyExternalLink = (token: string) => {
        const shareUrl = `${window.location.origin}/vendor-portal/${token}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success('Mission Link Copied to Clipboard!');
    };

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedRows.length === (filteredWorkOrders?.length || 0)) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredWorkOrders?.map((o: WorkOrderSync) => o.id) || []);
        }
    };

    const renderFilterBar = () => (
        <div className="relative group/filter-bar bg-white border-b border-slate-100 flex items-center z-[80] h-12">
            <div className="flex items-center justify-between px-4 w-full py-1 min-w-0">
                {/* Left side wrapper to hold scroll buttons and scroll container */}
                <div className="relative flex-1 min-w-0 flex items-center mr-4">
                    {/* Left scroll button */}
                    {canScrollLeft && (
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent z-10 flex items-center pointer-events-none">
                            <button 
                                onClick={() => scrollFilters('left')}
                                className="w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-primary hover:border-primary/20 pointer-events-auto transition-all active:scale-90"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Scrollable Filters Container */}
                    <div 
                        ref={filterScrollRef}
                        onScroll={checkScroll}
                        className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full py-1 scroll-smooth"
                    >
                    {/* Filters (N) */}
                    <button
                        onClick={() => setIsAdvancedFiltersModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[12px] font-black hover:bg-primary/20 transition-all shrink-0 active:scale-95 shadow-sm"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Filters {getActiveFiltersCount() > 0 ? `(${getActiveFiltersCount()})` : ''}</span>
                    </button>

                    <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

                    {/* Status Filter */}
                    <FilterDropdown 
                        label={getStatusFilterLabel()} 
                        icon={Activity} 
                        isOpen={isStatusDropdownOpen} 
                        onToggle={() => {
                            setIsStatusDropdownOpen(!isStatusDropdownOpen);
                            setStagedStatuses(activeStatuses);
                        }}
                        badgeValue={activeStatuses.length === 5 ? 0 : activeStatuses.length}
                        onApply={() => {
                            setActiveStatuses(stagedStatuses);
                            setIsStatusDropdownOpen(false);
                            setCurrentPage(1);
                        }}
                        onCancel={() => setIsStatusDropdownOpen(false)}
                        onClear={() => setStagedStatuses([])}
                    >
                        <div className="p-2 space-y-1 bg-white">
                            {[
                                { label: 'Open', dbKey: 'Open' },
                                { label: 'Pending Approval', dbKey: 'PENDING_APPROVAL' },
                                { label: 'In Progress', dbKey: 'In Progress' },
                                { label: 'On Hold', dbKey: 'On Hold' },
                                { label: 'Completed', dbKey: 'Complete' }
                            ].map(s => (
                                <button
                                    key={s.dbKey}
                                    onClick={() => {
                                        const next = stagedStatuses.includes(s.dbKey) 
                                            ? stagedStatuses.filter(x => x !== s.dbKey)
                                            : [...stagedStatuses, s.dbKey];
                                        setStagedStatuses(next);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left rounded-xl",
                                        stagedStatuses.includes(s.dbKey) ? "text-primary bg-primary/5 font-black" : "text-slate-700 font-bold"
                                    )}
                                >
                                    <span className="text-[13px]">{s.label}</span>
                                    {stagedStatuses.includes(s.dbKey) && <Check className="w-4 h-4 text-primary" />}
                                </button>
                            ))}
                        </div>
                    </FilterDropdown>

                    {/* Priority Filter */}
                    <FilterDropdown 
                        label="Priority" 
                        icon={Flag} 
                        isOpen={isPriorityDropdownOpen} 
                        onToggle={() => {
                            setIsPriorityDropdownOpen(!isPriorityDropdownOpen);
                            setStagedPriorities(selectedPriorities);
                        }}
                        badgeValue={selectedPriorities.length}
                        onApply={() => {
                            setSelectedPriorities(stagedPriorities);
                            setIsPriorityDropdownOpen(false);
                            setCurrentPage(1);
                        }}
                        onCancel={() => setIsPriorityDropdownOpen(false)}
                        onClear={() => setStagedPriorities([])}
                    >
                        <div className="p-2 space-y-1 bg-white">
                            {[
                                { label: 'High', value: 'High', colorClass: 'text-rose-500 fill-rose-500' },
                                { label: 'Medium', value: 'Medium', colorClass: 'text-amber-500 fill-amber-500' },
                                { label: 'Low', value: 'Low', colorClass: 'text-emerald-500 fill-emerald-500' },
                                { label: 'None', value: 'None', colorClass: 'text-slate-400 fill-slate-400' }
                            ].map(s => {
                                const isActive = stagedPriorities.includes(s.value);
                                return (
                                    <button
                                        key={s.value}
                                        onClick={() => {
                                            const next = stagedPriorities.includes(s.value) 
                                                ? stagedPriorities.filter(x => x !== s.value)
                                                : [...stagedPriorities, s.value];
                                            setStagedPriorities(next);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left rounded-xl",
                                            isActive ? "text-slate-900 bg-slate-50/50 font-black" : "text-slate-700 font-bold"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                                            isActive ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                                        )}>
                                            {isActive && <Check className="w-3 h-3 text-white stroke-[3.5px]" />}
                                        </div>
                                        <Flag className={cn("w-4 h-4 shrink-0", s.colorClass)} />
                                        <span className="text-[13px]">{s.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </FilterDropdown>

                    {/* Location Filter */}
                    <FilterDropdown 
                        label="Location" 
                        icon={MapPin} 
                        isOpen={isLocationDropdownOpen} 
                        onToggle={() => {
                            setIsLocationDropdownOpen(!isLocationDropdownOpen);
                            setStagedLocationIds(selectedLocationIds);
                        }}
                        badgeValue={selectedLocationIds.length}
                        onApply={() => {
                            setSelectedLocationIds(stagedLocationIds);
                            setIsLocationDropdownOpen(false);
                            setCurrentPage(1);
                        }}
                        onCancel={() => setIsLocationDropdownOpen(false)}
                        onClear={() => setStagedLocationIds([])}
                    >
                        <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar bg-white">
                            {(() => {
                                // Build location tree
                                const map: Record<string, any> = {};
                                const roots: any[] = [];
                                locations.forEach(l => { map[l.id] = { ...l, children: [] }; });
                                locations.forEach(l => {
                                    if (l.parentId && map[l.parentId]) {
                                        map[l.parentId].children.push(map[l.id]);
                                    } else {
                                        roots.push(map[l.id]);
                                    }
                                });

                                const renderNode = (node: any, level: number) => {
                                    const hasChildren = node.children && node.children.length > 0;
                                    const isExpanded = expandedLocationIds.includes(node.id);
                                    
                                    return (
                                        <div key={node.id}>
                                            <div 
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors text-left rounded-xl",
                                                    stagedLocationIds.includes(node.id) ? "text-primary bg-primary/5 font-black" : "text-slate-700 font-bold"
                                                )}
                                                style={{ paddingLeft: `${(level * 16) + 16}px` }}
                                            >
                                                <div className="flex items-center gap-2 flex-1">
                                                    {hasChildren ? (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedLocationIds(prev => prev.includes(node.id) ? prev.filter(id => id !== node.id) : [...prev, node.id]);
                                                            }}
                                                            className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400"
                                                        >
                                                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !isExpanded && "-rotate-90")} />
                                                        </button>
                                                    ) : (
                                                        <div className="w-5" />
                                                    )}
                                                    <button
                                                        className="flex-1 text-left py-0.5"
                                                        onClick={() => {
                                                            const next = stagedLocationIds.includes(node.id) 
                                                                ? stagedLocationIds.filter(x => x !== node.id)
                                                                : [...stagedLocationIds, node.id];
                                                            setStagedLocationIds(next);
                                                        }}
                                                    >
                                                        <span className="text-[13px]">{node.name}</span>
                                                    </button>
                                                </div>
                                                {stagedLocationIds.includes(node.id) && <Check className="w-4 h-4 text-primary shrink-0" />}
                                            </div>
                                            {isExpanded && node.children.map((child: any) => renderNode(child, level + 1))}
                                        </div>
                                    );
                                };
                                
                                return roots.map(root => renderNode(root, 0));
                            })()}
                        </div>
                    </FilterDropdown>

                    {/* Asset Filter */}
                    <FilterDropdown 
                        label="Asset" 
                        icon={Box} 
                        isOpen={isAssetDropdownOpen} 
                        onToggle={() => {
                            setIsAssetDropdownOpen(!isAssetDropdownOpen);
                            setStagedAssetIds(selectedAssetIds);
                        }}
                        badgeValue={selectedAssetIds.length}
                        onApply={() => {
                            setSelectedAssetIds(stagedAssetIds);
                            setIsAssetDropdownOpen(false);
                            setCurrentPage(1);
                        }}
                        onCancel={() => setIsAssetDropdownOpen(false)}
                        onClear={() => setStagedAssetIds([])}
                    >
                        <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar bg-white">
                            {assets.map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => {
                                        const next = stagedAssetIds.includes(a.id) 
                                            ? stagedAssetIds.filter(x => x !== a.id)
                                            : [...stagedAssetIds, a.id];
                                        setStagedAssetIds(next);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left rounded-xl",
                                        stagedAssetIds.includes(a.id) ? "text-primary bg-primary/5 font-black" : "text-slate-700 font-bold"
                                    )}
                                >
                                    <span className="text-[13px]">{a.name}</span>
                                    {stagedAssetIds.includes(a.id) && <Check className="w-4 h-4 text-primary" />}
                                </button>
                            ))}
                        </div>
                    </FilterDropdown>

                    {/* Assigned To Filter */}
                    <FilterDropdown 
                        label="Assigned To" 
                        icon={Users} 
                        isOpen={isEveryoneDropdownOpen} 
                        onToggle={() => {
                            setIsEveryoneDropdownOpen(!isEveryoneDropdownOpen);
                            setStagedAssigneeIds(selectedAssigneeIds);
                        }}
                        badgeValue={selectedAssigneeIds.length}
                        onApply={() => {
                            setSelectedAssigneeIds(stagedAssigneeIds);
                            setIsEveryoneDropdownOpen(false);
                            setCurrentPage(1);
                        }}
                        onCancel={() => setIsEveryoneDropdownOpen(false)}
                        onClear={() => setStagedAssigneeIds([])}
                    >
                        <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar bg-white">
                            {users.map((u: any) => {
                                const targetId = u.userOrgId || u.id;
                                return (
                                    <button
                                        key={targetId}
                                        onClick={() => {
                                            const next = stagedAssigneeIds.includes(targetId) 
                                                ? stagedAssigneeIds.filter(x => x !== targetId)
                                                : [...stagedAssigneeIds, targetId];
                                            setStagedAssigneeIds(next);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left rounded-xl",
                                            stagedAssigneeIds.includes(targetId) ? "text-primary bg-primary/5 font-black" : "text-slate-700 font-bold"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                                {u.name[0]}
                                            </div>
                                            <span className="text-[13px]">{u.name}</span>
                                        </div>
                                        {stagedAssigneeIds.includes(targetId) && <Check className="w-4 h-4 text-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    </FilterDropdown>

                    {/* Date Filter */}
                    <FilterDropdown 
                        label={dateFilter} 
                        icon={Calendar} 
                        isOpen={isDateDropdownOpen} 
                        onToggle={() => {
                            setIsDateDropdownOpen(!isDateDropdownOpen);
                            setStagedDateFilter(dateFilter);
                        }}
                        onApply={() => {
                            setDateFilter(stagedDateFilter);
                            setIsDateDropdownOpen(false);
                            setCurrentPage(1);
                        }}
                        onCancel={() => setIsDateDropdownOpen(false)}
                        onClear={() => setStagedDateFilter('Any Day')}
                    >
                        <div className="p-2 space-y-1 bg-white">
                            {['Any Day', 'Today', 'Past Due', 'Next 7 Days'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setStagedDateFilter(opt)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left rounded-xl",
                                        stagedDateFilter === opt ? "text-primary bg-primary/5 font-black" : "text-slate-700 font-bold"
                                    )}
                                >
                                    <span className="text-[13px]">{opt}</span>
                                    {stagedDateFilter === opt && <Check className="w-4 h-4 text-primary" />}
                                </button>
                            ))}
                        </div>
                    </FilterDropdown>

                    <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

                    <button 
                        onClick={() => {
                            setIsBookmarkedOnly(!isBookmarkedOnly);
                            setCurrentPage(1);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-black transition-all active:scale-95 whitespace-nowrap border h-9",
                            isBookmarkedOnly 
                                ? "bg-amber-50 text-amber-600 border-amber-200 shadow-sm" 
                                : "bg-white text-slate-500 border-transparent hover:bg-slate-50",
                            "shrink-0"
                        )}
                    >
                        <Star className={cn("w-3.5 h-3.5", isBookmarkedOnly && "fill-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]")} />
                        Bookmarked
                    </button>
                </div>

                {/* Right scroll button */}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent z-10 flex items-center justify-end pointer-events-none">
                        <button 
                            onClick={() => scrollFilters('right')}
                            className="w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-primary hover:border-primary/20 pointer-events-auto transition-all active:scale-90"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Right side: Action links */}
            <div className="flex items-center gap-4 shrink-0 pl-2">
                <button 
                    onClick={handleResetFilters}
                    className="text-[13px] font-black text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap"
                >
                    Reset Filters
                </button>
                <button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['work-orders'] })}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-primary animate-none"
                >
                    <RefreshCcw className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    </div>
);

    const handleStatusClick = (statusLabel: string) => {
        if (activeStatuses.length === 1 && activeStatuses[0] === statusLabel) {
            // Reset to default active statuses
            setActiveStatuses(['Open', 'PENDING_APPROVAL', 'In Progress', 'On Hold']);
        } else {
            setActiveStatuses([statusLabel]);
        }
        setCurrentPage(1);
    };

    const renderStatusSummaryBar = () => (
        <div className="grid grid-cols-5 gap-6">
            {[
                { label: 'Open', color: 'bg-rose-500', dbKey: 'OPEN' },
                { label: 'PENDING_APPROVAL', color: 'bg-purple-500', display: 'Pending Approval', dbKey: 'PENDING_APPROVAL' },
                { label: 'In Progress', color: 'bg-emerald-500', dbKey: 'IN_PROGRESS' },
                { label: 'On Hold', color: 'bg-amber-500', dbKey: 'ON_HOLD' },
                { label: 'Complete', color: 'bg-slate-400', dbKey: 'COMPLETED' }
            ].map((stat) => {
                const count = meta?.statusCounts
                    ? (meta.statusCounts[stat.dbKey] || 0)
                    : filteredWorkOrders.filter(wo => mapStatusToBackend(wo.status) === stat.dbKey).length;
                const isActive = activeStatuses.includes(stat.label);
                return (
                    <button
                        key={stat.label}
                        onClick={() => handleStatusClick(stat.label)}
                        className={cn(
                            "bg-white rounded-xl border p-6 flex justify-between items-center shadow-sm relative overflow-hidden group transition-all select-none hover:shadow-md cursor-pointer text-left w-full",
                            isActive
                                ? "border-slate-200 ring-2 ring-primary/10 opacity-100"
                                : "border-slate-100 opacity-40 hover:opacity-75 grayscale-[20%]"
                        )}
                    >
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", stat.color)} />
                        <span className="text-[18px] font-black text-slate-800 tracking-tight">{stat.display || stat.label}</span>
                        <span className="text-[28px] font-black text-slate-900 leading-none">{count}</span>
                    </button>
                );
            })}
        </div>
    );

    const renderSubHeader = () => (
        <div className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-100 z-40 py-2">
            <div className="flex items-center gap-6">
                <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {meta?.total || apiWorkOrders.length} {meta?.total === 1 ? 'Work Order' : 'Work Orders'}
                </span>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-6">
                    <div className="relative flex items-center gap-2">
                        <button
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className={cn(
                                "flex items-center gap-2 text-[13px] font-bold transition-colors hover:text-primary",
                                isSortDropdownOpen ? "text-primary" : "text-gray-600"
                            )}
                        >
                            <ArrowUpDown className="w-4 h-4" />
                            Sort: {sortBy}
                        </button>
                        
                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="p-1 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title={`Toggle sort order (currently ${sortOrder === 'desc' ? 'Descending' : 'Ascending'})`}
                        >
                            {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                        </button>

                        {isSortDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[110]" onClick={() => setIsSortDropdownOpen(false)} />
                                <div className="absolute top-full left-0 mt-3 w-64 popover-solid rounded-2xl z-[120] overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                        <span className="text-[15px] font-bold text-foreground">Sort By</span>
                                        <button onClick={() => setIsSortDropdownOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-slate-400">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="py-2 px-1 max-h-[320px] overflow-y-auto custom-scrollbar">
                                        {sortOptions.map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    setSortBy(option);
                                                    setIsSortDropdownOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left rounded-xl mx-0",
                                                    sortBy === option ? "text-primary bg-primary/10" : "text-gray-700"
                                                )}
                                            >
                                                <span className="text-[13px] font-semibold">{option}</span>
                                                {sortBy === option && <Check className="w-4 h-4 text-primary stroke-[3px]" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="h-6 w-px bg-slate-100 mx-2" />
                
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Search current view..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-3 pr-10 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[13px] text-slate-900 outline-none focus:bg-white focus:border-primary/40 transition-all font-medium"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>
        </div>
    );


    if (isMobile) {
        return <MobileWorkOrders />;
    }

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden animate-in fade-in duration-500">
            <AdvancedFiltersModal
                isOpen={isAdvancedFiltersModalOpen}
                onClose={() => setIsAdvancedFiltersModalOpen(false)}
                onApply={(filters) => {
                    setHideArchived(filters.hideArchived);
                    setActiveStatuses(filters.activeStatuses);
                    setSelectedPriorities(filters.selectedPriorities);
                    setSelectedLocationIds(filters.selectedLocationIds);
                    setSelectedAssetIds(filters.selectedAssetIds);
                    setSelectedAssigneeIds(filters.selectedAssignees);
                    setSelectedTeams(filters.selectedTeams);
                    setShowAllReactiveRepeating(filters.showAllReactiveRepeating);
                    
                    // Update the count of active filter categories
                    const categories = [];
                    if (filters.hideArchived) categories.push('Archived');
                    if (filters.activeStatuses.length > 0) categories.push('Status');
                    if (filters.selectedPriorities.length > 0) categories.push('Priority');
                    if (filters.selectedLocationIds.length > 0) categories.push('Location');
                    if (filters.selectedAssetIds.length > 0) categories.push('Asset');
                    if (filters.selectedAssignees.length > 0) categories.push('Assigned To');
                    if (filters.selectedTeams && filters.selectedTeams.length > 0) categories.push('Team');
                    if (filters.showAllReactiveRepeating !== 'All') categories.push('Type');
                    // Removed invalid state setter call
                }}
                activeFilters={{
                    hideArchived,
                    activeStatuses,
                    selectedPriorities,
                    selectedLocationIds,
                    selectedAssetIds,
                    selectedAssignees: selectedAssigneeIds,
                    selectedTeams,
                    showAllReactiveRepeating
                }}
            />


            {/* --- MAIN PAGE CONTENT --- */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
                {renderPageHeader()}
                {renderSubHeader()}
                {renderFilterBar()}
                {/* --- MAIN CONTENT --- */}
                {currentView === 'Column' && (
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                        <div className="flex-1 bg-slate-50/50 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            {/* 1. Global Status Summary Bar */}
                            {renderStatusSummaryBar()}

                            {/* 2. Assignee Grouped Kanban Boards */}
                            <div className="space-y-6">
                                {(() => {
                                    const baseStatuses = ['Open', 'PENDING_APPROVAL', 'In Progress', 'On Hold', 'Complete'];
                                    const allDynamicStatuses = Array.from(new Set([
                                        ...baseStatuses,
                                        ...filteredWorkOrders.map(wo => wo.status).filter(Boolean)
                                    ]));

                                    const groupedByAssignee = filteredWorkOrders.reduce((acc: Record<string, typeof filteredWorkOrders>, wo) => {
                                        const assignee = wo.assignee || 'No Assignee';
                                        if (!acc[assignee]) acc[assignee] = [];
                                        acc[assignee].push(wo);
                                        return acc;
                                    }, {});

                                    return Object.keys(groupedByAssignee).sort().map(assignee => {
                                        const isCollapsed = collapsedGroups.includes(assignee);
                                        const userOrders = groupedByAssignee[assignee];
                                        const totalEstHours = userOrders.reduce((sum: number, wo: any) => sum + (Number(wo.estimatedHours) || 0), 0);
                                        const initials = assignee === 'No Assignee' ? 'N/A' : (assignee.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase());
                                        const userProfile = users.find(u => u.name === assignee);
                                        
                                        return (
                                            <div key={assignee} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                                {/* Assignee Header */}
                                                <button 
                                                    onClick={() => setCollapsedGroups(prev => 
                                                        isCollapsed ? prev.filter(a => a !== assignee) : [...prev, assignee]
                                                    )}
                                                    className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-white border border-slate-200 rounded-lg p-1">
                                                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                                                        </div>
                                                        <div className="relative">
                                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-black text-slate-600 border border-white shadow-sm">
                                                                {initials}
                                                            </div>
                                                            {userProfile && (userProfile as any).jobTitle && (
                                                                <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white uppercase tracking-tighter">
                                                                    PRO
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[16px] font-black text-slate-800 tracking-tight">{assignee}</span>
                                                                {userProfile && (userProfile as any).jobTitle && (
                                                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">{(userProfile as any).jobTitle}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[12px] font-bold text-slate-400">{userOrders.length} {userOrders.length === 1 ? 'work order' : 'work orders'}</span>
                                                                <div className="h-3 w-px bg-slate-200" />
                                                                <div className="flex items-center gap-1">
                                                                    <Timer className="w-3 h-3 text-slate-400" />
                                                                    <span className={cn(
                                                                        "text-[12px] font-black",
                                                                        totalEstHours > 40 ? "text-rose-500" : "text-emerald-500"
                                                                    )}>
                                                                        Workload: {totalEstHours}h
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>

                                                {!isCollapsed && (
                                                    <div className="p-4 grid gap-6 bg-white border-t border-slate-50 overflow-x-auto custom-scrollbar" style={{ gridTemplateColumns: `repeat(${allDynamicStatuses.length}, minmax(320px, 1fr))` }}>
                                                        {allDynamicStatuses.map(status => {
                                                            const columnOrders = userOrders.filter(o => o.status === status);
                                                            return (
                                                                <KanbanColumn 
                                                                    key={`${assignee}-${status}`} 
                                                                    id={`droppable-${assignee}--${status}`}
                                                                    orders={columnOrders}
                                                                    onCardClick={(order) => { setSelectedWorkOrder(order); setIsDetailModalOpen(true); }}
                                                                    onAddTime={(id) => { setTimeLogTargetId(id); setIsAddTimeModalOpen(true); }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </DndContext>
                )}

                {currentView === 'Table' && (
                    <div className="flex-1 min-h-0 bg-slate-50 p-6 overflow-hidden flex flex-col">
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                            <table className="w-full min-w-[1800px] text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="w-[32px] min-w-[32px] max-w-[32px] px-2 py-2 sticky top-0 left-0 z-40 bg-slate-50 border-b border-slate-200">
                                            <div
                                                onClick={toggleAll}
                                                className={cn(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                                                    selectedRows.length === (filteredWorkOrders?.length || 0) && (filteredWorkOrders?.length || 0) > 0
                                                        ? "bg-primary border-primary"
                                                        : "border-slate-200 bg-white hover:border-primary/50"
                                                )}
                                            >
                                                {selectedRows.length === (filteredWorkOrders?.length || 0) && (filteredWorkOrders?.length || 0) > 0 && (
                                                    <Check className="w-3 h-3 text-white stroke-[3px]" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="w-[80px] min-w-[80px] max-w-[80px] px-2 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600 whitespace-nowrap sticky top-0 left-[32px] z-40 bg-slate-50 border-b border-slate-200">WO #</th>
                                        <th className="w-[220px] min-w-[220px] max-w-[220px] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 whitespace-nowrap sticky top-0 left-[112px] z-40 bg-slate-50 border-r border-slate-100 border-b border-slate-200">Work Order Title</th>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 min-w-[300px] whitespace-nowrap sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Description</th>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 min-w-[150px] whitespace-nowrap sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Due Date</th>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 min-w-[150px] whitespace-nowrap sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Start Date</th>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 min-w-[120px] whitespace-nowrap sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Status</th>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 min-w-[120px] whitespace-nowrap sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Priority</th>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 min-w-[150px] whitespace-nowrap sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Category</th>
                                        
                                        {visibleColumns.includes('Asset') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 min-w-[200px] sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Asset</th>}
                                        {visibleColumns.includes('Sector / Location') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 min-w-[200px] sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Sector / Location</th>}
                                        {visibleColumns.includes('Assigned To') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Assigned To</th>}
                                        {visibleColumns.includes('Labor Est.') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 text-center sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Labor Est.</th>}
                                        {visibleColumns.includes('Team') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Team</th>}
                                        {visibleColumns.includes('Requested By') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Requested By</th>}
                                        {visibleColumns.includes('Date Created') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Date Created</th>}
                                        {visibleColumns.includes('Last Updated') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Last Updated</th>}
                                        {visibleColumns.includes('Date Completed') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Date Completed</th>}
                                        {visibleColumns.includes('Archived') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 text-center sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Archived</th>}
                                        {visibleColumns.includes('Closeout Notes') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Closeout Notes</th>}
                                        {visibleColumns.includes('Source Type') && <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 sticky top-0 z-30 bg-slate-50 border-b border-slate-200">Source Type</th>}
                                        
                                        <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 text-right sticky top-0 right-0 z-40 bg-slate-50 border-l border-slate-200 border-b border-slate-200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-6"><div className="w-5 h-5 bg-slate-100 rounded" /></td>
                                                <td colSpan={visibleColumns.length + 9} className="px-4 py-6"><div className="h-4 bg-slate-50 rounded w-full" /></td>
                                            </tr>
                                        ))
                                    ) : (
                                        (filteredWorkOrders as WorkOrderSync[]).map((order) => (
                                            <tr 
                                                key={order.id} 
                                                className={cn(
                                                    "group transition-all cursor-pointer",
                                                    selectedRows.includes(order.id) 
                                                        ? "bg-primary/[0.04] hover:bg-primary/[0.08]" 
                                                        : "hover:bg-slate-50/80"
                                                )}
                                                onClick={() => {
                                                    setSelectedWorkOrder(order);
                                                    setIsDetailModalOpen(true);
                                                }}
                                            >
                                                <td 
                                                    className="w-[32px] min-w-[32px] max-w-[32px] px-2 py-2 sticky left-0 z-20 bg-white group-hover:bg-slate-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleRow(order.id);
                                                    }}
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                        selectedRows.includes(order.id) ? "bg-primary border-primary" : "border-slate-200 bg-white group-hover:border-primary/50"
                                                    )}>
                                                        {selectedRows.includes(order.id) && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                                                    </div>
                                                </td>
                                                
                                                <td className="w-[80px] min-w-[80px] max-w-[80px] px-2 py-2 sticky left-[32px] z-20 bg-white group-hover:bg-slate-50">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                                                            {String(order.woNumber || '').padStart(3, '0')}
                                                        </span>
                                                        {order.dueDate && (
                                                            <CalendarClock className="w-4 h-4 text-rose-500 shrink-0" />
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="w-[220px] min-w-[220px] max-w-[220px] px-4 py-2 sticky left-[112px] z-20 bg-white group-hover:bg-slate-50 border-r border-slate-50">
                                                    <span className="text-[13px] font-black text-slate-900 group-hover:text-primary transition-colors leading-tight truncate block max-w-[180px]">
                                                        {order.title}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                        {order.isShared && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 w-fit bg-emerald-100/50 border border-emerald-200 rounded-md">
                                                                <div className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse" />
                                                                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest italic">Active</span>
                                                            </div>
                                                        )}
                                                        {((order as any).request?.id || (order as any).requestId) && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 w-fit bg-indigo-50 border border-indigo-200 rounded-md shadow-sm" title="Originated from Request">
                                                                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-tight italic">
                                                                    From REQ-{((order as any).request?.id || (order as any).requestId).split('-')[0].toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3">
                                                    <div className="text-[13px] font-medium text-slate-600 truncate max-w-[300px]">
                                                        {order.description || '--'}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-black text-slate-800">
                                                            {order.dueDate ? new Date(order.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {order.dueDate ? new Date(order.dueDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Flexible'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3">
                                                    <span className="text-[13px] font-bold text-slate-600">
                                                        {order.startDate ? new Date(order.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px]",
                                                            order.status === 'Open' ? 'bg-blue-500 shadow-blue-500/40' :
                                                            order.status === 'In Progress' ? 'bg-amber-500 shadow-amber-500/40' :
                                                            order.status === 'Complete' ? 'bg-emerald-500 shadow-emerald-500/40' :
                                                            order.status === 'PENDING_APPROVAL' ? 'bg-purple-500 shadow-purple-500/40' : 'bg-slate-400'
                                                        )} />
                                                        <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">{order.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : order.status}</span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <div className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border transition-colors",
                                                            (order.priority === 'High' || (order as any).priority === 'CRITICAL') ? 'bg-rose-100/50 text-rose-700 border-rose-200' :
                                                            order.priority === 'Medium' ? 'bg-amber-100/50 text-amber-700 border-amber-200' :
                                                            order.priority === 'Low' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200' :
                                                            'bg-slate-100/50 text-slate-700 border-slate-200'
                                                        )}>
                                                            {order.priority || 'NONE'}
                                                        </div>
                                                        {order.isEscalated ? (
                                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200" title="SLA Breach">
                                                                SLA BREACH
                                                            </div>
                                                        ) : order.resolutionTimeTarget ? (
                                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100" title={`Due: ${new Date(order.resolutionTimeTarget).toLocaleString()}`}>
                                                                SLA: {new Date(order.resolutionTimeTarget).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <span className="text-[13px] font-bold text-slate-600">
                                                        {order.category || '--'}
                                                    </span>
                                                </td>

                                                {visibleColumns.includes('Asset') && (
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2 min-w-0 max-w-[200px]">
                                                            <Box className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                            <span className="text-[13px] font-bold text-slate-700 truncate">{order.assetName || 'UNASSIGNED'}</span>
                                                        </div>
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Sector / Location') && (
                                                    <td className="px-6 py-3">
                                                        <div className="text-[13px] font-bold text-slate-600 italic truncate max-w-[200px]">
                                                            {order.locationName || '--'}
                                                        </div>
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Assigned To') && (
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2 min-w-0 max-w-[180px]">
                                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200 shrink-0">
                                                                {(order.assignee || 'U')[0]}
                                                            </div>
                                                            <span className="text-[13px] font-bold text-slate-700 truncate">{order.assignee || 'Unassigned'}</span>
                                                        </div>
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Labor Est.') && (
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="text-[13px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                                            {order.estimatedHours || 0}h
                                                        </span>
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Team') && (
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-3.5 h-3.5 text-slate-500" />
                                                            <span className="text-[13px] font-bold text-slate-700">{order.teamName || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Requested By') && (
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <UserCircle className="w-3.5 h-3.5 text-slate-500" />
                                                            <span className="text-[13px] font-bold text-slate-700">{order.requestedBy || 'SYSTEM'}</span>
                                                        </div>
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Date Created') && (
                                                    <td className="px-6 py-3 text-[13px] font-bold text-slate-600 dark:text-slate-400">
                                                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '--'}
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Last Updated') && (
                                                    <td className="px-6 py-3 text-[13px] font-bold text-slate-600 dark:text-slate-400">
                                                        {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : '--'}
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Date Completed') && (
                                                    <td className="px-6 py-3 text-[13px] font-bold text-slate-600 dark:text-slate-400">
                                                        {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : '--'}
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Archived') && (
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">{order.archived ? 'YES' : 'NO'}</span>
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Closeout Notes') && (
                                                    <td className="px-6 py-3 text-[13px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                                                        {order.resolutionNotes || '--'}
                                                    </td>
                                                )}

                                                {visibleColumns.includes('Source Type') && (
                                                    <td className="px-6 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            {order.isRepeating ? (
                                                                <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-100/50 text-emerald-700 border border-emerald-200 flex items-center gap-1 italic uppercase tracking-wider">
                                                                    <RefreshCcw className="w-2.5 h-2.5" /> PM SCHED
                                                                </span>
                                                            ) : order.isReactive ? (
                                                                <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-100/50 text-rose-700 border border-rose-200 flex items-center gap-1 italic uppercase tracking-wider">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-current opacity-60" /> REACTIVE
                                                                </span>
                                                            ) : (
                                                                <span className="w-fit px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-100/50 text-slate-700 border border-slate-200 flex items-center gap-1 italic uppercase tracking-wider">
                                                                    <Plus className="w-2.5 h-2.5" /> MANUAL
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}

                                                <td className="px-2 py-3 text-right sticky right-0 z-10 bg-white/95 backdrop-blur-sm group-hover:bg-slate-50 border-l border-slate-200 shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                                                    <div className="flex items-center justify-end gap-0.5">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setWorkOrderToDelete(order.id);
                                                                setIsSingleDeleteModalOpen(true);
                                                            }}
                                                            className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-500 text-slate-400 hover:text-white flex items-center justify-center transition-all group/delete border border-slate-200 shadow-sm active:scale-90"
                                                            title="Delete Work Order"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 group-hover/delete:scale-110 transition-transform" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                shareWorkOrder.mutate(order.id);
                                                            }}
                                                            className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all group/share border border-primary/20 shadow-sm active:scale-95"
                                                            title="Share with Vendor"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5 group-hover/share:scale-110 transition-transform" />
                                                        </button>

                                                        {order.isShared && order.shareToken && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (order.shareToken) copyExternalLink(order.shareToken);
                                                                }}
                                                                className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white flex items-center justify-center transition-all group/copy border border-emerald-500/20 shadow-sm active:scale-95"
                                                                title="Copy Link"
                                                            >
                                                                <Link2 className="w-3.5 h-3.5 group-hover/copy:rotate-12 transition-transform" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>

                        {!isLoading && filteredWorkOrders.length === 0 && (
                            <div className="py-6">
                                <EmptyState
                                    variant="search"
                                    title="No work orders match your filters"
                                    description="Try clearing some filters or adjusting your search term to see results."
                                    size="md"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

                {currentView === 'Calendar' && (
                    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-700">
                        {/* EXECUTIVE MASTER HEADER */}
                        <div className="flex items-center justify-between px-10 py-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-3xl">
                            <div className="flex items-center gap-10">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400 dark:text-white/40 hover:text-primary dark:hover:text-white">
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <h2 className="text-[28px] font-black text-slate-900 dark:text-white italic tracking-tighter uppercase min-w-[280px] text-center">
                                            {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </h2>
                                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400 dark:text-white/40 hover:text-primary dark:hover:text-white">
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2 opacity-40 italic text-center">Executive Master Schedule</p>
                                </div>

                                <div className="h-12 w-px bg-white/5" />
                            </div>

                            <div className="flex items-center gap-4">
                                <button onClick={handleToday} className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black text-white hover:bg-white/10 transition-all active:scale-95 uppercase tracking-widest italic shadow-inner">Return to Now</button>
                                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1.5 shadow-inner">
                                    <button onClick={() => setCalendarMode('Month')} className={cn("px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all", calendarMode === 'Month' ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-white")}>Month</button>
                                    <button onClick={() => setCalendarMode('Week')} className={cn("px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all", calendarMode === 'Week' ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-white")}>Week</button>
                                </div>
                            </div>
                        </div>

                        {/* MASTER CALENDAR GRID */}
                        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-black p-6 custom-scrollbar">
                            <div className="min-w-[1000px] h-full flex flex-col bg-white dark:bg-white/[0.01] rounded-[48px] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden backdrop-blur-3xl">
                                {/* DAYS OF WEEK */}
                                <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02] sticky top-0 z-20">
                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                                        <div key={day} className="py-4 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic opacity-40">{day}</div>
                                    ))}
                                </div>

                                {/* CALENDAR CELLS */}
                                <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                                    {(calendarMode === 'Week' ? getWeekDays(calendarDate) : getCalendarDays(calendarDate)).map((dayInfo, i) => {
                                        const { day, month, fullDate } = dayInfo;
                                        const isToday = fullDate.toDateString() === new Date().toDateString();
                                        const isOutsideMonth = month !== 'current';

                                        const y = fullDate.getFullYear();
                                        const m = String(fullDate.getMonth() + 1).padStart(2, '0');
                                        const d = String(fullDate.getDate()).padStart(2, '0');
                                        const localDateStr = `${y}-${m}-${d}`;

                                        const dayWorkOrders = filteredWorkOrders.filter(wo => {
                                            const dateObj = wo.dueDate ? new Date(wo.dueDate) : wo.startDate ? new Date(wo.startDate) : null;
                                            if (!dateObj) return false;
                                            const y = dateObj.getFullYear();
                                            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                            const d = String(dateObj.getDate()).padStart(2, '0');
                                            const woDate = `${y}-${m}-${d}`;
                                            return woDate === localDateStr;
                                        });

                                        return (
                                            <div key={i} className={cn(
                                                "border-r border-b border-slate-100 dark:border-white/5 p-4 min-h-[160px] transition-all hover:bg-slate-50 dark:hover:bg-white/[0.04] group relative",
                                                isToday ? "bg-primary/[0.03]" : "bg-transparent",
                                                isOutsideMonth && "opacity-20 pointer-events-none"
                                            )}>
                                                <div className="flex justify-between items-start">
                                                    <span className={cn(
                                                        "text-[16px] font-black italic p-2 rounded-2xl w-10 h-10 flex items-center justify-center transition-all",
                                                        isToday ? "bg-primary text-white shadow-2xl shadow-primary/40 rotate-12 scale-110" :
                                                        "text-slate-400 dark:text-white/40 group-hover:text-primary dark:group-hover:text-white"
                                                    )}>
                                                        {day < 10 ? `0${day}` : day}
                                                    </span>
                                                    {dayWorkOrders.length > 0 && (
                                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                    )}
                                                </div>

                                                <div className="mt-6 space-y-2 overflow-hidden">
                                                    {dayWorkOrders.map((wo: WorkOrderSync) => (
                                                        <motion.div 
                                                            key={wo.id} 
                                                            whileHover={{ scale: 1.05 }}
                                                            className="cursor-pointer group/wo"
                                                            onClick={() => { setSelectedWorkOrder(wo); setIsDetailModalOpen(true); }}
                                                        >
                                                            <div className="px-3 py-2 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-lg backdrop-blur-sm">
                                                                <div className="flex flex-col gap-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-[9px] font-black text-primary uppercase italic opacity-80 shrink-0">
                                                                            {wo.dueDate ? new Date(wo.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00'}
                                                                        </span>
                                                                        {wo.priority === 'High' && (
                                                                            <span className="text-[7px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 rounded uppercase italic">Downtime Critical</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[11px] font-black text-slate-800 dark:text-white/90 truncate uppercase italic tracking-tighter group-hover/wo:text-primary transition-colors">
                                                                        {wo.title}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pagination Footer - Optimized for space and persistence (Visible across all views) */}
                {meta && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-2 border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-[100] shrink-0">
                        <div className="text-[10px] font-black italic text-muted-foreground uppercase tracking-widest opacity-60">
                            {(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)} OF {meta.total} MISSION RECORDS
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={meta.page === 1}
                                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest italic text-foreground hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                            >
                                <ChevronLeft className="w-3 h-3" />
                                PREV
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {[...Array(Math.min(5, meta.totalPages))].map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={cn(
                                                "w-8 h-8 rounded-xl text-[11px] font-black italic transition-all",
                                                meta.page === pageNum ? "bg-primary text-white shadow-lg shadow-primary/20 rotate-6" : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(meta.totalPages || 1, prev + 1))}
                                disabled={meta.page === meta.totalPages}
                                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest italic text-foreground hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                            >
                                NEXT
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Work Order Detail Modal */}
            {selectedWorkOrder && (
                <WorkOrderDetailModal 
                    isOpen={isDetailModalOpen} 
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedWorkOrder(null);
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('id');
                        setSearchParams(newParams);
                        if (paramId) {
                            navigate('/work-orders');
                        }
                    }} 
                    workOrder={selectedWorkOrder} 
                />
            )}
            {/* Create Work Order Modal */}
            <CreateWorkOrderModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />

            {/* Add Time Modal */}
            {timeLogTargetId && (
                <AddTimeModal 
                    isOpen={isAddTimeModalOpen} 
                    onClose={() => {
                        setIsAddTimeModalOpen(false);
                        setTimeLogTargetId(null);
                    }} 
                    workOrderId={timeLogTargetId}
                    defaultWorkerId={selectedAssigneeIds[0]} // Optional: default to first filtered worker
                />
            )}

            <ConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={() => {
                    bulkDeleteMutation.mutate(selectedRows);
                    setIsBulkDeleteModalOpen(false);
                }}
                title="Delete Work Orders"
                message={`Are you sure you want to permanently delete ${selectedRows.length} selected work orders? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                isLoading={bulkDeleteMutation.isPending}
            />

            <ConfirmationModal
                isOpen={isSingleDeleteModalOpen}
                onClose={() => {
                    setIsSingleDeleteModalOpen(false);
                    setWorkOrderToDelete(null);
                }}
                onConfirm={() => {
                    if (workOrderToDelete) {
                        deleteWorkOrder.mutate(workOrderToDelete);
                    }
                    setIsSingleDeleteModalOpen(false);
                    setWorkOrderToDelete(null);
                }}
                title="Abort Work Order"
                message="Are you sure you want to ABORT this mission and permanently delete this work order? This action cannot be undone."
                confirmText="Abort Mission"
                variant="danger"
                isLoading={deleteWorkOrder.isPending}
            />

            {renderBulkActions()}
        </div>
    );
};

export default WorkOrdersPage;
