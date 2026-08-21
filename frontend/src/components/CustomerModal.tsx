import { useState } from 'react';
import { X, Loader2, ChevronDown, Plus, Trash } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface CustomerModalProps {
    onClose: () => void;
    customer?: any;
}

export const CustomerModal = ({ onClose, customer }: CustomerModalProps) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        address: customer?.address || '',
        phone: customer?.phone || '',
        website: customer?.website || '',
        email: customer?.email || '',
        type: customer?.type || '',
        description: customer?.description || '',
        hourlyRate: customer?.hourlyRate ? customer.hourlyRate.toString() : '',
        billingName: customer?.billingName || '',
        billingAddress: customer?.billingAddress || '',
        addressLine2: customer?.addressLine2 || '',
        addressLine3: customer?.addressLine3 || '',
        currency: customer?.currency || 'USD - United States Dollar - $',
        isVip: customer?.isVip || false,
        customFields: customer?.customFields ? (Array.isArray(customer.customFields) ? customer.customFields : []) : []
    });

    const saveMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = {
                ...data,
                email: data.email || undefined,
                phone: data.phone || undefined,
                website: data.website || undefined,
                address: data.address || undefined,
                description: data.description || undefined,
                type: data.type || undefined,
                billingName: data.billingName || undefined,
                billingAddress: data.billingAddress || undefined,
                addressLine2: data.addressLine2 || undefined,
                addressLine3: data.addressLine3 || undefined,
                addressLine3: data.addressLine3 || undefined,
                hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
                customFields: data.customFields
            };
            if (customer?.id) {
                return api.patch(`/customers/${customer.id}`, payload);
            }
            return api.post('/customers', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            if (customer?.id) {
                queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
            }
            onClose();
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || error.message || 'Failed to save customer';
            console.error('Customer save error:', error);
            alert(Array.isArray(msg) ? msg[0] : msg);
        }
    });

    const addCustomField = () => {
        const currentFields = Array.isArray(formData.customFields) ? formData.customFields : [];
        setFormData({
            ...formData,
            customFields: [...currentFields, { name: '', value: '', unit: '' }]
        });
    };

    const updateCustomField = (index: number, key: string, value: string) => {
        const newFields = [...formData.customFields];
        newFields[index] = { ...newFields[index], [key]: value };
        setFormData({ ...formData, customFields: newFields });
    };

    const removeCustomField = (index: number) => {
        const newFields = formData.customFields.filter((_, i) => i !== index);
        setFormData({ ...formData, customFields: newFields });
    };

    const inputClasses = "w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-400";
    const labelClasses = "text-[13px] font-medium text-gray-700 block mb-1.5";

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in fade-in duration-200 font-outfit overflow-hidden">
            {/* Header */}
            <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-[18px] font-semibold text-gray-900">Create Customer</h2>
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
                        className="h-9 px-4 bg-indigo-600 text-white rounded-md text-[14px] font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                        {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {customer?.id ? 'Save Changes' : 'Create Customer'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pt-12 pb-32">
                <div className="max-w-[600px] mx-auto px-4 space-y-12">
                    
                    {/* DETAILS SECTION */}
                    <div>
                        <h3 className="text-[18px] font-bold text-gray-900 mb-6">Details</h3>
                        <div className="space-y-5">
                            <div>
                                <label className={labelClasses}>Customer Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Address</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                                <label className={labelClasses}>Website</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Email</label>
                                <input
                                    type="email"
                                    className={inputClasses}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Type</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Description</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[14px] focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Hourly Rate</label>
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
                        </div>
                    </div>

                    {/* BILLING INFORMATION SECTION */}
                    <div className="pt-8 border-t border-gray-100">
                        <h3 className="text-[18px] font-bold text-gray-900 mb-6">Billing Information</h3>
                        <div className="space-y-5">
                            <div>
                                <label className={labelClasses}>Billing Name</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.billingName}
                                    onChange={(e) => setFormData({ ...formData, billingName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Address</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.billingAddress}
                                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Address Line 2</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.addressLine2}
                                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Address Line 3</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.addressLine3}
                                    onChange={(e) => setFormData({ ...formData, addressLine3: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Currency</label>
                                <div className="relative">
                                    <select 
                                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-[14px] appearance-none focus:outline-none focus:border-indigo-500 transition-colors"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    >
                                        <option>USD - United States Dollar - $</option>
                                        <option>EUR - Euro - €</option>
                                        <option>GBP - British Pound - £</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CUSTOM DATA SECTION */}
                    <div className="pt-8 border-t border-gray-100">
                        <h3 className="text-[18px] font-bold text-gray-900 mb-2">Custom Data</h3>
                        <p className="text-[14px] text-gray-500 mb-6 font-normal italic">After naming custom fields, you can enter a value and unit.</p>
                        
                        <div className="space-y-4 mb-6">
                            {formData.customFields.map((field: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="flex-1 space-y-1.5">
                                        <input
                                            type="text"
                                            placeholder="Field Name"
                                            className={inputClasses}
                                            value={field.name}
                                            onChange={(e) => updateCustomField(idx, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <input
                                            type="text"
                                            placeholder="Value"
                                            className={inputClasses}
                                            value={field.value}
                                            onChange={(e) => updateCustomField(idx, 'value', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-24 space-y-1.5 shrink-0">
                                        <input
                                            type="text"
                                            placeholder="Unit"
                                            className={inputClasses}
                                            value={field.unit}
                                            onChange={(e) => updateCustomField(idx, 'unit', e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => removeCustomField(idx)}
                                        className="h-10 w-10 flex items-center justify-center shrink-0 border border-gray-200 rounded-md text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            type="button"
                            id="add-custom-field-btn"
                            onClick={addCustomField}
                            className="h-10 px-6 text-[14px] font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Custom Field
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
