import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
    children?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
    children
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
                    >
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                    variant === 'danger' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                                )}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-[20px] font-black text-gray-900 tracking-tight leading-tight">
                                    {title}
                                </h3>
                            </div>
                            
                            <p className="text-[15px] font-medium text-gray-500 leading-relaxed mb-6">
                                {message}
                            </p>

                            {children && (
                                <div className="mb-8">
                                    {children}
                                </div>
                            )}
                            
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3.5 bg-white border border-gray-200 text-gray-600 rounded-2xl text-[14px] font-black hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    {cancelText}
                                </button>
                                <button 
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={cn(
                                        "flex-1 px-6 py-3.5 rounded-2xl text-[14px] font-black text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
                                        variant === 'danger' ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
                                        isLoading && "opacity-70 cursor-not-allowed"
                                    )}
                                >
                                    {isLoading ? 'Processing...' : confirmText}
                                </button>
                            </div>
                        </div>
                        
                        <button 
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
