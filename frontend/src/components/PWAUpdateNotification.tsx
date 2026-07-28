import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const PWAUpdateNotification: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      console.log('Juric PWA Service Worker Registered');
    },
    onRegisterError(error) {
      console.error('SW Registration Error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  useEffect(() => {
    if (needRefresh) {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#0d0d10] shadow-2xl rounded-[24px] pointer-events-auto flex ring-1 ring-primary/20 border border-white/10 overflow-hidden`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary animate-spin-slow" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-[14px] font-black italic text-white uppercase tracking-tight">
                  System Update Available
                </p>
                <p className="mt-1 text-[12px] text-white/50 font-medium">
                  A new version of Juric CMMS is ready. Update now to access the latest industrial intelligence tools.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-white/5">
            <button
              onClick={() => updateServiceWorker(true)}
              className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-primary hover:bg-white/5 transition-all"
            >
              Update
            </button>
            <button
              onClick={close}
              className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/5 transition-all"
            >
              Later
            </button>
          </div>
        </div>
      ), { duration: Infinity, position: 'bottom-right' });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};
