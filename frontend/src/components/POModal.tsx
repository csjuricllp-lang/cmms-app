import { useState } from 'react';
import {
    Plus,
    Package,
    Trash2,
    ChevronDown,
    Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface POModalProps {
    onClose: () => void;
    initialData?: any;
}

export const POModal = ({ onClose, initialData }: POModalProps) => {
    const queryClient = useQueryClient();

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

    const [formData, setFormData] = useState({
        number: initialData?.number || `PO-${Math.floor(Math.random() * 90000) + 10000}`,
        title: initialData?.title || '',
        vendorId: initialData?.vendorId || '',
        currency: initialData?.currency || 'INR',
        company: initialData?.company || companyName,
        type: initialData?.type || '',
        additionalDetails: initialData?.additionalDetails || '',
        expectedDeliveryDate: initialData?.expectedDeliveryDate ? initialData.expectedDeliveryDate.split('T')[0] : '',
        billingAddressType: initialData?.billingAddressType || 'COMPANY_PROFILE',
        billingCompanyName: initialData?.billingCompanyName || '',
        billingAddress: initialData?.billingAddress || '',
        billingCity: initialData?.billingCity || '',
        billingState: initialData?.billingState || '',
        billingZip: initialData?.billingZip || '',
        billingPhone: initialData?.billingPhone || '',
        billingFax: initialData?.billingFax || '',
        writeShippingDetailsManually: initialData?.writeShippingDetailsManually || false,
        shippingAddressType: initialData?.shippingAddressType || 'SAME_AS_BILLING',
        shippingUserName: initialData?.shippingUserName || '',
        shippingCompanyName: initialData?.shippingCompanyName || '',
        shippingAddress: initialData?.shippingAddress || '',
        shippingCity: initialData?.shippingCity || '',
        shippingState: initialData?.shippingState || '',
        shippingZip: initialData?.shippingZip || '',
        shippingPhone: initialData?.shippingPhone || '',
        shippingFax: initialData?.shippingFax || '',
        printBackupSignToPdf: initialData?.printBackupSignToPdf || false,
        purchaseDate: initialData?.purchaseDate ? initialData.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0],
        terms: initialData?.terms || '',
        shippingMethod: initialData?.shippingMethod || '',
        fob: initialData?.fob || '',
        notes: initialData?.notes || '',
        tags: initialData?.tags || ([] as string[]),
        includeTaxOnPdf: initialData?.includeTaxOnPdf || false,
        shippingCost: initialData?.shippingCost || 0,
        taxAmount: initialData?.taxAmount || 0,
        invoiceNumber: initialData?.invoiceNumber || '',
        items: initialData?.items ? initialData.items.map((item: any) => ({
            id: item.id,
            partId: item.partId,
            quantity: item.quantity,
            unitCost: item.unitCost
        })) : ([] as any[])
    });

    const [newTagInput, setNewTagInput] = useState('');

    const { data: vendors } = useQuery({
        queryKey: ['vendors'],
        queryFn: async () => {
            const response = await api.get('/vendors');
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });

    const { data: parts } = useQuery({
        queryKey: ['parts'],
        queryFn: async () => {
            const response = await api.get('/parts');
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            // Sanitize data
            const payload = { ...data };
            
            // Remove non-whitelisted item fields (like id) and convert unitCost to actual number
            payload.items = payload.items
                .filter((item: any) => item.partId)
                .map((item: any) => ({
                    partId: item.partId,
                    quantity: Math.round(item.quantity),
                    unitCost: Number(item.unitCost || 0)
                }));

            // Convert numerical values to actual numbers to pass NestJS DTO validation
            payload.shippingCost = Number(payload.shippingCost || 0);
            payload.taxAmount = Number(payload.taxAmount || 0);
            
            // Convert empty strings to undefined for optional date/string fields
            if (!payload.expectedDeliveryDate) delete payload.expectedDeliveryDate;
            if (!payload.title) delete payload.title;
            if (!payload.currency) delete payload.currency;
            if (!payload.company) delete payload.company;
            if (!payload.type) delete payload.type;
            if (!payload.additionalDetails) delete payload.additionalDetails;
            if (!payload.terms) delete payload.terms;
            if (!payload.shippingMethod) delete payload.shippingMethod;
            if (!payload.fob) delete payload.fob;
            if (!payload.notes) delete payload.notes;
            if (!payload.shippingUserName) delete payload.shippingUserName;
            if (!payload.invoiceNumber) delete payload.invoiceNumber;
            
            if (!payload.billingCompanyName) delete payload.billingCompanyName;
            if (!payload.billingAddress) delete payload.billingAddress;
            if (!payload.billingCity) delete payload.billingCity;
            if (!payload.billingState) delete payload.billingState;
            if (!payload.billingZip) delete payload.billingZip;
            if (!payload.billingPhone) delete payload.billingPhone;
            if (!payload.billingFax) delete payload.billingFax;
            if (!payload.shippingCompanyName) delete payload.shippingCompanyName;
            if (!payload.shippingAddress) delete payload.shippingAddress;
            if (!payload.shippingCity) delete payload.shippingCity;
            if (!payload.shippingState) delete payload.shippingState;
            if (!payload.shippingZip) delete payload.shippingZip;
            if (!payload.shippingPhone) delete payload.shippingPhone;
            if (!payload.shippingFax) delete payload.shippingFax;

            if (initialData?.id) {
                return api.patch(`/purchase-orders/${initialData.id}`, payload);
            } else {
                return api.post('/purchase-orders', payload);
            }
        },
        onSuccess: () => {
            toast.success(initialData?.id ? 'Purchase Order Updated Successfully' : 'Purchase Order Created');
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            if (initialData?.id) {
                queryClient.invalidateQueries({ queryKey: ['purchase-order', initialData.id] });
            }
            onClose();
        },
        onError: (error: any) => {
            console.error('PO Save Error:', error.response?.data || error.message);
            const message = error.response?.data?.message;
            toast.error(Array.isArray(message) ? message[0] : message || 'Failed to save Purchase Order');
        }
    });

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { partId: '', quantity: 1, unitCost: 0 }]
        });
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        if (field === 'partId') {
            const part = parts?.find((p: any) => p.id === value);
            newItems[index] = { ...newItems[index], partId: value, unitCost: part?.cost || 0 };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setFormData({ ...formData, items: newItems });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real scenario, you'd upload this to S3/Cloudinary and store the URL
            console.log("Staging file for upload:", file.name);
        }
    };

    const subtotal = formData.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitCost), 0);
    const total = subtotal + Number(formData.shippingCost) + Number(formData.taxAmount);

    const [showMassActions, setShowMassActions] = useState(false);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-transparent">
            <div className="w-full max-w-[800px] h-full bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-border">
                {/* Header */}
                <div className="px-8 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
                        <Plus className="w-5 h-5 text-indigo-600" />
                        {initialData?.id ? 'Edit Purchase Order' : 'New Purchase Order'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold text-muted-foreground hover:text-foreground">Cancel</button>
                        <button
                            onClick={() => saveMutation.mutate(formData)}
                            disabled={saveMutation.isPending || !formData.vendorId || formData.items.length === 0}
                            className={cn("px-6 py-2 bg-indigo-600 text-white rounded-md text-[13px] font-bold shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95", saveMutation.isPending && "animate-pulse")}
                        >
                            {saveMutation.isPending ? 'Saving...' : (initialData?.id ? 'Save Changes' : 'Create Purchase Order')}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-12">
                    {/* Details Section */}
                    <section className="space-y-6">
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Details</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2">Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full border border-border rounded-lg px-4 py-2.5 text-[14px] bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="Enter descriptive title for this procurement"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">PO Number</label>
                                <input
                                    type="text"
                                    className="w-full border border-border rounded-lg px-4 py-2.5 text-[14px] bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 font-medium italic">This field is generally auto-generated, but it can be changed.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">Vendor Selection <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full border border-border rounded-lg px-4 py-2.5 text-[14px] bg-background text-foreground outline-none hover:border-primary/40 transition-colors"
                                        value={formData.vendorId}
                                        onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                    >
                                        <option value="">Select Supplier...</option>
                                        {vendors?.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full border border-border rounded-lg px-4 py-2.5 text-[14px] bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                                        value={formData.expectedDeliveryDate}
                                        onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">Category</label>
                                    <select
                                        className="w-full border border-border rounded-lg px-4 py-2.5 text-[14px] bg-background text-foreground outline-none hover:border-primary/40 transition-colors"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="">Select Category...</option>
                                        <option value="Restock">Replenishment / Restock</option>
                                        <option value="Direct">Direct Project Purchase</option>
                                        <option value="Contract">Service Contract</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">Tags</label>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 border border-border rounded-lg px-4 py-2 text-[14px] bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                                placeholder="Add tag..."
                                                value={newTagInput}
                                                onChange={(e) => setNewTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const tag = newTagInput.trim();
                                                        if (tag && !formData.tags.includes(tag)) {
                                                            setFormData({ ...formData, tags: [...formData.tags, tag] });
                                                            setNewTagInput('');
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const tag = newTagInput.trim();
                                                    if (tag && !formData.tags.includes(tag)) {
                                                        setFormData({ ...formData, tags: [...formData.tags, tag] });
                                                        setNewTagInput('');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold rounded-lg transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        {formData.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {formData.tags.map((tag: string) => (
                                                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100/50 rounded-full text-[12px] font-bold">
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tag) })}
                                                            className="hover:text-indigo-800 transition-colors"
                                                        >
                                                            &times;
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">Currency</label>
                                <select
                                    className="w-full border border-border rounded-lg px-4 py-2.5 text-[14px] bg-background text-foreground outline-none"
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                >
                                    <option value="INR">Indian Rupee (₹)</option>
                                    <option value="USD">US Dollar ($)</option>
                                    <option value="EUR">Euro (€)</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">Procurement Definition</label>
                                <textarea
                                    rows={4}
                                    className="w-full border border-border rounded-lg px-4 py-2.5 text-[14px] bg-background text-foreground outline-none resize-none placeholder:italic placeholder:text-muted-foreground"
                                    placeholder="Define the scope and reasoning for this order..."
                                    value={formData.additionalDetails}
                                    onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Line Items Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Inventory Reconciliation <span className="text-red-500">*</span></h3>
                            <div className="flex gap-2 relative">
                                <button
                                    onClick={() => setShowMassActions(!showMassActions)}
                                    className="px-3 py-1.5 text-[11px] font-bold text-slate-500 border border-slate-200 rounded flex items-center gap-1 hover:bg-slate-50 transition-colors"
                                >
                                    Mass Actions <ChevronDown className="w-3 h-3" />
                                </button>
                                <AnimatePresence>
                                    {showMassActions && (
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-xl py-2 z-50">
                                            <button
                                                onClick={() => { setFormData({ ...formData, items: [] }); setShowMassActions(false); }}
                                                className="w-full text-left px-4 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                Clear All Items
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <button onClick={addItem} className="px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-600 rounded flex items-center gap-1 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100">Add Parts</button>
                            </div>
                        </div>
                        {formData.items.length === 0 ? (
                            <div className="py-12 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-center opacity-40">
                                <Package className="w-8 h-8 text-slate-300 mb-2" />
                                <p className="text-[13px] font-medium text-slate-400 italic">No items added to this purchase order yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formData.items.map((item: any, i: number) => (
                                    <div key={i} className="group flex gap-4 items-center bg-muted/30 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all">
                                        <div className="flex-1">
                                            <select
                                                className="w-full bg-transparent border-none text-[14px] font-bold outline-none"
                                                value={item.partId}
                                                onChange={(e) => updateItem(i, 'partId', e.target.value)}
                                            >
                                                <option value="">Select Part...</option>
                                                {parts?.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.partNumber})</option>)}
                                            </select>
                                        </div>
                                        <div className="w-32 flex items-center border border-border rounded-lg bg-background px-3 py-1">
                                            <input
                                                type="number"
                                                className="w-full text-center text-[13px] font-bold outline-none"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                                            />
                                            <span className="text-[10px] font-bold text-slate-300 ml-1">QTY</span>
                                        </div>
                                        <div className="w-40 flex items-center border border-border rounded-lg bg-background px-3 py-1">
                                            <span className="text-slate-400 mr-2 text-[13px]">₹</span>
                                            <input
                                                type="number"
                                                className="w-full text-[13px] font-bold outline-none"
                                                value={item.unitCost}
                                                onChange={(e) => updateItem(i, 'unitCost', Number(e.target.value))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setFormData({ ...formData, items: formData.items.filter((_: any, idx: number) => idx !== i) })}
                                            className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex justify-end pt-4 pr-12">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal Balance</span>
                                        <span className="text-[24px] font-black text-slate-800">₹{subtotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Files Section */}
                    <section className="space-y-6">
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Files</h3>
                        <input type="file" id="po-file-upload" className="hidden" onChange={handleFileUpload} />
                        <label htmlFor="po-file-upload" className="border-2 border-dashed border-slate-100 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-indigo-200 hover:bg-slate-50 transition-all cursor-pointer group">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Upload className="w-6 h-6 text-indigo-500" /></div>
                            <div className="text-center">
                                <p className="text-[14px] font-bold text-slate-700">Upload or drag and drop</p>
                                <p className="text-[11px] text-slate-400 mt-1 font-medium italic">PDF, Images, Excel accepted • Max 50MB</p>
                            </div>
                        </label>
                        <div className="flex justify-end mt-2">
                            <button
                                type="button"
                                className="text-[13px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                onClick={() => toast.success("Saved files modal placeholder")}
                            >
                                Add from External Link
                            </button>
                        </div>
                    </section>

                    {/* Billing Address */}
                    <section className="space-y-6">
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Billing Address</h3>
                        <div className="space-y-4">
                            {[
                                { id: 'COMPANY_PROFILE', label: 'Use Address from Company profile' },
                                { id: 'DIFFERENT', label: 'Type a different address' }
                            ].map((opt) => (
                                <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => setFormData({ ...formData, billingAddressType: opt.id })}
                                        className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", formData.billingAddressType === opt.id ? "border-indigo-500" : "border-slate-200 group-hover:border-slate-300")}
                                    >
                                        {formData.billingAddressType === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                    </div>
                                    <span className={cn("text-[14px] font-bold", formData.billingAddressType === opt.id ? "text-slate-800" : "text-slate-500")}>{opt.label}</span>
                                </label>
                            ))}
                            <AnimatePresence>
                                {formData.billingAddressType === 'DIFFERENT' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                                    >
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Company Name</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="Enter company name"
                                                value={formData.billingCompanyName}
                                                onChange={(e) => setFormData({ ...formData, billingCompanyName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Address</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="Enter billing address"
                                                value={formData.billingAddress}
                                                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">City</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="City"
                                                value={formData.billingCity}
                                                onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">State</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="State"
                                                value={formData.billingState}
                                                onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Zip Code</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="Zip"
                                                value={formData.billingZip}
                                                onChange={(e) => setFormData({ ...formData, billingZip: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Phone Number</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="Phone Number"
                                                value={formData.billingPhone}
                                                onChange={(e) => setFormData({ ...formData, billingPhone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Fax Number</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="Fax Number"
                                                value={formData.billingFax}
                                                onChange={(e) => setFormData({ ...formData, billingFax: e.target.value })}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <label className="flex items-center gap-3 mt-6 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.includeTaxOnPdf}
                                    onChange={(e) => setFormData({ ...formData, includeTaxOnPdf: e.target.checked })}
                                />
                                <span className="text-[12px] font-bold text-slate-500 italic">Show company logo on PDF</span>
                            </label>
                        </div>
                    </section>

                    {/* Shipping Address */}
                    <section className="space-y-6">
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Shipping Address</h3>
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">Ship to name</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                    placeholder="Enter specific recipient name"
                                    value={formData.shippingUserName}
                                    onChange={(e) => setFormData({ ...formData, shippingUserName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-4">
                                {[
                                    { id: 'SAME_AS_BILLING', label: 'Same as billing address' },
                                    { id: 'DIFFERENT', label: 'Type a different address' }
                                ].map((opt) => (
                                    <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                                        <div
                                            onClick={() => setFormData({ ...formData, shippingAddressType: opt.id })}
                                            className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", formData.shippingAddressType === opt.id ? "border-indigo-500" : "border-slate-200 group-hover:border-slate-300")}
                                        >
                                            {formData.shippingAddressType === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                        </div>
                                        <span className={cn("text-[14px] font-bold", formData.shippingAddressType === opt.id ? "text-slate-800" : "text-slate-500")}>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                            <AnimatePresence>
                                {formData.shippingAddressType === 'DIFFERENT' && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                                    >
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Company Name</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="Enter shipping company name"
                                                value={formData.shippingCompanyName}
                                                onChange={(e) => setFormData({ ...formData, shippingCompanyName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Address</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="Enter shipping address"
                                                value={formData.shippingAddress}
                                                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">City</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="City"
                                                value={formData.shippingCity}
                                                onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">State</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="State"
                                                value={formData.shippingState}
                                                onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Zip Code</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="Zip"
                                                value={formData.shippingZip}
                                                onChange={(e) => setFormData({ ...formData, shippingZip: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Phone Number</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="Phone Number"
                                                value={formData.shippingPhone}
                                                onChange={(e) => setFormData({ ...formData, shippingPhone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-slate-500 uppercase">Fax Number</label>
                                            <input
                                                type="text"
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                                placeholder="Fax Number"
                                                value={formData.shippingFax}
                                                onChange={(e) => setFormData({ ...formData, shippingFax: e.target.value })}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* Additional Details */}
                    <section className="space-y-6">
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Additional Details</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">Procuring Company</label>
                                <select
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                >
                                    <option value="">Select Company...</option>
                                    <option value={companyName}>{companyName}</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">PO Classification</label>
                                <select
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="">Select Type...</option>
                                    <option value="Restock">Replenishment / Restock</option>
                                    <option value="Direct">Direct Project Purchase</option>
                                    <option value="Contract">Service Contract</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">Purchase Date</label>
                                <input
                                    type="date"
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">Terms</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                    placeholder="e.g. Net 30"
                                    value={formData.terms}
                                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">Shipping Method</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                    placeholder="e.g. FedEx Ground"
                                    value={formData.shippingMethod}
                                    onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">F.O.B. Shipping Point</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                    value={formData.fob}
                                    onChange={(e) => setFormData({ ...formData, fob: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-500 uppercase">Invoice Number</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none"
                                    placeholder="Invoice Number"
                                    value={formData.invoiceNumber}
                                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-500 uppercase">Specific Notes</label>
                            <textarea
                                rows={3}
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] outline-none resize-none"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={formData.printBackupSignToPdf}
                                onChange={(e) => setFormData({ ...formData, printBackupSignToPdf: e.target.checked })}
                            />
                            <span className="text-[12px] font-bold text-slate-500">Print signature sign line on PDF</span>
                        </label>
                    </section>
                </div>

                {/* Footer Summary */}
                <div className="px-12 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Logistics</span>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Shipping</span>
                                    <input type="number" className="w-20 bg-transparent border-none p-0 text-[13px] font-black outline-none" value={formData.shippingCost} onChange={(e) => setFormData({ ...formData, shippingCost: Number(e.target.value) })} />
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Tax</span>
                                    <input type="number" className="w-20 bg-transparent border-none p-0 text-[13px] font-black outline-none" value={formData.taxAmount} onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Procurement Total</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[14px] font-bold text-slate-400">₹</span>
                            <span className="text-[36px] font-black text-slate-800 tracking-tighter">{total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


