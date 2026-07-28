import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { name: string, parentId?: string }) => void;
    categories: any[];
    editingCategory?: any | null;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onCreate, categories, editingCategory }) => {
    const [name, setName] = useState(editingCategory?.name || '');
    const [parentId, setParentId] = useState<string>(editingCategory?.parentId || '');

    React.useEffect(() => {
        if (isOpen) {
            setName(editingCategory?.name || '');
            setParentId(editingCategory?.parentId || '');
        }
    }, [isOpen, editingCategory]);
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
                    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
                        <h2 className="text-[20px] font-bold text-slate-800">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-8 py-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[14px] font-bold text-slate-700 ml-1">Name</label>
                            <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter category name"
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-5 py-4 text-[15px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[14px] font-bold text-slate-700 ml-1">Parent Category</label>
                            <div className="relative group">
                                <select 
                                    value={parentId}
                                    onChange={(e) => setParentId(e.target.value)}
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-5 py-4 text-[15px] font-medium text-slate-700 transition-all appearance-none cursor-pointer pr-12 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 group-hover:bg-white"
                                >
                                    <option value="">None</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-8 py-6 bg-slate-50/50">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 bg-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                if (!name) return;
                                onCreate({ name, parentId: parentId || undefined });
                                onClose();
                            }}
                            disabled={!name}
                            className="px-8 py-3 bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-[14px] font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                            {editingCategory ? 'Save Changes' : 'Add Category'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
