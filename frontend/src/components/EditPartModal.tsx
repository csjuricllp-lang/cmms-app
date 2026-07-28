import { useState } from 'react';
import { X, Info } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useVendors, useTeams, useCustomers, useUsers } from '../hooks/useData';

interface EditPartModalProps {
    isOpen: boolean;
    onClose: () => void;
    part: any;
}

export const EditPartModal = ({ isOpen, onClose, part }: EditPartModalProps) => {
    const queryClient = useQueryClient();
    const { data: vendors } = useVendors();
    const { data: teams } = useTeams();
    const { data: customers } = useCustomers();
    const { data: users } = useUsers();

    const [formData, setFormData] = useState({
        name: part?.name || '',
        partNumber: part?.partNumber || '',
        description: part?.description || '',
        category: part?.category || '',
        tags: part?.tags || '',
        isNonStock: part?.status === 'Non-stock',
        isCritical: part?.criticality === 'CRITICAL',
        assignedToId: part?.assignedToId || '',
        teamId: part?.teamId || '',
        vendorId: part?.vendorId || '',
        customerId: part?.customerId || '',
        barcode: part?.barcode || '',
        cost: part?.cost || 0,
        additionalInfo: part?.additionalInfo || ''
    });

    const editMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.patch(`/parts/${part.id}`, {
                name: data.name,
                partNumber: data.partNumber,
                description: data.description,
                category: data.category,
                tags: data.tags,
                criticality: data.isCritical ? 'CRITICAL' : 'MEDIUM',
                assignedToId: data.assignedToId || undefined,
                teamId: data.teamId || undefined,
                vendorId: data.vendorId || undefined,
                customerId: data.customerId || undefined,
                barcode: data.barcode,
                cost: Number(data.cost),
                additionalInfo: data.additionalInfo
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parts'] });
            toast.success('Part updated successfully');
            onClose();
        },
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]">
            <div className="w-full h-full bg-white flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl">
                {/* Header */}
                <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-slate-900">Edit Part</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="h-9 px-4 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => editMutation.mutate(formData)}
                            className="h-9 px-4 bg-[#3B82F6] rounded text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Sub Header Tab */}
                <div className="h-12 border-b border-slate-200 px-6 flex items-end">
                    <div className="h-full flex items-center border-b-2 border-[#3B82F6] px-1 relative -bottom-[1px]">
                        <span className="text-sm font-bold text-slate-900">Details</span>
                    </div>
                </div>

                {/* Main Content Two-Column Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Column - Details */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-8 px-24 pb-20">
                        <div className="max-w-2xl mx-auto space-y-12">
                            {/* Details Section */}
                            <section className="space-y-6">
                                <h3 className="text-base font-bold text-slate-900">Details</h3>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-600">Name <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full h-10 px-3 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-600">Part Number <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={formData.partNumber}
                                        onChange={(e) => setFormData({...formData, partNumber: e.target.value})}
                                        className="w-full h-10 px-3 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-600">Description</label>
                                    <textarea 
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full p-3 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                                    />
                                    <div className="text-[11px] text-slate-500">{formData.description.length}/970</div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-600">Category</label>
                                    <input 
                                        type="text" 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="w-full h-10 px-3 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-600">Tags</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            readOnly
                                            className="w-full h-10 px-3 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none cursor-pointer"
                                        />
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </section>

                            {/* Image Section */}
                            <section className="space-y-6">
                                <h3 className="text-base font-bold text-slate-900">Image</h3>
                                <div className="w-full max-w-sm border border-dashed border-slate-300 rounded flex items-center justify-center p-6 bg-[#FAFAFA]">
                                    <div className="flex items-center gap-3">
                                        <button className="h-8 px-4 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                                            Upload
                                        </button>
                                        <span className="text-xs text-slate-400">or Drop Image</span>
                                    </div>
                                </div>
                            </section>

                            {/* Assigned To Section */}
                            <section className="space-y-6">
                                <h3 className="text-base font-bold text-slate-900">Assigned To</h3>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-600">Workers</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.assignedToId}
                                            onChange={(e) => setFormData({...formData, assignedToId: e.target.value})}
                                            className="w-full h-10 px-3 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="">None specified</option>
                                            {users?.map(u => (
                                                <option key={u.id} value={u.userOrgId}>{u.name}</option>
                                            ))}
                                        </select>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-600">Teams</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.teamId}
                                            onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                                            className="w-full h-10 px-3 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="">None specified</option>
                                            {teams?.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </section>

                            {/* More Information Section */}
                            <section className="space-y-6">
                                <h3 className="text-base font-bold text-slate-900">More Information</h3>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-600">Vendors</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.vendorId}
                                            onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                                            className="w-full h-10 px-3 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="">None specified</option>
                                            {vendors?.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-600">Customers</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.customerId}
                                            onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                                            className="w-full h-10 px-3 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="">None specified</option>
                                            {customers?.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-600">Additional Information</label>
                                    <textarea 
                                        rows={3}
                                        value={formData.additionalInfo}
                                        onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                                        className="w-full p-3 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-500 resize-none bg-white"
                                    />
                                </div>
                            </section>

                            {/* Files Section */}
                            <section className="space-y-6 pb-20">
                                <h3 className="text-base font-bold text-slate-900">Files</h3>
                                
                                <div className="w-full max-w-sm border border-dashed border-slate-300 rounded flex flex-col items-center justify-center py-6 bg-white shrink-0">
                                    <div className="flex items-center gap-3">
                                        <button className="h-8 px-4 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                                            Upload
                                        </button>
                                        <span className="text-xs text-slate-400">or Drop Files</span>
                                    </div>
                                </div>
                                
                                <button className="text-sm font-medium text-[#3B82F6] hover:underline">
                                    Add from Saved Files
                                </button>
                            </section>

                        </div>
                    </div>

                    {/* Right Column - Inventory Settings (Sticky/Scroll mapped independently) */}
                    <div className="w-[360px] border-l border-slate-200 bg-white overflow-y-auto custom-scrollbar shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
                        <div className="p-8 space-y-10">
                            
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Inventory Settings</h3>
                                <p className="text-[13px] text-slate-600 leading-relaxed max-w-[280px]">
                                    This data is managed per individual inventory line unless specified here.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <span className="inline-block px-2 py-1 bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold rounded">
                                    General
                                </span>
                                <div className="space-y-4 pl-1">
                                    <label 
                                        className="flex items-start gap-4 cursor-pointer group"
                                        onClick={() => setFormData({...formData, isNonStock: !formData.isNonStock})}
                                    >
                                        <div className="mt-0.5 w-4 h-4 rounded-[3px] border border-slate-300 flex items-center justify-center bg-white group-hover:border-blue-500 transition-colors">
                                            {formData.isNonStock && <CheckIcon />}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-1">
                                            <span className="text-[13px] text-slate-700 font-medium">This is a non-stock part</span>
                                            <Info className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                    </label>
                                    <label 
                                        className="flex items-start gap-4 cursor-pointer group"
                                        onClick={() => setFormData({...formData, isCritical: !formData.isCritical})}
                                    >
                                        <div className="mt-0.5 w-4 h-4 rounded-[3px] border border-slate-300 flex items-center justify-center bg-white group-hover:border-blue-500 transition-colors">
                                            {formData.isCritical && <CheckIcon />}
                                        </div>
                                        <span className="text-[13px] text-slate-700 font-medium flex-1">This is a critical part</span>
                                    </label>
                                </div>
                            </div>

                            <div className="h-px bg-slate-200" />

                            <div className="space-y-4">
                                <h4 className="text-[13px] font-bold text-slate-900">Minimum Qty Threshold</h4>
                                <p className="text-[12px] text-slate-600">Stock is 'low' when below this threshold</p>
                                <label className="flex items-start gap-4 cursor-pointer group pt-1">
                                    <div className="mt-0.5 w-4 h-4 rounded-[3px] border border-slate-300 flex items-center justify-center bg-white group-hover:border-blue-500" />
                                    <span className="text-[13px] text-slate-700 font-medium flex-1">Same for all inventory lines</span>
                                </label>
                            </div>

                            <div className="h-px bg-slate-200" />

                            <div className="space-y-4">
                                <h4 className="text-[13px] font-bold text-slate-900">Maximum Qty Threshold</h4>
                                <p className="text-[12px] text-slate-600">Reorder quantities will be recommended based on this threshold</p>
                                <label className="flex items-start gap-4 cursor-pointer group pt-1">
                                    <div className="mt-0.5 w-4 h-4 rounded-[3px] border border-slate-300 flex items-center justify-center bg-white group-hover:border-blue-500" />
                                    <span className="text-[13px] text-slate-700 font-medium flex-1">Same for all inventory lines</span>
                                </label>
                            </div>

                            <div className="h-px bg-slate-200" />

                            <div className="space-y-4">
                                <h4 className="text-[13px] font-bold text-slate-900">Barcode</h4>
                                <div className="space-y-4">
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <div className="mt-0.5 w-4 h-4 rounded-[3px] border border-slate-300 flex items-center justify-center bg-white group-hover:border-blue-500" />
                                        <span className="text-[13px] text-slate-700 font-medium flex-1">Use randomly-generated barcode(s)</span>
                                    </label>
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <div className="mt-0.5 w-4 h-4 rounded-[3px] bg-blue-500 border border-blue-500 flex items-center justify-center">
                                            <CheckIcon />
                                        </div>
                                        <span className="text-[13px] text-slate-700 font-medium flex-1">Same for all inventory lines</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.barcode}
                                        onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                                        className="w-full h-9 px-3 border border-slate-300 rounded text-sm text-slate-900 bg-white ml-8 w-[calc(100%-32px)] focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-slate-200" />

                            <div className="space-y-4">
                                <h4 className="text-[13px] font-bold text-slate-900">Cost</h4>
                                <div className="space-y-4">
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <div className="mt-0.5 w-4 h-4 rounded-[3px] bg-blue-500 border border-blue-500 flex items-center justify-center">
                                            <CheckIcon />
                                        </div>
                                        <span className="text-[13px] text-slate-700 font-medium flex-1">Same for all inventory lines</span>
                                    </label>
                                    <div className="relative ml-8 w-[calc(100%-32px)]">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                                        <input 
                                            type="number" 
                                            value={formData.cost}
                                            onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
                                            className="w-full h-9 pl-7 pr-3 border border-slate-300 rounded text-sm text-slate-900 text-right bg-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="h-10" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CheckIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
