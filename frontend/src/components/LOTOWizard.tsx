import React, { useState } from 'react';
import { X, ShieldAlert, CircleCheck, Lock, Tag, ZapOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: LOTOData) => void;
    workOrderTitle: string;
}

export interface LOTOData {
    lockVerified: boolean;
    tagVerified: boolean;
    energyVerified: boolean;
}

export const LOTOWizard: React.FC<Props> = ({ isOpen, onClose, onComplete, workOrderTitle }) => {
    const [step, setStep] = useState(1);
    const [verification, setVerification] = useState<LOTOData>({
        lockVerified: false,
        tagVerified: false,
        energyVerified: false,
    });

    if (!isOpen) return null;

    const steps = [
        {
            id: 1,
            title: "Physical Lock-Out",
            description: "Has the main energy source been physically secured with a padlock?",
            icon: Lock,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            field: "lockVerified" as const
        },
        {
            id: 2,
            title: "Safety Tagging",
            description: "Has a 'DO NOT OPERATE' tag been attached to the lock with your identification?",
            icon: Tag,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            field: "tagVerified" as const
        },
        {
            id: 3,
            title: "Zero Energy Verification",
            description: "Have all residual energies (pneumatic, hydraulic, thermal) been bled and verified zero?",
            icon: ZapOff,
            color: "text-red-500",
            bg: "bg-red-500/10",
            field: "energyVerified" as const
        }
    ];

    const currentStep = steps[step - 1];

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            onComplete(verification);
        }
    };

    const toggleVerification = () => {
        setVerification(prev => ({
            ...prev,
            [currentStep.field]: !prev[currentStep.field]
        }));
    };

    return (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
            
            <div className="relative w-full max-w-xl bg-white rounded-[48px] shadow-[0_32px_120px_rgba(0,0,0,0.5)] overflow-hidden">
                {/* Status Bar */}
                <div className="flex h-2">
                    {[1, 2, 3].map(i => (
                        <div 
                            key={i} 
                            className={`flex-1 transition-all duration-500 ${i <= step ? 'bg-red-600' : 'bg-slate-100'}`} 
                        />
                    ))}
                </div>

                <div className="px-12 py-12">
                    <header className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                                <ShieldAlert className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-[24px] font-black italic text-slate-900 tracking-tight leading-none uppercase">LOTO SAFETY AUDIT</h2>
                                <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">MANDATORY PROTOCOL: {workOrderTitle}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-300">
                            <X className="w-6 h-6" />
                        </button>
                    </header>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="flex items-start gap-8">
                                <div className={`w-20 h-20 rounded-[32px] ${currentStep.bg} flex items-center justify-center shrink-0`}>
                                    <currentStep.icon className={`w-10 h-10 ${currentStep.color}`} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-[28px] font-black italic text-slate-900 tracking-tighter uppercase leading-tight">
                                        {currentStep.title}
                                    </h3>
                                    <p className="text-[16px] text-slate-500 font-medium leading-relaxed">
                                        {currentStep.description}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={toggleVerification}
                                className={`w-full p-10 rounded-[40px] border-4 transition-all flex flex-col items-center gap-6 group ${
                                    verification[currentStep.field] 
                                    ? "bg-emerald-50 border-emerald-500/30" 
                                    : "bg-slate-50 border-slate-100 hover:border-slate-200"
                                }`}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                                    verification[currentStep.field] 
                                    ? "bg-emerald-500 text-white" 
                                    : "bg-white text-slate-200 border-4 border-slate-50 group-hover:border-slate-100"
                                }`}>
                                    <CircleCheck className="w-8 h-8" />
                                </div>
                                <span className={`text-[14px] font-black uppercase tracking-[0.2em] italic ${
                                    verification[currentStep.field] ? "text-emerald-600" : "text-slate-400"
                                }`}>
                                    {verification[currentStep.field] ? "Verified & Locked" : "Click to Verify"}
                                </span>
                            </button>
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-12 flex items-center justify-between">
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div 
                                    key={i} 
                                    className={`w-2 h-2 rounded-full ${i === step ? 'bg-red-600 w-6' : 'bg-slate-200'} transition-all`} 
                                />
                            ))}
                        </div>
                        
                        <button
                            disabled={!verification[currentStep.field]}
                            onClick={handleNext}
                            className={`px-10 py-5 rounded-[24px] font-black italic text-[14px] uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 ${
                                verification[currentStep.field]
                                ? "bg-slate-900 text-white shadow-xl shadow-slate-200 scale-105"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                        >
                            {step === 3 ? "Complete Audit" : "Next Protocol"}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <footer className="bg-slate-50 px-12 py-8 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic text-center">
                         By completing this audit, you certify that all energy sources are neutralized and secured according to OSHA 1910.147 standards. Antigravity CMMS tracks this signature for safety compliance.
                    </p>
                </footer>
            </div>
        </div>
    );
};
