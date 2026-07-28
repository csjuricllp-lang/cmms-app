import React, { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface InventoryFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InventoryFiltersModal: React.FC<InventoryFiltersModalProps> = ({
    isOpen,
    onClose
}) => {
    const [isAddFilterOpen, setIsAddFilterOpen] = useState(false);

    const filterOptions = [
        'Name', 'Status', 'Incoming Qty', 'Location', 'Barcode', 'Tags', 
        'Area', 'Category', 'Description', 'Workers', 'Vendors', 
        'Date Created', 'Part Number', 'Customers', 'Additional Details', 
        'Team', 'Critical'
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white w-full max-w-[500px] rounded-[1.25rem] shadow-2xl flex flex-col relative"
                >
                    {/* Header */}
                    <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
                        <h2 className="text-[18px] font-black text-slate-900 tracking-tight">Filters</h2>
                        <button 
                            onClick={onClose}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-8 py-16 flex flex-col items-center justify-center text-center">
                        <h3 className="text-[15px] font-bold text-slate-900 mb-2">No filters added yet.</h3>
                        <p className="text-[13px] text-slate-400 font-medium leading-relaxed max-w-[280px]">
                            When you add filters, they'll appear here.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between rounded-b-[1.25rem] relative overflow-visible">
                        <div className="relative">
                            <button 
                                onClick={() => setIsAddFilterOpen(!isAddFilterOpen)}
                                className="flex items-center gap-2.5 text-blue-600 hover:text-blue-700 font-bold transition-all px-3 py-2 rounded-xl hover:bg-blue-50/50"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-[14px]">Add Filter</span>
                                <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform", isAddFilterOpen && "rotate-180")} />
                            </button>
                            
                            <AnimatePresence>
                                {isAddFilterOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[110]" onClick={() => setIsAddFilterOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: -8, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute bottom-full left-0 mb-2 w-[260px] bg-white rounded-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-[120] py-2 max-h-[320px] overflow-y-auto custom-scrollbar ring-1 ring-black/5"
                                        >
                                            <div className="px-4 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Available Filters</div>
                                            {filterOptions.map((option) => (
                                                <button
                                                    key={option}
                                                    className="w-full text-left px-4 py-2.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-between group"
                                                    onClick={() => setIsAddFilterOpen(false)}
                                                >
                                                    {option}
                                                    <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={onClose}
                                className="h-10 px-5 text-[14px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button className="h-10 px-6 text-[14px] font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                                Apply
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
