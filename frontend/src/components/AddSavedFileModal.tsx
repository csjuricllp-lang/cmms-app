import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

interface AddSavedFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId: string;
}

export const AddSavedFileModal: React.FC<AddSavedFileModalProps> = ({ isOpen, onClose, workOrderId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    console.log('Preparing to link files to mission:', workOrderId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-[580px] bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-h-[600px]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[24px] font-[900] text-slate-800 tracking-tight">Add Files</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col">
                    {/* Search */}
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Search files"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-blue-400 rounded-xl text-[14px] font-bold text-slate-600 outline-none shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all"
                        />
                    </div>

                    {/* Empty State */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <p className="text-[14px] font-bold text-slate-400 italic">No file found</p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-50">
                        <button
                            onClick={onClose}
                            className="px-8 py-2.5 border border-gray-200 text-slate-600 rounded-xl text-[15px] font-black hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            disabled
                            className="px-10 py-3 bg-blue-600 text-white rounded-xl text-[15px] font-black transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-200"
                        >
                            Add Files
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSavedFileModal;
