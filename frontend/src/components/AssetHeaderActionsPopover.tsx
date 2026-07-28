import React from 'react';
import { Upload, Download, QrCode } from 'lucide-react';

interface AssetHeaderActionsPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: () => void;
    onExport: () => void;
    onGenerateQR: () => void;
    onDownloadLabels: () => void;
    anchorRect?: DOMRect;
}

export const AssetHeaderActionsPopover: React.FC<AssetHeaderActionsPopoverProps> = ({
    isOpen,
    onClose,
    onImport,
    onExport,
    onGenerateQR,
    onDownloadLabels,
    anchorRect
}) => {
    if (!isOpen || !anchorRect) return null;

    return (
        <>
            <div className="fixed inset-0 z-[250]" onClick={onClose} />
            <div 
                className="fixed z-[260] w-[320px] bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200"
                style={{ 
                    top: anchorRect.bottom + 8, 
                    right: window.innerWidth - anchorRect.right 
                }}
            >
                <button
                    onClick={() => { onImport(); onClose(); }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                >
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                    <span className="text-[17px] font-medium text-slate-700">Import</span>
                </button>
                
                <div className="h-[1px] bg-slate-100 my-1" />

                <button
                    onClick={() => { onGenerateQR(); onClose(); }}
                    className="w-full flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors group text-left"
                >
                    <QrCode className="w-5 h-5 text-slate-400 mt-0.5 group-hover:text-blue-600" />
                    <div className="flex flex-col">
                        <span className="text-[17px] font-medium text-slate-700">Download & Generate</span>
                        <span className="text-[13px] text-slate-400 leading-tight mt-1 font-medium">This will generate QR codes for assets without one.</span>
                    </div>
                </button>

                <button
                    onClick={() => { onDownloadLabels(); onClose(); }}
                    className="w-full flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors group text-left"
                >
                    <QrCode className="w-5 h-5 text-slate-400 mt-0.5 group-hover:text-blue-600" />
                    <div className="flex flex-col">
                        <span className="text-[17px] font-medium text-slate-700">Download Labels</span>
                        <span className="text-[13px] text-slate-400 leading-tight mt-1 font-medium">This will only download existing QR codes in a 1" x 2-5/8" format.</span>
                    </div>
                </button>
            </div>
        </>
    );
};
