import React, { useState } from 'react';
import { X, ShieldAlert, FileText, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { createPortal } from 'react-dom';

interface PermitDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    permit: any; // Permit object
}

export const PermitDetailsModal: React.FC<PermitDetailsModalProps> = ({ isOpen, onClose, permit }) => {
    if (!isOpen || !permit) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-50 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-tight">Permit {permit?.number}</h3>
                            <p className="text-[13px] font-bold text-slate-500">{permit?.type?.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto">
                    <div className="space-y-6">
                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                            <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Permit Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[12px] font-bold text-slate-500 uppercase">Status</p>
                                    <p className="text-[14px] font-black text-slate-900">{permit?.status}</p>
                                </div>
                                <div>
                                    <p className="text-[12px] font-bold text-slate-500 uppercase">Requested By</p>
                                    <p className="text-[14px] font-black text-slate-900">{permit?.requestedBy?.user?.name || 'Unknown'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl space-y-4">
                            <h4 className="text-[14px] font-black text-orange-800 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Risk Assessment
                            </h4>
                            <p className="text-[14px] font-medium text-orange-900/80 leading-relaxed">
                                {permit?.riskAssessment ? JSON.stringify(permit.riskAssessment) : 'No risk assessment data available for this permit.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 border-t border-gray-50 bg-white flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-[13px] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
