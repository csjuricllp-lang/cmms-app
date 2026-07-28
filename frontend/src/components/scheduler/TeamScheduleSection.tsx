import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, Eye, Filter, Settings, ChevronDown, Check, User as UserIcon } from 'lucide-react';
import { format, parseISO, isSameDay, startOfHour } from 'date-fns';
import { cn } from '../../lib/utils';
import { DroppableSlot } from './DroppableSlot';
import { TimelineCard } from './TimelineCard';
import { type WorkOrderSync } from '../../lib/db';
import { type User } from '../../hooks/useUsers';
import { type TagConfig } from './ConfigureTagsModal';

interface TeamScheduleSectionProps {
    currentDate: Date;
    handlePrevDay: () => void;
    handleNextDay: () => void;
    handleToday: () => void;
    scheduledWOs: WorkOrderSync[];
    showAlerts: boolean;
    setShowAlerts: (show: boolean) => void;
    setSelectedWo: (wo: WorkOrderSync) => void;
    setShowRisksModal: (show: boolean) => void;
    showScheduleFilters: boolean;
    setShowScheduleFilters: (show: boolean) => void;
    sortField: 'firstName' | 'lastName';
    setSortField: (field: 'firstName' | 'lastName') => void;
    localLocation: string;
    setLocalLocation: (l: string) => void;
    localTeam: string;
    setLocalTeam: (t: string) => void;
    localRole: string;
    setLocalRole: (r: string) => void;
    locations: any[];
    teams: any[];
    setLocationFilter: (l: string) => void;
    setTeamFilter: (t: string) => void;
    setRoleFilter: (r: string) => void;
    setShowSettingsModal: (show: boolean) => void;
    activeView: string;
    setActiveView: (view: string) => void;
    showViewDropdown: boolean;
    setShowViewDropdown: (show: boolean) => void;
    timeSlots: Date[];
    users: User[];
    roleFilter: string;
    locationFilter: string;
    teamFilter: string;
    scheduleConfig: any;
    setEditingWo: (wo: WorkOrderSync) => void;
    tagConfig: TagConfig[];
}

export const TeamScheduleSection = ({
    currentDate,
    handlePrevDay,
    handleNextDay,
    handleToday,
    scheduledWOs,
    showAlerts,
    setShowAlerts,
    setSelectedWo,
    setShowRisksModal,
    showScheduleFilters,
    setShowScheduleFilters,
    sortField,
    setSortField,
    localLocation,
    setLocalLocation,
    localTeam,
    setLocalTeam,
    localRole,
    setLocalRole,
    locations,
    teams,
    setLocationFilter,
    setTeamFilter,
    setRoleFilter,
    setShowSettingsModal,
    activeView,
    setActiveView,
    showViewDropdown,
    setShowViewDropdown,
    timeSlots,
    users,
    roleFilter,
    locationFilter,
    teamFilter,
    scheduleConfig,
    setEditingWo,
    tagConfig
}: TeamScheduleSectionProps) => {
    const alertsRef = useRef<HTMLDivElement>(null);
    const filtersRef = useRef<HTMLDivElement>(null);
    const viewDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
                setShowAlerts(false);
            }
        }
        if (showAlerts) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showAlerts, setShowAlerts]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
                setShowScheduleFilters(false);
            }
        }
        if (showScheduleFilters) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showScheduleFilters, setShowScheduleFilters]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
                setShowViewDropdown(false);
            }
        }
        if (showViewDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showViewDropdown, setShowViewDropdown]);

    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-[18px] font-black text-[#1E293B]">Team Schedule</h2>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
                        <button onClick={handleToday} className="px-3 py-1.5 hover:bg-gray-50 rounded-lg text-[13px] font-bold text-gray-600 transition-colors active:bg-gray-100">Today</button>
                        <div className="flex items-center px-4 gap-4 border-l border-gray-50 ml-1">
                            <button onClick={handlePrevDay} className="p-1 hover:text-primary transition-colors active:scale-125"><ChevronLeft className="w-4 h-4" /></button>
                            <div className="flex items-center gap-2 text-[13px] font-bold text-gray-600 min-w-[180px] justify-center">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                {format(currentDate, 'EEEE, MMMM dd, yyyy')}
                            </div>
                            <button onClick={handleNextDay} className="p-1 hover:text-primary transition-colors active:scale-125"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 relative">
                        <div ref={alertsRef} className="relative">
                            <button 
                                onClick={() => setShowAlerts(!showAlerts)} 
                                className={cn(
                                    "p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-rose-500 transition-all relative shadow-sm active:scale-95",
                                    showAlerts && "text-rose-500 border-rose-200 bg-rose-50/30"
                                )}
                            >
                                <AlertCircle className="w-5 h-5" />
                                {scheduledWOs.filter((w: any) => w.priority === 'High').length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#F8FAFC]">
                                        {scheduledWOs.filter((w: any) => w.priority === 'High').length}
                                    </span>
                                )}
                            </button>

                            {showAlerts && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                                        <span className="text-[12px] font-black text-rose-600 uppercase tracking-widest">Critical Missions</span>
                                        <button 
                                            onClick={() => {
                                                setShowRisksModal(true);
                                                setShowAlerts(false);
                                            }}
                                            className="text-[10px] font-black text-rose-500 hover:text-rose-700 underline underline-offset-4 uppercase transition-colors"
                                        >
                                            Scale Assessment
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                                        {scheduledWOs.filter((w: any) => w.priority === 'High').length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 font-bold text-[13px] italic">No critical missions detected.</div>
                                        ) : (
                                            scheduledWOs.filter((w: any) => w.priority === 'High').map((wo: any) => (
                                                <button 
                                                    key={wo.id}
                                                    onClick={() => {
                                                        setSelectedWo(wo);
                                                        setShowAlerts(false);
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-all group flex items-start gap-3"
                                                >
                                                    <div className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 animate-pulse ring-4 ring-rose-500/10" />
                                                    <div className="flex-1">
                                                        <div className="text-[13px] font-black text-slate-700 leading-none mb-1 group-hover:text-primary transition-colors">#{wo.woNumber?.padStart(3, '0')}: {wo.title}</div>
                                                        <div className="text-[11px] font-bold text-slate-400 capitalize">{wo.assetName || 'Primary System'} • {format(parseISO(wo.startDate!), 'h:mm a')}</div>
                                                    </div>
                                                    <Eye className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors mt-1" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div ref={filtersRef} className="relative">
                            <button 
                                onClick={() => setShowScheduleFilters(!showScheduleFilters)} 
                                className={cn("p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-primary transition-colors shadow-sm active:scale-95", showScheduleFilters && "text-primary border-primary/20")}
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            
                            {showScheduleFilters && (
                                <div className="absolute top-full right-0 mt-3 w-[600px] bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[60] overflow-hidden animate-in fade-in zoom-in slide-in-from-top-2 duration-300">
                                    <div className="flex h-[320px]">
                                        <div className="w-1/2 p-6 border-r border-gray-100">
                                            <h3 className="text-[16px] font-black text-slate-800 mb-6">Sort</h3>
                                            <div className="space-y-2">
                                                {['firstName', 'lastName'].map((f) => (
                                                    <button 
                                                        key={f}
                                                        onClick={() => setSortField(f as any)}
                                                        className={cn(
                                                            "w-full px-4 py-3 rounded-xl text-[14px] font-bold text-left transition-all flex items-center justify-between group",
                                                            sortField === f ? "bg-slate-50 text-primary border border-primary/10 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {f === 'firstName' ? 'First Name' : 'Last Name'}
                                                        <ChevronDown className={cn("w-4 h-4 text-slate-300 transform transition-transform", sortField === f && "rotate-180 text-primary")} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="w-1/2 p-6 space-y-6">
                                            <h3 className="text-[16px] font-black text-slate-800">Filters</h3>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[12px] font-black text-slate-500">Location</label>
                                                    <select 
                                                        value={localLocation}
                                                        onChange={(e) => setLocalLocation(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none appearance-none pr-8"
                                                    >
                                                        <option value="">Select Location</option>
                                                        {locations?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[12px] font-black text-slate-500">Team</label>
                                                    <select 
                                                        value={localTeam}
                                                        onChange={(e) => setLocalTeam(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none appearance-none pr-8"
                                                    >
                                                        <option value="">Select Team</option>
                                                        {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[12px] font-black text-slate-500">Account Type</label>
                                                    <select 
                                                        value={localRole}
                                                        onChange={(e) => setLocalRole(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none appearance-none pr-8"
                                                    >
                                                        <option value="">Select Account Type</option>
                                                        {['Technician', 'Administrator', 'Manager'].map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
                                        <button 
                                            onClick={() => {
                                                setLocalLocation('');
                                                setLocalTeam('');
                                                setLocalRole('');
                                                setLocationFilter('');
                                                setTeamFilter('');
                                                setRoleFilter('');
                                                setSortField('firstName');
                                            }}
                                            className="px-5 py-2 bg-white border border-gray-200 text-blue-600 rounded-xl text-[13px] font-black hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95 shadow-sm"
                                        >
                                            Reset Filters
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setLocationFilter(localLocation);
                                                setTeamFilter(localTeam);
                                                setRoleFilter(localRole);
                                                setShowScheduleFilters(false);
                                            }}
                                            className="px-8 py-2 bg-primary text-white rounded-xl text-[14px] font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setShowSettingsModal(true)} 
                                className={cn("p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-primary transition-colors shadow-sm active:scale-95", false && "text-primary border-primary/20")}
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div ref={viewDropdownRef} className="relative group/view">
                        <button 
                            onClick={() => setShowViewDropdown(!showViewDropdown)}
                            className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[14px] font-black text-slate-700 shadow-sm hover:border-gray-300 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {activeView}
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", showViewDropdown && "rotate-180")} />
                        </button>

                        {showViewDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in slide-in-from-top-2 duration-200 p-2">
                                {['Day', 'Week', 'Month'].map(view => (
                                    <button 
                                        key={view}
                                        onClick={() => {
                                            setActiveView(view);
                                            setShowViewDropdown(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-bold transition-all",
                                            activeView === view ? "bg-slate-50 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                        )}
                                    >
                                        <span className="flex items-center gap-3">
                                            {activeView === view ? <Check className="w-4 h-4 text-slate-900" /> : <div className="w-4" />}
                                            {view}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
                <div className="flex border-b border-gray-100 scheduler-sidebar-bg">
                    <div className="w-[300px] p-5 flex items-center gap-3 border-r border-slate-200 relative z-30 scheduler-sidebar-bg scheduler-sidebar-shadow">
                        <UserIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-[14px] font-bold text-slate-600 pt-0.5">Team Members</span>
                    </div>
                    <div className="flex-1 flex overflow-x-auto custom-scrollbar-h relative">
                        {timeSlots.map(time => {
                            const isCurrentHour = activeView === 'Day' && isSameDay(currentDate, new Date()) && startOfHour(time).getTime() === startOfHour(new Date()).getTime();
                            return (
                                <div key={time.toISOString()} className={cn(
                                    "min-w-[150px] py-4 text-[13px] font-black flex items-center justify-center border-r border-gray-100 last:border-0 transition-colors",
                                    isCurrentHour ? "text-primary bg-primary/5 shadow-[inset_0_-2px_0_rgba(37,99,235,1)]" : "text-slate-400"
                                )}>
                                    {format(time, 'h:00 a').toUpperCase()}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {users
                    ?.filter((u: any) => {
                        const matchRole = !roleFilter || u.roleName?.includes(roleFilter);
                        const matchLocation = !locationFilter || (u.assignedLocationIds && u.assignedLocationIds.includes(locationFilter));
                        const matchTeam = !teamFilter || (u.teams && u.teams.some((t: any) => t.teamId === teamFilter));
                        return matchRole && matchLocation && matchTeam;
                    })
                    .sort((a: any, b: any) => {
                        const firstA = a.user?.firstName || a.user?.name?.split(' ')[0] || '';
                        const firstB = b.user?.firstName || b.user?.name?.split(' ')[0] || '';
                        const lastA = a.user?.lastName || a.user?.name?.split(' ').slice(-1)[0] || '';
                        const lastB = b.user?.lastName || b.user?.name?.split(' ').slice(-1)[0] || '';
                        
                        if (sortField === 'firstName') {
                            return firstA.localeCompare(firstB);
                        }
                        return lastA.localeCompare(lastB);
                    })
                    .map((user: User) => (
                    <div key={user.userOrgId} className="flex border-b border-gray-50 last:border-0 group">
                        <div className="w-[300px] p-5 border-r border-slate-200 flex items-center justify-between transition-colors relative z-20 scheduler-sidebar-bg scheduler-sidebar-bg-hover scheduler-sidebar-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-blue-100/80 shadow-sm uppercase">
                                    {user.name?.trim()[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <div className="text-[14px] font-bold text-slate-800 tracking-tight leading-none mb-1.5">{user.name}</div>
                                    <div className="text-[12px] font-medium text-slate-500 leading-none">{user.roleName || 'Technician'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pr-2">
                                {(() => {
                                    const techWos = scheduledWOs.filter((w: any) => w.assignedToId === user.userOrgId && isSameDay(parseISO(w.startDate!), currentDate));
                                    const techHours = techWos.reduce((acc: number, w: any) => acc + (Number(w.estimatedHours) || 1), 0);
                                    return (
                                        <>
                                            <span className="text-[13px] font-semibold text-amber-600">{techHours}h</span>
                                            <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 bg-white" />
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className="flex-1 flex overflow-x-auto custom-scrollbar-h relative h-20">
                            {timeSlots.map(time => {
                                const slotId = `${user.userOrgId}-${time.toISOString()}`;
                                const wosInSlot = scheduledWOs.filter((wo: WorkOrderSync) => {
                                    const woDate = parseISO(wo.startDate!);
                                    if (activeView === 'Day') {
                                        return wo.assignedToId === user.userOrgId && isSameDay(woDate, time) && startOfHour(woDate).getTime() === startOfHour(time).getTime();
                                    }
                                    return wo.assignedToId === user.userOrgId && isSameDay(woDate, time);
                                });

                                return (
                                    <DroppableSlot key={slotId} slotId={slotId} userId={user.userOrgId} time={time}>
                                        {wosInSlot.map((wo: WorkOrderSync) => (
                                            <TimelineCard 
                                                key={wo.id} 
                                                wo={wo} 
                                                onClick={() => setSelectedWo(wo)} 
                                                onEdit={() => setEditingWo(wo)}
                                                tagConfig={tagConfig} 
                                                hasConflict={wosInSlot.length > 1}
                                            />
                                        ))}
                                    </DroppableSlot>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
