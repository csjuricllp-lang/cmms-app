import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

import { useRoles, type Role } from '../hooks/useRoles';
import { toast } from 'react-hot-toast';

interface CreateRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleToEdit?: Role | null;
}

interface PermissionCategory {
    id: string;
    label: string;
    actions: { id: string; key: string; label: string; hasInfo?: boolean }[];
}

const permissionCategories: PermissionCategory[] = [
    {
        id: 'categories',
        label: 'Categories',
        actions: [
            { id: 'cat_create', key: 'categories.create', label: 'Create', hasInfo: true },
            { id: 'cat_read', key: 'categories.read', label: 'View' },
            { id: 'cat_update', key: 'categories.update', label: 'Edit', hasInfo: true },
            { id: 'cat_delete', key: 'categories.delete', label: 'Delete' }
        ]
    },
    {
        id: 'locations',
        label: 'Locations',
        actions: [
            { id: 'loc_create', key: 'locations.create', label: 'Create' },
            { id: 'loc_read', key: 'locations.read', label: 'View' },
            { id: 'loc_update', key: 'locations.update', label: 'Edit' },
            { id: 'loc_delete', key: 'locations.delete', label: 'Delete' }
        ]
    },
    {
        id: 'assets',
        label: 'Assets',
        actions: [
            { id: 'asset_create', key: 'assets.create', label: 'Create' },
            { id: 'asset_read', key: 'assets.read', label: 'View' },
            { id: 'asset_update', key: 'assets.update', label: 'Edit' },
            { id: 'asset_delete', key: 'assets.delete', label: 'Delete' }
        ]
    },
    {
        id: 'parts',
        label: 'Parts & Inventory',
        actions: [
            { id: 'part_create', key: 'parts.create', label: 'Create' },
            { id: 'part_read', key: 'parts.read', label: 'View' },
            { id: 'part_update', key: 'parts.update', label: 'Edit' },
            { id: 'part_delete', key: 'parts.delete', label: 'Delete' }
        ]
    },
    {
        id: 'work_orders',
        label: 'Work Orders',
        actions: [
            { id: 'wo_create', key: 'work-orders.create', label: 'Create' },
            { id: 'wo_read', key: 'work-orders.read', label: 'View' },
            { id: 'wo_update', key: 'work-orders.update', label: 'Edit' },
            { id: 'wo_delete', key: 'work-orders.delete', label: 'Delete' }
        ]
    },
    {
        id: 'requests',
        label: 'Work Requests',
        actions: [
            { id: 'req_create', key: 'requests.create', label: 'Create' },
            { id: 'req_read', key: 'requests.read', label: 'View' },
            { id: 'req_update', key: 'requests.update', label: 'Edit' },
            { id: 'req_delete', key: 'requests.delete', label: 'Delete' }
        ]
    },
    {
        id: 'po',
        label: 'Purchase Orders',
        actions: [
            { id: 'po_create', key: 'po.create', label: 'Create' },
            { id: 'po_read', key: 'po.read', label: 'View' },
            { id: 'po_update', key: 'po.update', label: 'Edit' },
            { id: 'po_delete', key: 'po.delete', label: 'Delete' }
        ]
    },
    {
        id: 'analytics',
        label: 'Analytics Dashboard',
        actions: [
            { id: 'an_read', key: 'analytics.read', label: 'Read' },
            { id: 'an_view', key: 'analytics.view', label: 'View' }
        ]
    }
];

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ isOpen, onClose, roleToEdit }) => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const getTenantCompany = () => {
        try {
            const orgStr = localStorage.getItem('organization');
            if (orgStr) {
                const org = JSON.parse(orgStr);
                if (org && org.name) return org.name;
            }
            if (user && user.organizations && user.organizations.length > 0) {
                return user.organizations[0].name;
            }
        } catch (e) {
            console.error("Error reading tenant organization", e);
        }
        return 'Juric';
    };
    const companyName = getTenantCompany();
    const isReadOnly = !!roleToEdit?.isSystem;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [externalId, setExternalId] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
    const [expandedCategories, setExpandedCategories] = useState<string[]>(permissionCategories.map(c => c.id));
    
    const { permissions: dbPermissions, createRole, updateRole } = useRoles();

    useEffect(() => {
        if (isOpen) {
            if (roleToEdit) {
                setName(roleToEdit.name || '');
                setDescription(roleToEdit.description || '');
                setExternalId((roleToEdit as any).externalId || '');
                
                const permissionsObj: Record<string, string[]> = {};
                permissionCategories.forEach(cat => {
                    const catKeys = cat.actions.map(act => act.key);
                    const matched = roleToEdit.permissions
                        .map(p => p.key)
                        .filter(key => catKeys.includes(key));
                    permissionsObj[cat.id] = matched;
                });
                setSelectedPermissions(permissionsObj);
            } else {
                setName('');
                setDescription('');
                setExternalId('');
                setSelectedPermissions({});
            }
        }
    }, [isOpen, roleToEdit]);

    const isFormValid = name.length <= 50 && description.length <= 150 && externalId.length <= 50;

    const handleSave = async () => {
        if (!isFormValid) return;

        // Collect all selected keys
        const selectedKeys = Object.values(selectedPermissions).flat();
        
        // Map keys to DB IDs
        const permissionIds = dbPermissions
            .filter(p => selectedKeys.includes(p.key))
            .map(p => p.id);

        try {
            if (roleToEdit) {
                await updateRole.mutateAsync({
                    id: roleToEdit.id,
                    name,
                    description,
                    externalId,
                    permissionIds
                });
                toast.success('Role updated successfully');
            } else {
                await createRole.mutateAsync({
                    name,
                    description,
                    externalId,
                    permissionIds
                });
                toast.success('Role created successfully');
            }
            onClose();
        } catch (error) {
            toast.error(roleToEdit ? 'Failed to update role' : 'Failed to create role');
        }
    };

    const togglePermission = (categoryId: string, key: string) => {
        setSelectedPermissions(prev => {
            const current = prev[categoryId] || [];
            if (current.includes(key)) {
                return { ...prev, [categoryId]: current.filter(id => id !== key) };
            } else {
                return { ...prev, [categoryId]: [...current, key] };
            }
        });
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => 
            prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
        );
    };

    const toggleSelectAll = (categoryId: string, allKeys: string[]) => {
        setSelectedPermissions(prev => {
            const current = prev[categoryId] || [];
            if (current.length === allKeys.length) {
                return { ...prev, [categoryId]: [] };
            } else {
                return { ...prev, [categoryId]: allKeys };
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#000000]/40 backdrop-blur-[2px]" 
                onClick={onClose} 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[850px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">
                        {isReadOnly ? 'View Role' : roleToEdit ? 'Edit Role' : 'Create Role'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                    {/* Basic Info */}
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[14px] font-bold text-slate-700">Name</label>
                            <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isReadOnly}
                                placeholder="Name"
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                            />
                            <p className="text-[12px] text-slate-400 font-medium">Name must be 50 characters or less.</p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[14px] font-bold text-slate-700">Description</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isReadOnly}
                                placeholder="Description"
                                rows={3}
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300 resize-none disabled:bg-slate-50 disabled:text-slate-500"
                            />
                            <p className="text-[12px] text-slate-400 font-medium">Description must be 150 characters or less.</p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[14px] font-bold text-slate-700">External ID</label>
                            <input 
                                value={externalId}
                                onChange={(e) => setExternalId(e.target.value)}
                                disabled={isReadOnly}
                                placeholder="External ID"
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-[15px] font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300 font-mono disabled:bg-slate-50 disabled:text-slate-500"
                            />
                            <div className="space-y-1">
                                <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                                    This is unique to each role and will show up on import/export (can only contain lower case letters and underscores).
                                </p>
                                <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                                    External ID must be 50 characters or less, can only have letters and underscores and cannot start or end with an underscore.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Permissions Section */}
                    <div className="space-y-6">
                        <div className="space-y-2 pb-6 border-b border-gray-50">
                            <h3 className="text-[20px] font-black text-slate-800 tracking-tight">Permissions</h3>
                            <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                                This role can do everything an Administrator can do in {companyName}, but you can customize some important permissions below.
                            </p>
                        </div>

                        {/* Accordion Categories */}
                        <div className="space-y-6 pt-4">
                            {permissionCategories.map((category) => {
                                const isExpanded = expandedCategories.includes(category.id);
                                const selected = selectedPermissions[category.id] || [];
                                const allIds = category.actions.map(a => a.id);
                                const isAllSelected = selected.length === allIds.length;

                                return (
                                    <div key={category.id} className="space-y-4">
                                        <div className="flex items-center justify-between group cursor-pointer" onClick={() => toggleCategory(category.id)}>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-[16px] font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{category.label}</h4>
                                            </div>
                                            <div className="flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] font-bold text-slate-400">Select All</span>
                                                    <button 
                                                        onClick={() => toggleSelectAll(category.id, category.actions.map(a => a.key))}
                                                        disabled={isReadOnly}
                                                        className={cn(
                                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                                            isAllSelected ? "bg-slate-400 border-slate-400" : "border-slate-300",
                                                            isReadOnly && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        {isAllSelected && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                                                    </button>
                                                </div>
                                                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", isExpanded && "rotate-180")} />
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-8 bg-white border border-gray-100 rounded-2xl grid grid-cols-2 gap-x-12 gap-y-6">
                                                        {category.actions.map((action) => (
                                                            <div 
                                                                key={action.id} 
                                                                className={cn("flex items-center gap-3 group", !isReadOnly && "cursor-pointer")} 
                                                                onClick={() => !isReadOnly && togglePermission(category.id, action.key)}
                                                            >
                                                                <button 
                                                                    disabled={isReadOnly}
                                                                    className={cn(
                                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                                                        selected.includes(action.key) ? "bg-indigo-600 border-indigo-600 shadow-sm" : "border-gray-200 group-hover:border-indigo-400",
                                                                        isReadOnly && "opacity-50 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    {selected.includes(action.key) && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                                                                </button>
                                                                <span className={cn("text-[14px] font-bold transition-colors", isReadOnly ? "text-slate-500" : "text-slate-600 group-hover:text-slate-900")}>{action.label}</span>
                                                                {action.hasInfo && <Info className="w-3.5 h-3.5 text-slate-300" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-100 bg-slate-50/30 flex items-center justify-end gap-4 shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-8 py-2.5 bg-white border border-gray-200 text-slate-600 text-[14px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        {isReadOnly ? 'Close' : 'Cancel'}
                    </button>
                    {!isReadOnly && (
                        <button 
                            onClick={handleSave}
                            disabled={!isFormValid || createRole.isPending || updateRole.isPending}
                            className={cn(
                                "px-10 py-2.5 text-[14px] font-bold rounded-xl transition-all",
                                isFormValid && !createRole.isPending && !updateRole.isPending
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700" 
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {createRole.isPending || updateRole.isPending ? 'Submitting...' : roleToEdit ? 'Save' : 'Submit'}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
