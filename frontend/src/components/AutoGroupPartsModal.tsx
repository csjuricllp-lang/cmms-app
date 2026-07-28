import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface AutoGroupPartsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AutoGroupPartsModal: React.FC<AutoGroupPartsModalProps> = ({ isOpen, onClose }) => {
    const [hasPartNumbers, setHasPartNumbers] = useState(false);
    const queryClient = useQueryClient();

    const groupMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/parts/auto-group');
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['parts'] });
            queryClient.invalidateQueries({ queryKey: ['asset-settings'] });
            toast.success(
                `Consolidation complete! Merged ${data.groupsMerged} groups and consolidated ${data.partsConsolidated} parts.`, 
                { duration: 6000 }
            );
            onClose();
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to auto group parts';
            toast.error(message);
        }
    });

    const handleContinue = () => {
        if (!hasPartNumbers || groupMutation.isPending) return;
        groupMutation.mutate();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm shadow-[0_0_100px_rgba(0,0,0,0.2)]"
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-[560px] bg-white rounded-[2rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] p-10 flex flex-col gap-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-[24px] font-black text-slate-800 tracking-tight">Auto Group Parts</h2>
                            <button 
                                onClick={onClose} 
                                disabled={groupMutation.isPending}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-[15px] font-bold text-slate-600 leading-relaxed max-w-[450px]">
                                    This process will automatically group your current parts by the "Part Number" field.
                                </p>
                                <p className="text-[14px] text-slate-400 font-medium">
                                    Please follow <a href="#" className="text-indigo-600 hover:underline">this import process</a> to update your data
                                </p>
                            </div>

                            <label className={cn(
                                "flex items-center gap-4 py-4 cursor-pointer group",
                                groupMutation.isPending && "pointer-events-none opacity-50"
                            )}>
                                <div 
                                    onClick={() => !groupMutation.isPending && setHasPartNumbers(!hasPartNumbers)}
                                    className={cn(
                                        "w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center",
                                        hasPartNumbers ? "bg-indigo-600 border-indigo-600" : "border-slate-200 group-hover:border-slate-300"
                                    )}
                                >
                                    {hasPartNumbers && (
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-2.5 h-2.5 bg-white rounded-sm"
                                        />
                                    )}
                                </div>
                                <span className="text-[14px] font-bold text-slate-600 select-none">All of my parts have a part number</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-4">
                            <button 
                                onClick={onClose}
                                disabled={groupMutation.isPending}
                                className="px-8 py-3 bg-white border border-gray-200 text-slate-500 text-[14px] font-black rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleContinue}
                                disabled={!hasPartNumbers || groupMutation.isPending}
                                className={cn(
                                    "px-8 py-3 text-[14px] font-black rounded-xl transition-all flex items-center justify-center gap-2",
                                    hasPartNumbers && !groupMutation.isPending
                                        ? "bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-black" 
                                        : "bg-gray-100 text-gray-300 cursor-not-allowed"
                                )}
                            >
                                {groupMutation.isPending ? 'Grouping...' : 'Continue'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
