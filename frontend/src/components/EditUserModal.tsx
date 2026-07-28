import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface EditUserModalProps {
    user: any;
    onClose: () => void;
}

export const EditUserModal = ({ user, onClose }: EditUserModalProps) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: user.name || '',
        phone: user.phone || '',
        jobTitle: user.jobTitle || '',
        hourlyRate: user.hourlyRate ? user.hourlyRate.toString() : '',
        companyRate: user.companyRate ? user.companyRate.toString() : '',
    });

    const updateMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = {
                ...data,
                hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
                companyRate: data.companyRate ? parseFloat(data.companyRate) : undefined,
            };
            return api.patch(`/users/${user.id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
        }
    });

    const inputClasses = "w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors";
    const labelClasses = "text-[13px] font-medium text-gray-700 block mb-1.5";

    return (
        <div 
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-outfit"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-[16px] font-bold text-gray-900">Edit Profile: {user.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className={labelClasses}>Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className={inputClasses}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Phone Number</label>
                        <input
                            type="text"
                            className={inputClasses}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Job Title</label>
                        <input
                            type="text"
                            className={inputClasses}
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Hourly Rate</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">$</span>
                                <input
                                    type="number"
                                    className="w-full h-10 pl-7 pr-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.hourlyRate}
                                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Company Rate</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">$</span>
                                <input
                                    type="number"
                                    className="w-full h-10 pl-7 pr-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.companyRate}
                                    onChange={(e) => setFormData({ ...formData, companyRate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => updateMutation.mutate(formData)}
                        disabled={updateMutation.isPending || !formData.name}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-[14px] font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
