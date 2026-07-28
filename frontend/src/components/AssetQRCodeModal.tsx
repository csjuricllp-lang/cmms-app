import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download, Share2, ShieldCheck, Box } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    asset: {
        id: string;
        name: string;
        serialNumber?: string;
    };
}

export const AssetQRCodeModal: React.FC<Props> = ({ isOpen, onClose, asset }) => {
    if (!isOpen) return null;

    const qrValue = `${window.location.origin}/assets/${asset.id}`;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const qrSvg = document.getElementById('asset-qr-code')?.outerHTML || '';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Asset Tag - ${asset.name}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .card { border: 2px solid #000; padding: 40px; border-radius: 20px; text-align: center; width: 300px; }
                        .qr-container { margin-bottom: 20px; }
                        .name { font-size: 24px; font-weight: 900; margin: 10px 0; text-transform: uppercase; }
                        .id { font-size: 12px; color: #666; font-family: monospace; }
                        .brand { font-size: 10px; font-weight: bold; color: #999; margin-top: 20px; tracking: 2px; }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div class="card">
                        <div class="qr-container">${qrSvg}</div>
                        <div class="name">${asset.name}</div>
                        <div class="id">SN: ${asset.serialNumber || 'N/A'}</div>
                        <div class="brand">ANTIGRAVITY CMMS PRO</div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-[0_32px_120px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="bg-slate-900 px-8 py-10 text-white relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mb-6">
                        <ShieldCheck className="w-7 h-7 text-primary-foreground" />
                    </div>

                    <h2 className="text-[28px] font-black italic tracking-tight uppercase leading-none mb-2">
                        Asset Identity Tag
                    </h2>
                    <p className="text-white/40 text-[13px] font-bold italic">
                        Generate a secure scannable tag for field operations.
                    </p>
                </div>

                {/* QR Display Area */}
                <div className="p-10 flex flex-col items-center">
                    <div className="p-8 bg-slate-50 rounded-[48px] border-4 border-slate-100 shadow-inner relative group">
                        <div className="bg-white p-6 rounded-[32px] shadow-xl group-hover:scale-105 transition-all duration-500">
                            <QRCodeSVG 
                                id="asset-qr-code"
                                value={qrValue} 
                                size={200}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                            Verified Node
                        </div>
                    </div>

                    <div className="mt-10 text-center space-y-2">
                        <h3 className="text-[20px] font-black italic text-slate-800 uppercase tracking-tight">{asset.name}</h3>
                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest opacity-60 italic">{asset.serialNumber || 'NO SERIAL RECORDED'}</p>
                    </div>

                    {/* Action Grid */}
                    <div className="grid grid-cols-1 w-full gap-4 mt-10">
                        <button 
                            onClick={handlePrint}
                            className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-[24px] text-[14px] font-black uppercase tracking-widest italic flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-100"
                        >
                            <Printer className="w-5 h-5" />
                            Print Physical Tag
                        </button>
                        
                        <div className="flex gap-3">
                            <button className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[20px] text-[12px] font-black uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all">
                                <Download className="w-4 h-4" />
                                Save Image
                            </button>
                            <button className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[20px] text-[12px] font-black uppercase tracking-widest italic flex items-center justify-center gap-2 transition-all">
                                <Share2 className="w-4 h-4" />
                                Share Link
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-10 pb-10">
                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                        <Box className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 font-medium leading-relaxed italic">
                            Scanning this tag in the field instantly pulls up maintenance logs, safety protocols, and spare parts inventory for this specific machine.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
