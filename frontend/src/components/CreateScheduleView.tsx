import React, { useState } from 'react';
import { Clock, Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAssetSettings } from '../hooks/useAssetSettings';

interface TimeBlock {
    from: string;
    to: string;
}

interface DaySchedule {
    enabled: boolean;
    blocks: TimeBlock[];
}

interface CreateScheduleViewProps {
    onBack: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CreateScheduleView: React.FC<CreateScheduleViewProps> = ({ onBack }) => {
    const [name, setName] = useState('');
    const [schedules, setSchedules] = useState<Record<string, DaySchedule>>(
        DAYS.reduce((acc, day) => ({ ...acc, [day]: { enabled: false, blocks: [{ from: '', to: '' }] } }), {})
    );

    const { createSchedule } = useAssetSettings();

    const handleSubmit = () => {
        createSchedule.mutate({
            name,
            config: schedules,
        }, {
            onSuccess: () => {
                onBack();
            }
        });
    };

    const toggleDay = (day: string) => {
        setSchedules(prev => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day].enabled }
        }));
    };

    const addBlock = (day: string) => {
        setSchedules(prev => ({
            ...prev,
            [day]: { ...prev[day], blocks: [...prev[day].blocks, { from: '', to: '' }] }
        }));
    };

    const removeBlock = (day: string, index: number) => {
        setSchedules(prev => ({
            ...prev,
            [day]: { ...prev[day], blocks: prev[day].blocks.filter((_, i) => i !== index) }
        }));
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">Create New Schedule</h2>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onBack}
                        className="px-8 py-2.5 bg-white border border-gray-200 text-slate-600 text-[14px] font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={createSchedule.isPending || !name.trim()}
                        className={cn(
                            "px-8 py-2.5 text-[14px] font-bold rounded-lg transition-all",
                            name.trim() 
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700" 
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        {createSchedule.isPending ? 'Creating...' : 'Create Schedule'}
                    </button>
                </div>
            </div>

            {/* Schedule Details */}
            <div className="grid grid-cols-[280px,1fr] gap-12">
                <div className="space-y-2">
                    <h3 className="text-[14px] font-bold text-slate-700">Schedule Details</h3>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-10 shadow-sm">
                    <div className="space-y-3">
                        <label className="text-[13px] font-bold text-slate-500">Schedule Name</label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-lg text-[15px] font-medium focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>
            </div>

            {/* Time-based Schedule */}
            <div className="grid grid-cols-[280px,1fr] gap-12 border-t border-gray-50 pt-12">
                <div className="space-y-4">
                    <h3 className="text-[14px] font-bold text-slate-700">Configure Time-based Schedule</h3>
                    <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                        Select the days and times when assets are expected to be operational. You can create multiple time blocks on each day.
                    </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-12 shadow-sm space-y-12">
                    {DAYS.map((day) => (
                        <div key={day} className="flex items-start gap-12">
                            <div className="flex items-center gap-4 w-[160px] pt-3">
                                <button 
                                    onClick={() => toggleDay(day)}
                                    className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                        schedules[day].enabled ? "bg-indigo-600 border-indigo-600" : "border-gray-200"
                                    )}
                                >
                                    {schedules[day].enabled && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </button>
                                <span className={cn(
                                    "text-[14px] font-bold transition-colors",
                                    schedules[day].enabled ? "text-slate-700" : "text-slate-400"
                                )}>
                                    {day}
                                </span>
                            </div>

                            <div className="flex-1 space-y-4">
                                {schedules[day].blocks.map((_block, idx) => (
                                    <div key={idx} className="flex items-center gap-4 group">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[12px] font-bold text-slate-500">From</label>
                                                <div className="relative">
                                                    <input 
                                                        disabled={!schedules[day].enabled}
                                                        type="text"
                                                        placeholder="--:--"
                                                        className="w-full pl-4 pr-12 py-3 bg-slate-50/50 border border-gray-100 rounded-lg text-[14px] font-medium disabled:opacity-50 outline-none focus:border-indigo-600 focus:bg-white transition-all"
                                                    />
                                                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[12px] font-bold text-slate-500">To</label>
                                                <div className="relative">
                                                    <input 
                                                        disabled={!schedules[day].enabled}
                                                        type="text"
                                                        placeholder="--:--"
                                                        className="w-full pl-4 pr-12 py-3 bg-slate-50/50 border border-gray-100 rounded-lg text-[14px] font-medium disabled:opacity-50 outline-none focus:border-indigo-600 focus:bg-white transition-all"
                                                    />
                                                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {schedules[day].enabled && (
                                            <div className="flex items-center pt-8">
                                                {idx === 0 ? (
                                                    <button 
                                                        onClick={() => addBlock(day)}
                                                        className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all border border-gray-100 shadow-sm"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => removeBlock(day, idx)}
                                                        className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all border border-gray-100 shadow-sm"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
