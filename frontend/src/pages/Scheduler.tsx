import { useState, useMemo } from 'react';
import { 
    RotateCcw 
} from 'lucide-react';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useUsers } from '../hooks/useUsers';
import { useTeams } from '../hooks/useTeams';
import { useLocations, useAssets, useSavedViews } from '../hooks/useData';

import { 
    DndContext, 
    DragOverlay, 
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import { SchedulerHeader } from '../components/scheduler/SchedulerHeader';
import { UnscheduledSection } from '../components/scheduler/UnscheduledSection';
import { TeamScheduleSection } from '../components/scheduler/TeamScheduleSection';
import { ConfigureTagsModal, type TagConfig } from '../components/scheduler/ConfigureTagsModal';
import { WorkOrderDetailModal } from '../components/WorkOrderDetailModal';
import { type WorkOrderSync } from '../lib/db';
import { toast } from 'react-hot-toast';
import { ScheduleRisksModal } from '../components/ScheduleRisksModal';
import { ScheduleSettingsModal } from '../components/ScheduleSettingsModal';
import { EditWorkOrderModal } from '../components/EditWorkOrderModal';
import { SavedViewsModal } from '../components/SavedViewsModal';
import { SmartScheduleModal } from '../components/SmartScheduleModal';
import { 
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addHours, 
    addDays,
} from 'date-fns';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileScheduler } from './MobileScheduler';
import { MobileWorkOrderDetail } from './MobileWorkOrderDetail';


export const Scheduler = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const isMobile = useMediaQuery('(max-width: 767px)');

    // 1. Core Data
    const { data: users, isLoading: userLoading } = useUsers();
    const [selectedWo, setSelectedWo] = useState<WorkOrderSync | null>(null);
    const [editingWo, setEditingWo] = useState<WorkOrderSync | null>(null);
    const [draggedWoId, setDraggedWoId] = useState<UniqueIdentifier | null>(null);
    const [isHidden, setIsHidden] = useState(false);
    const [activeView, setActiveView] = useState('Day');
    const [showSmartScheduleModal, setShowSmartScheduleModal] = useState(false);
    
    // Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [showScheduleFilters, setShowScheduleFilters] = useState(false);
    
    // Tag Config
    const [tagConfig, setTagConfig] = useState<TagConfig[]>(() => {
        const saved = localStorage.getItem('cmms-scheduler-tag-config');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return [
            { id: 'status', label: 'Status', visible: true },
            { id: 'asset', label: 'Asset', visible: true },
            { id: 'location', label: 'Location', visible: true },
            { id: 'category', label: 'Category', visible: true },
        ];
    });
    const [showTagsModal, setShowTagsModal] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);
    const [showRisksModal, setShowRisksModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showViewDropdown, setShowViewDropdown] = useState(false);

    // Saved Views
    const { data: savedViews = [], createView, deleteView } = useSavedViews('SCHEDULER');
    const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);
    
    // Timeline & Capacity Config
    const [scheduleConfig, setScheduleConfig] = useState({
        visibleUnits: 8,
        timeGranularity: '1h',
        defaultDailyHours: 8,
        startTime: 8,
        endTime: 17,
        workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });

    const timelineStartHour = scheduleConfig.startTime;
    const timelineEndHour = scheduleConfig.endTime;
    const [roleFilter, setRoleFilter] = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [sortField, setSortField] = useState<'firstName' | 'lastName'>('firstName');
    
    // UI Local state for filters before "Apply"
    const [localRole, setLocalRole] = useState('');
    const [localTeam, setLocalTeam] = useState('');
    const [localLocation, setLocalLocation] = useState('');

    const [rowsToShow, setRowsToShow] = useState(2); // Default to 2 rows

    // New Work Order Filter States for Scheduler
    const [woSortField, setWoSortField] = useState<string>('Priority');
    const [woPriorityFilter, setWoPriorityFilter] = useState<string>('');
    const [woAssigneeFilter, setWoAssigneeFilter] = useState<string>('');
    const [woCategoryFilter, setWoCategoryFilter] = useState<string>('');
    const [woAssetFilter, setWoAssetFilter] = useState<string>('');
    const [woLocationFilter, setWoLocationFilter] = useState<string>('');
    const [woStatusFilter, setWoStatusFilter] = useState<string>('');
    const [woDueDateFilter, setWoDueDateFilter] = useState<string>('');
    const [woTeamFilter, setWoTeamFilter] = useState<string>('');

    const categories = ['Damage', 'Electrical', 'Inspection', 'Meter Reading', 'None', 'Preventative', 'Project', 'Safety', 'Upgrade'];


    // ─── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Converts the human-readable due-date dropdown value into ISO date range
     * params that the backend understands.
     */
    const dueDateToRange = (filter: string): { dueDateStart?: string; dueDateEnd?: string } => {
        const today = new Date();
        if (filter === 'Today') {
            return { dueDateStart: startOfDay(today).toISOString(), dueDateEnd: endOfDay(today).toISOString() };
        }
        if (filter === 'This Week') {
            return { dueDateStart: today.toISOString(), dueDateEnd: addDays(today, 7).toISOString() };
        }
        if (filter === 'This Month') {
            return { dueDateStart: startOfMonth(today).toISOString(), dueDateEnd: endOfMonth(today).toISOString() };
        }
        if (filter === 'Overdue') {
            return { dueDateEnd: startOfDay(today).toISOString() };
        }
        // 'Not Set' is handled client-side after fetch
        return {};
    };

    /**
     * Maps the UI sort label to the Prisma field name used by the backend.
     */
    const sortFieldToBackend = (field: string): { sortBy?: string; sortOrder?: string } => {
        if (field === 'Due Date')      return { sortBy: 'dueDate',        sortOrder: 'asc' };
        if (field === 'Duration')      return { sortBy: 'estimatedHours', sortOrder: 'desc' };
        if (field === 'Work Order Number') return { sortBy: 'workOrderNo',    sortOrder: 'desc' };
        // 'Priority' — backend alphabetic sort isn't ideal; let backend default and sort client-side
        return {};
    };

    // ─── Timeline date range (for scheduled WOs query) ──────────────────────────
    const timelineRange = useMemo(() => {
        if (activeView === 'Day') {
            return { startDateStart: startOfDay(currentDate).toISOString(), startDateEnd: endOfDay(currentDate).toISOString() };
        }
        if (activeView === 'Week') {
            return { startDateStart: startOfWeek(currentDate).toISOString(), startDateEnd: endOfWeek(currentDate).toISOString() };
        }
        // Month
        return { startDateStart: startOfMonth(currentDate).toISOString(), startDateEnd: endOfMonth(currentDate).toISOString() };
    }, [currentDate, activeView]);

    // ─── Query 1: Unscheduled WOs — all active filters sent to backend ───────────
    const dueDateRange = useMemo(() => dueDateToRange(woDueDateFilter), [woDueDateFilter]);
    const backendSort  = useMemo(() => sortFieldToBackend(woSortField), [woSortField]);

    const {
        workOrders: rawUnscheduled,
        isLoading: unscheduledLoading,
        updateAssignment,
        smartSchedule,
        refetchWorkOrders: refetchUnscheduled,
    } = useWorkOrders({
        isScheduled:    'false',
        priority:       woPriorityFilter  || undefined,
        status:         woStatusFilter    || undefined,
        assignedToId:   woAssigneeFilter  || undefined,
        category:       woCategoryFilter  || undefined,
        assetId:        woAssetFilter     || undefined,
        locationId:     woLocationFilter  || undefined,
        assignedTeamId: woTeamFilter      || undefined,
        ...dueDateRange,
        ...backendSort,
        limit: 500,
    });

    // For 'Not Set' due-date filter (no dueDate field) — handled client-side
    // since the backend can't easily express "dueDate IS NULL" via the range params
    const unscheduledWOs = useMemo(() => {
        let items = [...(rawUnscheduled || [])];
        if (woDueDateFilter === 'Not Set') {
            items = items.filter(wo => !wo.dueDate);
        }
        if (woDueDateFilter === 'Overdue') {
            // additionally exclude already-completed ones
            items = items.filter(wo => wo.status !== 'COMPLETED' && wo.status !== 'Complete');
        }
        // Priority sort is done client-side since DB alphabetical sort isn't ideal
        if (woSortField === 'Priority') {
            const rank = (p?: string) => p === 'Critical' || p === 'CRITICAL' ? 4 : p === 'High' || p === 'HIGH' ? 3 : p === 'Medium' || p === 'MEDIUM' ? 2 : 1;
            items.sort((a, b) => rank(b.priority) - rank(a.priority));
        }
        return items;
    }, [rawUnscheduled, woDueDateFilter, woSortField]);

    // ─── Query 2: Scheduled WOs — only those within the current view's date window ─
    const {
        workOrders: scheduledWOs,
        isLoading: scheduledLoading,
        refetchWorkOrders: refetchScheduled,
    } = useWorkOrders({
        isScheduled: 'true',
        ...timelineRange,
        limit: 1000,
    });

    const refetchWorkOrders = () => {
        refetchUnscheduled();
        refetchScheduled();
    };

    const woLoading = unscheduledLoading || scheduledLoading;
    const workOrders = useMemo(() => [...(rawUnscheduled || []), ...(scheduledWOs || [])], [rawUnscheduled, scheduledWOs]);

    const [detailInitialTab, setDetailInitialTab] = useState('Overview');
    const [autoOpenLinkModal, setAutoOpenLinkModal] = useState(false);

    // Register global link opener for DraggableCard
    (window as any).openWoLinks = (wo: WorkOrderSync) => {
        setSelectedWo(wo);
        setDetailInitialTab('Links');
        setAutoOpenLinkModal(true);
    };

    const { data: locations } = useLocations();
    const { data: assets } = useAssets();
    const { data: teams } = useTeams();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );


    const startOfOfDayCached = (d: Date) => startOfDay(d);

    const timeSlots = useMemo(() => {
        if (activeView === 'Day') {
            const range = timelineEndHour - timelineStartHour + 1;
            return Array.from({ length: range > 0 ? range : 10 }, (_, i) => addHours(startOfDay(currentDate), timelineStartHour + i));
        }
        if (activeView === 'Week') {
            const start = addDays(currentDate, -currentDate.getDay()); // Sunday
            return Array.from({ length: 7 }, (_, i) => addDays(startOfOfDayCached(start), i));
        }
        // Month: simplified to 30 days or actual month days
        const start = startOfDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => addDays(start, i));
    }, [currentDate, activeView, timelineStartHour, timelineEndHour]);

    const handleDragStart = (event: DragStartEvent) => {
        setDraggedWoId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggedWoId(null);
        if (!event.over) return;

        const wo = event.active.data.current?.wo as WorkOrderSync;
        const targetUserId = event.over.data.current?.userId;
        const targetTime = event.over.data.current?.time;

        if (wo && targetUserId && targetTime) {
            updateAssignment.mutate({
                id: wo.id,
                assigneeId: targetUserId,
                startDate: targetTime.toISOString()
            });
        }
    };

    const handlePrevDay = () => setCurrentDate(addDays(currentDate, -1));
    const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const handleSmartSchedule = () => {
        setShowSmartScheduleModal(true);
    };

    const handleRemoveFromSchedule = (id: string) => {
        updateAssignment.mutate({
            id,
            assigneeId: null,
            startDate: null
        });
    };

    const handleRemoveAllOverdue = (ids: string[]) => {
        // Since we have updateAssignment, we can loop or use a bulk endpoint if available
        ids.forEach(id => handleRemoveFromSchedule(id));
        toast.success(`Backlog Recovery: ${ids.length} missions returned to Unscheduled.`);
        setShowRisksModal(false);
    };

    const hasActiveFilters = useMemo(() => {
        return !!(
            woPriorityFilter ||
            woAssigneeFilter ||
            woCategoryFilter ||
            woAssetFilter ||
            woLocationFilter ||
            woStatusFilter ||
            woDueDateFilter ||
            woTeamFilter ||
            woSortField !== 'Priority'
        );
    }, [
        woPriorityFilter,
        woAssigneeFilter,
        woCategoryFilter,
        woAssetFilter,
        woLocationFilter,
        woStatusFilter,
        woDueDateFilter,
        woTeamFilter,
        woSortField
    ]);

    const handleSaveCurrentView = (name: string) => {
        createView.mutate({
            name,
            entityType: 'SCHEDULER',
            config: {
                woSortField,
                woPriorityFilter,
                woAssigneeFilter,
                woCategoryFilter,
                woAssetFilter,
                woLocationFilter,
                woStatusFilter,
                woDueDateFilter,
                woTeamFilter
            }
        }, {
            onSuccess: () => {
                toast.success(`View "${name}" saved successfully!`);
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || 'Failed to save view');
            }
        });
    };

    const handleApplySavedView = (config: any) => {
        if (config.woSortField) setWoSortField(config.woSortField);
        if (config.hasOwnProperty('woPriorityFilter')) setWoPriorityFilter(config.woPriorityFilter);
        if (config.hasOwnProperty('woAssigneeFilter')) setWoAssigneeFilter(config.woAssigneeFilter);
        if (config.hasOwnProperty('woCategoryFilter')) setWoCategoryFilter(config.woCategoryFilter);
        if (config.hasOwnProperty('woAssetFilter')) setWoAssetFilter(config.woAssetFilter);
        if (config.hasOwnProperty('woLocationFilter')) setWoLocationFilter(config.woLocationFilter);
        if (config.hasOwnProperty('woStatusFilter')) setWoStatusFilter(config.woStatusFilter);
        if (config.hasOwnProperty('woDueDateFilter')) setWoDueDateFilter(config.woDueDateFilter);
        if (config.hasOwnProperty('woTeamFilter')) setWoTeamFilter(config.woTeamFilter);
        toast.success('Saved view applied!');
    };

    const handleDeleteSavedView = (id: string) => {
        deleteView.mutate(id, {
            onSuccess: () => {
                toast.success('Saved view deleted.');
            }
        });
    };

    if (woLoading || userLoading) return (
        <div className="flex items-center justify-center h-full">
            <RotateCcw className="w-8 h-8 text-primary animate-spin" />
        </div>
    );

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden w-full">
                {/* Header */}
                <SchedulerHeader 
                    onReload={() => window.location.reload()}
                    onSave={() => toast.success('Quantum Sync: Assignments mirrored to Secure Cloud.')}
                    onSmartSchedule={handleSmartSchedule}
                    isOptimizing={smartSchedule.isPending}
                    onOpenSavedViews={() => setIsSavedViewsOpen(true)}
                />

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                    {/* Unscheduled Section */}
                    <UnscheduledSection 
                        unscheduledWOs={unscheduledWOs}
                        rowsToShow={rowsToShow}
                        setRowsToShow={setRowsToShow}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        woSortField={woSortField}
                        setWoSortField={setWoSortField}
                        woPriorityFilter={woPriorityFilter}
                        setWoPriorityFilter={setWoPriorityFilter}
                        woAssigneeFilter={woAssigneeFilter}
                        setWoAssigneeFilter={setWoAssigneeFilter}
                        woCategoryFilter={woCategoryFilter}
                        setWoCategoryFilter={setWoCategoryFilter}
                        woAssetFilter={woAssetFilter}
                        setWoAssetFilter={setWoAssetFilter}
                        woLocationFilter={woLocationFilter}
                        setWoLocationFilter={setWoLocationFilter}
                        woStatusFilter={woStatusFilter}
                        setWoStatusFilter={setWoStatusFilter}
                        woDueDateFilter={woDueDateFilter}
                        setWoDueDateFilter={setWoDueDateFilter}
                        woTeamFilter={woTeamFilter}
                        setWoTeamFilter={setWoTeamFilter}
                        assets={assets || []}
                        categories={categories}
                        locations={locations || []}
                        teams={teams || []}
                        users={users || []}
                        tagConfig={tagConfig}
                        onOpenTagsModal={() => setShowTagsModal(true)}
                        isHidden={isHidden}
                        setIsHidden={setIsHidden}
                        onRefetch={() => {
                            refetchWorkOrders();
                            toast.success('Synchronizing tactical backlog...');
                        }}
                        onSelectWo={setSelectedWo}
                        onEditWo={setEditingWo}
                        onOpenSavedViews={() => setIsSavedViewsOpen(true)}
                    />

                    {/* Team Schedule Section */}
                    <TeamScheduleSection 
                        currentDate={currentDate}
                        handlePrevDay={handlePrevDay}
                        handleNextDay={handleNextDay}
                        handleToday={handleToday}
                        scheduledWOs={scheduledWOs}
                        showAlerts={showAlerts}
                        setShowAlerts={setShowAlerts}
                        setSelectedWo={setSelectedWo}
                        setShowRisksModal={setShowRisksModal}
                        showScheduleFilters={showScheduleFilters}
                        setShowScheduleFilters={setShowScheduleFilters}
                        sortField={sortField}
                        setSortField={setSortField}
                        localLocation={localLocation}
                        setLocalLocation={setLocalLocation}
                        localTeam={localTeam}
                        setLocalTeam={setLocalTeam}
                        localRole={localRole}
                        setLocalRole={setLocalRole}
                        locations={locations || []}
                        teams={teams || []}
                        setLocationFilter={setLocationFilter}
                        setTeamFilter={setTeamFilter}
                        setRoleFilter={setRoleFilter}
                        setShowSettingsModal={setShowSettingsModal}
                        activeView={activeView}
                        setActiveView={setActiveView}
                        showViewDropdown={showViewDropdown}
                        setShowViewDropdown={setShowViewDropdown}
                        timeSlots={timeSlots}
                        users={users || []}
                        roleFilter={roleFilter}
                        locationFilter={locationFilter}
                        teamFilter={teamFilter}
                        scheduleConfig={scheduleConfig}
                        setEditingWo={setEditingWo}
                        tagConfig={tagConfig}
                    />

                </div>

                {/* Detail Modal */}
                {selectedWo && (
                    <WorkOrderDetailModal 
                        isOpen={!!selectedWo} 
                        onClose={() => {
                            setSelectedWo(null);
                            setDetailInitialTab('Overview');
                            setAutoOpenLinkModal(false);
                        }} 
                        workOrder={selectedWo!} 
                        initialTab={detailInitialTab}
                        autoOpenLinkModal={autoOpenLinkModal}
                    />
                )}

                {/* Settings Modal */}
                <ScheduleSettingsModal
                    isOpen={showSettingsModal}
                    onClose={() => setShowSettingsModal(false)}
                    currentSettings={scheduleConfig}
                    onSave={(newSettings) => {
                        setScheduleConfig(newSettings);
                        setShowSettingsModal(false);
                        toast.success('Operational configuration updated.');
                    }}
                />

                {/* Risks Modal */}
                <ScheduleRisksModal 
                    isOpen={showRisksModal} 
                    onClose={() => setShowRisksModal(false)} 
                    workOrders={workOrders || []}
                    onRemoveFromSchedule={handleRemoveFromSchedule}
                    onRemoveAll={handleRemoveAllOverdue}
                />

                {/* Edit Modal */}
                {editingWo && (
                    <EditWorkOrderModal 
                        isOpen={!!editingWo}
                        onClose={() => setEditingWo(null)}
                        workOrder={editingWo!}
                    />
                )}

                {/* Configure Tags Modal */}
                <ConfigureTagsModal 
                    isOpen={showTagsModal}
                    onClose={() => setShowTagsModal(false)}
                    tagConfig={tagConfig}
                    onSave={(newConfig) => {
                        setTagConfig(newConfig);
                        localStorage.setItem('cmms-scheduler-tag-config', JSON.stringify(newConfig));
                        setShowTagsModal(false);
                    }}
                />

                {/* Saved Views Modal */}
                <SavedViewsModal 
                    isOpen={isSavedViewsOpen}
                    onClose={() => setIsSavedViewsOpen(false)}
                    savedViews={savedViews}
                    onApply={handleApplySavedView}
                    onDelete={handleDeleteSavedView}
                    onSaveCurrent={handleSaveCurrentView}
                    hasActiveFilters={hasActiveFilters}
                />

                {/* Smart Schedule Modal */}
                <SmartScheduleModal 
                    isOpen={showSmartScheduleModal}
                    onClose={() => setShowSmartScheduleModal(false)}
                    currentDate={currentDate}
                />

                {/* Detail Modal */}
                {selectedWo && (
                    <WorkOrderDetailModal 
                        isOpen={!!selectedWo} 
                        onClose={() => {
                            setSelectedWo(null);
                            setDetailInitialTab('Overview');
                            setAutoOpenLinkModal(false);
                        }} 
                        workOrder={selectedWo!} 
                        initialTab={detailInitialTab}
                        autoOpenLinkModal={autoOpenLinkModal}
                    />
                )}


                {/* Drag Overlay for smooth UI */}
                <DragOverlay>
                    {draggedWoId ? (
                        <div className="bg-white border-2 border-primary/30 rounded-2xl p-5 shadow-2xl scale-105 opacity-90 w-64">
                            <div className="text-[14px] font-black text-slate-800">
                                {workOrders?.find((w: WorkOrderSync) => w.id === draggedWoId)?.title || "Moving..."}
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};
