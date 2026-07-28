import React, { useState } from 'react';
import { X, Search, Check, ChevronDown, AlertCircle, Info } from 'lucide-react';
import { useParts } from '../hooks/useData';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface AddPartModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId: string;
    onPartsAdded?: () => void;
}

const AddPartModal: React.FC<AddPartModalProps> = ({ isOpen, onClose, workOrderId, onPartsAdded }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'Parts' | 'Sets'>('Parts');
    const [selectedParts, setSelectedParts] = useState<Record<string, number>>({});
    
    const { data: partsData, isLoading } = useParts({ search: searchTerm });
    const parts = (Array.isArray(partsData) ? partsData : (partsData as any)?.items || []) as any[];
    const { consumeParts } = useWorkOrders();


    if (!isOpen) return null;

    const togglePart = (partId: string) => {
        setSelectedParts(prev => {
            const next = { ...prev };
            if (next[partId]) {
                delete next[partId];
            } else {
                next[partId] = 1;
            }
            return next;
        });
    };

    const handleAdd = async () => {
        const partsToConsume = Object.entries(selectedParts).map(([partId, quantity]) => ({
            partId,
            quantity
        }));

        if (partsToConsume.length === 0) return;

        try {
            await consumeParts.mutateAsync({
                workOrderId,
                parts: partsToConsume
            });
            toast.success('Parts added successfully');
            if (onPartsAdded) {
                onPartsAdded();
            }
            onClose();
        } catch (error) {
            toast.error('Failed to add parts');
        }
    };

    const selectedCount = Object.keys(selectedParts).length;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-[1100px] h-[85vh] bg-white rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header Section */}
                <div className="px-8 pt-8 bg-white">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[26px] font-[900] text-slate-800">Add Parts</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-8 border-b border-gray-100">
                        {['Parts', 'Sets'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn(
                                    "pb-4 text-[14px] font-black transition-all relative px-2",
                                    activeTab === tab ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toolbar Context */}
                <div className="px-8 py-5 border-b border-gray-100 bg-white">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-[#f5f5f5] border-none rounded-lg text-[14px] font-bold text-slate-600 placeholder:text-slate-400 outline-none"
                        />
                    </div>
                </div>

                {/* Data Grid Content */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-[#fafafa]">
                    {activeTab === 'Parts' ? (
                        <table className="w-full border-collapse bg-white">
                            <thead className="sticky top-0 bg-white shadow-sm z-20">
                                <tr>
                                    <th className="p-5 text-left w-[60px]">
                                        <div className="w-5 h-5 border-2 border-gray-200 rounded cursor-pointer" />
                                    </th>
                                    <th className="p-5 text-left min-w-[200px] border-r border-gray-100">
                                        <div className="flex items-center gap-2 group cursor-pointer">
                                            <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">Name</span>
                                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
                                        </div>
                                    </th>
                                    <th className="p-5 text-left text-[12px] font-black text-slate-700 uppercase tracking-tight">ID</th>
                                    <th className="p-5 text-left text-[12px] font-black text-slate-700 uppercase tracking-tight">Location</th>
                                    <th className="p-5 text-left text-[12px] font-black text-slate-700 uppercase tracking-tight">Area</th>
                                    <th className="p-5 text-left text-[12px] font-black text-slate-700 uppercase tracking-tight">Cost</th>
                                    <th className="p-5 text-left text-[12px] font-black text-slate-700 uppercase tracking-tight">Available Qty</th>
                                    <th className="p-5 text-left text-[12px] font-black text-slate-700 uppercase tracking-tight">Maximum Qty</th>
                                    <th className="p-5 text-left text-[12px] font-black text-slate-700 uppercase tracking-tight">Status</th>
                                    <th className="p-5 text-left text-[12px] font-black text-slate-700 uppercase tracking-tight">Part Number</th>
                                    <th className="p-5 text-left text-[12px] font-black text-slate-700 uppercase tracking-tight">Barcode</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr><td colSpan={11} className="p-20 text-center font-bold text-slate-400 italic">Syncing with warehouse...</td></tr>
                                ) : parts.length === 0 ? (
                                    <tr><td colSpan={11} className="p-20 text-center font-bold text-slate-400 italic">No inventory matches found.</td></tr>
                                ) : (
                                    parts.map((part) => (
                                        <tr 
                                            key={part.id} 
                                            className={cn(
                                                "hover:bg-slate-50/50 transition-colors cursor-pointer group",
                                                selectedParts[part.id] && "bg-blue-50/30"
                                            )}
                                            onClick={() => togglePart(part.id)}
                                        >
                                            <td className="p-5">
                                                <div className={cn(
                                                    "w-5 h-5 border-2 rounded flex items-center justify-center transition-all",
                                                    selectedParts[part.id] ? "border-blue-600 bg-blue-600" : "border-gray-200"
                                                )}>
                                                    {selectedParts[part.id] && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </td>
                                            <td className="p-5 border-r border-gray-100">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-slate-700">{part.name}</span>
                                                    {selectedParts[part.id] !== undefined && (
                                                        <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                                            <span className="text-[11px] font-black text-blue-600 uppercase">Quantity:</span>
                                                            <input 
                                                                type="number"
                                                                min="1"
                                                                className="w-16 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-[12px] font-black text-blue-700 outline-none focus:ring-2 focus:ring-blue-200"
                                                                value={selectedParts[part.id]}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    const val = Math.max(1, Number(e.target.value));
                                                                    setSelectedParts(prev => ({ ...prev, [part.id]: val }));
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[13px] font-bold text-slate-600 font-mono opacity-80">{part.id.substring(0, 10)}</span>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[14px] font-bold text-slate-600">{part.location?.name || 'Suite B'}</span>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[14px] font-bold text-slate-600">{part.binLocation || 'Maintenance'}</span>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[14px] font-bold text-slate-700">{part.cost?.toLocaleString() || '1.55'}</span>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[14px] font-bold text-slate-700">{Number(part.quantity || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[14px] font-bold text-slate-700">{part.maxQuantity || ''}</span>
                                            </td>
                                            <td className="p-5">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[11px] font-black tracking-tight",
                                                    part.quantity <= 0 ? "bg-gray-100 text-gray-500" :
                                                    part.quantity <= (part.minQuantity || 5) ? "bg-orange-100 text-orange-600" :
                                                    "bg-blue-50 text-blue-600"
                                                )}>
                                                    {part.quantity <= 0 ? 'No stock' : 
                                                     part.quantity <= (part.minQuantity || 5) ? 'Low stock' : 'Non-stock'}
                                                </span>
                                            </td>
                                            <td className="p-5 uppercase tracking-tighter">
                                                <span className="text-[13px] font-bold text-slate-500 opacity-80">{part.partNumber || 'N/A'}</span>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[13px] font-bold text-slate-500 font-mono opacity-80">{part.barcode || 'N/A'}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 bg-[#fafafa]">
                            <div className="w-full max-w-md p-8 bg-blue-50/50 border border-blue-100 rounded-[20px] flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                                    <Info className="w-8 h-8" />
                                </div>
                                <h3 className="text-[18px] font-black text-slate-800">No sets available</h3>
                                <p className="text-[14px] font-bold text-slate-500 leading-relaxed">
                                    Part sets allow you to group multiple inventory items together and add them to a mission in a single action. You haven't created any sets yet.
                                </p>
                                <div className="pt-4 flex items-center gap-2 text-blue-600 font-black text-[13px] uppercase tracking-widest cursor-pointer hover:underline">
                                    <AlertCircle className="w-4 h-4" />
                                    Learn about sets
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="px-8 py-6 border-t border-gray-100 bg-white flex items-center justify-between">
                    <span className="text-[14px] font-bold text-slate-400 italic lowercase">
                        {selectedCount} Part{selectedCount !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="px-8 py-2.5 border border-gray-200 text-slate-600 rounded-lg text-[15px] font-black hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleAdd}
                            disabled={selectedCount === 0 || consumeParts.isPending}
                            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-[15px] font-black shadow-lg shadow-blue-100 transition-all active:scale-95"
                        >
                            {consumeParts.isPending ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPartModal;
