import React from 'react';
import { CircleCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
    isOpen,
    onClose,
    title,
    message
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden border border-emerald-100 p-10 text-center"
                    >
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CircleCheck className="w-10 h-10" />
                        </div>
                        
                        <h3 className="text-[22px] font-black text-gray-900 tracking-tight mb-2">
                            {title}
                        </h3>
                        
                        <p className="text-[15px] font-medium text-gray-500 leading-relaxed mb-10">
                            {message}
                        </p>
                        
                        <button 
                            onClick={onClose}
                            className="w-full px-8 py-4 bg-gray-950 text-white rounded-2xl text-[14px] font-black hover:bg-gray-800 transition-all shadow-lg shadow-gray-950/20 active:scale-95"
                        >
                            Dismiss
                        </button>

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
