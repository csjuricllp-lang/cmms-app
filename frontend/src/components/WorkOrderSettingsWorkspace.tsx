import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAssetSettings } from '../hooks/useAssetSettings';
import { useWorkOrderSettings } from '../hooks/useWorkOrderSettings';
import type { Category, CustomStatus } from '../hooks/useWorkOrderSettings';
import { useFailureCodes } from '../hooks/useFailureCodes';
import type { FailureCode } from '../hooks/useFailureCodes';
import { CreateAssetFieldModal } from './CreateAssetFieldModal';
import { CreateCustomStatusModal } from './CreateCustomStatusModal';
import { AddCategoryModal } from './AddCategoryModal';
import { AddTimerModal } from './AddTimerModal';
import { 
    ChevronDown, AlignLeft, 
    Trash2, Plus, AlertCircle, MoreHorizontal,
    Type, List, Calendar, Hash, DollarSign
} from 'lucide-react';

type TabId = 'General' | 'Configuration' | 'Statuses' | 'Categories' | 'Color' | 'Timers' | 'Custom Fields' | 'Failure Codes';

export const WorkOrderSettingsWorkspace: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('General');
    const { 
        settings, updateSetting, 
        categories, createCategory, updateCategory, deleteCategory,
        statuses, createStatus, deleteStatus,
        timers, createTimer, deleteTimer, updateTimer, provisionDefaultTimers
    } = useWorkOrderSettings();
    const { fields, deleteField } = useAssetSettings('WORK_ORDER');
    const { failureCodes, createFailureCode, updateFailureCode, deleteFailureCode } = useFailureCodes();
    
    // UI Local State
    const [isCreateFieldModalOpen, setIsCreateFieldModalOpen] = useState(false);
    const [isCreateStatusModalOpen, setIsCreateStatusModalOpen] = useState(false);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [isAddTimerModalOpen, setIsAddTimerModalOpen] = useState(false);
    const [selectedFieldType, setSelectedFieldType] = useState('Single Line Text');
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingTimer, setEditingTimer] = useState<any | null>(null);
    
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#6366F1');
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editingCatName, setEditingCatName] = useState('');
    const [editingCatColor, setEditingCatColor] = useState('#6366F1');

    const [newFailureCode, setNewFailureCode] = useState('');
    const [newFailureName, setNewFailureName] = useState('');
    const [newFailureDescription, setNewFailureDescription] = useState('');
    const [editingFailureId, setEditingFailureId] = useState<string | null>(null);
    const [editingFailureCode, setEditingFailureCode] = useState('');
    const [editingFailureName, setEditingFailureName] = useState('');
    const [editingFailureDescription, setEditingFailureDescription] = useState('');

    const getVal = (key: string) => (settings.data || []).find((s: any) => s.key === `wo.${key}`)?.value === 'true';

    const renderToggle = (key: string, label: string, description: string) => {
        const enabled = getVal(key);
        return (
            <div className="flex items-start gap-8">
                <button 
                    onClick={() => updateSetting.mutate({ 
                        key: `wo.${key}`, 
                        value: (!enabled).toString() 
                    })}
                    className={cn(
                        "w-14 h-7 rounded-full transition-all flex items-center px-1 shrink-0 mt-1",
                        enabled ? "bg-indigo-600" : "bg-slate-200"
                    )}
                >
                    <motion.div 
                        animate={{ x: enabled ? 28 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 bg-white rounded-full shadow-lg shadow-black/5"
                    />
                </button>
                <div className="space-y-2">
                    <h3 className="text-[15px] font-bold text-slate-700">{label}</h3>
                    <p className="text-[14px] text-slate-400 font-medium leading-relaxed max-w-[600px]">
                        {description}
                    </p>
                </div>
            </div>
        );
    };

    const renderFieldConfig = (key: string, label: string) => {
        const fullKey = `wo.conf.${key}`;
        const value = (settings.data || []).find((s: any) => s.key === fullKey)?.value || 'Optional';
        
        return (
            <div className="space-y-3">
                <label className="text-[14px] font-bold text-slate-600 ml-1">{label}</label>
                <div className="relative group">
                    <select 
                        value={value}
                        onChange={(e) => updateSetting.mutate({ key: fullKey, value: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-6 py-3.5 text-[14px] font-bold text-slate-700 transition-all appearance-none cursor-pointer pr-12 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm"
                    >
                        <option value="Optional">Optional</option>
                        <option value="Required">Required</option>
                        <option value="Hidden">Hidden</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Navigation */}
            <div className="border-b border-gray-100">
                <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                    {['General', 'Configuration', 'Statuses', 'Categories', 'Color', 'Timers', 'Custom Fields', 'Failure Codes'].map((tab) => (
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
            </div>

            {/* Tab Content */}
            {activeTab === 'General' ? (
                <div className="divide-y divide-gray-100">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-20 py-12 border-b border-gray-100">
                        <div className="w-full lg:w-[180px] shrink-0 space-y-4">
                            <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-widest opacity-50">Overall</h2>
                        </div>
                        <div className="flex-1 space-y-10">
                            <div className="bg-white border border-gray-100 rounded-lg p-10 space-y-10">
                                {renderToggle('autoUpdateTimer', 'Automatically update timer based on WO status changes', "Timer will automatically start once a WO is moved into the 'in progress' status, and will end once the status reaches 'complete'.")}
                                
                                <div className="h-[1px] bg-gray-50 w-full" />
                                <div className="space-y-4 max-w-[300px]">
                                    <label className="text-[13px] font-bold text-slate-700 ml-1">Starting Work Order Number</label>
                                    <input 
                                        type="number"
                                        value={(settings.data || []).find(s => s.key === 'wo.startNumber')?.value || 1}
                                        onChange={(e) => updateSetting.mutate({ key: 'wo.startNumber', value: e.target.value })}
                                        className="w-full px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-[15px] font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'Configuration' ? (
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-20 py-12 border-b border-gray-100">
                        <div className="w-full lg:w-[200px] shrink-0 space-y-3">
                            <h2 className="text-[14px] font-bold text-slate-800">Creating a Work Order</h2>
                            <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                                Configure create work order form from this page. You can mark fields as Optional, Hidden or Required.
                            </p>
                        </div>
                        <div className="flex-1">
                            <div className="bg-white border border-gray-100 rounded-[24px] p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-10">
                                    {renderFieldConfig('create.description', 'Description')}
                                    {renderFieldConfig('create.priority', 'Priority')}
                                    <div className="col-span-2">
                                        {renderFieldConfig('create.images', 'Images')}
                                    </div>
                                    {renderFieldConfig('create.primaryWorker', 'Primary Worker')}
                                    {renderFieldConfig('create.additionalWorkers', 'Additional Workers')}
                                    {renderFieldConfig('create.assignedTeam', 'Assigned Team')}
                                    {renderFieldConfig('create.assignedAsset', 'Assigned Asset')}
                                    <div className="col-span-2">
                                        {renderFieldConfig('create.assignedLocation', 'Assigned Location')}
                                    </div>
                                    {renderFieldConfig('create.dueDate', 'Due Date')}
                                    {renderFieldConfig('create.category', 'Category')}
                                    {renderFieldConfig('create.purchaseOrders', 'Purchase Orders')}
                                    {renderFieldConfig('create.files', 'Files')}
                                    <div className="col-span-2">
                                        {renderFieldConfig('create.signature', 'Signature')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-20 py-12 pb-20">
                        <div className="w-full lg:w-[200px] shrink-0 space-y-3">
                            <h2 className="text-[14px] font-bold text-slate-800">Completing a Work Order</h2>
                            <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                                Configure complete work order form from this page. You can mark fields as Optional, Hidden or Required.
                            </p>
                        </div>
                        <div className="flex-1">
                            <div className="bg-white border border-gray-100 rounded-[24px] p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-10">
                                    <div className="col-span-2">
                                        {renderFieldConfig('complete.files', 'Files')}
                                    </div>
                                    {renderFieldConfig('complete.time', 'Time')}
                                    {renderFieldConfig('complete.parts', 'Parts')}
                                    <div className="col-span-2">
                                        {renderFieldConfig('complete.cost', 'Cost')}
                                    </div>
                                    <div className="col-span-2">
                                        {renderFieldConfig('complete.closeoutNotes', 'Closeout Notes')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'Statuses' ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[18px] font-bold text-slate-800">{4 + (statuses.data?.length || 0)}</span>
                            <span className="text-[14px] text-slate-400 font-medium">statuses</span>
                        </div>
                        <button 
                            onClick={() => setIsCreateStatusModalOpen(true)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-[14px] font-bold transition-all shadow-lg shadow-indigo-100"
                        >
                            Create Custom Status
                        </button>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left font-bold">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-gray-100 font-black">
                                    <th className="px-8 py-5 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-8 py-5 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-8 py-5 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Last Updated</th>
                                    <th className="px-8 py-5 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Created By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {[
                                    { name: 'Open', type: 'Open', color: '#64748b' },
                                    { name: 'In Progress', type: 'In Progress', color: '#22c55e' },
                                    { name: 'On Hold', type: 'On Hold', color: '#f59e0b' },
                                    { name: 'Complete', type: 'Complete', color: '#3b82f6' },
                                ].map((sys) => (
                                    <tr key={sys.name} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 text-[14px] font-bold text-slate-700">{sys.name}</td>
                                        <td className="px-8 py-5">
                                            <span 
                                                className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
                                                style={{ backgroundColor: `${sys.color}15`, color: sys.color }}
                                            >
                                                {sys.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-[14px] text-slate-400 font-medium">-</td>
                                        <td className="px-8 py-5 text-[14px] text-slate-400 font-medium"></td>
                                    </tr>
                                ))}

                                {statuses.data?.map((status: CustomStatus) => (
                                    <tr key={status.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5 text-[14px] font-bold text-slate-700">{status.label}</td>
                                        <td className="px-8 py-5">
                                            <span 
                                                className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
                                                style={{ backgroundColor: `${status.color}15`, color: status.color }}
                                            >
                                                {status.systemStatus}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-[14px] text-slate-400 font-medium">
                                            Just now
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[14px] text-slate-400 font-medium">Admin</span>
                                                <button 
                                                    onClick={() => deleteStatus.mutate(status.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'Categories' ? (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => {
                                setEditingCategory(null);
                                setIsAddCategoryModalOpen(true);
                            }}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-2.5 rounded-lg text-[14px] font-bold transition-all"
                        >
                            Add
                        </button>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-visible">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 bg-slate-50/50">
                                    <th className="px-8 py-6 text-[14px] font-bold text-slate-700">Name</th>
                                    <th className="px-8 py-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-8 py-5 text-[14px] font-medium text-slate-600">None</td>
                                    <td className="px-8 py-5 text-right relative">
                                        <button 
                                            onClick={() => setOpenMenuId(openMenuId === 'none' ? null : 'none')}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
                                        >
                                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                        </button>
                                    </td>
                                </tr>
                                {categories.data?.map((cat: Category) => (
                                    <tr key={cat.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-5 text-[14px] font-medium text-slate-600">{cat.name}</td>
                                        <td className="px-8 py-5 text-right relative">
                                            <div className="flex items-center justify-end">
                                                <button 
                                                    onClick={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                                </button>

                                                <AnimatePresence>
                                                    {openMenuId === cat.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                                                            <motion.div 
                                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                className="absolute right-8 top-12 w-[160px] bg-white border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] py-2 z-40 overflow-hidden"
                                                            >
                                                                <button 
                                                                    onClick={() => {
                                                                        setEditingCategory(cat);
                                                                        setIsAddCategoryModalOpen(true);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-[14px] font-bold text-slate-600 group/item"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover/item:bg-white transition-colors">
                                                                        <AlignLeft className="w-4 h-4 text-slate-400 group-hover/item:text-indigo-600" />
                                                                    </div>
                                                                    Edit
                                                                </button>
                                                                <div className="h-[1px] bg-gray-50 mx-2" />
                                                                <button 
                                                                    onClick={() => {
                                                                        if (window.confirm('Delete this category?')) {
                                                                            deleteCategory.mutate(cat.id);
                                                                        }
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 transition-colors text-[14px] font-bold text-rose-600 group/del"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-rose-50/50 flex items-center justify-center group-hover/del:bg-white transition-colors">
                                                                        <Trash2 className="w-4 h-4 text-rose-400 group-hover/del:text-rose-600" />
                                                                    </div>
                                                                    Delete
                                                                </button>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'Color' ? (
                <div className="space-y-12 pb-20">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-20 py-12">
                        <div className="w-full lg:w-[180px] shrink-0 space-y-2">
                            <h2 className="text-[14px] font-bold text-slate-800">Classification</h2>
                            <p className="text-[12px] text-slate-400 leading-relaxed font-medium">Group your work orders by type (Electrical, Plumbing, etc.) for better reporting with visual identifiers.</p>
                        </div>
                        <div className="flex-1 space-y-8">
                            <div className="bg-white border border-gray-100 rounded-[24px] p-8 space-y-8 shadow-sm">
                                <div className="flex items-end gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex-1 space-y-3">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Category Name</label>
                                        <input 
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="e.g. Mechanical"
                                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Color</label>
                                        <div className="flex items-center gap-2 px-3 py-3 bg-white border border-slate-200 rounded-xl">
                                            <input 
                                                type="color"
                                                value={newCategoryColor}
                                                onChange={(e) => setNewCategoryColor(e.target.value)}
                                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                                            />
                                            <span className="text-[13px] font-bold text-slate-500 uppercase">{newCategoryColor}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (!newCategoryName) return;
                                            createCategory.mutate({ name: newCategoryName, color: newCategoryColor });
                                            setNewCategoryName('');
                                        }}
                                        disabled={createCategory.isPending || !newCategoryName}
                                        className="h-14 px-8 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-black uppercase tracking-widest text-[12px] disabled:opacity-50"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {categories.data?.map((cat: Category) => (
                                        editingCatId === cat.id ? (
                                            <div key={cat.id} className="flex items-center gap-3 p-4 rounded-2xl border-2 border-indigo-300 bg-indigo-50/40 shadow-sm">
                                                <label className="relative cursor-pointer shrink-0" title="Click to change color">
                                                    <div 
                                                        className="w-9 h-9 rounded-full border-[3px] border-white shadow-lg ring-2 ring-indigo-400"
                                                        style={{ backgroundColor: editingCatColor }}
                                                    />
                                                    <input 
                                                        type="color"
                                                        value={editingCatColor}
                                                        onChange={(e) => setEditingCatColor(e.target.value)}
                                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                    />
                                                </label>
                                                <input
                                                    autoFocus
                                                    value={editingCatName}
                                                    onChange={(e) => setEditingCatName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && editingCatName.trim()) {
                                                            updateCategory.mutate({ id: cat.id, name: editingCatName.trim(), color: editingCatColor });
                                                            setEditingCatId(null);
                                                        }
                                                        if (e.key === 'Escape') setEditingCatId(null);
                                                    }}
                                                    className="flex-1 min-w-0 text-[13px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition-all"
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (editingCatName.trim()) {
                                                            updateCategory.mutate({ id: cat.id, name: editingCatName.trim(), color: editingCatColor });
                                                        }
                                                        setEditingCatId(null);
                                                    }}
                                                    className="text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-all shrink-0"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingCatId(null)}
                                                    className="text-[11px] font-black text-slate-400 hover:text-slate-600 px-2 py-2 rounded-lg transition-all shrink-0"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white hover:bg-slate-50/50 transition-all shadow-sm">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Large clickable color swatch */}
                                                    <label className="relative cursor-pointer shrink-0" title="Click to change color">
                                                        <div
                                                            className="w-7 h-7 rounded-full border-2 border-white shadow-md ring-1 ring-slate-200 hover:ring-indigo-400 transition-all"
                                                            style={{ backgroundColor: cat.color || '#6366F1' }}
                                                        />
                                                        <input
                                                            type="color"
                                                            value={cat.color || '#6366F1'}
                                                            onChange={(e) => updateCategory.mutate({ id: cat.id, color: e.target.value })}
                                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                        />
                                                    </label>
                                                    <span className="text-[14px] font-bold text-slate-700 truncate">{cat.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCatId(cat.id);
                                                            setEditingCatName(cat.name);
                                                            setEditingCatColor(cat.color || '#6366F1');
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit name"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteCategory.mutate(cat.id)}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'Timers' ? (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setIsAddTimerModalOpen(true)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-2.5 rounded-lg text-[14px] font-bold transition-all"
                        >
                            Add
                        </button>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 bg-slate-50/50">
                                    <th className="px-8 py-6 text-[14px] font-bold text-slate-700">Name</th>
                                    <th className="px-8 py-6 text-[14px] font-bold text-slate-700">Date Created</th>
                                    <th className="px-8 py-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {timers.data?.map((timer: any) => (
                                    <tr key={timer.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-5 text-[14px] font-medium text-slate-600">{timer.name}</td>
                                        <td className="px-8 py-5 text-[14px] text-slate-400 font-medium lowercase">
                                            {new Date(timer.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                                        </td>
                                        <td className="px-8 py-5 text-right relative">
                                            <div className="flex items-center justify-end">
                                                <button 
                                                    onClick={() => setOpenMenuId(openMenuId === timer.id ? null : timer.id)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    <MoreHorizontal className="w-5 h-5 text-slate-400" />
                                                </button>

                                                <AnimatePresence>
                                                    {openMenuId === timer.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                                                            <motion.div 
                                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                className="absolute right-8 top-12 w-[160px] bg-white border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] py-2 z-40 overflow-hidden"
                                                            >
                                                                <button 
                                                                    onClick={() => {
                                                                        setEditingTimer(timer);
                                                                        setIsAddTimerModalOpen(true);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-[14px] font-bold text-slate-600 group/item text-left"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover/item:bg-white transition-colors">
                                                                        <AlignLeft className="w-4 h-4 text-slate-400 group-hover/item:text-indigo-600" />
                                                                    </div>
                                                                    Edit
                                                                </button>
                                                                <div className="h-[1px] bg-gray-50 mx-2" />
                                                                <button 
                                                                    onClick={() => {
                                                                        if (window.confirm('Delete this timer type?')) {
                                                                            deleteTimer.mutate(timer.id);
                                                                        }
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 transition-colors text-[14px] font-bold text-rose-600 group/del text-left"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-rose-50/50 flex items-center justify-center group-hover/del:bg-white transition-colors">
                                                                        <Trash2 className="w-4 h-4 text-rose-400 group-hover/del:text-rose-600" />
                                                                    </div>
                                                                    Delete
                                                                </button>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!timers.data || timers.data.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-32 text-center space-y-6">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                    <AlertCircle className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[16px] font-bold text-slate-700">No timer types defined yet.</p>
                                                    <p className="text-[13px] text-slate-400 font-medium">Initialize your environment with standard industry classifications.</p>
                                                </div>
                                                <button 
                                                    onClick={() => provisionDefaultTimers.mutate()}
                                                    disabled={provisionDefaultTimers.isPending}
                                                    className="mt-4 px-6 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-[13px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                                                >
                                                    {provisionDefaultTimers.isPending ? 'Provisioning...' : 'Provision Standard Timers'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'Custom Fields' ? (
                <div className="flex-1 space-y-8 pb-20">
                    <div className="flex items-center justify-between mb-8">
                        <div className="text-[14px] text-slate-400 font-medium">
                            {fields.data?.length || 0} result
                        </div>
                        <div className="relative">
                            <button 
                                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                                className="flex items-center gap-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md group"
                            >
                                <span className="text-[14px] font-bold">Create Field</span>
                                <ChevronDown className={cn("w-4 h-4 text-white transition-transform duration-300", showCreateDropdown && "rotate-180")} />
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

                    {fields.isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Loading Registry...</p>
                        </div>
                    ) : fields.data?.length === 0 ? (
                        <div className="py-40 flex flex-col items-center justify-center text-center space-y-4">
                            <h3 className="text-[18px] font-bold text-slate-800">You don't have any custom fields yet</h3>
                            <p className="text-[14px] text-slate-400 font-medium">Create a new custom field to get started</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm w-full">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-gray-100">
                                        <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Field Label</th>
                                        <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                        <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {fields.data?.map((field: any) => (
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
            ) : activeTab === 'Failure Codes' ? (
                <div className="space-y-12 pb-20">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-20 py-12">
                        <div className="w-full lg:w-[180px] shrink-0 space-y-2">
                            <h2 className="text-[14px] font-bold text-slate-800">Failure Codes</h2>
                            <p className="text-[12px] text-slate-400 leading-relaxed font-medium">Define standardized failure codes and root causes for technicians to select when completing work orders.</p>
                        </div>
                        <div className="flex-1 space-y-8">
                            <div className="bg-white border border-gray-100 rounded-[24px] p-8 space-y-8 shadow-sm">
                                <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-3">
                                            <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Code</label>
                                            <input 
                                                value={newFailureCode}
                                                onChange={(e) => setNewFailureCode(e.target.value)}
                                                placeholder="e.g. ELEC-01"
                                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all uppercase"
                                            />
                                        </div>
                                        <div className="space-y-3 sm:col-span-2">
                                            <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Name</label>
                                            <input 
                                                value={newFailureName}
                                                onChange={(e) => setNewFailureName(e.target.value)}
                                                placeholder="e.g. Electrical Short"
                                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Description (Optional)</label>
                                        <input 
                                            value={newFailureDescription}
                                            onChange={(e) => setNewFailureDescription(e.target.value)}
                                            placeholder="Detailed explanation of the failure code"
                                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => {
                                                if (!newFailureCode || !newFailureName) return;
                                                createFailureCode.mutate({ code: newFailureCode.toUpperCase(), name: newFailureName, description: newFailureDescription });
                                                setNewFailureCode('');
                                                setNewFailureName('');
                                                setNewFailureDescription('');
                                            }}
                                            disabled={createFailureCode.isPending || !newFailureCode || !newFailureName}
                                            className="h-12 px-8 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-black uppercase tracking-widest text-[12px] disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add Code
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {failureCodes.data?.map((code: FailureCode) => (
                                        editingFailureId === code.id ? (
                                            <div key={code.id} className="flex flex-col gap-4 p-4 rounded-2xl border-2 border-indigo-300 bg-indigo-50/40 shadow-sm">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <input
                                                        value={editingFailureCode}
                                                        onChange={(e) => setEditingFailureCode(e.target.value)}
                                                        placeholder="Code"
                                                        className="w-full text-[13px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition-all uppercase"
                                                    />
                                                    <input
                                                        value={editingFailureName}
                                                        onChange={(e) => setEditingFailureName(e.target.value)}
                                                        placeholder="Name"
                                                        className="w-full text-[13px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition-all sm:col-span-2"
                                                    />
                                                </div>
                                                <div className="flex gap-4 items-center">
                                                    <input
                                                        value={editingFailureDescription}
                                                        onChange={(e) => setEditingFailureDescription(e.target.value)}
                                                        placeholder="Description"
                                                        className="flex-1 min-w-0 text-[13px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 transition-all"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (editingFailureCode.trim() && editingFailureName.trim()) {
                                                                updateFailureCode.mutate({ id: code.id, code: editingFailureCode.trim().toUpperCase(), name: editingFailureName.trim(), description: editingFailureDescription.trim() });
                                                            }
                                                            setEditingFailureId(null);
                                                        }}
                                                        className="text-[11px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-lg transition-all shrink-0"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingFailureId(null)}
                                                        className="text-[11px] font-black text-slate-400 hover:text-slate-600 px-3 py-2.5 rounded-lg transition-all shrink-0 bg-white border border-slate-200"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={code.id} className="flex items-start justify-between p-5 rounded-2xl border border-gray-100 bg-white hover:bg-slate-50/50 transition-all shadow-sm">
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-widest rounded-md">{code.code}</span>
                                                        <span className="text-[14px] font-bold text-slate-700">{code.name}</span>
                                                    </div>
                                                    {code.description && <p className="text-[13px] text-slate-400 font-medium">{code.description}</p>}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-4">
                                                    <button
                                                        onClick={() => {
                                                            setEditingFailureId(code.id);
                                                            setEditingFailureCode(code.code);
                                                            setEditingFailureName(code.name);
                                                            setEditingFailureDescription(code.description || '');
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit code"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if(window.confirm('Delete this failure code?')) deleteFailureCode.mutate(code.id);
                                                        }}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                    {(!failureCodes.data || failureCodes.data.length === 0) && (
                                        <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-300">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-slate-700">No Failure Codes defined</p>
                                                <p className="text-[12px] text-slate-400 font-medium">Add codes above to standardize root causes.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 py-32 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 animate-pulse">
                        <AlertCircle className="w-10 h-10 text-slate-200" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-800">{activeTab} Hub</h2>
                        <p className="text-slate-400 max-w-[400px]">CTO Antigravity is currently implementing this maintenance configuration segment.</p>
                    </div>
                </div>
            )}

            <CreateAssetFieldModal 
                isOpen={isCreateFieldModalOpen}
                onClose={() => setIsCreateFieldModalOpen(false)}
                fieldType={selectedFieldType}
                entityType="WORK_ORDER"
            />
            <CreateCustomStatusModal 
                isOpen={isCreateStatusModalOpen}
                onClose={() => setIsCreateStatusModalOpen(false)}
                onCreate={(data) => createStatus.mutate(data)}
            />
            <AddCategoryModal 
                isOpen={isAddCategoryModalOpen}
                onClose={() => setIsAddCategoryModalOpen(false)}
                categories={categories.data || []}
                editingCategory={editingCategory}
                onCreate={(data) => createCategory.mutate(data)}
            />
            <AddTimerModal 
                isOpen={isAddTimerModalOpen}
                onClose={() => {
                    setIsAddTimerModalOpen(false);
                    setEditingTimer(null);
                }}
                editingTimer={editingTimer}
                onConfirm={(name, id) => {
                    if (id) {
                        updateTimer.mutate({ id, name });
                    } else {
                        createTimer.mutate(name);
                    }
                }}
            />
        </div>
    );
};
