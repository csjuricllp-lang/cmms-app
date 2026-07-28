import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useLocations, useAssets, useUsers, useCategories } from '../hooks/useData';

interface EditMeterModalProps {
    isOpen: boolean;
    onClose: () => void;
    meter: any;
}

export const EditMeterModal = ({ isOpen, onClose, meter }: EditMeterModalProps) => {
    const queryClient = useQueryClient();
    const { data: locations } = useLocations();
    const { data: assets } = useAssets();
    const { data: users } = useUsers();
    const { data: categories } = useCategories();

    const [formData, setFormData] = useState({
        name: meter?.name || '',
        unit: meter?.unit || '',
        frequency: meter?.frequency || 1,
        assignedToId: meter?.assignedToId || '',
        locationId: meter?.locationId || '',
        assetId: meter?.assetId || '',
        categoryId: meter?.categoryId || '',
        threshold: meter?.threshold || 100,
    });

    const editMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.patch(`/meters/${meter.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meters'] });
            toast.success('Meter updated successfully');
            onClose();
        },
        onError: () => {
            toast.error('Failed to update meter');
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900">Edit Meter</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => editMutation.mutate(formData)}
                            disabled={editMutation.isPending}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-[15px] font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {editMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-[500px] mx-auto space-y-8">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Details</h3>
                            
                            <div className="space-y-5">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full h-11 px-4 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Unit */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-gray-700">Unit of Measurement <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={formData.unit}
                                        onChange={e => setFormData({...formData, unit: e.target.value})}
                                        className="w-full h-11 px-4 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Threshold */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-gray-700">Threshold (Overdue Level)</label>
                                    <input 
                                        type="number" 
                                        value={formData.threshold}
                                        onChange={e => setFormData({...formData, threshold: parseInt(e.target.value) || 0})}
                                        className="w-full h-11 px-4 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Frequency */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-gray-700">Frequency <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={formData.frequency}
                                            onChange={e => setFormData({...formData, frequency: parseInt(e.target.value) || 0})}
                                            className="w-full h-11 px-4 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                                            <button 
                                                type="button"
                                                onClick={() => setFormData(prev => ({...prev, frequency: prev.frequency + 1}))}
                                                className="p-0.5 hover:bg-gray-100 rounded text-gray-400"
                                            >
                                                <ChevronDown className="w-3 h-3 rotate-180" />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData(prev => ({...prev, frequency: Math.max(0, prev.frequency - 1)}))}
                                                className="p-0.5 hover:bg-gray-100 rounded text-gray-400"
                                            >
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Worker */}
                                <div className="space-y-1.5 pt-4">
                                    <label className="text-[14px] font-medium text-gray-700">Worker</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.assignedToId}
                                            onChange={e => setFormData({...formData, assignedToId: e.target.value})}
                                            className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        >
                                            <option value="">Select Worker</option>
                                            {users?.map(u => (
                                                <option key={u.id} value={u.id}>{u.name || 'Unknown'}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-gray-700">Location</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.locationId}
                                            onChange={e => setFormData({...formData, locationId: e.target.value})}
                                            className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        >
                                            <option value="">Select Location</option>
                                            {locations?.map((l:any) => (
                                                <option key={l.id} value={l.id}>{l?.name || 'Unnamed'}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Asset */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-gray-700">Asset <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            value={formData.assetId}
                                            onChange={e => setFormData({...formData, assetId: e.target.value})}
                                            className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        >
                                            <option value="">Select Asset</option>
                                            {assets?.map((a:any) => (
                                                <option key={a.id} value={a.id}>{a?.name || 'Unnamed'}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="space-y-1.5">
                                    <label className="text-[14px] font-medium text-gray-700">Category</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.categoryId}
                                            onChange={e => setFormData({...formData, categoryId: e.target.value})}
                                            className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        >
                                            <option value="">Select Category</option>
                                            {categories?.map((c:any) => (
                                                <option key={c.id} value={c.id}>{c?.name || 'Uncategorized'}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
