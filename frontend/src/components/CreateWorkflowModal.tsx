import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useWorkflows } from '../hooks/useWorkflows';
import { toast } from 'react-hot-toast';

interface CreateWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [ifValue, setIfValue] = useState('');
    const { createWorkflow } = useWorkflows();

    const isFormValid = title.trim() !== '' && ifValue !== '';

    const handleSave = async () => {
        if (!isFormValid) return;

        try {
            await createWorkflow.mutateAsync({
                name: title,
                entity: 'WorkOrder', // Default for now
                trigger: ifValue,
                conditions: [], // Placeholder
                actions: [], // Placeholder
                isActive: true
            });
            toast.success('Workflow created successfully');
            onClose();
            setTitle('');
            setIfValue('');
        } catch (error) {
            toast.error('Failed to create workflow');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#000000]/40 backdrop-blur-[2px]" 
                onClick={onClose} 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[650px] bg-white rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[20px] font-bold text-slate-800">Create Workflow</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                </div>

                <div className="p-8 space-y-10">
                    {/* Title Field */}
                    <div className="space-y-3">
                        <label className="text-[14px] font-bold text-slate-700 flex items-center gap-1">
                            Title <span className="text-rose-500 font-black text-[16px]">*</span>
                        </label>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder=""
                            className="w-full px-5 py-3.5 bg-white border border-rose-500 rounded-lg text-[15px] font-medium focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                        />
                    </div>

                    {/* If Field */}
                    <div className="space-y-3">
                        <label className="text-[14px] font-bold text-slate-700 flex items-center gap-1">
                            If <span className="text-rose-500 font-black text-[16px]">*</span>
                        </label>
                        <div className="relative group">
                            <select 
                                value={ifValue}
                                onChange={(e) => setIfValue(e.target.value)}
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-lg text-[15px] font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="" disabled hidden></option>
                                <option value="request_created">Request is created</option>
                                <option value="request_updated">Request is updated</option>
                                <option value="status_changed">Status is changed</option>
                                <option value="priority_changed">Priority is changed</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 bg-white border border-gray-200 text-slate-600 text-[14px] font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!isFormValid || createWorkflow.isPending}
                            className={cn(
                                "px-10 py-3 text-[14px] font-bold rounded-lg transition-all",
                                isFormValid && !createWorkflow.isPending
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700" 
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {createWorkflow.isPending ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
