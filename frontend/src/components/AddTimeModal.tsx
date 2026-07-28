import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Calendar, Clock, ChevronDown } from 'lucide-react';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useUsers } from '../hooks/useData';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface AddTimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId: string;
    defaultWorkerId?: string;
}

const AddTimeModal: React.FC<AddTimeModalProps> = ({ isOpen, onClose, workOrderId, defaultWorkerId }) => {
    const { addTimeLog } = useWorkOrders();
    const { data: usersData } = useUsers();
    
    const users = (Array.isArray(usersData) ? usersData : (usersData as any)?.items || []) as any[];
    
    const [workerId, setWorkerId] = useState(defaultWorkerId || '');
    const [hourlyRate, setHourlyRate] = useState(0);
    const getLocalDateISOString = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
    };
    const [startedAt, setStartedAt] = useState(getLocalDateISOString());
    const [durationHours, setDurationHours] = useState(0);
    const [durationMinutes, setDurationMinutes] = useState(0);
    const [category, setCategory] = useState('');

    // Auto-fill hourly rate when worker changes
    useEffect(() => {
        if (workerId) {
            const worker = users.find(u => u.userOrgId === workerId);
            if (worker?.hourlyRate) {
                setHourlyRate(worker.hourlyRate);
            }
        }
    }, [workerId, users]);

    useEffect(() => {
        if (defaultWorkerId) setWorkerId(defaultWorkerId);
    }, [defaultWorkerId]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        const totalHours = Number(durationHours) + (Number(durationMinutes) / 60);
        if (totalHours <= 0) {
            toast.error('Duration must be greater than zero');
            return;
        }

        try {
            await addTimeLog.mutateAsync({
                workOrderId,
                data: {
                    userId: workerId || undefined,
                    hoursLogged: totalHours,
                    hourlyRate,
                    startTime: new Date(startedAt).toISOString(),
                    category: category || 'REGULAR',
                    description: `Logged via Add Time Modal`
                }
            });
            onClose();
        } catch (error) {
            toast.error('Failed to log time');
        }
    };

    const selectedWorker = users.find(u => u.userOrgId === workerId);

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-[580px] bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[24px] font-[900] text-slate-800 tracking-tight">Add Time</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-10">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Worker */}
                        <div className="col-span-8 space-y-2">
                            <label className="text-[14px] font-bold text-slate-700">Worker <span className="text-rose-500">*</span></label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                    <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-black text-white uppercase">
                                        {selectedWorker?.name?.charAt(0) || <UserIcon className="w-3 h-3" />}
                                    </div>
                                </div>
                                <select 
                                    className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={workerId}
                                    onChange={(e) => setWorkerId(e.target.value)}
                                >
                                    <option value="">Select Worker</option>
                                    {users.map(u => (
                                        <option key={u.userOrgId} value={u.userOrgId}>{u.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Hourly Rate */}
                        <div className="col-span-4 space-y-2">
                            <label className="text-[14px] font-bold text-slate-700">Hourly Rate</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">$</span>
                                <input 
                                    type="number"
                                    className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 text-right focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* Start Date */}
                        <div className="col-span-8 space-y-2">
                            <label className="text-[14px] font-bold text-slate-700">Work Started at <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="datetime-local"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={startedAt}
                                    onChange={(e) => setStartedAt(e.target.value)}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-slate-300">
                                    <Calendar className="w-4 h-4" />
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="col-span-4 space-y-2">
                            <label className="text-[14px] font-bold text-slate-700">Duration <span className="text-rose-500">*</span></label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <input 
                                        type="number"
                                        className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 text-center focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="0"
                                        value={durationHours}
                                        onChange={(e) => setDurationHours(Number(e.target.value))}
                                    />
                                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase text-center">Hours</p>
                                </div>
                                <div className="flex-1">
                                    <input 
                                        type="number"
                                        className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 text-center focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="0"
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                    />
                                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase text-center">Minutes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-slate-700">Category <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <select 
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="">Select Category</option>
                                <option value="Drive Time">Drive Time</option>
                                <option value="Wrench Time">Wrench Time</option>
                                <option value="Other Time">Other Time</option>
                                <option value="Vendor Time">Vendor Time</option>
                                <option value="Inspection Time">Inspection Time</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-4 pt-6">
                        <button 
                            onClick={onClose}
                            className="px-8 py-2.5 border border-gray-200 text-slate-600 rounded-xl text-[15px] font-black hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={addTimeLog.isPending || !workerId || !category || (durationHours === 0 && durationMinutes === 0)}
                            className={cn(
                                "px-10 py-3 rounded-xl text-[15px] font-black transition-all active:scale-95 disabled:opacity-50",
                                workerId && category && (durationHours > 0 || durationMinutes > 0)
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
                                    : "bg-slate-100 text-slate-400"
                            )}
                        >
                            {addTimeLog.isPending ? 'Logging...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddTimeModal;
