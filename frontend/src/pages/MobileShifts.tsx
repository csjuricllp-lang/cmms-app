import { useState } from 'react';
import { Clock, Plus, Search, Calendar as CalendarIcon, Users, X, UserPlus, Trash2, Edit2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useShifts } from '../hooks/useData';
import { toast } from 'react-hot-toast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SHIFT_COLORS = [
    { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700' },
    { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
    { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-100', dot: 'bg-slate-400', badge: 'bg-slate-700 text-slate-100' },
    { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
    { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700' },
];

// ─── Shift Create / Edit Bottom Sheet ─────────────────────────────────────────

interface ShiftModalProps {
    isOpen: boolean;
    selectedShift: any;
    name: string;
    startTime: string;
    endTime: string;
    workDays: number[];
    isSaving: boolean;
    onClose: () => void;
    onSave: () => void;
    onNameChange: (v: string) => void;
    onStartTimeChange: (v: string) => void;
    onEndTimeChange: (v: string) => void;
    onToggleDay: (i: number) => void;
}

const ShiftModal = ({
    isOpen, selectedShift, name, startTime, endTime, workDays, isSaving,
    onClose, onSave, onNameChange, onStartTimeChange, onEndTimeChange, onToggleDay
}: ShiftModalProps) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Sheet */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                    className="relative bg-white rounded-t-3xl shadow-2xl z-10 overflow-hidden"
                >
                    {/* Sheet Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <h2 className="text-[16px] font-black text-slate-800">
                                {selectedShift ? 'Edit Shift' : 'Create New Shift'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 active:scale-90 transition-transform"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Form Body */}
                    <div className="px-5 py-5 space-y-5">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shift Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => onNameChange(e.target.value)}
                                placeholder="e.g. Morning Shift"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                            />
                        </div>

                        {/* Time Range */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Start Time</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={e => onStartTimeChange(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">End Time</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={e => onEndTimeChange(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Work Days */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Work Days</label>
                            <div className="flex gap-2">
                                {DAYS.map((day, i) => (
                                    <button
                                        key={day}
                                        onClick={() => onToggleDay(i)}
                                        className={cn(
                                            "flex-1 h-10 rounded-xl flex items-center justify-center text-[12px] font-black transition-all active:scale-95",
                                            workDays.includes(i)
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                                : "bg-slate-100 text-slate-400"
                                        )}
                                    >
                                        {day.charAt(0)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Assign Users */}
                        <div className="pt-1 border-t border-slate-100">
                            <button className="flex items-center gap-2 text-[13px] font-black text-indigo-600 hover:text-indigo-700 transition-colors">
                                <UserPlus className="w-4 h-4" />
                                Assign Users to Shift
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-11 bg-white border border-slate-200 text-slate-600 text-[13px] font-black rounded-xl transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            disabled={isSaving}
                            className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-black rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {selectedShift ? 'Save Changes' : 'Create Shift'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

// ─── Mobile Shifts Page ────────────────────────────────────────────────────────

export const MobileShifts = () => {
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
        if (!name.trim()) { toast.error('Shift name is required'); return; }
        try {
            if (selectedShift) {
                await updateShift.mutateAsync({ id: selectedShift.id, name, startTime, endTime, workDays });
                toast.success('Shift updated successfully');
            } else {
                await createShift.mutateAsync({ name, startTime, endTime, workDays });
                toast.success('Shift created successfully');
            }
            setIsCreateModalOpen(false);
            setSelectedShift(null);
        } catch {
            toast.error('Failed to save shift');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this shift?')) return;
        try {
            await deleteShift.mutateAsync(id);
            toast.success('Shift deleted successfully');
        } catch {
            toast.error('Failed to delete shift');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] font-outfit pb-24 relative">
            {/* Header */}
            <div className="bg-white px-4 py-4 border-b border-slate-100 sticky top-0 z-30 shadow-sm shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Shifts Management</h1>
                    </div>

                    {/* View toggle + Create */}
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {(['List', 'Calendar'] as const).map((view) => (
                                <button
                                    key={view}
                                    onClick={() => setCurrentView(view)}
                                    className={cn(
                                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
                                        currentView === view ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                                    )}
                                >
                                    {view === 'List' ? <Users className="w-3 h-3" /> : <CalendarIcon className="w-3 h-3" />}
                                    {view}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleCreateClick}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[12px] font-black shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Create
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search shifts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-transparent rounded-xl text-[13px] font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : currentView === 'List' ? (
                    /* ── List View ─────────────────────────────── */
                    <div className="space-y-3">
                        {filteredShifts.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm space-y-4">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto">
                                    <Clock className="w-7 h-7 text-slate-200" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[15px] font-black text-slate-700">No Shifts Found</p>
                                    <p className="text-[12px] text-slate-400 font-medium">Create a shift to start managing schedules.</p>
                                </div>
                                <button
                                    onClick={handleCreateClick}
                                    className="inline-flex items-center gap-2 text-indigo-600 font-black text-[13px] hover:underline"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create your first shift
                                </button>
                            </div>
                        ) : (
                            filteredShifts.map((shift, idx) => {
                                const color = SHIFT_COLORS[idx % SHIFT_COLORS.length];
                                const isDark = idx % SHIFT_COLORS.length === 2;
                                return (
                                    <motion.div
                                        key={shift.id}
                                        layout
                                        className={cn(
                                            "rounded-2xl border p-4 shadow-sm space-y-3",
                                            color.bg, color.border
                                        )}
                                    >
                                        {/* Top Row */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", color.dot)} />
                                                <h3 className={cn("text-[15px] font-black leading-tight truncate", isDark ? 'text-white' : 'text-slate-900')}>
                                                    {shift.name}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleEditClick(shift)}
                                                    className={cn("p-1.5 rounded-lg transition-colors", isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-white text-slate-400 hover:text-indigo-600')}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(shift.id)}
                                                    className={cn("p-1.5 rounded-lg transition-colors", isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-red-50 text-slate-400 hover:text-red-500')}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Time */}
                                        <div className="flex items-center gap-2">
                                            <Clock className={cn("w-3.5 h-3.5 shrink-0", isDark ? 'text-slate-400' : 'text-slate-400')} />
                                            <span className={cn("text-[13px] font-black", isDark ? 'text-slate-200' : 'text-slate-700')}>
                                                {shift.startTime} – {shift.endTime}
                                            </span>
                                        </div>

                                        {/* Work Days Strip */}
                                        <div className="flex gap-1.5">
                                            {DAYS.map((day, i) => {
                                                const active = shift.workDays.includes(i);
                                                return (
                                                    <div
                                                        key={day}
                                                        className={cn(
                                                            "flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors",
                                                            active
                                                                ? isDark ? 'bg-white/20 text-white' : `${color.badge}`
                                                                : isDark ? 'bg-white/5 text-slate-600' : 'bg-white/60 text-slate-300'
                                                        )}
                                                    >
                                                        {day.charAt(0)}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Users Row */}
                                        <div className="flex items-center gap-2 pt-1 border-t border-white/20">
                                            <div className="flex -space-x-1.5">
                                                {[...Array(Math.min(3, shift.usersCount || 0))].map((_, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-white/80 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">
                                                        U{i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className={cn("text-[11px] font-bold", isDark ? 'text-slate-400' : 'text-slate-500')}>
                                                {shift.usersCount || 0} users assigned
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* ── Calendar View ─────────────────────────── */
                    <div className="space-y-3">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            {/* Day headers */}
                            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                                {DAYS.map((day) => (
                                    <div key={day} className="py-2.5 text-center text-[11px] font-black text-slate-500 uppercase tracking-wider">
                                        {day.charAt(0)}
                                    </div>
                                ))}
                            </div>

                            {/* Shift blocks per day */}
                            <div className="grid grid-cols-7 min-h-[200px] divide-x divide-slate-50">
                                {DAYS.map((day, dayIdx) => {
                                    const dayShifts = filteredShifts.filter(s => s.workDays.includes(dayIdx));
                                    return (
                                        <div key={day} className="p-1.5 flex flex-col gap-1">
                                            {dayShifts.map((shift, sIdx) => {
                                                const color = SHIFT_COLORS[filteredShifts.indexOf(shift) % SHIFT_COLORS.length];
                                                const isDark = filteredShifts.indexOf(shift) % SHIFT_COLORS.length === 2;
                                                return (
                                                    <button
                                                        key={shift.id}
                                                        onClick={() => handleEditClick(shift)}
                                                        className={cn(
                                                            "w-full rounded-lg p-1.5 text-left border transition-all active:scale-95",
                                                            color.bg, color.border
                                                        )}
                                                    >
                                                        <p className={cn("text-[9px] font-black leading-tight truncate", isDark ? 'text-white' : color.text)}>
                                                            {shift.name}
                                                        </p>
                                                        <p className={cn("text-[8px] font-bold mt-0.5 opacity-70", isDark ? 'text-slate-300' : color.text)}>
                                                            {shift.startTime}–{shift.endTime}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Shift Legend</p>
                            {filteredShifts.map((shift, idx) => {
                                const color = SHIFT_COLORS[idx % SHIFT_COLORS.length];
                                return (
                                    <div key={shift.id} className="flex items-center gap-3">
                                        <div className={cn("w-3 h-3 rounded-full", color.dot)} />
                                        <span className="text-[13px] font-bold text-slate-700">{shift.name}</span>
                                        <span className="text-[11px] text-slate-400 font-medium ml-auto">{shift.startTime}–{shift.endTime}</span>
                                    </div>
                                );
                            })}
                            {filteredShifts.length === 0 && (
                                <p className="text-[12px] text-slate-400 font-medium italic">No shifts to display.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* FAB */}
            <button
                onClick={handleCreateClick}
                className="fixed right-6 bottom-20 z-40 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 transition-transform active:scale-90"
                title="Create Shift"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Create / Edit Modal */}
            <ShiftModal
                isOpen={isCreateModalOpen}
                selectedShift={selectedShift}
                name={name}
                startTime={startTime}
                endTime={endTime}
                workDays={workDays}
                isSaving={createShift.isPending || updateShift.isPending}
                onClose={() => { setIsCreateModalOpen(false); setSelectedShift(null); }}
                onSave={handleSave}
                onNameChange={setName}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                onToggleDay={handleToggleDay}
            />
        </div>
    );
};
