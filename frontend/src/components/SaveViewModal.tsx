import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SaveViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}

export const SaveViewModal: React.FC<SaveViewModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[440px] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between">
                    <h3 className="text-[19px] font-bold text-slate-800">Save View</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <div className="px-6 pb-8">
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-slate-600 ml-0.5">Name</label>
                        <input 
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-slate-50 flex items-center justify-end gap-3 bg-slate-50/20">
                    <button 
                        onClick={onClose}
                        className="h-10 px-6 border border-slate-200 rounded-lg text-[15px] font-bold text-slate-600 hover:bg-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={!name.trim()}
                        onClick={() => { onSave(name); onClose(); }}
                        className={cn(
                            "h-10 px-8 rounded-lg text-[15px] font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed",
                            name.trim() ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-100 text-slate-400"
                        )}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
