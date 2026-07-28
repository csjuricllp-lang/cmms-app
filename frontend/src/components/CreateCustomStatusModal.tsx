import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';


interface CreateCustomStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { label: string, systemStatus: string, color: string }) => void;
}

const SYSTEM_STATUSES = [
    { label: 'Open', value: 'OPEN', description: "Work orders in an Open status represent work that hasn't been started yet", color: '#64748b' },
    { label: 'In Progress', value: 'IN_PROGRESS', description: "Work orders in an In Progress status represent work that is currently being worked on", color: '#22c55e' },
    { label: 'On Hold', value: 'ON_HOLD', description: "Work orders in an On Hold status represent work that has been paused", color: '#f59e0b' },
    { label: 'Complete', value: 'COMPLETED', description: "Work orders in a Complete status represent work that has been finished", color: '#3b82f6' },
];

export const CreateCustomStatusModal: React.FC<CreateCustomStatusModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [selectedType, setSelectedType] = useState(SYSTEM_STATUSES[0]);
    const [statusLabel, setStatusLabel] = useState('');

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-[500px] bg-white rounded-[24px] shadow-[0_32px_128px_rgba(0,0,0,0.18)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6">
                        <h2 className="text-[20px] font-bold text-slate-800">Create Custom Status</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-8 pb-8 space-y-8">
                        {/* Type Picker */}
                        <div className="space-y-4">
                            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Type</label>
                            <div className="relative group">
                                <select 
                                    value={selectedType.value}
                                    onChange={(e) => {
                                        const type = SYSTEM_STATUSES.find(s => s.value === e.target.value);
                                        if (type) setSelectedType(type);
                                    }}
                                    className="w-full bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-xl px-5 py-4 text-[15px] font-bold text-slate-700 transition-all appearance-none cursor-pointer pr-12 outline-none focus:ring-2 focus:ring-indigo-500/10"
                                >
                                    {SYSTEM_STATUSES.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            <p className="text-[13px] text-slate-400 font-medium leading-relaxed px-1">
                                {selectedType.description}
                            </p>
                        </div>

                        <div className="h-[1px] bg-slate-50 w-full" />

                        {/* Status Label */}
                        <div className="space-y-4">
                            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-1">Status</label>
                            <input 
                                value={statusLabel}
                                onChange={(e) => setStatusLabel(e.target.value)}
                                placeholder=""
                                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 text-[15px] font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-8 py-6 bg-slate-50/50">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                if (!statusLabel) return;
                                onCreate({ 
                                    label: statusLabel, 
                                    systemStatus: selectedType.value,
                                    color: selectedType.color
                                });
                                onClose();
                            }}
                            disabled={!statusLabel}
                            className="px-8 py-3 bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-[14px] font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                            Create Custom Status
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
