import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { usePurchaseOrderSettings } from '../hooks/usePurchaseOrderSettings';
import { X, Plus, Trash2, FolderOpen } from 'lucide-react';

type TabId = 'General' | 'Categories' | 'Public Request Portal';

export const PurchaseOrderSettingsWorkspace: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState<TabId>('General');
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [newCategoryName, setNewCategoryName] = React.useState('');
    
    const { 
        settings, 
        updateSetting, 
        categories, 
        createCategory, 
        deleteCategory 
    } = usePurchaseOrderSettings();

    // Utility to get setting value
    const getVal = (key: string) => (settings.data || []).find((s: any) => s.key === `po.${key}`)?.value || '';

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        createCategory.mutate({ name: newCategoryName }, {
            onSuccess: () => {
                setNewCategoryName('');
                setIsAddModalOpen(false);
            }
        });
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px]">
            {/* Top Navigation & Action Header */}
            <div className="border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                    {['General', 'Categories', 'Public Request Portal'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as TabId)}
                            className={cn(
                                "pb-4 text-[14px] font-bold transition-all relative whitespace-nowrap",
                                activeTab === tab ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="tab-indicator"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600"
                                />
                            )}
                        </button>
                    ))}
                </div>
                
                {activeTab === 'Categories' && (
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="mb-4 px-6 py-2 bg-indigo-600 text-white text-[13px] font-black rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'General' && (
                        <motion.div 
                            key="general"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8 py-8"
                        >
                            {/* Start Count Setting */}
                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-50 bg-slate-50/40">
                                    <h2 className="text-[15px] font-bold text-slate-800">Purchase Order Start Count</h2>
                                    <p className="text-[13px] text-slate-400 font-medium leading-relaxed mt-1">
                                        Set the number you want your first purchase order to increment from.
                                    </p>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Start count number</label>
                                        <input 
                                            type="number"
                                            value={getVal('startNumber') || '1'}
                                            onChange={(e) => updateSetting.mutate({ key: 'po.startNumber', value: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Prefix Setting */}
                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-50 bg-slate-50/40">
                                    <h2 className="text-[15px] font-bold text-slate-800">Purchase Order Prefix</h2>
                                    <p className="text-[13px] text-slate-400 font-medium leading-relaxed mt-1">
                                        Set the prefix you want for your auto generated purchase order number.
                                    </p>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Purchase order prefix</label>
                                        <input 
                                            type="text"
                                            placeholder="e.g. PO-"
                                            value={getVal('prefix')}
                                            onChange={(e) => updateSetting.mutate({ key: 'po.prefix', value: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Categories' && (
                        <motion.div 
                            key="categories"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="py-8"
                        >
                            {categories.data && categories.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {categories.data.map((category) => (
                                        <div 
                                            key={category.id}
                                            className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                                                    <FolderOpen className="w-5 h-5" />
                                                </div>
                                                <span className="text-[15px] font-bold text-slate-700">{category.name}</span>
                                            </div>
                                            <button 
                                                onClick={() => deleteCategory.mutate(category.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                                            <FolderOpen className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                                            <Plus className="w-5 h-5 text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-[17px] font-bold text-slate-800">You don't have any categories yet</h2>
                                        <p className="text-[14px] text-slate-400 font-medium">Create a new category to get started</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="px-10 py-3 bg-white border border-slate-200 text-slate-600 text-[14px] font-black rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'Public Request Portal' && (
                        <motion.div 
                            key="portal"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="py-12"
                        >
                            <div className="max-w-4xl mx-auto">
                                <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                                    <div className="p-8 border-b border-gray-50 bg-slate-50/30">
                                        <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Purchase Order Requests</h2>
                                    </div>
                                    <div className="p-10 space-y-8">
                                        <div className="flex items-start justify-between gap-12">
                                            <div className="flex-1 space-y-2">
                                                <h3 className="text-[15px] font-bold text-slate-700">Enable Purchase Order Public Request Portal</h3>
                                                <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                                                    Enable access for non-users to request purchase orders using the public request portal
                                                </p>
                                            </div>
                                            
                                            {/* Industrial Toggle */}
                                            <button 
                                                onClick={() => updateSetting.mutate({ 
                                                    key: 'po.publicPortalEnabled', 
                                                    value: getVal('publicPortalEnabled') === 'true' ? 'false' : 'true' 
                                                })}
                                                className={cn(
                                                    "shrink-0 w-[58px] h-[32px] rounded-full relative transition-all duration-300 outline-none",
                                                    getVal('publicPortalEnabled') === 'true' ? "bg-indigo-600" : "bg-slate-200"
                                                )}
                                            >
                                                <motion.div 
                                                    animate={{ x: getVal('publicPortalEnabled') === 'true' ? 28 : 4 }}
                                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md pointer-events-none"
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Add Category Modal */}
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
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Add Category</h2>
                                    <button 
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="p-2 hover:bg-slate-50 rounded-xl transition-all"
                                    >
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <input 
                                        autoFocus
                                        type="text"
                                        placeholder=""
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[16px] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-600 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)] transition-all"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-2">
                                    <button 
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-8 py-3 text-slate-500 text-[14px] font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        disabled={!newCategoryName.trim() || createCategory.isPending}
                                        onClick={handleAddCategory}
                                        className="px-10 py-3 bg-indigo-600 text-white text-[14px] font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:shadow-none transition-all"
                                    >
                                        {createCategory.isPending ? 'Adding...' : 'Confirm'}
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
