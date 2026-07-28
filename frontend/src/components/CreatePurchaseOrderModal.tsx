import { useState, useEffect } from 'react';
import { 
    X, Plus, Trash2, ShoppingBag, 
    Hash, User, Search, Check, ChevronDown,
    ArrowRight, Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useVendors, useCreatePurchaseOrder } from '../hooks/useData';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface CreatePurchaseOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPartId?: string;
}

interface POItem {
    partId: string;
    partName: string;
    quantity: number;
    unitCost: number;
}

import { CreateVendorModal } from './CreateVendorModal';

export const CreatePurchaseOrderModal = ({ isOpen, onClose, initialPartId }: CreatePurchaseOrderModalProps) => {
    const { data: vendors = [] } = useVendors();
    const createPOMutation = useCreatePurchaseOrder();

    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [poNumber, setPoNumber] = useState('');
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [taxAmount, setTaxAmount] = useState<number>(0);
    const [items, setItems] = useState<POItem[]>([]);
    
    const [dropdowns, setDropdowns] = useState({ vendor: false, parts: false });
    const [vendorSearch, setVendorSearch] = useState('');

    const { data: partsData = [] } = useQuery({
        queryKey: ['parts'],
        queryFn: async () => {
            const response = await api.get('/parts');
            return response.data;
        },
        enabled: isOpen
    });

    const parts = Array.isArray(partsData) ? partsData : (partsData as any)?.items || [];

    useEffect(() => {
        if (isOpen) {
            setPoNumber(`PO-${Math.floor(100000 + Math.random() * 900000)}`);
            if (initialPartId && parts.length > 0) {
                const part = parts.find((p: any) => p.id === initialPartId);
                if (part) {
                    setItems([{
                        partId: part.id,
                        partName: part.name,
                        quantity: 10,
                        unitCost: part.cost || 0
                    }]);
                }
            }
        }
    }, [isOpen, initialPartId, parts]);


    const removeItem = (partId: string) => {
        setItems(items.filter(i => i.partId !== partId));
    };

    const updateItem = (partId: string, field: keyof POItem, value: any) => {
        setItems(items.map(i => i.partId === partId ? { ...i, [field]: value } : i));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const total = subtotal + Number(shippingCost) + Number(taxAmount);

    const handleSubmit = () => {
        if (!selectedVendorId || items.length === 0) return;

        createPOMutation.mutate({
            number: poNumber,
            vendorId: selectedVendorId,
            expectedDeliveryDate: expectedDeliveryDate || undefined,
            shippingCost: Number(shippingCost),
            taxAmount: Number(taxAmount),
            items: items.map(i => ({
                partId: i.partId,
                quantity: Number(i.quantity),
                unitCost: Number(i.unitCost)
            }))
        }, {
            onSuccess: () => {
                onClose();
                resetForm();
            }
        });
    };

    const resetForm = () => {
        setPoNumber('');
        setSelectedVendorId(null);
        setItems([]);
        setShippingCost(0);
        setTaxAmount(0);
        setExpectedDeliveryDate('');
    };

    if (!isOpen) return null;

    const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()));

    return (
        <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
            
            <div className="relative w-full max-w-[1300px] h-[92vh] glass-panel border border-white/10 rounded-[40px] shadow-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-10 py-8 bg-slate-900/5 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-8">
                        <div className="p-5 rounded-[1.5rem] bg-primary/20 border border-primary/30 text-primary">
                            <ShoppingBag className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase leading-none mb-1">Draft Purchase Order</h2>
                            <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] opacity-70">Supply Node v2.2 • Priority Fulfillment</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all">
                        <X className="w-10 h-10 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-10 flex gap-10">
                    {/* Left: Metadata */}
                    <div className="w-[280px] space-y-10 shrink-0 overflow-y-auto custom-scrollbar pr-2">
                        <section className="space-y-8">
                            <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] italic px-2">Config</h3>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-3">Order ID</label>
                                    <div className="relative group">
                                        <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary group-focus-within:scale-110 transition-transform relative z-10" />
                                        <input 
                                            type="text" 
                                            value={poNumber}
                                            onChange={(e) => setPoNumber(e.target.value)}
                                            className="w-full h-14 bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 text-base font-black tracking-tight focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-900 dark:text-white relative z-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 relative">
                                    <div className="flex justify-between items-center px-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vendor</label>
                                        <button onClick={() => setIsVendorModalOpen(true)} className="text-[9px] font-black text-primary uppercase hover:underline">+ New</button>
                                    </div>
                                    <button 
                                        onClick={() => setDropdowns({ ...dropdowns, vendor: !dropdowns.vendor })}
                                        className="w-full h-14 bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <User className="w-5 h-5 text-primary" />
                                            <span className={cn("text-base font-black truncate max-w-[140px]", selectedVendorId ? "text-slate-900 dark:text-white" : "text-slate-400")}>
                                                {vendors.find(v => v.id === selectedVendorId)?.name || 'Select Supplier...'}
                                            </span>
                                        </div>
                                        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", dropdowns.vendor && "rotate-180")} />
                                    </button>

                                    {dropdowns.vendor && (
                                        <div className="absolute top-full left-0 right-0 mt-3 p-4 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[150] animate-in slide-in-from-top-4">
                                            <div className="relative mb-4">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    autoFocus
                                                    placeholder="Search..."
                                                    value={vendorSearch}
                                                    onChange={(e) => setVendorSearch(e.target.value)}
                                                    className="w-full h-10 bg-slate-50 dark:bg-white/5 rounded-xl pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                                                {filteredVendors.map(v => (
                                                    <button 
                                                        key={v.id}
                                                        onClick={() => { setSelectedVendorId(v.id); setDropdowns({ ...dropdowns, vendor: false }); }}
                                                        className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-primary/10 text-slate-900 dark:text-white font-black transition-all flex items-center justify-between group"
                                                    >
                                                        <span className="group-hover:text-primary transition-colors">{v.name}</span>
                                                        {selectedVendorId === v.id && <Check className="w-4 h-4 text-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-3">Delivery ETA</label>
                                    <input 
                                        type="date" 
                                        value={expectedDeliveryDate}
                                        onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                                        className="w-full h-14 bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 text-base font-black transition-all text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-8">
                            <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] italic">Financial Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-black uppercase">Subtotal</span>
                                    <span className="font-black text-slate-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Logistics Cost</label>
                                        <input 
                                            type="number" 
                                            value={shippingCost} 
                                            onChange={(e) => setShippingCost(Number(e.target.value))}
                                            className="w-full h-10 bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-sm font-black text-slate-900 dark:text-white" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">System Tax</label>
                                        <input 
                                            type="number" 
                                            value={taxAmount} 
                                            onChange={(e) => setTaxAmount(Number(e.target.value))}
                                            className="w-full h-10 bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-sm font-black text-slate-900 dark:text-white" 
                                        />
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-primary/20 flex flex-col">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">Grand Total</p>
                                    <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">₹{total.toLocaleString()}</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right: Items Table */}
                    <div className="flex-1 flex flex-col space-y-8 min-w-0">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[12px] font-black text-primary uppercase tracking-[0.4em] italic">Manifest Line Items</h3>
                            <button 
                                onClick={() => setDropdowns({ ...dropdowns, parts: !dropdowns.parts })}
                                className="px-8 py-4 rounded-2xl bg-primary text-white flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Add Catalog Item
                            </button>
                        </div>

                        <div className="flex-1 bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col min-h-0">
                            {items.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 opacity-30">
                                    <Package className="w-20 h-20 mb-6 stroke-[1]" />
                                    <h4 className="text-xl font-black italic uppercase">Manifest Empty</h4>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                                                <th className="pl-10 pr-4 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Tactical Item / ID</th>
                                                <th className="px-4 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic w-28 text-center">Qty</th>
                                                <th className="px-4 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic w-40 text-right">Unit cost</th>
                                                <th className="px-4 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic w-40 text-right">Ext. Total</th>
                                                <th className="pl-4 pr-10 py-8 w-20"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                            {items.map((item) => (
                                                <tr key={item.partId} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                                                    <td className="pl-10 pr-4 py-8">
                                                        <div className="flex flex-col min-w-0">
                                                            <p className="text-lg font-black italic text-slate-900 dark:text-white leading-none mb-2 truncate max-w-[200px]">{item.partName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NODE: {item.partId.split('-')[0]}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-8">
                                                        <div className="flex justify-center">
                                                            <input 
                                                                type="number" 
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(item.partId, 'quantity', e.target.value)}
                                                                className="w-20 h-10 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-center text-sm font-black outline-none focus:border-primary/50 text-slate-900 dark:text-white"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-8">
                                                        <div className="flex justify-end">
                                                            <input 
                                                                type="number" 
                                                                value={item.unitCost}
                                                                onChange={(e) => updateItem(item.partId, 'unitCost', e.target.value)}
                                                                className="w-32 h-10 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-right px-4 text-sm font-black outline-none focus:border-primary/50 text-slate-900 dark:text-white"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-8 text-right font-black text-xl italic text-primary">
                                                        ₹{(item.quantity * item.unitCost).toLocaleString()}
                                                    </td>
                                                    <td className="pl-4 pr-10 py-8">
                                                        <button 
                                                            onClick={() => removeItem(item.partId)}
                                                            className="p-3 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all transform hover:rotate-12"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-10 bg-slate-900/5 border-t border-white/10 flex items-center justify-between shrink-0">
                    <button onClick={onClose} className="px-10 py-5 text-[11px] font-black text-slate-400 hover:text-red-500 uppercase tracking-[0.3em] transition-colors">Abort Order</button>
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col items-end pr-10 border-r border-slate-200 dark:border-white/10">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Payload Total</span>
                            <span className="text-4xl font-black italic text-primary tracking-tighter">₹{total.toLocaleString()}</span>
                        </div>
                        <button 
                            onClick={handleSubmit}
                            disabled={!selectedVendorId || items.length === 0 || createPOMutation.isPending}
                            className={cn(
                                "flex items-center gap-6 px-16 py-7 bg-primary text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 group",
                                (!selectedVendorId || items.length === 0 || createPOMutation.isPending) && "opacity-30 grayscale cursor-not-allowed"
                            )}
                        >
                            {createPOMutation.isPending ? 'Processing...' : 'Sync Order Intel'}
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <CreateVendorModal 
            isOpen={isVendorModalOpen} 
            onClose={() => setIsVendorModalOpen(false)} 
        />
        </>
    );
};
