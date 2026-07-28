import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';

interface HoldReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

export const HoldReasonModal: React.FC<HoldReasonModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            setReason('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

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
                    className="relative w-full max-w-[480px] bg-white rounded-[28px] shadow-[0_32px_128px_rgba(0,0,0,0.24)] overflow-hidden border border-slate-100"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/30">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h2 className="text-[18px] font-black uppercase tracking-tight text-slate-800">Pause Work Order</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-8 py-6 space-y-4">
                        <p className="text-[14px] text-slate-500 font-bold leading-normal">
                            Flowchart regulations require documenting a reason before placing this active mission On Hold.
                        </p>
                        
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">On-Hold Reason</label>
                            <textarea 
                                autoFocus
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Waiting for replacement parts from vendor..."
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none min-h-[100px]"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-8 py-6 bg-slate-50/50 border-t border-slate-50">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 bg-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                if (!reason.trim()) return;
                                onSubmit(reason);
                                onClose();
                            }}
                            disabled={!reason.trim()}
                            className="px-8 py-3 bg-amber-500 disabled:opacity-50 text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all active:scale-95 hover:bg-amber-600"
                        >
                            Confirm Pause
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
