import { useState } from 'react';
import { X, UserSquare, MapPin, Phone, Globe, Mail, Clock, Trash2, Edit2, DollarSign, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { CustomerModal } from './CustomerModal';
import { ConfirmationModal } from './ConfirmationModal';

interface CustomerInspectorProps {
    customer: any;
    onClose: () => void;
}

export const CustomerInspector = ({ customer, onClose }: CustomerInspectorProps) => {
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const deleteMutation = useMutation({
        mutationFn: async () => {
            return api.delete(`/customers/${customer.id}`);
        },
        onSuccess: () => {
            toast.success('Customer deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            onClose();
        },
        onError: () => {
            toast.error('Failed to delete customer');
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
        >
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-[600px] h-full bg-white shadow-2xl flex flex-col font-outfit"
            >
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-start justify-between shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                            <UserSquare className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{customer.name}</h2>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[12px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-widest">
                                    {customer.type || 'Internal'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm text-slate-500"
                            title="Edit Customer"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors shadow-sm text-slate-500 disabled:opacity-50"
                            title="Delete Customer"
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
                    
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Hourly Rate</p>
                                <p className="text-[14px] font-bold text-slate-900">
                                    {customer.hourlyRate ? `$${customer.hourlyRate}/hr` : 'Not Set'}
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Currency</p>
                                <p className="text-[14px] font-bold text-slate-900 truncate max-w-[150px]">
                                    {customer.currency || 'USD'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                            Contact Dossier
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="divide-y divide-slate-100">
                                <div className="p-4 flex items-center hover:bg-slate-50 transition-colors">
                                    <div className="w-1/3 flex items-center gap-3 text-[13px] font-bold text-slate-500">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        Email
                                    </div>
                                    <div className="w-2/3 text-[14px] font-medium text-slate-900 truncate">
                                        {customer.email || <span className="text-slate-300 italic">Not Provided</span>}
                                    </div>
                                </div>
                                <div className="p-4 flex items-center hover:bg-slate-50 transition-colors">
                                    <div className="w-1/3 flex items-center gap-3 text-[13px] font-bold text-slate-500">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        Phone
                                    </div>
                                    <div className="w-2/3 text-[14px] font-medium text-slate-900 truncate">
                                        {customer.phone || <span className="text-slate-300 italic">Not Provided</span>}
                                    </div>
                                </div>
                                <div className="p-4 flex items-center hover:bg-slate-50 transition-colors">
                                    <div className="w-1/3 flex items-center gap-3 text-[13px] font-bold text-slate-500">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        Website
                                    </div>
                                    <div className="w-2/3 text-[14px] font-medium truncate">
                                        {customer.website ? (
                                            <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                                {customer.website}
                                            </a>
                                        ) : (
                                            <span className="text-slate-300 italic">Not Provided</span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 flex items-center hover:bg-slate-50 transition-colors">
                                    <div className="w-1/3 flex items-center gap-3 text-[13px] font-bold text-slate-500">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        Address
                                    </div>
                                    <div className="w-2/3 text-[14px] font-medium text-slate-900 leading-relaxed">
                                        {customer.address || <span className="text-slate-300 italic">Not Provided</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Information */}
                    <div>
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                            Billing Profile
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Billing Name</p>
                                <p className="text-[14px] font-medium text-slate-900">{customer.billingName || <span className="text-slate-300 italic">Same as Customer Name</span>}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Billing Address</p>
                                <p className="text-[14px] font-medium text-slate-900 leading-relaxed">
                                    {customer.billingAddress || <span className="text-slate-300 italic">Not Provided</span>}
                                    {customer.addressLine2 && <><br />{customer.addressLine2}</>}
                                    {customer.addressLine3 && <><br />{customer.addressLine3}</>}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Operational Details */}
                    {customer.description && (
                        <div>
                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-3 mb-4">
                                Additional Details
                            </h3>
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <p className="text-[14px] font-medium text-slate-900 leading-relaxed">
                                    {customer.description}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">
                            Added: {new Date(customer.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isEditModalOpen && (
                    <CustomerModal 
                        customer={customer} 
                        onClose={() => setIsEditModalOpen(false)} 
                    />
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => deleteMutation.mutate()}
                title="Delete Customer"
                message={`Are you sure you want to delete ${customer.name}? This action cannot be undone.`}
                confirmText="Delete Customer"
                cancelText="Cancel"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </motion.div>
    );
};
