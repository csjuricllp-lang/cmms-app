import React, { useRef, useState } from 'react';
import { X, Check, Eraser, PenTool } from 'lucide-react';

interface SignaturePadProps {
    onSave: (signatureBase64: string) => void;
    onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        setHasContent(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasContent(false);
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasContent) return;
        onSave(canvas.toDataURL('image/png'));
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
                            <PenTool className="w-5 h-5 text-primary" />
                            Digital Authentication
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mt-1">Legally binding electronic signature</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-10">
                    <div className="relative aspect-[2/1] bg-slate-900/50 rounded-3xl border-2 border-dashed border-white/5 overflow-hidden group">
                        <canvas
                            ref={canvasRef}
                            width={1200}
                            height={600}
                            className="w-full h-full cursor-crosshair touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        {!hasContent && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                                <PenTool className="w-12 h-12 mb-4" />
                                <p className="text-sm font-black uppercase tracking-widest italic">Sign Here to Authenticate</p>
                            </div>
                        )}
                        <div className="absolute bottom-6 left-6 flex items-center gap-3 pointer-events-none opacity-40 italic">
                            <div className="w-4 h-[1px] bg-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Technician Acknowledgment</span>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-10">
                        <button
                            onClick={clear}
                            className="flex-1 h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 font-black uppercase tracking-widest italic flex items-center justify-center gap-3 transition-all"
                        >
                            <Eraser className="w-5 h-5" />
                            Clear Pad
                        </button>
                        <button
                            onClick={save}
                            disabled={!hasContent}
                            className="flex-[2] h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:grayscale text-white font-black uppercase tracking-widest italic flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                            <Check className="w-6 h-6" />
                            Verify & Close Task
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
