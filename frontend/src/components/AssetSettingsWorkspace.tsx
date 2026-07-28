import React, { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Type, AlignLeft, List, Calendar, Hash, DollarSign, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateAssetFieldModal } from './CreateAssetFieldModal';
import { CreateScheduleView } from './CreateScheduleView';
import { useAssetSettings } from '../hooks/useAssetSettings';
import { useCategoriesByType } from '../hooks/useData';
import { AddCategoryModal } from './AddCategoryModal';

type TabId = 'fields' | 'hours' | 'status' | 'checkin';

interface AssetField {
    id: string;
    name: string;
    type: string;
    source: 'Default' | 'Custom';
}

const defaultFields: AssetField[] = [
    { id: '1', name: 'Additional Information', type: 'Multi-Line Text', source: 'Default' },
    { id: '2', name: 'Additional Worker', type: 'Dropdown', source: 'Default' },
    { id: '3', name: 'Area', type: 'Single Line Text', source: 'Default' },
    { id: '4', name: 'Category', type: 'Single Line Text', source: 'Default' },
    { id: '5', name: 'Customers', type: 'Dropdown', source: 'Default' },
    { id: '6', name: 'Description', type: 'Multi-Line Text', source: 'Default' },
    { id: '7', name: 'Model', type: 'Single Line Text', source: 'Default' },
    { id: '8', name: 'Name', type: 'Single Line Text', source: 'Default' },
    { id: '9', name: 'Placed In Service', type: 'Date', source: 'Default' },
    { id: '10', name: 'Purchase Date', type: 'Date', source: 'Default' },
    { id: '11', name: 'Purchase Price', type: 'Number', source: 'Default' },
    { id: '12', name: 'Residual Price', type: 'Number', source: 'Default' },
    { id: '13', name: 'Serial Number', type: 'Single Line Text', source: 'Default' },
    { id: '14', name: 'Team', type: 'Dropdown', source: 'Default' },
    { id: '15', name: 'Useful life', type: 'Number', source: 'Default' },
    { id: '16', name: 'Vendors', type: 'Dropdown', source: 'Default' },
    { id: '17', name: 'Warranty Expiration', type: 'Date', source: 'Default' },
    { id: '18', name: 'Worker', type: 'Dropdown', source: 'Default' }
];

export const AssetSettingsWorkspace: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('fields');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedFieldType, setSelectedFieldType] = useState('Single Line Text');
    const [showCreateSchedule, setShowCreateSchedule] = useState(false);

    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const { data: assetCategories = [], createCategory, updateCategory, deleteCategory } = useCategoriesByType('ASSET');

    const { fields, schedules, settings, updateSetting, deleteField } = useAssetSettings();

    const tabs = [
        { id: 'fields', label: 'Fields' },
        { id: 'hours', label: 'Operating Hours' },
        { id: 'status', label: 'Asset Status' },
        { id: 'checkin', label: 'Check In/Out' }
    ];

    const fieldTypes = [
        { id: 'single_line', label: 'Single Line Text', icon: Type },
        { id: 'multi_line', label: 'Multi-Line Text', icon: AlignLeft },
        { id: 'dropdown', label: 'Dropdown', icon: List },
        { id: 'date', label: 'Date', icon: Calendar },
        { id: 'number', label: 'Number', icon: Hash },
        { id: 'currency', label: 'Currency', icon: DollarSign },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tabs */}
            <div className="border-b border-gray-100 pb-0">
                <div className="flex items-center gap-8">
                    {tabs.map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabId)}
                            className={cn(
                                "pb-4 text-[14px] font-bold transition-all relative",
                                activeTab === tab.id ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div layoutId="asset-tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'fields' && (
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="flex items-center justify-end gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="px-6 py-2.5 bg-indigo-600 text-white text-[13px] font-black rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                                <span>Create Field</span>
                                <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isDropdownOpen && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[50]" onClick={() => setIsDropdownOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-[260px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 py-3 z-[60] overflow-hidden"
                                        >
                                            {fieldTypes.map((type) => (
                                                <button 
                                                    key={type.id}
                                                    onClick={() => {
                                                        setSelectedFieldType(type.label);
                                                        setIsCreateModalOpen(true);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group text-left"
                                                >
                                                    <type.icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                    <span className="text-[14px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{type.label}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-[14px] font-bold text-slate-400">{(fields.data?.length || 0) + defaultFields.length} results</span>
                        <div className="relative w-[320px]">
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by Name"
                                className="w-full pl-4 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto max-h-[500px] overflow-y-auto shadow-sm">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50 bg-slate-50/30 sticky top-0 z-10">
                                    <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 sticky top-0 bg-slate-50 z-10">Name</th>
                                    <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 sticky top-0 bg-slate-50 z-10">Type</th>
                                    <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 text-right sticky top-0 bg-slate-50 z-10">Source</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {defaultFields.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((field) => (
                                    <tr key={field.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <td className="px-8 py-5">
                                            <span className="text-[14px] font-bold text-slate-700">{field.name}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-[13px] font-medium text-slate-500">{field.type}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                {field.source}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {fields.isLoading ? (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-10 text-center text-[14px] font-medium text-slate-400 italic">
                                            Loading custom fields...
                                        </td>
                                    </tr>
                                ) : (
                                    fields.data?.filter(f => f.label.toLowerCase().includes(searchQuery.toLowerCase())).map((field) => (
                                        <tr key={field.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                            <td className="px-8 py-5 flex items-center justify-between">
                                                <span className="text-[14px] font-bold text-slate-700">{field.label}</span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if(confirm('Are you sure you want to delete this custom field?')) {
                                                            deleteField.mutate(field.id);
                                                        }
                                                    }}
                                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[13px] font-medium text-slate-500">{field.type}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                                                    Custom
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2 cursor-pointer group">
                            <span className="text-[13px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Show 25 per page</span>
                            <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                        <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 text-slate-300 cursor-not-allowed">
                                <ChevronLeft className="w-5 h-5" />
                                <span className="text-[13px] font-bold">Previous</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-slate-400">Page 1 of 1</span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                            <button className="flex items-center gap-2 text-slate-300 cursor-not-allowed">
                                <span className="text-[13px] font-bold">Next</span>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                <CreateAssetFieldModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    fieldType={selectedFieldType}
                />
            </AnimatePresence>
            {activeTab === 'hours' && (
                showCreateSchedule ? (
                    <CreateScheduleView onBack={() => setShowCreateSchedule(false)} />
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-bold text-slate-400">{schedules.data?.length || 0} Schedules</span>
                            <button 
                                onClick={() => setShowCreateSchedule(true)}
                                className="px-6 py-2.5 bg-indigo-600 text-white text-[13px] font-black rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all font-bold"
                            >
                                Create Schedule
                            </button>
                        </div>

                        <div className="w-full h-[280px] border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center gap-4">
                            <p className="text-[14px] font-bold text-slate-400 font-bold">No schedules have been created yet</p>
                        </div>
                    </div>
                )
            )}
            {activeTab === 'status' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => {
                                setEditingCategory(null);
                                setIsAddCategoryModalOpen(true);
                            }}
                            className="px-6 py-2.5 bg-indigo-600 text-white text-[13px] font-black rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all font-bold"
                        >
                            Add Category
                        </button>
                    </div>

                    {assetCategories.length === 0 ? (
                        <div className="w-full py-32 flex flex-col items-center justify-center gap-6 bg-white border border-gray-100 rounded-2xl">
                            <div className="space-y-2 text-center">
                                <h3 className="text-[16px] font-bold text-slate-700">You don't have any categories yet</h3>
                                <p className="text-[14px] text-slate-400 font-medium font-bold">Create a new category to get started</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setEditingCategory(null);
                                    setIsAddCategoryModalOpen(true);
                                }}
                                className="px-8 py-3 bg-white border border-gray-200 text-slate-600 text-[14px] font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                            >
                                Add Category
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto max-h-[500px] overflow-y-auto shadow-sm">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-50 bg-slate-50/30 sticky top-0 z-10">
                                        <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 sticky top-0 bg-slate-50 z-10">Category Name</th>
                                        <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 sticky top-0 bg-slate-50 z-10">Parent Category</th>
                                        <th className="px-8 py-4 text-right text-[11px] font-black uppercase tracking-widest text-slate-400 sticky top-0 bg-slate-50 z-10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {assetCategories.map((cat: any) => {
                                        const parentCat = assetCategories.find((p: any) => p.id === cat.parentId);
                                        return (
                                            <tr key={cat.id} className="hover:bg-slate-50/30 transition-colors group">
                                                <td className="px-8 py-5 text-[14px] font-bold text-slate-700">{cat.name}</td>
                                                <td className="px-8 py-5 text-[13px] font-medium text-slate-400">{parentCat ? parentCat.name : '—'}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingCategory(cat);
                                                                setIsAddCategoryModalOpen(true);
                                                            }}
                                                            className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this category?')) {
                                                                    deleteCategory.mutate(cat.id);
                                                                }
                                                            }}
                                                            className="text-[12px] font-bold text-rose-600 hover:text-rose-700"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'checkin' && (
                <div className="space-y-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm flex items-start gap-8">
                        {(() => {
                            const isCascadingEnabled = (settings.data || []).find((s: any) => s.key === 'asset.cascadingCheck')?.value === 'true';
                            
                            return (
                                <button 
                                    onClick={() => {
                                        updateSetting.mutate({ 
                                            key: 'asset.cascadingCheck', 
                                            value: (!isCascadingEnabled).toString() 
                                        });
                                    }}
                                    className={cn(
                                        "w-14 h-7 rounded-full transition-all flex items-center px-1 shrink-0",
                                        isCascadingEnabled ? "bg-indigo-600" : "bg-slate-200"
                                    )}
                                >
                                    <motion.div 
                                        animate={{ x: isCascadingEnabled ? 28 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="w-5 h-5 bg-white rounded-full shadow-lg shadow-black/5"
                                    />
                                </button>
                            );
                        })()}
                        <div className="space-y-4">
                            <h3 className="text-[14px] font-bold text-slate-700">Enable cascading hierarchy check in and check out.</h3>
                            <p className="text-[14px] text-slate-400 font-medium leading-relaxed max-w-[600px]">
                                When enabled, checking in or out a parent asset will also check in/out all of its descendants. Only descendants with check in/out enabled will be affected.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <AnimatePresence>
                {isAddCategoryModalOpen && (
                    <AddCategoryModal 
                        isOpen={isAddCategoryModalOpen}
                        onClose={() => {
                            setIsAddCategoryModalOpen(false);
                            setEditingCategory(null);
                        }}
                        categories={assetCategories}
                        editingCategory={editingCategory}
                        onCreate={(data) => {
                            if (editingCategory) {
                                updateCategory.mutate({ id: editingCategory.id, ...data });
                            } else {
                                createCategory.mutate(data.name);
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
