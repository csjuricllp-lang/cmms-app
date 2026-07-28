import React, { useState, useMemo } from 'react';
import { 
    X, ChevronDown, Calendar, Clock, User, Zap, 
    Filter, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUsers } from '../hooks/useUsers';
import { useShifts } from '../hooks/useData';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { type WorkOrderSync } from '../lib/db';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface SmartScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
}

export const SmartScheduleModal: React.FC<SmartScheduleModalProps> = ({ isOpen, onClose, currentDate }) => {
    const { data: users = [] } = useUsers();
    const { shifts = [] } = useShifts();
    const { workOrders = [], bulkUpdate, smartSchedule } = useWorkOrders({ limit: 500 });

    // Formatting date helper
    const formatDateToYYYYMMDD = (d: Date) => {
        return d.toISOString().split('T')[0];
    };

    // Form States
    const [startDateStr, setStartDateStr] = useState(formatDateToYYYYMMDD(currentDate));
    const [endDateStr, setEndDateStr] = useState(formatDateToYYYYMMDD(currentDate));
    const [selectedShiftId, setSelectedShiftId] = useState<string>('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [selectedWoIds, setSelectedWoIds] = useState<string[]>([]);
    const [showCustomTimeRange, setShowCustomTimeRange] = useState(false);

    // Accordion Sections State
    const [expandedSections, setExpandedSections] = useState({
        when: true,
        who: true,
        what: true
    });

    // Pagination for Work Orders Section (4 per page)
    const [woPage, setWoPage] = useState(1);
    const woPerPage = 4;



    // Filter unscheduled work orders to show in the list
    const candidateWorkOrders = useMemo(() => {
        return (workOrders || []).filter((wo: WorkOrderSync) => !wo.startDate || !wo.assignedToId);
    }, [workOrders]);

    // Paginated candidate work orders
    const paginatedWos = useMemo(() => {
        const startIndex = (woPage - 1) * woPerPage;
        return candidateWorkOrders.slice(startIndex, startIndex + woPerPage);
    }, [candidateWorkOrders, woPage]);

    const totalWoPages = Math.max(1, Math.ceil(candidateWorkOrders.length / woPerPage));

    const toggleSection = (section: 'when' | 'who' | 'what') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Select Page handlers
    const handleSelectAllUsersOnPage = () => {
        const allUserIds = users.map(u => u.userOrgId || u.id);
        const allSelected = allUserIds.every(id => selectedUserIds.includes(id));
        if (allSelected) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(allUserIds);
        }
    };

    const handleSelectAllWosOnPage = () => {
        const pageWoIds = paginatedWos.map(wo => wo.id);
        const allSelected = pageWoIds.every(id => selectedWoIds.includes(id));
        if (allSelected) {
            setSelectedWoIds(prev => prev.filter(id => !pageWoIds.includes(id)));
        } else {
            setSelectedWoIds(prev => Array.from(new Set([...prev, ...pageWoIds])));
        }
    };

    const handleToggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleToggleWoSelection = (woId: string) => {
        setSelectedWoIds(prev => 
            prev.includes(woId) ? prev.filter(id => id !== woId) : [...prev, woId]
        );
    };

    const formatRangeDisplay = (startStr: string, endStr: string) => {
        try {
            const start = new Date(startStr);
            const end = new Date(endStr);
            return `${format(start, 'MM/dd/yyyy')} - ${format(end, 'MM/dd/yyyy')}`;
        } catch {
            return `${startStr} - ${endStr}`;
        }
    };

    // Run Optimization Scheduling Logic
    const handleGenerate = async () => {
        if (selectedUserIds.length === 0 || selectedWoIds.length === 0) return;

        try {
            await smartSchedule.mutateAsync({
                startDate: startDateStr,
                endDate: endDateStr,
                shiftId: selectedShiftId || undefined,
                technicianIds: selectedUserIds,
                workOrderIds: selectedWoIds
            });
            onClose();
        } catch (error: any) {
            // Error handling is managed by the mutation promise toast
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-[850px] max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-[20px] font-black text-slate-800">Smart Schedule</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#FAFAFA]">
                    
                    {/* Section 1: When should the work be scheduled? */}
                    <div className="bg-white border border-slate-150 rounded-[20px] shadow-sm overflow-hidden">
                        <button 
                            onClick={() => toggleSection('when')}
                            className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", expandedSections.when && "rotate-180")} />
                                <span className="text-[15px] font-extrabold text-slate-800">When should the work be scheduled?</span>
                            </div>
                            <span className="text-[13px] font-bold text-slate-400 pr-2">
                                {formatRangeDisplay(startDateStr, endDateStr)}
                            </span>
                        </button>

                        {expandedSections.when && (
                            <div className="p-6 grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-wider">Date Range</label>
                                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3 bg-white">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <input 
                                            type="date" 
                                            value={startDateStr} 
                                            onChange={(e) => setStartDateStr(e.target.value)} 
                                            className="text-[14px] font-bold text-slate-700 outline-none w-full"
                                        />
                                        <span className="text-slate-400 font-bold">-</span>
                                        <input 
                                            type="date" 
                                            value={endDateStr} 
                                            onChange={(e) => setEndDateStr(e.target.value)} 
                                            className="text-[14px] font-bold text-slate-700 outline-none w-full"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setShowCustomTimeRange(!showCustomTimeRange)}
                                        className="text-[12px] font-bold text-blue-600 hover:underline inline-block pt-1"
                                    >
                                        Use custom time range
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-wider">Shift</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedShiftId} 
                                            onChange={(e) => setSelectedShiftId(e.target.value)}
                                            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none appearance-none pr-10 hover:border-slate-350 transition-colors"
                                        >
                                            <option value="">Select Shift</option>
                                            {shifts.map((s: any) => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Who should be considered for the schedule? */}
                    <div className="bg-white border border-slate-150 rounded-[20px] shadow-sm overflow-hidden">
                        <button 
                            onClick={() => toggleSection('who')}
                            className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", expandedSections.who && "rotate-180")} />
                                <span className="text-[15px] font-extrabold text-slate-800">Who should be considered for the schedule?</span>
                            </div>
                            <span className="text-[13px] font-bold text-slate-400 pr-2">
                                {selectedUserIds.length} team member(s) selected
                            </span>
                        </button>

                        {expandedSections.who && (
                            <div className="p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] font-extrabold text-slate-700">Team Members</span>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-black">{users.length}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                            <Filter className="w-3.5 h-3.5 text-slate-500" />
                                        </button>
                                        <button 
                                            onClick={handleSelectAllUsersOnPage}
                                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            Select page
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                    {users.map((user) => {
                                        const userId = user.userOrgId || user.id;
                                        const isSelected = selectedUserIds.includes(userId);
                                        return (
                                            <div 
                                                key={userId}
                                                onClick={() => handleToggleUserSelection(userId)}
                                                className={cn(
                                                    "border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 relative cursor-pointer hover:shadow-md transition-all",
                                                    isSelected ? "border-blue-500 bg-blue-50/10" : "hover:border-slate-350"
                                                )}
                                            >
                                                {/* Checkbox */}
                                                <div className={cn(
                                                    "absolute top-3 right-3 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                    isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>

                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-black text-slate-600">
                                                    {user.name[0]?.toUpperCase()}
                                                </div>

                                                {/* Name */}
                                                <span className="text-[13px] font-bold text-slate-700 text-center truncate w-full">
                                                    {user.name}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Which work orders should be scheduled? */}
                    <div className="bg-white border border-slate-150 rounded-[20px] shadow-sm overflow-hidden">
                        <button 
                            onClick={() => toggleSection('what')}
                            className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", expandedSections.what && "rotate-180")} />
                                <span className="text-[15px] font-extrabold text-slate-800">Which work orders should be scheduled?</span>
                            </div>
                            <span className="text-[13px] font-bold text-slate-400 pr-2">
                                {selectedWoIds.length} work order(s) selected
                            </span>
                        </button>

                        {expandedSections.what && (
                            <div className="p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] font-extrabold text-slate-700">Work Orders</span>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-black">{candidateWorkOrders.length}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                            <Filter className="w-3.5 h-3.5 text-slate-500" />
                                        </button>
                                        <button 
                                            onClick={handleSelectAllWosOnPage}
                                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            Select page
                                        </button>
                                        <button 
                                            onClick={() => setWoPage(1)}
                                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            Back to First
                                        </button>
                                        
                                        {/* Pagination Controls */}
                                        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                                            <button 
                                                disabled={woPage === 1}
                                                onClick={() => setWoPage(prev => Math.max(1, prev - 1))}
                                                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 disabled:opacity-40"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-[12px] font-bold text-slate-500">Page {woPage} / {totalWoPages}</span>
                                            <button 
                                                disabled={woPage === totalWoPages}
                                                onClick={() => setWoPage(prev => Math.min(totalWoPages, prev + 1))}
                                                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 disabled:opacity-40"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {paginatedWos.map((wo) => {
                                        const isSelected = selectedWoIds.includes(wo.id);
                                        return (
                                            <div 
                                                key={wo.id}
                                                onClick={() => handleToggleWoSelection(wo.id)}
                                                className={cn(
                                                    "border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 relative cursor-pointer hover:shadow-md transition-all bg-white",
                                                    isSelected ? "border-blue-500 bg-blue-50/10" : "hover:border-slate-350"
                                                )}
                                            >
                                                {/* Checkbox */}
                                                <div className={cn(
                                                    "absolute top-4 right-4 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                    isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-[14px] font-extrabold text-slate-800 pr-8 leading-snug">
                                                    #{wo.woNumber?.padStart(3, '0') || '---'}: {wo.title}
                                                </h4>

                                                {/* Meta Info */}
                                                <div className="flex flex-col gap-2 pt-1 border-t border-slate-50 mt-1">
                                                    {/* Priority */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest w-16">Priority:</span>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[11px] font-bold",
                                                            wo.priority === 'High' || wo.priority === 'CRITICAL' ? "bg-rose-50 text-rose-600" :
                                                            wo.priority === 'Medium' ? "bg-orange-50 text-orange-600" :
                                                            wo.priority === 'Low' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
                                                        )}>
                                                            {wo.priority || 'None'}
                                                        </span>
                                                    </div>

                                                    {/* Due Date */}
                                                    <div className="flex items-center gap-2 text-slate-500 text-[12px] font-bold">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>
                                                            {wo.dueDate ? format(parseISO(wo.dueDate), 'M/d/yyyy') : 'No date'}
                                                        </span>
                                                    </div>

                                                    {/* Duration */}
                                                    <div className="flex items-center gap-2 text-slate-500 text-[12px] font-bold">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{wo.estimatedHours || 1} {wo.estimatedHours === 1 ? 'hour' : 'hours'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleGenerate} 
                        disabled={selectedUserIds.length === 0 || selectedWoIds.length === 0 || smartSchedule.isPending}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[14px] font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
                            smartSchedule.isPending && "cursor-wait"
                        )}
                    >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>{smartSchedule.isPending ? 'Optimizing...' : 'Generate'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
