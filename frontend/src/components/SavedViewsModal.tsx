import React, { useState } from 'react';
import { X, Trash2, Star, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface SavedViewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    savedViews: any[];
    onApply: (config: any) => void;
    onDelete: (id: string) => void;
    onSaveCurrent: (name: string) => void;
    hasActiveFilters: boolean;
}

export const SavedViewsModal: React.FC<SavedViewsModalProps> = ({
    isOpen,
    onClose,
    savedViews,
    onApply,
    onDelete,
    onSaveCurrent,
    hasActiveFilters
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [newViewName, setNewViewName] = useState('');

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (newViewName.trim()) {
            onSaveCurrent(newViewName.trim());
            setNewViewName('');
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[480px] bg-white rounded-xl shadow-[0_20px_70px_rgba(0,0,0,0.2)] overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                    <h2 className="text-[17px] font-bold text-slate-800">Saved Views</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* View Name Form */}
                    <AnimatePresence>
                        {isSaving ? (
                            <motion.form 
                                onSubmit={handleSave}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3 overflow-hidden"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-bold text-slate-500 block">View Name</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. My High Priority Tasks"
                                        autoFocus
                                        value={newViewName}
                                        onChange={(e) => setNewViewName(e.target.value)}
                                        className="w-full px-3.5 py-2 border-2 border-slate-100 rounded-lg text-[14px] font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => { setIsSaving(false); setNewViewName(''); }}
                                        className="px-4 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={!newViewName.trim()}
                                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[12px] font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </motion.form>
                        ) : (
                            hasActiveFilters && (
                                <button 
                                    onClick={() => setIsSaving(true)}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-blue-600 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98]"
                                >
                                    <Plus className="w-4 h-4" />
                                    Save Current Filter View
                                </button>
                            )
                        )}
                    </AnimatePresence>

                    {/* Views List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-wider">
                                My Views ({savedViews.length})
                            </span>
                        </div>

                        <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                            {savedViews.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 font-medium text-[13px] italic bg-slate-50/50 rounded-xl border border-slate-100">
                                    No saved views yet
                                </div>
                            ) : (
                                savedViews.map((view) => (
                                    <div 
                                        key={view.id} 
                                        className="group relative flex items-center justify-between p-3 hover:bg-slate-50/80 border border-slate-100/70 rounded-xl transition-all hover:shadow-sm"
                                    >
                                        <button
                                            onClick={() => {
                                                onApply(view.config);
                                                onClose();
                                            }}
                                            className="flex-1 text-left flex flex-col gap-0.5"
                                        >
                                            <span className="text-[13px] font-black text-slate-800 group-hover:text-blue-600 transition-colors pr-8">
                                                {view.name}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Onboarded {new Date(view.createdAt).toLocaleDateString()}
                                            </span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => onDelete(view.id)}
                                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Delete view"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[13px] font-bold text-slate-600 transition-colors shadow-sm active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
