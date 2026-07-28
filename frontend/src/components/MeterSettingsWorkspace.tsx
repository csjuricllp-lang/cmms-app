import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, X, Edit2, Trash2 } from 'lucide-react';
import { useCategoriesByType } from '../hooks/useData';
import { toast } from 'react-hot-toast';

export const MeterSettingsWorkspace: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState<any>(null);
    const [newName, setNewName] = React.useState('');
    const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

    const { data: categories, createCategory, updateCategory, deleteCategory } = useCategoriesByType('METER');

    const handleConfirm = () => {
        if (!newName.trim()) return;
        if (editingCategory) {
            updateCategory.mutate({ id: editingCategory.id, name: newName }, {
                onSuccess: () => {
                    setEditingCategory(null);
                    setNewName('');
                    toast.success('Category updated');
                }
            });
        } else {
            createCategory.mutate(newName, {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    setNewName('');
                    toast.success('Category added');
                }
            });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Tabs */}
            <div className="border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                    <button className="pb-4 px-2 text-[14px] font-bold text-slate-800 relative">
                        Categories
                        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-600 rounded-t-full" />
                    </button>
                </div>
                <div className="pb-4">
                    <button 
                        onClick={() => {
                            setEditingCategory(null);
                            setNewName('');
                            setIsAddModalOpen(true);
                        }}
                        className="px-6 py-2.5 bg-[#4F7CFF] text-white text-[13px] font-bold rounded-lg hover:bg-blue-600 transition-all shadow-md shadow-blue-500/10"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-gray-100">
                            <th className="px-10 py-5 text-[14px] font-bold text-slate-800">Name</th>
                            <th className="px-10 py-5 text-[14px] font-bold text-slate-800 text-center">Date Created</th>
                            <th className="px-10 py-5 text-[14px] font-bold text-slate-800 w-[100px]"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories && categories.length > 0 ? (
                            categories.map((cat: any) => (
                                <tr key={cat.id} className="border-b border-gray-50 last:border-b-0 hover:bg-slate-50/30 transition-all group">
                                    <td className="px-10 py-6 text-[15px] font-medium text-slate-600 italic">
                                        {cat.name}
                                    </td>
                                    <td className="px-10 py-6 text-[15px] font-medium text-slate-400 text-center">
                                        {new Date(cat.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                                    </td>
                                    <td className="px-10 py-6 text-right relative">
                                        <button 
                                            onClick={() => setActiveMenu(activeMenu === cat.id ? null : cat.id)}
                                            className="p-2 hover:bg-white rounded-lg transition-all"
                                        >
                                            <MoreHorizontal className="w-6 h-6 text-slate-400" />
                                        </button>
                                        
                                        <AnimatePresence>
                                            {activeMenu === cat.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        className="absolute right-10 top-14 w-40 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 overflow-hidden"
                                                    >
                                                        <button 
                                                            onClick={() => {
                                                                setEditingCategory(cat);
                                                                setNewName(cat.name);
                                                                setIsAddModalOpen(true);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full px-5 py-4 text-left text-[14px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-all border-b border-slate-50"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteCategory.mutate(cat.id, {
                                                                onSuccess: () => {
                                                                    toast.success('Category deleted');
                                                                    setActiveMenu(null);
                                                                }
                                                            })}
                                                            className="w-full px-5 py-4 text-left text-[14px] font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-10 py-24 text-center">
                                    <div className="space-y-2">
                                        <div className="text-[17px] font-bold text-slate-800">No Meter Categories</div>
                                        <div className="text-[14px] text-slate-400 font-medium italic">Your meter categories will appear in this registry.</div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[20px] font-bold text-slate-800">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                        className="w-full px-4 py-3 bg-white border border-blue-400 rounded-lg text-[15px] font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <button 
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-6 py-2.5 border border-slate-200 text-slate-600 text-[14px] font-bold rounded-lg hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleConfirm}
                                        disabled={!newName.trim()}
                                        className="px-8 py-2.5 bg-slate-100 text-slate-400 text-[14px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
