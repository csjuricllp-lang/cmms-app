import { useState } from 'react';
import { Plus, Info, ChevronDown, Trash } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { useVendors, useTeams, useLocations, useCustomers, useUsers } from '../hooks/useData';

interface CreatePartModalProps {
    isOpen: boolean;
    onClose: () => void;
    part?: any;
}

export const CreatePartModal = ({ isOpen, onClose, part }: CreatePartModalProps) => {
    const queryClient = useQueryClient();
    const [expandedSections, setExpandedSections] = useState<string[]>(['Part Details', 'Inventory Lines']);
    
    const toggleSection = (section: string) => {
        setExpandedSections(prev => 
            prev.includes(section) 
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };
    
    const { data: vendors } = useVendors();
    const { data: teams } = useTeams();
    const { data: locations } = useLocations();
    const { data: customers } = useCustomers();
    const { data: users } = useUsers();

    const [formData, setFormData] = useState({
        name: part?.name || '',
        partNumber: part?.partNumber || '',
        description: part?.description || '',
        category: part?.category || '',
        tags: part?.tags || '',
        manufacturer: part?.manufacturer || '',
        isNonStock: false,
        isCritical: part?.criticality === 'CRITICAL',
        vendorId: part?.vendorId || '',
        customerId: part?.customerId || '',
        teamId: part?.teamId || '',
        assignedToId: part?.assignedToId || '',
        notes: '',
        additionalInfo: '',
        inventoryLines: part?.inventoryLines?.length > 0 ? part.inventoryLines.map((line: any) => ({
            id: line.id,
            locationId: line.locationId || '',
            area: line.binLocation || '',
            minQty: line.minQuantity || 5,
            maxQty: line.maxQuantity || 100,
            quantity: line.quantity || 0,
            cost: line.cost || 0,
            barcode: line.barcode || ''
        })) : [
            { locationId: part?.locationId || '', area: part?.binLocation || '', minQty: part?.minQuantity || 5, maxQty: part?.maxQuantity || 100, quantity: part?.quantity || 0, cost: part?.cost || 0, barcode: part?.barcode || '' }
        ]
    });

    const addInventoryLine = () => {
        setFormData({
            ...formData,
            inventoryLines: [
                ...formData.inventoryLines,
                { locationId: '', area: '', minQty: 5, maxQty: 100, quantity: 0, cost: 0, barcode: '' }
            ]
        });
    };

    const updateInventoryLine = (index: number, field: string, value: any) => {
        const newLines = [...formData.inventoryLines];
        (newLines[index] as any)[field] = value;
        setFormData({ ...formData, inventoryLines: newLines });
    };

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const firstLine = data.inventoryLines[0] || {};
            
            const payload = {
                name: data.name,
                partNumber: data.partNumber,
                description: data.description,
                category: data.category,
                tags: data.tags,
                criticality: data.isCritical ? 'CRITICAL' : 'MEDIUM',
                quantity: Number(firstLine.quantity),
                minQuantity: Number(firstLine.minQty),
                maxQuantity: Number(firstLine.maxQty),
                cost: Number(firstLine.cost),
                binLocation: firstLine.area,
                barcode: firstLine.barcode,
                locationId: firstLine.locationId || undefined,
                vendorId: data.vendorId || undefined,
                customerId: data.customerId || undefined,
                teamId: data.teamId || undefined,
                assignedToId: data.assignedToId || undefined,
                manufacturer: data.manufacturer || undefined
            };

            if (part?.id) {
                return api.patch(`/parts/${part.id}`, payload);
            }
            return api.post('/parts', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parts'] });
            toast.success(part?.id ? 'Part Updated Successfully' : 'Part Created Successfully');
            onClose();
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || `Failed to ${part?.id ? 'update' : 'create'} part`;
            toast.error(message);
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8F9FA] flex flex-col">
            {/* Minimal Header */}
            <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                     <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>
                  <h2 className="text-[13px] font-bold text-slate-900">{part ? 'Edit Part' : 'New Part'}</h2>
               </div>
               <div className="flex items-center gap-3">
                   <button onClick={onClose} type="button" className="h-8 px-4 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                   <button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending} className="h-8 px-4 bg-[#3B82F6] rounded text-xs font-semibold text-white hover:bg-blue-600 transition-colors tracking-wide">{createMutation.isPending ? 'SAVING...' : (part ? 'Save Changes' : 'Create Part')}</button>
               </div>
            </div>

            {/* Scrolling Form View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
                <div className="max-w-[760px] mx-auto py-8">
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
                        
                        {/* Part Details Card (Always Expanded) */}
                        <div className="bg-white rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-slate-200 p-6 space-y-6">
                            <h3 className="text-sm font-bold text-slate-900">Part Details</h3>
                            
                            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600">Part Name <span className="text-red-500">*</span></label>
                                    <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-9 px-3 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600">Part Number <span className="text-red-500">*</span></label>
                                    <input required type="text" value={formData.partNumber} onChange={(e) => setFormData({...formData, partNumber: e.target.value})} className="w-full h-9 px-3 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600">Category</label>
                                    <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-9 px-3 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600">Tags</label>
                                    <div className="relative">
                                        <select value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} className="w-full h-9 px-3 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer">
                                            <option value="">Select Categories</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[11px] font-bold text-slate-600">Description</label>
                                    <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none" />
                                </div>
                                
                                <div className="col-span-2 mt-2">
                                    <div className="w-full h-16 border border-dashed border-slate-300 rounded bg-[#FAFAFA] flex items-center justify-center gap-3">
                                        <button type="button" className="h-7 px-3 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50">Upload</button>
                                        <span className="text-[11px] text-slate-400 font-medium">or Drop Image</span>
                                    </div>
                                </div>
                                
                                <div className="col-span-2">
                                    <button type="button" className="text-[12px] font-semibold text-[#3B82F6] hover:underline">Add from Saved Files</button>
                                </div>

                                <div className="col-span-2 space-y-4 mt-6">
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <div className={cn("mt-0 w-8 h-4.5 rounded-full relative transition-colors duration-200 ease-in-out shrink-0", formData.isNonStock ? "bg-blue-500" : "bg-slate-300")}>
                                            <div className={cn("w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow-sm", formData.isNonStock ? "translate-x-[14px]" : "translate-x-0.5")} />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold text-slate-800 leading-tight">This is a non-stock part</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Non-stock parts are not regularly kept in inventory and are often purchased on-demand. These parts won't trigger low or out-of-stock alerts.</p>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={formData.isNonStock} onChange={() => setFormData({...formData, isNonStock: !formData.isNonStock})} />
                                    </label>
                                    
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <div className={cn("mt-0 w-8 h-4.5 rounded-full relative transition-colors duration-200 ease-in-out shrink-0", formData.isCritical ? "bg-blue-500" : "bg-slate-300")}>
                                            <div className={cn("w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow-sm", formData.isCritical ? "translate-x-[14px]" : "translate-x-0.5")} />
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold text-slate-800 leading-tight">This is a critical part</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Critical parts are essential for operations and require immediate attention when low or out-of-stock to prevent downtime or disruptions.</p>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={formData.isCritical} onChange={() => setFormData({...formData, isCritical: !formData.isCritical})} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Lines Card */}
                        <div className="bg-white rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
                            <div 
                                className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleSection('Inventory Lines')}
                            >
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-900">Inventory Lines</h3>
                                    <Info className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[11px] font-semibold text-[#3B82F6] hover:underline flex items-center gap-1">Show Inventory Settings <ChevronDown className="w-3 h-3 -rotate-90"/></span>
                                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedSections.includes('Inventory Lines') ? "rotate-180" : "")} />
                                </div>
                            </div>
                            
                            {expandedSections.includes('Inventory Lines') && (
                                <div className="px-6 pb-6 pt-2">
                                    <div className="border border-slate-200 rounded overflow-x-auto">
                                        <table className="w-full text-left bg-white">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-[#FAFAFA]">
                                                    <th className="py-3 px-4 text-[10px] font-bold text-slate-600">Location</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-slate-600">Area</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-slate-600 text-center">Min QTY</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-slate-600 text-center">Max QTY</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-slate-600 text-center">Avail QTY</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-slate-600 text-center">Cost</th>
                                                    <th className="py-3 px-4 text-[10px] font-bold text-slate-600">Barcode</th>
                                                    <th className="py-3 px-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.inventoryLines.map((line: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                        <td className="p-3">
                                                            <div className="relative">
                                                                <select value={line.locationId} onChange={(e) => updateInventoryLine(idx, 'locationId', e.target.value)} className="w-full h-8 px-2 border border-slate-200 rounded text-[11px] text-slate-900 focus:outline-none focus:border-blue-500 appearance-none bg-white font-medium cursor-pointer">
                                                                    <option value="">Select...</option>
                                                                    {locations?.map(loc => (
                                                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <input type="text" value={line.area} onChange={(e) => updateInventoryLine(idx, 'area', e.target.value)} className="w-20 h-8 px-2 border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-500 bg-white" />
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <input type="number" value={line.minQty} onChange={(e) => updateInventoryLine(idx, 'minQty', Number(e.target.value))} className="w-14 h-8 px-2 text-center border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-500 bg-white" />
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <input type="number" value={line.maxQty} onChange={(e) => updateInventoryLine(idx, 'maxQty', Number(e.target.value))} className="w-14 h-8 px-2 text-center border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-500 bg-white" />
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <input type="number" value={line.quantity} onChange={(e) => updateInventoryLine(idx, 'quantity', Number(e.target.value))} className="w-14 h-8 px-2 text-center border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-500 bg-white text-[#3B82F6] font-bold" />
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <input type="number" value={line.cost} onChange={(e) => updateInventoryLine(idx, 'cost', Number(e.target.value))} className="w-16 h-8 px-2 text-center border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-500 bg-white" />
                                                        </td>
                                                        <td className="p-3">
                                                            <input type="text" value={line.barcode} onChange={(e) => updateInventoryLine(idx, 'barcode', e.target.value)} className="w-24 h-8 px-2 border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-500 bg-white" />
                                                        </td>
                                                        <td className="p-3 pr-4 text-right">
                                                            <button type="button" className="text-red-400 hover:text-red-600 transition-colors">
                                                                <Trash className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button type="button" onClick={addInventoryLine} className="mt-4 h-7 px-3 border border-slate-300 rounded text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
                                        <Plus className="w-3 h-3 text-[#E87B35]" />
                                        Add Inventory Line
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Vendors & Customers Card */}
                        <div className="bg-white rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
                            <div 
                                className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleSection('Vendors and Customers')}
                            >
                                <h3 className="text-sm font-bold text-slate-900">Vendors and Customers</h3>
                                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedSections.includes('Vendors and Customers') ? "rotate-180" : "")} />
                            </div>
                            
                            {expandedSections.includes('Vendors and Customers') && (
                                <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-600">Vendors</label>
                                        <div className="relative">
                                            <select value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} className="w-full h-9 px-3 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer">
                                                <option value="">Select Vendor</option>
                                                {vendors?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-600">Customers</label>
                                        <div className="relative">
                                            <select value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} className="w-full h-9 px-3 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer">
                                                <option value="">Select Customer</option>
                                                {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* People and Teams Card */}
                        <div className="bg-white rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
                            <div 
                                className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleSection('People and Teams')}
                            >
                                <h3 className="text-sm font-bold text-slate-900">People and Teams</h3>
                                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedSections.includes('People and Teams') ? "rotate-180" : "")} />
                            </div>
                            
                            {expandedSections.includes('People and Teams') && (
                                <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-600">People</label>
                                        <div className="relative">
                                            <select value={formData.assignedToId} onChange={(e) => setFormData({...formData, assignedToId: e.target.value})} className="w-full h-9 px-3 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer">
                                                <option value="">Select Person</option>
                                                {users?.map(u => <option key={u.id} value={u.userOrgId}>{u.name}</option>)}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-600">Teams</label>
                                        <div className="relative">
                                            <select value={formData.teamId} onChange={(e) => setFormData({...formData, teamId: e.target.value})} className="w-full h-9 px-3 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer">
                                                <option value="">Select Team</option>
                                                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional Information Card */}
                        <div className="bg-white rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
                            <div 
                                className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleSection('Additional Information')}
                            >
                                <h3 className="text-sm font-bold text-slate-900">Additional Information</h3>
                                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedSections.includes('Additional Information') ? "rotate-180" : "")} />
                            </div>
                            
                            {expandedSections.includes('Additional Information') && (
                                <div className="px-6 pb-6 pt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-600">Notes</label>
                                        <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full p-3 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none placeholder:text-slate-300" placeholder="Enter technical notes..."/>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-20" /> {/* Scroll Spacer */}
                    </form>
                </div>
            </div>
        </div>
    );
};
