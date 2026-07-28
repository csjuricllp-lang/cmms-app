import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, MessageSquare, ClipboardCheck, ArrowRight, PenTool } from 'lucide-react';
import { cn } from '../lib/utils';
import { SignaturePad } from './SignaturePad';

import { useFailureCodes } from '../hooks/useFailureCodes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: { resolutionNotes: string; rcaCode: string; signature?: string }) => void;
    workOrderTitle: string;
}

export const CompletionWizard: React.FC<Props> = ({ isOpen, onClose, onComplete, workOrderTitle }) => {
    const { failureCodes } = useFailureCodes();
    const [step, setStep] = useState(1);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [selectedRca, setSelectedRca] = useState('');
    const [signature, setSignature] = useState<string | null>(null);
    const [isPadOpen, setIsPadOpen] = useState(false);

    if (!isOpen) return null;

    const handleFinish = () => {
        if (!resolutionNotes || !signature) return;
        if (failureCodes.data && failureCodes.data.length > 0 && !selectedRca) return;
        onComplete({ resolutionNotes, rcaCode: selectedRca, signature });
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-[0_32px_120px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                {/* Header Section */}
                <div className="bg-slate-900 px-10 py-10 text-white relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em]">
                            Mission Completion Protocol
                        </div>
                    </div>

                    <h2 className="text-[32px] font-black italic tracking-tight uppercase leading-none mb-2">
                        Close Work Order
                    </h2>
                    <p className="text-white/40 text-[14px] font-bold italic truncate max-w-[80%]">
                        Target: {workOrderTitle}
                    </p>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5">
                        <div 
                            className="h-full bg-emerald-500 transition-all duration-700 ease-out"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Body Section */}
                <div className="p-10">
                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                            <div className="flex items-center gap-4 pb-2">
                                <MessageSquare className="w-6 h-6 text-primary" />
                                <h3 className="text-[20px] font-black italic uppercase">Resolution Logistics</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-2">What was the final outcome?</label>
                                <textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    placeholder="Describe the solution, parts replaced, and any remaining observations..."
                                    className="w-full min-h-[160px] p-8 bg-slate-50 border border-slate-100 rounded-[32px] text-[16px] font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all custom-scrollbar"
                                />
                            </div>

                            <button 
                                onClick={() => resolutionNotes && setStep(2)}
                                disabled={!resolutionNotes}
                                className="w-full py-6 bg-slate-900 hover:bg-black text-white rounded-[24px] text-[15px] font-black uppercase tracking-widest italic flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-20 shadow-xl"
                            >
                                Identify Root Cause
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                            <div className="flex items-center gap-4 pb-2">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                                <h3 className="text-[20px] font-black italic uppercase">Root Cause Analysis</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {(!failureCodes.data || failureCodes.data.length === 0) ? (
                                    <div className="p-6 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border border-slate-100">
                                        No failure codes configured. You may proceed to the next step.
                                    </div>
                                ) : (
                                    failureCodes.data.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedRca(item.id)}
                                            className={cn(
                                                "flex items-center justify-between p-6 rounded-[24px] border transition-all text-left group",
                                                selectedRca === item.id 
                                                    ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" 
                                                    : "bg-white border-slate-100 hover:border-slate-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                                    selectedRca === item.id ? "bg-primary text-white" : "bg-slate-50 text-slate-400"
                                                )}>
                                                    <ShieldCheck className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded">{item.code}</span>
                                                        <p className={cn("text-[15px] font-black italic uppercase", selectedRca === item.id ? "text-primary" : "text-slate-700")}>{item.name}</p>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-400 italic opacity-60 uppercase tracking-tight mt-1">{item.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setStep(1)}
                                    className="px-8 py-6 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[24px] text-[15px] font-black uppercase tracking-widest italic transition-all"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={() => setStep(3)}
                                    disabled={failureCodes.data && failureCodes.data.length > 0 ? !selectedRca : false}
                                    className="flex-1 py-6 bg-slate-900 hover:bg-black text-white rounded-[24px] text-[15px] font-black uppercase tracking-widest italic flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-20 shadow-xl"
                                >
                                    Final Certification
                                    <ClipboardCheck className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                            <div className="flex flex-col items-center text-center space-y-6 py-4">
                                <div className="w-24 h-24 rounded-[40px] bg-emerald-500 shadow-[0_20px_40px_rgba(16,185,129,0.3)] flex items-center justify-center text-white scale-110 mb-4">
                                    <ShieldCheck className="w-12 h-12" />
                                </div>
                                <h3 className="text-[28px] font-black italic uppercase tracking-tight leading-none">Technician Sign-Off</h3>
                                <p className="text-slate-400 font-bold italic text-[14px] max-w-sm">
                                    By clicking complete, you certify that all safety protocols were followed and the equipment is restored to optimal status.
                                </p>
                            </div>

                            {!signature ? (
                                <button
                                    onClick={() => setIsPadOpen(true)}
                                    className="w-full p-10 rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-primary/40 transition-all flex flex-col items-center gap-4 group cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <PenTool className="w-7 h-7 text-slate-400 group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-[13px] font-black italic uppercase tracking-[0.1em] text-slate-400 group-hover:text-slate-600 transition-colors">
                                        Capture Official Signature
                                    </span>
                                </button>
                            ) : (
                                <div className="space-y-4 animate-in zoom-in-95 duration-500">
                                    <div className="relative aspect-[2/1] bg-slate-900 rounded-[32px] overflow-hidden border-2 border-emerald-500/20 shadow-xl group">
                                        <img src={signature} alt="Signature" className="w-full h-full object-contain p-4" />
                                        <button 
                                            onClick={() => setSignature(null)}
                                            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Authenticity Verified</span>
                                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        </div>
                                    </div>
                                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase italic opacity-60">Verified {new Date().toLocaleTimeString()}</p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setStep(2)}
                                    className="px-8 py-6 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[24px] text-[15px] font-black uppercase tracking-widest italic transition-all"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={handleFinish}
                                    disabled={!signature}
                                    className="flex-1 py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[24px] text-[15px] font-black uppercase tracking-widest italic flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-20 shadow-2xl shadow-emerald-500/20"
                                >
                                    Finalize Mission
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isPadOpen && (
                <SignaturePad 
                    onSave={(sig) => {
                        setSignature(sig);
                        setIsPadOpen(false);
                    }}
                    onCancel={() => setIsPadOpen(false)}
                />
            )}
        </div>
    );
};
