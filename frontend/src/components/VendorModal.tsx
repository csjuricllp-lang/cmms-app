import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface VendorModalProps {
    onClose: () => void;
    vendor?: any;
}

export const VendorModal = ({ onClose, vendor }: VendorModalProps) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: vendor?.name || '',
        address: vendor?.address || '',
        phone: vendor?.phone || '',
        website: vendor?.website || '',
        contactName: vendor?.contactName || '',
        email: vendor?.email || '',
        type: vendor?.type || '',
        description: vendor?.description || '',
        hourlyRate: vendor?.hourlyRate ? vendor.hourlyRate.toString() : '',
        isLocationBased: vendor?.isLocationBased || false,
        verificationStatus: vendor?.verificationStatus || 'Unverified',
        serviceRadius: vendor?.serviceRadius || 25,
        specialties: vendor?.specialties ? vendor.specialties.join(', ') : '',
        services: vendor?.services ? vendor.services.join(', ') : '',
    });

    const saveMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = {
                ...data,
                email: data.email || undefined,
                phone: data.phone || undefined,
                website: data.website || undefined,
                address: data.address || undefined,
                contactName: data.contactName || undefined,
                description: data.description || undefined,
                type: data.type || undefined,
                hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
                serviceRadius: data.serviceRadius ? parseInt(String(data.serviceRadius), 10) : 25,
                specialties: data.specialties ? data.specialties.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                services: data.services ? data.services.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            };
            if (vendor?.id) {
                return api.patch(`/vendors/${vendor.id}`, payload);
            }
            return api.post('/vendors', payload);
        },
        onSuccess: () => {
            toast.success(vendor?.id ? 'Provider updated successfully' : 'Provider created successfully');
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            if (vendor?.id) {
                queryClient.invalidateQueries({ queryKey: ['vendor', vendor.id] });
            }
            onClose();
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || error.message || 'Failed to save provider';
            toast.error(Array.isArray(msg) ? msg[0] : msg);
            console.error('Provider save error:', error);
        }
    });

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-200 font-outfit overflow-hidden">
            {/* Header */}
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-[18px] font-semibold text-gray-900">
                        {vendor?.id ? 'Edit Provider' : 'Create Provider'}
                    </h2>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onClose}
                        className="h-9 px-4 text-[14px] font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => saveMutation.mutate(formData)}
                        disabled={saveMutation.isPending || !formData.name}
                        className="h-9 px-4 bg-indigo-600 text-white rounded-md text-[14px] font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {vendor?.id ? 'Save Changes' : 'Create Provider'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pt-12 pb-24">
                <div className="max-w-[600px] mx-auto px-4">
                    <h3 className="text-[18px] font-bold text-gray-900 mb-6">Details</h3>
                    
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-300"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">Address</label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">Phone Number</label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">Website</label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">Contact Name</label>
                            <input
                                type="text"
                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">Email</label>
                            <input
                                type="email"
                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-gray-700">Type</label>
                                <select
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="">Select type...</option>
                                    <option value="Vendor">Vendor</option>
                                    <option value="Contractor">Contractor</option>
                                    <option value="Supplier">Supplier</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-gray-700">Verification Status</label>
                                <select
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.verificationStatus}
                                    onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                                >
                                    <option value="Unverified">Unverified</option>
                                    <option value="Verified">Verified</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-gray-700">Hourly Rate</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">$</span>
                                    <input
                                        type="text"
                                        className="w-full h-10 pl-7 pr-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={formData.hourlyRate}
                                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-gray-700">Service Radius (miles)</label>
                                <input
                                    type="number"
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={formData.serviceRadius}
                                    onChange={(e) => setFormData({ ...formData, serviceRadius: parseInt(e.target.value, 10) || 25 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">Specialties (comma-separated)</label>
                            <input
                                type="text"
                                placeholder="HVAC, Plumbing, Electrical"
                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.specialties}
                                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">Services (comma-separated)</label>
                            <input
                                type="text"
                                placeholder="AC Repair, Pipe Fitting, Wiring"
                                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.services}
                                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-semibold text-gray-700">Description</label>
                            <textarea
                                rows={4}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <div 
                                onClick={() => setFormData({ ...formData, isLocationBased: !formData.isLocationBased })}
                                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${formData.isLocationBased ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <div 
                                    className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${formData.isLocationBased ? 'left-5' : 'left-1'}`}
                                />
                            </div>
                            <span className="text-[13px] font-medium text-gray-700">Is Location Based</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
