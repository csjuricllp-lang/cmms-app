import React, { useState } from 'react';
import { 
    X, ShoppingCart, AlertTriangle, ArrowRight, CheckCircle2, 
    Box, Truck, RefreshCcw, PackageCheck, Zap 
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface Part {
    id: string;
    name: string;
    partNumber?: string;
    quantity: number;
    minQuantity: number;
    maxQuantity?: number;
    cost: number;
    vendorId?: string;
}

interface InventoryPlanningHubProps {
    isOpen: boolean;
    onClose: () => void;
    parts: Part[];
}

export const InventoryPlanningHub: React.FC<InventoryPlanningHubProps> = ({ isOpen, onClose, parts }) => {
    const queryClient = useQueryClient();
    const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());

    // Filter parts that need restock
    const logicLowStockParts = parts.filter(p => p.quantity <= (p.minQuantity || 0));

    // Initialize selection with all low stock parts
    React.useEffect(() => {
        if (isOpen) {
            setSelectedPartIds(new Set(logicLowStockParts.map(p => p.id)));
        }
    }, [isOpen]);

    const createPOMutation = useMutation({
        mutationFn: async (partIds: string[]) => {
            // For industrial simplicity, we group by vendor or create a draft PO
            // Here we'll call a bulk PO creation endpoint or handle it sequentially
            const selectedParts = logicLowStockParts.filter(p => partIds.includes(p.id));
            
            // Logic: Create a Purchase Order for the selected items
            return api.post('/purchase-orders/bulk-generate', {
                partRequests: selectedParts.map(p => ({
                    partId: p.id,
                    quantity: (p.maxQuantity || p.minQuantity * 2) - p.quantity,
                }))
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parts'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            onClose();
        }
    });

    if (!isOpen) return null;

    const toggleSelection = (id: string) => {
        const next = new Set(selectedPartIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedPartIds(next);
    };

    const totalOrderValue = logicLowStockParts
        .filter(p => selectedPartIds.has(p.id))
        .reduce((sum, p) => {
            const qty = (p.maxQuantity || p.minQuantity * 2) - p.quantity;
            return sum + (p.cost * qty);
        }, 0);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-end">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            
            <div className="relative w-full max-w-2xl h-full bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="px-8 py-6 bg-white border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                            <Zap className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Inventory Planning Hub</h2>
                            <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">Automated Replenishment Engine</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items Needing Action</p>
                            <p className="text-3xl font-black text-slate-900">{logicLowStockParts.length}</p>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-3xl space-y-1 shadow-xl shadow-slate-900/20">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Value</p>
                            <p className="text-3xl font-black text-white">₹{totalOrderValue.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Planning List */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Suggested Restock List
                        </h3>

                        {logicLowStockParts.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold italic">Inventory levels are optimized. No replenish suggestions.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {logicLowStockParts.map(part => {
                                    const suggestedQty = (part.maxQuantity || part.minQuantity * 2) - part.quantity;
                                    const isSelected = selectedPartIds.has(part.id);

                                    return (
                                        <div 
                                            key={part.id}
                                            onClick={() => toggleSelection(part.id)}
                                            className={cn(
                                                "p-6 bg-white rounded-3xl border-2 transition-all cursor-pointer group flex items-center gap-6",
                                                isSelected ? "border-primary shadow-lg shadow-primary/5" : "border-transparent hover:border-slate-200 shadow-sm"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                isSelected ? "bg-primary border-primary text-white" : "border-slate-200"
                                            )}>
                                                {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{part.partNumber || 'N/A'}</span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <AlertTriangle className={cn("w-3.5 h-3.5", part.quantity === 0 ? "text-red-500" : "text-amber-500")} />
                                                </div>
                                                <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{part.name}</h4>
                                            </div>

                                            <div className="flex items-center gap-4 text-right">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Current</p>
                                                    <p className="text-sm font-black text-slate-700">{part.quantity}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-300" />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">Order</p>
                                                    <p className="text-sm font-black text-primary">+{suggestedQty}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-white border-t border-slate-200 space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <p className="text-[12px] text-slate-500 font-medium">
                            Proceeding will generate draft Purchase Orders grouped by primary vendors.
                        </p>
                    </div>
                    <button 
                        onClick={() => createPOMutation.mutate(Array.from(selectedPartIds))}
                        disabled={selectedPartIds.size === 0 || createPOMutation.isPending}
                        className={cn(
                            "w-full h-16 rounded-[1.5rem] font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all",
                            selectedPartIds.size === 0 || createPOMutation.isPending
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-primary text-white hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]"
                        )}
                    >
                        {createPOMutation.isPending ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Box className="w-5 h-5" />}
                        {createPOMutation.isPending ? 'Propagating...' : `Process ${selectedPartIds.size} Replenishment Requests`}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by CMMS Intelligence Engine</p>
                </div>
            </div>
        </div>
    );
};
