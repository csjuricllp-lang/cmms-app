import { useState } from 'react';
import { X, Phone, Mail, Clock, Trash2, Edit2, DollarSign, Building, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { EditUserModal } from './EditUserModal';
import { ConfirmationModal } from './ConfirmationModal';

interface UserInspectorProps {
    user: any;
    onClose: () => void;
}

export const UserInspector = ({ user, onClose }: UserInspectorProps) => {
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [deactivationReason, setDeactivationReason] = useState('');

    const deleteMutation = useMutation({
        mutationFn: async () => {
            return api.delete(`/users/${user.id}`);
        },
        onSuccess: () => {
            toast.success('User removed successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
        },
        onError: () => {
            toast.error('Failed to remove user');
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async () => {
            return api.patch(`/users/${user.id}`, { 
                isActive: !user.isActive,
                ...( !user.isActive ? {} : { deactivationReason } )
            });
        },
        onSuccess: () => {
            toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowDeactivateConfirm(false);
            setDeactivationReason('');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || `Failed to ${user.isActive ? 'deactivate' : 'activate'} user`);
            setShowDeactivateConfirm(false);
            setDeactivationReason('');
        }
    });

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-end"
            onClick={onClose}
        >
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-[500px] h-full bg-white shadow-2xl flex flex-col font-outfit"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-start justify-between shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[20px] font-black shadow-lg shadow-blue-200">
                            {user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-widest">
                                    {user.jobTitle || user.roleName || user.role || 'No Title'}
                                </span>
                                {user.isActive ? (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        Inactive
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm text-slate-500"
                            title="Edit User"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => {
                                if (user.isActive) {
                                    setShowDeactivateConfirm(true);
                                } else {
                                    toggleStatusMutation.mutate();
                                }
                            }}
                            disabled={toggleStatusMutation.isPending}
                            className={`p-2.5 bg-white border border-slate-200 rounded-xl transition-colors shadow-sm disabled:opacity-50 text-slate-500 ${user.isActive ? 'hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600' : 'hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600'}`}
                            title={user.isActive ? "Deactivate User" : "Activate User"}
                        >
                            <Power className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors shadow-sm text-slate-500 disabled:opacity-50"
                            title="Remove User"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1" />
                        <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Labor Cost (H)</p>
                                <p className="text-[16px] font-bold text-slate-900">
                                    {user.hourlyRate ? `$${user.hourlyRate.toFixed(2)}/hr` : 'Not Set'}
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <Building className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Rate (H)</p>
                                <p className="text-[16px] font-bold text-slate-900">
                                    {user.companyRate ? `$${user.companyRate.toFixed(2)}/hr` : 'Not Set'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-3 mb-4">
                            Contact & Identity
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="divide-y divide-slate-100">
                                <div className="p-4 flex items-center hover:bg-slate-50 transition-colors">
                                    <div className="w-1/3 flex items-center gap-3 text-[13px] font-bold text-slate-500">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        Email
                                    </div>
                                    <div className="w-2/3 text-[14px] font-medium text-slate-900 truncate">
                                        {user.email}
                                    </div>
                                </div>
                                <div className="p-4 flex items-center hover:bg-slate-50 transition-colors">
                                    <div className="w-1/3 flex items-center gap-3 text-[13px] font-bold text-slate-500">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        Phone
                                    </div>
                                    <div className="w-2/3 text-[14px] font-medium text-slate-900 truncate">
                                        {user.phone || <span className="text-slate-300 italic">Not Provided</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Information */}
                    <div>
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-3 mb-4">
                            System Access
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Platform Role</p>
                                <p className="text-[14px] font-bold text-slate-900">{user.roleName || user.role || 'No Role Assigned'}</p>
                            </div>
                            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Last Login</p>
                                    <p className="text-[14px] font-medium text-slate-700">
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Active WO Count</p>
                                    <p className="text-[14px] font-medium text-slate-700">
                                        {user.activeWoCount || 0} Open Tickets
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">
                            Onboarded: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isEditModalOpen && (
                    <EditUserModal 
                        user={user} 
                        onClose={() => setIsEditModalOpen(false)} 
                    />
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => deleteMutation.mutate()}
                title="Remove User"
                message={`Are you sure you want to remove ${user.name}? This action cannot be undone.`}
                confirmText="Remove User"
                cancelText="Cancel"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />

            <ConfirmationModal
                isOpen={showDeactivateConfirm}
                onClose={() => {
                    setShowDeactivateConfirm(false);
                    setDeactivationReason('');
                }}
                onConfirm={() => toggleStatusMutation.mutate()}
                title="Deactivate User"
                message={`Are you sure you want to deactivate ${user.name}? They will lose access to the system immediately.`}
                confirmText="Deactivate"
                cancelText="Cancel"
                variant="warning"
                isLoading={toggleStatusMutation.isPending}
            >
                <div className="space-y-2">
                    <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
                        Reason (Optional)
                    </label>
                    <textarea
                        value={deactivationReason}
                        onChange={(e) => setDeactivationReason(e.target.value)}
                        placeholder="Why is this user being deactivated?"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
                        rows={3}
                    />
                </div>
            </ConfirmationModal>
        </motion.div>
    );
};
