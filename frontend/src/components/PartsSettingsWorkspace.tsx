import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAssetSettings } from '../hooks/useAssetSettings';
import { AutoGroupPartsModal } from './AutoGroupPartsModal';
import { CreateAssetFieldModal } from './CreateAssetFieldModal';
import { 
    ChevronDown, Type, AlignLeft, 
    Hash, DollarSign, Calendar, List, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const PartsSettingsWorkspace: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'General' | 'Custom Fields'>('General');
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isCreateFieldModalOpen, setIsCreateFieldModalOpen] = useState(false);
    const [selectedFieldType, setSelectedFieldType] = useState('Single Line Text');
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);

    const { fields, settings, updateSetting, deleteField } = useAssetSettings('PART');
    const queryClient = useQueryClient();

    const syncAllocatedMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/parts/sync-allocated');
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['parts'] });
            queryClient.invalidateQueries({ queryKey: ['asset-settings', 'PART'] });
            toast.success(
                `Sync complete! Recalculated allocation values for all ${data.partsSynced} parts.`,
                { duration: 6000, icon: '✅' }
            );
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to sync allocated quantities';
            toast.error(message);
        }
    });

    const handleSync = () => {
        if (syncAllocatedMutation.isPending) return;
        syncAllocatedMutation.mutate();
    };

    const isMultipleInventoryEnabled = (settings.data || []).find((s: any) => s.key === 'parts.multipleInventoryLines')?.value === 'true';
    const isPurchaseHistoryEnabled = (settings.data || []).find((s: any) => s.key === 'parts.purchaseHistory')?.value === 'true';

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Navigation */}
            <div className="border-b border-gray-100 -mt-6">
                <div className="flex items-center gap-8">
                    {['General', 'Custom Fields'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "pb-4 text-[14px] font-bold transition-all relative",
                                activeTab === tab ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="parts-tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-20">
                {/* Sidebar Navigation */}
                <div className="w-[180px] shrink-0 pt-2">
                    <h2 className="text-[14px] font-bold text-slate-800">Parts & Inventory</h2>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-8 pb-20">
                    {activeTab === 'General' ? (
                        <>
                            {/* Card 1: Multiple Inventory Lines */}
                            <div className="bg-white border border-gray-100 rounded-lg p-10 space-y-8">
                                <div className="flex items-start gap-8">
                                    <button 
                                        onClick={() => updateSetting.mutate({ 
                                            key: 'parts.multipleInventoryLines', 
                                            value: (!isMultipleInventoryEnabled).toString() 
                                        })}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-all flex items-center px-0.5 shrink-0 mt-1",
                                            isMultipleInventoryEnabled ? "bg-indigo-600" : "bg-slate-200"
                                        )}
                                    >
                                        <motion.div 
                                            animate={{ x: isMultipleInventoryEnabled ? 24 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="w-5 h-5 bg-white rounded-full shadow-md"
                                        />
                                    </button>
                                    <div className="space-y-2">
                                        <h3 className="text-[14px] font-bold text-slate-700 leading-none">Enable Parts with multiple inventory lines</h3>
                                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                            Please follow <a href="#" className="text-indigo-600 hover:underline">this import process</a> to update your data
                                        </p>
                                    </div>
                                </div>
                                <div className="pl-20">
                                    <button 
                                        onClick={() => setIsGroupModalOpen(true)}
                                        className="px-6 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-all"
                                    >
                                        Group Parts
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: Sync Allocated Quantities */}
                            <div className="bg-white border border-gray-100 rounded-lg p-10 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-[14px] font-bold text-slate-700">Sync allocated part quantities</h3>
                                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-[700px]">
                                        The allocated quantity field on your parts to be synced to match the total quantity of parts on incomplete work orders. Parts on deleted, archived, or complete work orders do not get counted as allocated.
                                    </p>
                                </div>
                                <div>
                                    <button 
                                        onClick={handleSync}
                                        disabled={syncAllocatedMutation.isPending}
                                        className="px-8 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {syncAllocatedMutation.isPending ? 'Syncing...' : 'Sync'}
                                    </button>
                                </div>
                            </div>

                            {/* Card 3: Purchase History */}
                            <div className="bg-white border border-gray-100 rounded-lg p-10">
                                <div className="flex items-start gap-8">
                                    <button 
                                        onClick={() => updateSetting.mutate({ 
                                            key: 'parts.purchaseHistory', 
                                            value: (!isPurchaseHistoryEnabled).toString() 
                                        })}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-all flex items-center px-0.5 shrink-0 mt-1",
                                            isPurchaseHistoryEnabled ? "bg-indigo-600" : "bg-slate-200"
                                        )}
                                    >
                                        <motion.div 
                                            animate={{ x: isPurchaseHistoryEnabled ? 24 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="w-5 h-5 bg-white rounded-full shadow-md"
                                        />
                                    </button>
                                    <div className="space-y-2">
                                        <h3 className="text-[14px] font-bold text-slate-700 leading-none">Enable Purchase History</h3>
                                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-[700px]">
                                            Track historical purchase costs and view average cost over time for your parts. This allows you to see purchase history, unit costs, and calculated average costs.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             {/* Content Header */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-[18px] font-black text-slate-800">Parts Custom Fields</h3>
                                    <p className="text-[14px] text-slate-400 font-medium">Extend your inventory profiles with domain-specific metadata.</p>
                                </div>

                                <div className="relative">
                                    <button 
                                        onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                                        className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xl shadow-indigo-100 flex items-center gap-3 transition-all active:scale-95 z-20"
                                    >
                                        <span className="text-[14px] font-black uppercase tracking-widest">Create Field</span>
                                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", showCreateDropdown && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {showCreateDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowCreateDropdown(false)} />
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-30 overflow-hidden py-2"
                                                >
                                                    {[
                                                        { id: 'Single Line Text', label: 'Single Line Text', icon: Type },
                                                        { id: 'Multi-Line Text', label: 'Multi-Line Text', icon: AlignLeft },
                                                        { id: 'Dropdown', label: 'Dropdown', icon: List },
                                                        { id: 'Date', label: 'Date', icon: Calendar },
                                                        { id: 'Number', label: 'Number', icon: Hash },
                                                        { id: 'Currency', label: 'Currency', icon: DollarSign },
                                                    ].map((item) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => {
                                                                setSelectedFieldType(item.id);
                                                                setIsCreateFieldModalOpen(true);
                                                                setShowCreateDropdown(false);
                                                            }}
                                                            className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors group text-left"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                                <item.icon className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-[14px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Fields Table */}
                            {fields.isLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Loading Registry...</p>
                                </div>
                            ) : fields.data?.length === 0 ? (
                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-24 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
                                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <Type className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-slate-800">No custom fields yet.</h3>
                                        <p className="text-slate-400 max-w-[320px] mx-auto text-[15px]">Create individual data points to track the specific needs of your inventory.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowCreateDropdown(true)}
                                        className="text-indigo-600 font-black uppercase tracking-widest text-[12px] hover:text-indigo-700 transition-colors"
                                    >
                                        Create your first field
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-gray-100">
                                                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Field Label</th>
                                                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Created At</th>
                                                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {fields.data?.map((field) => (
                                                <tr key={field.id} className="group hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-10 py-6">
                                                        <span className="text-[15px] font-bold text-slate-700">{field.label}</span>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-slate-400">
                                                                {field.type === 'Single Line Text' && <Type className="w-4 h-4" />}
                                                                {field.type === 'Multi-Line Text' && <AlignLeft className="w-4 h-4" />}
                                                                {field.type === 'Dropdown' && <List className="w-4 h-4" />}
                                                                {field.type === 'Date' && <Calendar className="w-4 h-4" />}
                                                                {field.type === 'Number' && <Hash className="w-4 h-4" />}
                                                                {field.type === 'Currency' && <DollarSign className="w-4 h-4" />}
                                                            </div>
                                                            <span className="text-[13px] font-black text-slate-400 uppercase tracking-wider">{field.type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <span className="text-[14px] font-medium text-slate-400">{new Date(field.createdAt).toLocaleDateString()}</span>
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        <button 
                                                            onClick={() => {
                                                                if (window.confirm('Are you sure you want to delete this field?')) {
                                                                    deleteField.mutate(field.id);
                                                                }
                                                            }}
                                                            className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AutoGroupPartsModal 
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
            />

            <CreateAssetFieldModal 
                isOpen={isCreateFieldModalOpen}
                onClose={() => setIsCreateFieldModalOpen(false)}
                fieldType={selectedFieldType}
                entityType="PART"
            />
        </div>
    );
};
