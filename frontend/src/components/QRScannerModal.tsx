import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Zap, ZapOff, Loader2, Maximize, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

export const QRScannerModal: React.FC<Props> = ({ isOpen, onClose, onScan }) => {
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [torchActive, setTorchActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isStartingRef = useRef(false);
    const shouldStopRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            shouldStopRef.current = false;
            startScanner();
        } else {
            stopScanner();
        }
        return () => {
            shouldStopRef.current = true;
            stopScanner();
        };
    }, [isOpen]);

    const startScanner = async (cameraId?: string) => {
        try {
            setError(null);
            isStartingRef.current = true;
            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            const config = { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            const deviceId = cameraId || { facingMode: "environment" };

            await html5QrCode.start(
                deviceId, 
                config, 
                (decodedText) => {
                    onScan(decodedText);
                    stopScanner();
                    onClose();
                },
                () => {} // Silent on failure to scan frame
            );
            isStartingRef.current = false;
            setIsCameraActive(true);

            if (shouldStopRef.current) {
                stopScanner();
            }
        } catch (err: any) {
            isStartingRef.current = false;
            console.error("Scanner Error:", err);
            setError("Could not access camera. Please ensure permissions are granted.");
        }
    };

    const stopScanner = async () => {
        shouldStopRef.current = true;
        if (isStartingRef.current) {
            return;
        }
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current = null;
                setIsCameraActive(false);
                setTorchActive(false);
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    const toggleTorch = async () => {
        if (scannerRef.current && isCameraActive) {
            try {
                const track = (scannerRef.current as any).getRunningTrack();
                if (track && 'applyConstraints' in track) {
                    await (track as any).applyConstraints({
                        advanced: [{ torch: !torchActive }]
                    });
                    setTorchActive(!torchActive);
                }
            } catch (err) {
                console.error("Torch failed", err);
            }
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
                >
                <div className="relative w-full max-w-lg bg-[#0d0d10] rounded-[40px] border border-white/10 shadow-[0_32px_120px_rgba(0,0,0,0.8)] overflow-hidden">
                    {/* Header */}
                    <div className="p-8 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                                <Maximize className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic text-white uppercase tracking-tight leading-none">Asset Scanner</h2>
                                <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-1">Field Node Identification</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scanner Area */}
                    <div className="relative p-6">
                        <div className="relative aspect-square w-full bg-black rounded-[32px] border-2 border-white/5 overflow-hidden flex items-center justify-center">
                            <div id="qr-reader" className="w-full h-full object-cover" />
                            
                            {!isCameraActive && !error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/40">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                    <p className="text-white/40 text-[11px] font-black uppercase tracking-widest">Warming Sensors...</p>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-destructive/10">
                                    <Camera className="w-12 h-12 text-destructive mb-4 opacity-50" />
                                    <p className="text-destructive font-bold text-sm leading-relaxed">{error}</p>
                                    <button 
                                        onClick={() => startScanner()}
                                        className="mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {/* Scanning Overlays */}
                            {isCameraActive && (
                                <>
                                    <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.3)] pointer-events-none">
                                        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-primary shadow-[0_0_15px_#2563eb] animate-[scan_2s_infinite_linear]" />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Manual Entry Fallback */}
                        <div className="mt-8 px-6 pb-4">
                            <div className="relative">
                                <input 
                                    type="text"
                                    placeholder="OR ENTER ASSET TAG ID MANUALLY"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[11px] font-black text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all uppercase tracking-widest"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            onScan((e.target as HTMLInputElement).value);
                                            onClose();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4 mt-4 pb-4">
                            <button 
                                onClick={toggleTorch}
                                disabled={!isCameraActive}
                                className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                                    torchActive ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {torchActive ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
                            </button>
                            
                            <button 
                                onClick={onClose}
                                className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest italic transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/5 p-6 border-t border-white/5 flex items-start gap-4">
                        <Monitor className="w-5 h-5 text-white/20 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-white/40 font-medium leading-relaxed italic">
                            Align the Asset QR Tag within the frame. The system will automatically detect and redirect you to the digital twin for real-time maintenance logs.
                        </p>
                    </div>
                </div>

                <style>{`
                    @keyframes scan {
                        0% { top: 0; }
                        50% { top: 100%; }
                        100% { top: 0; }
                    }
                    #qr-reader video {
                        object-fit: cover !important;
                        width: 100% !important;
                        height: 100% !important;
                    }
                `}</style>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
