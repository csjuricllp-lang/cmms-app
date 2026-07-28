import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface AddTimerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string, id?: string) => void;
    editingTimer?: any | null;
}

export const AddTimerModal: React.FC<AddTimerModalProps> = ({ isOpen, onClose, onConfirm, editingTimer }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (editingTimer) {
            setName(editingTimer.name);
        } else {
            setName('');
        }
    }, [editingTimer, isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    className="relative w-full max-w-[580px] bg-white rounded-[1.25rem] shadow-[0_20px_70px_rgba(0,0,0,0.25)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-10 pt-10 pb-6">
                        <h2 className="text-[32px] font-bold text-slate-800 tracking-tight">
                            {editingTimer ? 'Edit Category' : 'Add Category'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors group">
                            <X className="w-7 h-7 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-10 pb-12">
                        <div className="relative">
                            <input 
                                autoFocus
                                placeholder=""
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-[72px] bg-white border-[2px] border-blue-200 rounded-xl px-6 text-[22px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-[4px] focus:ring-blue-500/20 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Footer - Exactly like image */}
                    <div className="flex items-center justify-end gap-4 px-10 pb-10 bg-white">
                        <button 
                            onClick={onClose}
                            className="px-8 py-4 rounded-xl text-[20px] font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all min-w-[140px]"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                if (!name) return;
                                onConfirm(name, editingTimer?.id);
                                setName('');
                                onClose();
                            }}
                            className={cn(
                                "px-10 py-4 rounded-xl text-[20px] font-semibold transition-all min-w-[160px]",
                                name 
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700" 
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            {editingTimer ? 'Save' : 'Confirm'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
