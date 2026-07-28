import { useState, useMemo } from 'react';
import { X, ChevronDown, Search, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { type WorkOrderSync } from '../lib/db';
import { toast } from 'react-hot-toast';

interface LinkWorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentWorkOrder: WorkOrderSync;
}

const RELATION_TYPES = [
    { value: 'IS_BLOCKED_BY', label: 'Is blocked by' },
    { value: 'BLOCKS', label: 'Blocks' },
    { value: 'SPLIT_FROM', label: 'Split from' },
    { value: 'SPLIT_TO', label: 'Split to' },
    { value: 'RELATES_TO', label: 'Relates to' },
    { value: 'DUPLICATES', label: 'Duplicates' },
    { value: 'IS_DUPLICATED_BY', label: 'Is duplicated by' }
];

export const LinkWorkOrderModal = ({ isOpen, onClose, currentWorkOrder }: LinkWorkOrderModalProps) => {
    const queryClient = useQueryClient();
    const [selectedType, setSelectedType] = useState('IS_BLOCKED_BY');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWoIds, setSelectedWoIds] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isRelationMenuOpen, setIsRelationMenuOpen] = useState(false);

    const { data: allWorkOrders } = useQuery({
        queryKey: ['work-orders', 'all-for-linking'],
        queryFn: async () => {
            const response = await api.get('/work-orders', { params: { limit: 1000 } });
            return response.data?.items || response.data || [];
        },
        enabled: isOpen
    });

    const filteredWorkOrders = useMemo(() => {
        if (!allWorkOrders) return [];
        return allWorkOrders.filter((wo: any) => 
            wo.id !== currentWorkOrder.id && // Don't link to self
            (wo.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
             wo.workOrderNo?.toString().includes(searchTerm))
        );
    }, [allWorkOrders, searchTerm, currentWorkOrder.id]);

    const linkMutation = useMutation({
        mutationFn: async () => {
            const promises = selectedWoIds.map(targetId => 
                api.post(`/work-orders/${currentWorkOrder.id}/links`, {
                    targetId,
                    type: selectedType
                })
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders', currentWorkOrder.id] });
            toast.success(`${selectedWoIds.length} mission associations established.`);
            setSelectedWoIds([]);
            setSearchTerm('');
            onClose();
        },
        onError: () => {
            toast.error('Tactical failure: Link protocol rejected.');
        }
    });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                />
                
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-[480px] bg-white rounded-[32px] shadow-2xl"
                >
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 flex items-center justify-between">
                        <h2 className="text-[24px] font-[900] text-slate-900 leading-tight">Link Work Orders</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="px-8 pb-8 space-y-8">
                        <p className="text-[15px] font-bold text-slate-500 leading-relaxed">
                            Select a link relationship and choose one or more work orders to link to the current one:
                        </p>

                        {/* Current WO Badge */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                             <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[13px] font-black text-slate-600">
                                #{String(currentWorkOrder.woNumber || 'PENDING').padStart(3, '0')}
                             </div>
                             <span className="text-[14px] font-black text-slate-700 truncate">{currentWorkOrder.title}</span>
                        </div>

                        {/* Relationship Selector */}
                        <div className="space-y-3">
                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic">Link Relationship</label>
                            <div className="relative">
                                <div 
                                    onClick={() => setIsRelationMenuOpen(!isRelationMenuOpen)}
                                    className={cn(
                                        "w-full h-[60px] px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-200 transition-all",
                                        isRelationMenuOpen && "border-blue-500 bg-white shadow-lg"
                                    )}
                                >
                                    <span className="text-[15px] font-bold text-slate-800">
                                        {RELATION_TYPES.find(t => t.value === selectedType)?.label}
                                    </span>
                                    <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isRelationMenuOpen && "rotate-180")} />
                                </div>
                                
                                <AnimatePresence>
                                    {isRelationMenuOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-[calc(100%+8px)] left-0 w-[240px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-[120] py-2 overflow-y-auto max-h-[220px] custom-scrollbar"
                                        >
                                            {RELATION_TYPES.map(type => (
                                                <button 
                                                    key={type.value}
                                                    onClick={() => {
                                                        setSelectedType(type.value);
                                                        setIsRelationMenuOpen(false);
                                                    }}
                                                    className="w-full px-6 py-3.5 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                                                >
                                                    <span className={cn(
                                                        "text-[14px] font-bold transition-colors",
                                                        selectedType === type.value ? "text-blue-600" : "text-slate-600 group-hover:text-slate-900"
                                                    )}>
                                                        {type.label}
                                                    </span>
                                                    {selectedType === type.value && (
                                                        <Check className="w-4 h-4 text-blue-500" />
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Searchable Multi-select */}
                        <div className="space-y-3 relative z-50">
                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest italic">Work Order(s) to Link</label>
                            
                            {/* Trigger */}
                            <div 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={cn(
                                    "w-full min-h-[60px] p-2 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-between cursor-pointer transition-all gap-2",
                                    isDropdownOpen && "border-blue-500 bg-white"
                                )}
                            >
                                {selectedWoIds.length === 0 ? (
                                    <span className="text-[15px] font-bold text-slate-400 pl-4 py-2">Select mission dependencies...</span>
                                ) : (
                                    <div className="flex flex-wrap gap-2 p-1 border-r border-transparent">
                                        {selectedWoIds.map(id => {
                                            const wo = allWorkOrders?.find((w: any) => w.id === id);
                                            return (
                                                <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-lg text-[13px] font-black text-slate-700">
                                                    <span>#{String(wo?.workOrderNo || '').padStart(3, '0')}</span>
                                                    <button 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setSelectedWoIds(prev => prev.filter(i => i !== id)); 
                                                        }}
                                                        className="hover:bg-slate-100 p-0.5 rounded-full transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <ChevronDown className={cn("w-5 h-5 text-slate-400 shrink-0 mr-4 transition-transform", isDropdownOpen && "rotate-180")} />
                            </div>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                                        >
                                            {/* Search Input */}
                                            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Search"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="w-full h-[46px] pl-[42px] pr-4 bg-white border-2 border-blue-500 rounded-xl text-[14px] font-bold text-slate-800 outline-none shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all placeholder:text-slate-400"
                                                        autoFocus
                                                    />
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />
                                                </div>
                                            </div>

                                            {/* Results */}
                                            <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1">
                                                {filteredWorkOrders.length === 0 ? (
                                                    <div className="px-6 py-10 text-center space-y-3">
                                                        <AlertCircle className="w-10 h-10 text-slate-200 mx-auto" />
                                                        <p className="text-[14px] font-bold text-slate-400 italic">No missions match your strategy.</p>
                                                    </div>
                                                ) : (
                                                    filteredWorkOrders.map((wo: any) => {
                                                        const isSelected = selectedWoIds.includes(wo.id);
                                                        return (
                                                            <div 
                                                                key={wo.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedWoIds(prev => 
                                                                        isSelected ? prev.filter(i => i !== wo.id) : [...prev, wo.id]
                                                                    );
                                                                }}
                                                                className="w-full px-5 py-3 text-left hover:bg-slate-50 flex items-center gap-4 cursor-pointer group/item rounded-xl transition-colors"
                                                            >
                                                                <div className={cn(
                                                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                                                    isSelected ? "bg-blue-600 border-blue-600 shadow-sm" : "bg-white border-slate-300 group-hover/item:border-blue-400"
                                                                )}>
                                                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
                                                                </div>
                                                                <div className="flex items-center gap-3 w-full">
                                                                    <div className="px-2 py-1 bg-slate-100 rounded-lg text-[13px] font-black text-slate-700">
                                                                        #{String(wo.workOrderNo || '').padStart(3, '0')}
                                                                    </div>
                                                                    <span className="text-[14.5px] font-bold text-slate-700 truncate">{wo.title}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-4 rounded-b-[32px]">
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 text-[15px] font-black text-slate-500 hover:text-slate-700 transition-all uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={selectedWoIds.length === 0 || linkMutation.isPending}
                            onClick={() => linkMutation.mutate()}
                            className={cn(
                                "px-10 py-3 rounded-2xl text-[15px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95",
                                selectedWoIds.length === 0 
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                                : "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:shadow-xl"
                            )}
                        >
                            {linkMutation.isPending ? 'Linking...' : 'Link'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
