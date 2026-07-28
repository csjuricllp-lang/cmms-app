import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export const GlobalAlerts: React.FC = () => {
    const { lastAlert, clearAlert } = useNotifications();

    if (!lastAlert) return null;

    const isAssignment = lastAlert.type === 'ASSIGNMENT';
    const accentColor = isAssignment ? 'text-blue-500' : 'text-red-500';
    const bgColor = isAssignment ? 'bg-blue-500/10' : 'bg-red-500/10';
    const borderColor = isAssignment ? 'border-blue-500/20' : 'border-red-500/20';
    const gradient = isAssignment ? 'from-blue-600 via-blue-500 to-indigo-500' : 'from-red-600 via-red-500 to-amber-500';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed top-24 right-8 z-[500] w-[400px]"
            >
                <div className="relative group">
                    {/* Pulsing Border Glow */}
                    <div className={cn(
                        "absolute -inset-1 rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse bg-gradient-to-r",
                        isAssignment ? "from-blue-600 to-indigo-600" : "from-red-600 to-amber-600"
                    )} />
                    
                    <div className={cn("relative bg-[#0f172a] border rounded-[32px] overflow-hidden shadow-2xl", borderColor)}>
                        {/* Status bar */}
                        <div className={cn("h-1.5 bg-gradient-to-r", gradient)} />
                        
                        <div className="p-6">
                            <div className="flex items-start gap-5">
                                <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0", bgColor, borderColor)}>
                                    <ShieldAlert className={cn("w-8 h-8 animate-bounce", accentColor)} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] italic", accentColor)}>
                                            {isAssignment ? 'Work Assignment' : 'Critical Breakdown'}
                                        </span>
                                        <button 
                                            onClick={clearAlert}
                                            className="p-1 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className="text-[18px] font-black italic text-white leading-tight uppercase tracking-tight">
                                        {lastAlert.name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-3 text-slate-400">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="text-[12px] font-bold italic uppercase tracking-widest">
                                            {typeof lastAlert.location === 'string' ? lastAlert.location : (lastAlert.location as any)?.name || 'UNKNOWN SECTOR'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex gap-3">
                                <Link 
                                    to={isAssignment ? `/work-orders?id=${lastAlert.id}` : `/assets`} 
                                    onClick={clearAlert}
                                    className={cn(
                                        "flex-1 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest italic text-center transition-all flex items-center justify-center gap-2 text-white",
                                        isAssignment ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-500"
                                    )}
                                >
                                    Inspect 
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <button 
                                    onClick={clearAlert}
                                    className="px-6 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl text-[12px] font-black uppercase tracking-widest italic transition-all"
                                >
                                    Acknowledge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
