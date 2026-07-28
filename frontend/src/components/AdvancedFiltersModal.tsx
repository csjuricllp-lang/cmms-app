import { useState, useEffect } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvancedFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: any) => void;
    activeFilters: any;
}

const ALL_CATEGORIES = [
    'Name',
    'Workers',
    'Teams',
    'Customers',
    'Vendors'
];

export const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({
    isOpen,
    onClose,
    onApply,
    activeFilters
}) => {
    const [visibleRows, setVisibleRows] = useState<string[]>([]);
    const [isAddFilterOpen, setIsAddFilterOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState(activeFilters);

    useEffect(() => {
        if (isOpen) {
            const rows: string[] = [];
            if (activeFilters.name) rows.push('Name');
            if (activeFilters.selectedAssignees?.length > 0) rows.push('Workers');
            if (activeFilters.selectedTeams?.length > 0) rows.push('Teams');
            if (activeFilters.vendorIds?.length > 0) rows.push('Vendors');
            if (activeFilters.customerId) rows.push('Customers');
            
            setVisibleRows(rows);
            setLocalFilters(activeFilters);
        }
    }, [isOpen, activeFilters]);

    if (!isOpen) return null;

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const addRow = (category: string) => {
        if (!visibleRows.includes(category)) {
            setVisibleRows(prev => [...prev, category]);
        }
        setIsAddFilterOpen(false);
    };

    const removeRow = (category: string) => {
        setVisibleRows(prev => prev.filter(r => r !== category));
    };

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
                        <h2 className="text-[18px] font-black text-slate-900 tracking-tight">Advanced Filters</h2>
                        <button 
                            onClick={onClose}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="min-h-[240px] max-h-[60vh] overflow-y-auto flex flex-col custom-scrollbar">
                        {visibleRows.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-16 px-8 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                    <Plus className="w-8 h-8 text-slate-200" />
                                </div>
                                <h3 className="text-[15px] font-bold text-slate-900 mb-1">No filters added yet.</h3>
                                <p className="text-[13px] text-slate-400 font-medium max-w-[280px]">Add specific fields to narrow down your location search results.</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {visibleRows.map((category) => (
                                    <div key={category} className="space-y-2 group animate-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{category}</label>
                                            <button 
                                                onClick={() => removeRow(category)}
                                                className="text-[11px] font-bold text-slate-300 hover:text-rose-500 transition-colors uppercase tracking-widest"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="h-12 border border-slate-200 rounded-xl flex items-center px-4 bg-slate-50/50 shadow-inner group-hover:border-slate-300 transition-colors">
                                            <span className="text-[13px] text-slate-400 font-bold italic">Configure {category}...</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 relative rounded-b-[1.25rem] overflow-visible">
                        <div className="relative">
                            <button 
                                onClick={() => setIsAddFilterOpen(!isAddFilterOpen)}
                                className="flex items-center gap-2.5 text-blue-600 hover:text-blue-700 font-black text-[14px] transition-all px-3 py-2 rounded-xl hover:bg-blue-50/50"
                            >
                                <Plus className="w-4 h-4" />
                                Add Filter
                                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform opacity-50", isAddFilterOpen && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {isAddFilterOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[110]" onClick={() => setIsAddFilterOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: -8, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] z-[120] py-2 ring-1 ring-black/5"
                                        >
                                            <div className="px-4 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Available Fields</div>
                                            {ALL_CATEGORIES.map(category => (
                                                <button
                                                    key={category}
                                                    onClick={() => addRow(category)}
                                                    className="w-full text-left px-4 py-2.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-between group"
                                                >
                                                    {category}
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
                                className="h-10 px-6 border border-slate-200 bg-white rounded-lg text-[14px] font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleApply}
                                className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[14px] font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-[2px]"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
