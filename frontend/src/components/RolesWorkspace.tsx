import React from 'react';
import { cn } from '../lib/utils';
import { CreateRoleModal } from './CreateRoleModal';
import { ConfirmationModal } from './ConfirmationModal';
import { AnimatePresence } from 'framer-motion';
import { useRoles, type Role } from '../hooks/useRoles';
import { ShieldCheck, Briefcase as BriefcaseIcon, Glasses, UserCircle, Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const RolesWorkspace: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState<Role | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
    const [roleToDelete, setRoleToDelete] = React.useState<Role | null>(null);
    const { roles, isLoadingRoles, deleteRole } = useRoles();

    const handleDelete = (role: Role) => {
        setRoleToDelete(role);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!roleToDelete) return;
        try {
            await deleteRole.mutateAsync(roleToDelete.id);
            toast.success('Role deleted successfully');
        } catch (error) {
            toast.error('Failed to delete role');
        } finally {
            setIsDeleteConfirmOpen(false);
            setRoleToDelete(null);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start justify-between">
                <div className="space-y-4 max-w-4xl">
                    <h1 className="text-[32px] font-black text-slate-800 tracking-tight">Roles</h1>
                    <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                        Manage user permissions and organizational access levels by defining custom roles or using industry standard defaults.
                    </p>
                </div>
                <button 
                    onClick={() => {
                        setEditingRole(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-xl shadow-md shadow-indigo-500/10 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Role</span>
                </button>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-gray-50 bg-slate-50/50 sticky top-0 z-10">
                            <th className="px-8 py-6 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 sticky top-0 bg-slate-50 z-10">Name</th>
                            <th className="px-8 py-6 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 sticky top-0 bg-slate-50 z-10">Users</th>
                            <th className="px-8 py-6 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 sticky top-0 bg-slate-50 z-10">External ID</th>
                            <th className="px-8 py-6 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 sticky top-0 bg-slate-50 z-10">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoadingRoles ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-[14px] font-bold text-slate-400">Loading roles...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : roles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <p className="text-[14px] font-bold text-slate-400">No custom roles found.</p>
                                </td>
                            </tr>
                        ) : (
                            roles.map((role) => (
                                <tr 
                                    key={role.id} 
                                    onClick={() => {
                                        setEditingRole(role);
                                        setIsCreateModalOpen(true);
                                    }}
                                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                                                !role.isSystem ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"
                                            )}>
                                                {role.name.includes('Admin') && <ShieldCheck className="w-5 h-5" />}
                                                {role.name.includes('Technician') && <BriefcaseIcon className="w-5 h-5" />}
                                                {role.name.includes('View Only') && <Glasses className="w-5 h-5" />}
                                                {role.name.includes('Requester') && <UserCircle className="w-5 h-5" />}
                                                {!['Admin', 'Technician', 'View Only', 'Requester'].some(s => role.name.includes(s)) && <ShieldCheck className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[15px] font-bold text-slate-700">{role.name}</span>
                                                {role.isSystem && <span className="text-[11px] font-black uppercase text-indigo-500 tracking-widest mt-0.5">System Default</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[14px] font-bold text-slate-300">0</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <code className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-bold text-slate-500 font-mono">
                                            {(role as any).externalId || '—'}
                                        </code>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm",
                                            !role.isSystem 
                                                ? "bg-amber-50 text-amber-600 border border-amber-100" 
                                                : "bg-slate-50 text-slate-400 border border-slate-100"
                                        )}>
                                            {!role.isSystem ? 'Paid' : 'System'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {!role.isSystem && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingRole(role);
                                                        setIsCreateModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                    title="Edit Role"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(role);
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Delete Role"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                <CreateRoleModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setEditingRole(null);
                    }}
                    roleToEdit={editingRole}
                />
            </AnimatePresence>

            <ConfirmationModal 
                isOpen={isDeleteConfirmOpen}
                onClose={() => {
                    setIsDeleteConfirmOpen(false);
                    setRoleToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Role"
                message={`Are you sure you want to delete the "${roleToDelete?.name}" role? This action cannot be undone.`}
                confirmText="Delete Role"
                cancelText="Cancel"
                isLoading={deleteRole.isPending}
            />
        </div>
    );
};
