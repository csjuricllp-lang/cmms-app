import React, { useState } from 'react';
import { X, Clock, Eye, Info } from 'lucide-react';

interface ScheduleSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: {
        visibleUnits: number;
        timeGranularity: string;
        defaultDailyHours: number;
        startTime: number;
        endTime: number;
        workDays: string[];
    };
    onSave: (settings: any) => void;
}

export const ScheduleSettingsModal: React.FC<ScheduleSettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    currentSettings,
    onSave
}) => {
    const [settings, setSettings] = useState(currentSettings);

    if (!isOpen) return null;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const toggleDay = (day: string) => {
        setSettings(prev => ({
            ...prev,
            workDays: prev.workDays.includes(day) 
                ? prev.workDays.filter(d => d !== day) 
                : [...prev.workDays, day]
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[24px] font-black text-slate-800 tracking-tight">Schedule Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-10 overflow-y-auto max-h-[70vh]">
                    {/* Chart View Settings */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-[14px] font-bold uppercase tracking-widest">Chart View Settings</span>
                            <Info className="w-4 h-4" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[14px] font-black text-slate-700">Visible Units</label>
                                <div className="relative">
                                    <Eye className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select 
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={settings.visibleUnits}
                                        onChange={(e) => setSettings({...settings, visibleUnits: Number(e.target.value)})}
                                    >
                                        <option value={8}>8 hours</option>
                                        <option value={10}>10 hours</option>
                                        <option value={12}>12 hours</option>
                                        <option value={24}>24 hours</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[14px] font-black text-slate-700">Time Granularity</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select 
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={settings.timeGranularity}
                                        onChange={(e) => setSettings({...settings, timeGranularity: e.target.value})}
                                    >
                                        <option value="1h">Hours (:00)</option>
                                        <option value="30m">30 Minutes</option>
                                        <option value="15m">15 Minutes</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Technician Capacity Defaults */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-[14px] font-bold uppercase tracking-widest">Technician Capacity Defaults</span>
                            <Info className="w-4 h-4" />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[14px] font-black text-slate-700">Default Daily Hours</label>
                                <input 
                                    type="number"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={settings.defaultDailyHours}
                                    onChange={(e) => setSettings({...settings, defaultDailyHours: Number(e.target.value)})}
                                    min={1}
                                    max={24}
                                />
                                <p className="text-[12px] font-bold text-slate-400 italic">Enter the number of hours a technician is expected to work per day (min 1, max 24).</p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-[14px] font-black text-slate-700">Daily Start/End Times</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <select 
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 appearance-none"
                                            value={settings.startTime}
                                            onChange={(e) => setSettings({...settings, startTime: Number(e.target.value)})}
                                        >
                                            {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>)}
                                        </select>
                                    </div>
                                    <div className="relative flex-1">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <select 
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 appearance-none"
                                            value={settings.endTime}
                                            onChange={(e) => setSettings({...settings, endTime: Number(e.target.value)})}
                                        >
                                            {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>)}
                                        </select>
                                    </div>
                                </div>
                                <p className="text-[12px] font-bold text-slate-400 italic">Select the start time and end time of each working day</p>
                            </div>

                            <div className="space-y-4 pt-2">
                                <label className="text-[14px] font-black text-slate-700">Work Days</label>
                                <div className="flex flex-wrap gap-3">
                                    {days.map(day => (
                                        <label key={day} className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input 
                                                type="checkbox"
                                                className="w-5 h-5 rounded-md border-gray-300 text-primary focus:ring-primary/20"
                                                checked={settings.workDays.includes(day)}
                                                onChange={() => toggleDay(day)}
                                            />
                                            <span className="text-[14px] font-bold text-slate-600">{day}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-[12px] font-bold text-slate-400 italic">Choose the default working days used for technician scheduling.</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-100 bg-slate-50/30 flex justify-end gap-4">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-gray-200 text-slate-600 rounded-xl text-[15px] font-black hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSave(settings)}
                        className="px-10 py-3 bg-primary text-white rounded-xl text-[15px] font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
