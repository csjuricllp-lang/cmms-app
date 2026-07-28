import React from 'react';
import { Upload, Download } from 'lucide-react';

interface HeaderActionsPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: () => void;
    onExport: () => void;
    anchorRect?: DOMRect;
}

export const HeaderActionsPopover: React.FC<HeaderActionsPopoverProps> = ({
    isOpen,
    onClose,
    onImport,
    onExport,
    anchorRect
}) => {
    if (!isOpen || !anchorRect) return null;

    return (
        <>
            <div className="fixed inset-0 z-[250]" onClick={onClose} />
            <div 
                className="fixed z-[260] w-64 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200"
                style={{ 
                    top: anchorRect.bottom + 8, 
                    right: window.innerWidth - anchorRect.right 
                }}
            >
                <button
                    onClick={() => { onImport(); onClose(); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                >
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    <span className="text-[15px] font-medium text-slate-700">Import</span>
                </button>
                <button
                    onClick={() => { onExport(); onClose(); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                >
                    <Download className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    <span className="text-[15px] font-medium text-slate-700">Export All Locations</span>
                </button>
            </div>
        </>
    );
};
