import { useState } from 'react';
import { Clock, Plus, Search, Calendar as CalendarIcon, Users, X, UserPlus, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { TableEmptyState } from '../components/EmptyState';
import { useShifts } from '../hooks/useData';
import { toast } from 'react-hot-toast';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileShifts } from './MobileShifts';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ShiftsPage = () => {
    const { shifts, isLoading, createShift, updateShift, deleteShift } = useShifts();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentView, setCurrentView] = useState<'List' | 'Calendar'>('List');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<any>(null);

    // Form states
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);

    const filteredShifts = (shifts || []).filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Helpers for calendar rendering
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const handleCreateClick = () => {
        setSelectedShift(null);
        setName('');
        setStartTime('09:00');
        setEndTime('17:00');
        setWorkDays([1, 2, 3, 4, 5]);
        setIsCreateModalOpen(true);
    };

    const handleEditClick = (shift: any) => {
        setSelectedShift(shift);
        setName(shift.name);
        setStartTime(shift.startTime);
        setEndTime(shift.endTime);
        setWorkDays(shift.workDays);
        setIsCreateModalOpen(true);
    };

    const handleToggleDay = (dayIndex: number) => {
        setWorkDays(prev => 
            prev.includes(dayIndex) 
                ? prev.filter(d => d !== dayIndex) 
                : [...prev, dayIndex].sort()
        );
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Shift name is required');
            return;
        }

        try {
            if (selectedShift) {
                await updateShift.mutateAsync({
                    id: selectedShift.id,
                    name,
                    startTime,
                    endTime,
                    workDays
                });
                toast.success('Shift updated successfully');
            } else {
                await createShift.mutateAsync({
                    name,
                    startTime,
                    endTime,
                    workDays
                });
                toast.success('Shift created successfully');
            }
            setIsCreateModalOpen(false);
            setSelectedShift(null);
        } catch (error) {
            toast.error('Failed to save shift');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this shift?')) return;
        try {
            await deleteShift.mutateAsync(id);
            toast.success('Shift deleted successfully');
        } catch (error) {
            toast.error('Failed to delete shift');
        }
    };

    const isMobile = useMediaQuery('(max-width: 768px)');
    if (isMobile) return <MobileShifts />;

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden animate-in fade-in duration-500">
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
                {/* Header */}
                <div className="h-14 flex items-center px-4 bg-white border-b border-slate-100 z-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h1 className="text-[18px] font-black text-slate-900 tracking-tight whitespace-nowrap">Shifts Management</h1>
                    </div>

                    <div className="flex-1" />

                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {['List', 'Calendar'].map((view) => (
                                <button
                                    key={view}
                                    onClick={() => setCurrentView(view as any)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-black uppercase tracking-wider transition-all",
                                        currentView === view ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {view === 'List' ? <Users className="w-3.5 h-3.5" /> : <CalendarIcon className="w-3.5 h-3.5" />}
                                    {view}
                                </button>
                            ))}
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <button 
                            onClick={handleCreateClick}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-black transition-all shadow-sm active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Shift</span>
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="h-12 bg-white border-b border-slate-100 flex items-center px-4 z-40">
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="Search shifts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-3 pr-10 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[13px] text-slate-900 outline-none focus:bg-white focus:border-indigo-500/40 transition-all font-medium"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Main Content */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    </div>
                ) : currentView === 'List' ? (
                    <div className="flex-1 p-6 overflow-auto custom-scrollbar">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600">Shift Name</th>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600">Schedule</th>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600">Work Days</th>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600">Assigned Users</th>
                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredShifts.length === 0 ? (
                                        <TableEmptyState 
                                            variant="person" 
                                            title="No Shifts Found" 
                                            description="Create a shift to start managing schedules." 
                                            colSpan={5} 
                                        />
                                    ) : (
                                        filteredShifts.map(shift => (
                                            <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="text-[14px] font-black text-slate-900">{shift.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        <span className="text-[13px] font-bold text-slate-700">{shift.startTime} - {shift.endTime}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1">
                                                        {DAYS.map((day, index) => (
                                                            <div 
                                                                key={day} 
                                                                className={cn(
                                                                    "w-7 h-7 rounded flex items-center justify-center text-[10px] font-black transition-colors",
                                                                    shift.workDays.includes(index) ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-slate-50 text-slate-300 border border-slate-100"
                                                                )}
                                                            >
                                                                {day.charAt(0)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex -space-x-2">
                                                            {[...Array(Math.min(3, shift.usersCount))].map((_, i) => (
                                                                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">
                                                                    U{i+1}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <span className="text-[12px] font-bold text-slate-500">{shift.usersCount} users</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleEditClick(shift)}
                                                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                                                            title="Edit Shift"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(shift.id)}
                                                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                                            title="Delete Shift"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 p-6 overflow-hidden flex flex-col">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                <h2 className="text-[14px] font-black text-slate-800">Weekly Shift Coverage</h2>
                                <div className="flex items-center gap-4 text-[12px] font-bold text-slate-500">
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-indigo-500" /> Coverage</div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar relative">
                                <div className="min-w-[800px] h-full flex">
                                    {/* Time Sidebar */}
                                    <div className="w-16 border-r border-slate-100 flex flex-col shrink-0">
                                        <div className="h-10 border-b border-slate-100 bg-slate-50" />
                                        {hours.map(h => (
                                            <div key={h} className="h-12 border-b border-slate-50 relative">
                                                <span className="absolute -top-2.5 right-2 text-[10px] font-black text-slate-400">{String(h).padStart(2, '0')}:00</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Days Grid */}
                                    <div className="flex-1 flex">
                                        {DAYS.map((day, index) => (
                                            <div key={day} className="flex-1 border-r border-slate-100 relative min-w-[120px]">
                                                <div className="h-10 border-b border-slate-100 bg-slate-50 flex items-center justify-center sticky top-0 z-10">
                                                    <span className="text-[12px] font-black text-slate-600 uppercase tracking-wider">{day}</span>
                                                </div>
                                                <div className="relative h-[1152px]">
                                                    {filteredShifts.map((shift, sIdx) => {
                                                        if (!shift.workDays.includes(index)) return null;
                                                        
                                                        const startH = parseInt(shift.startTime.split(':')[0]) || 0;
                                                        const endH = parseInt(shift.endTime.split(':')[0]) || 0;
                                                        const top = startH * 48;
                                                        let height = (endH > startH ? endH - startH : (24 - startH) + endH) * 48;
                                                        if (height <= 0) height = 48;
                                                        
                                                        const colors = [
                                                            'bg-indigo-100 border-indigo-200 text-indigo-700',
                                                            'bg-amber-100 border-amber-200 text-amber-700',
                                                            'bg-slate-800 border-slate-700 text-slate-100',
                                                            'bg-emerald-100 border-emerald-200 text-emerald-700'
                                                        ];

                                                        return (
                                                            <div 
                                                                key={`${shift.id}-${day}`}
                                                                className={cn(
                                                                    "absolute left-1 right-1 rounded-lg border p-2 shadow-sm flex flex-col gap-1 overflow-hidden transition-all hover:ring-2 ring-indigo-500/50 cursor-pointer hover:z-20",
                                                                    colors[sIdx % colors.length]
                                                                )}
                                                                style={{ top: `${top}px`, height: `${height}px` }}
                                                                onClick={() => handleEditClick(shift)}
                                                            >
                                                                <span className="text-[11px] font-black leading-tight truncate">{shift.name}</span>
                                                                <span className="text-[9px] font-bold opacity-80">{shift.startTime} - {shift.endTime}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="absolute inset-0 pointer-events-none mt-10">
                                                    {hours.map(h => (
                                                        <div key={h} className="h-12 border-b border-slate-50 w-full" />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <h2 className="text-lg font-black text-slate-800">
                                    {selectedShift ? 'Edit Shift' : 'Create New Shift'}
                                </h2>
                                <button 
                                    onClick={() => { setIsCreateModalOpen(false); setSelectedShift(null); }}
                                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Shift Name</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/50 transition-colors" 
                                        placeholder="e.g. Morning Shift"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Start Time</label>
                                        <input 
                                            type="time" 
                                            value={startTime}
                                            onChange={e => setStartTime(e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/50 transition-colors" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">End Time</label>
                                        <input 
                                            type="time" 
                                            value={endTime}
                                            onChange={e => setEndTime(e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/50 transition-colors" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Work Days</label>
                                    <div className="flex gap-2">
                                        {DAYS.map((day, i) => (
                                            <button 
                                                key={day}
                                                onClick={() => handleToggleDay(i)}
                                                className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-black transition-colors",
                                                    workDays.includes(i) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                )}
                                            >
                                                {day.charAt(0)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <button className="flex items-center gap-2 text-[13px] font-black text-indigo-600 hover:text-indigo-700 transition-colors">
                                        <UserPlus className="w-4 h-4" />
                                        Assign Users to Shift
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button 
                                    onClick={() => { setIsCreateModalOpen(false); setSelectedShift(null); }}
                                    className="px-4 py-2 text-[13px] font-black text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={createShift.isPending || updateShift.isPending}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-black rounded-xl shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {selectedShift ? 'Save Changes' : 'Create Shift'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
