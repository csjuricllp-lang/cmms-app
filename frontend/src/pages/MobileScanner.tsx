import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Zap, ZapOff, Loader2, Maximize, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

export const MobileScanner = () => {
  const navigate = useNavigate();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingCode, setResolvingCode] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const shouldStopRef = useRef(false);

  useEffect(() => {
    shouldStopRef.current = false;
    startScanner();
    return () => {
      shouldStopRef.current = true;
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId?: string) => {
    try {
      setError(null);
      isStartingRef.current = true;
      // Wait for DOM element to exist
      const readerElement = document.getElementById("mobile-qr-reader");
      if (!readerElement) return;

      const html5QrCode = new Html5Qrcode("mobile-qr-reader");
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 10, 
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0
      };

      const deviceId = cameraId || { facingMode: "environment" };

      await html5QrCode.start(
        deviceId, 
        config, 
        (decodedText) => {
          handleScannedCode(decodedText);
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

  const handleScannedCode = async (code: string) => {
    if (resolvingCode) return;
    setResolvingCode(true);
    
    // Stop scanner early to prevent double-scanning
    await stopScanner();

    const cleanCode = code.trim();
    toast.loading('Resolving Asset Tag...', { id: 'scan-resolve' });

    try {
      // 1. Try to resolve as an asset code on the backend
      const response = await api.get(`/assets/scan/${cleanCode}`);
      if (response.data && response.data.id) {
        toast.success('Asset identified', { id: 'scan-resolve' });
        navigate(`/assets/${response.data.id}`);
        return;
      }
    } catch (err) {
      // If asset lookup failed, let's check if the scanned text is a UUID itself (could be direct ID)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);
      if (isUuid) {
        // Try to load as direct asset
        try {
          const res = await api.get(`/assets/${cleanCode}`);
          if (res.data) {
            toast.success('Asset identified by direct UUID', { id: 'scan-resolve' });
            navigate(`/assets/${cleanCode}`);
            return;
          }
        } catch {}

        // Try to load as direct work order
        try {
          const res = await api.get(`/work-orders/${cleanCode}`);
          if (res.data) {
            toast.success('Work Order identified by direct UUID', { id: 'scan-resolve' });
            navigate(`/work-orders?id=${cleanCode}`);
            return;
          }
        } catch {}
      }
    }

    toast.error('Could not identify Asset Tag', { id: 'scan-resolve' });
    setResolvingCode(false);
    // Restart scanner
    startScanner();
  };

  return (
    <div className="min-h-screen bg-[#0d0d10] text-white flex flex-col pb-20 select-none">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Maximize className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-[15px] font-black italic uppercase tracking-wider text-white">Asset Scanner</h2>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-none mt-0.5">Field Tag Reader</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Reader Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="relative aspect-square w-full max-w-[320px] bg-black rounded-[36px] border-2 border-white/5 overflow-hidden flex items-center justify-center shadow-2xl">
          <div id="mobile-qr-reader" className="w-full h-full object-cover" />
          
          {!isCameraActive && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/60 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Activating Camera...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-red-500/10">
              <Camera className="w-10 h-10 text-red-500 mb-3 opacity-65 animate-pulse" />
              <p className="text-red-400 font-bold text-[12px] leading-relaxed">{error}</p>
              <button 
                onClick={() => startScanner()}
                className="mt-4 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10"
              >
                Retry Sensor
              </button>
            </div>
          )}

          {/* Target Scanning Overlay */}
          {isCameraActive && !resolvingCode && (
            <>
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.25)] pointer-events-none">
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-primary shadow-[0_0_10px_#3b82f6] animate-[scan_2s_infinite_linear]" />
              </div>
            </>
          )}

          {resolvingCode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/75 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Decoding Tag...</p>
            </div>
          )}
        </div>

        {/* Manual Keyboard Entry */}
        <div className="w-full max-w-[320px]">
          <input 
            type="text"
            placeholder="OR ENTER CODE MANUALLY"
            className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-5 text-[10px] font-black text-white placeholder:text-white/20 focus:outline-none focus:border-primary/45 transition-all text-center uppercase tracking-widest"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleScannedCode((e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>

        {/* Flash Light Control */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTorch}
            disabled={!isCameraActive || resolvingCode}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95",
              torchActive 
                ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" 
                : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
            )}
            title="Toggle Flash"
          >
            {torchActive ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Info footer */}
      <div className="bg-white/5 p-4 border-t border-white/5 flex items-start gap-3 mx-4 rounded-2xl mb-4">
        <AlertCircle className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
        <p className="text-[11px] text-white/40 font-medium leading-relaxed italic">
          Position the QR or Barcode tag inside the central green frame. Scanner automatically resolves physical asset nodes to redirect to active work orders or history logs.
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        #mobile-qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};
