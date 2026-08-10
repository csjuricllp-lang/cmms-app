import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarClock } from 'lucide-react';

interface DeferWorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        onHoldReason: string;
        deferredUntilDate: string;
        deferredRiskLevel: string;
        deferredComments: string;
    }) => void;
}

export const DeferWorkOrderModal: React.FC<DeferWorkOrderModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [deferredUntilDate, setDeferredUntilDate] = useState('');
    const [riskLevel, setRiskLevel] = useState('LOW');
    const [comments, setComments] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            setReason('');
            setDeferredUntilDate('');
            setRiskLevel('LOW');
            setComments('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isValid = reason.trim() && deferredUntilDate;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-[480px] bg-white rounded-[28px] shadow-[0_32px_128px_rgba(0,0,0,0.24)] overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm border border-orange-100/30">
                                <CalendarClock className="w-5 h-5" />
                            </div>
                            <h2 className="text-[18px] font-black uppercase tracking-tight text-slate-800">Defer Work Order</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-8 py-6 space-y-6">
                        <p className="text-[14px] text-slate-500 font-bold leading-normal">
                            Log this work order into the Deferred Maintenance backlog. This requires a formal review date and risk assessment.
                        </p>
                        
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Deferral Reason <span className="text-red-500">*</span></label>
                            <input 
                                autoFocus
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Budget constraints, waiting for capital approval..."
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Review Date <span className="text-red-500">*</span></label>
                            <input 
                                type="date"
                                value={deferredUntilDate}
                                onChange={(e) => setDeferredUntilDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Risk Level <span className="text-red-500">*</span></label>
                            <select 
                                value={riskLevel}
                                onChange={(e) => setRiskLevel(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                            >
                                <option value="LOW">Low Risk</option>
                                <option value="MEDIUM">Medium Risk</option>
                                <option value="HIGH">High Risk</option>
                                <option value="CRITICAL">Critical Risk</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Additional Comments</label>
                            <textarea 
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Any additional notes or mitigations in place..."
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none min-h-[100px]"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-8 py-6 bg-slate-50/50 border-t border-slate-50 sticky bottom-0">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 bg-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                if (!isValid) return;
                                onSubmit({
                                    onHoldReason: reason,
                                    deferredUntilDate: new Date(deferredUntilDate).toISOString(),
                                    deferredRiskLevel: riskLevel,
                                    deferredComments: comments
                                });
                                onClose();
                            }}
                            disabled={!isValid}
                            className="px-8 py-3 bg-orange-500 disabled:opacity-50 text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-95 hover:bg-orange-600"
                        >
                            Confirm Deferral
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
