import React from 'react';
import { useOfflineSync } from '../contexts/OfflineSyncContext';
import { CloudOff, RefreshCcw, Wifi, Database, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export const SyncStatus: React.FC = () => {
    const { isOnline, isSyncing, pendingChanges, mediaCount, dataCount, syncNow } = useOfflineSync();

    if (isOnline && pendingChanges === 0 && !isSyncing) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed top-6 right-[380px] z-[400]"
            >
                <div className={cn(
                    "flex items-center gap-4 px-5 py-3 rounded-[24px] border shadow-2xl backdrop-blur-xl transition-all duration-500",
                    isOnline 
                        ? "bg-[#0d0d10]/80 border-primary/20" 
                        : "bg-rose-500/10 border-rose-500/20"
                )}>
                    {/* Status Icon */}
                    <div className="relative">
                        {isSyncing ? (
                            <RefreshCcw className="w-5 h-5 text-primary animate-spin" />
                        ) : !isOnline ? (
                            <CloudOff className="w-5 h-5 text-rose-500 animate-pulse" />
                        ) : (
                            <Wifi className="w-5 h-5 text-emerald-500" />
                        )}
                        
                        {pendingChanges > 0 && !isSyncing && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-ping" />
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "text-[11px] font-black uppercase tracking-widest italic",
                                !isOnline ? "text-rose-500" : "text-white"
                            )}>
                                {isSyncing ? 'Synchronizing' : !isOnline ? 'Offline Mode' : 'Cloud Sync Staged'}
                            </span>
                        </div>
                        
                        {pendingChanges > 0 && (
                            <div className="flex items-center gap-3 mt-1 opacity-60">
                                {dataCount > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Database className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-bold text-white">{dataCount}</span>
                                    </div>
                                )}
                                {mediaCount > 0 && (
                                    <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                                        <ImageIcon className="w-3 h-3 text-blue-400" />
                                        <span className="text-[10px] font-bold text-white">{mediaCount}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    {isOnline && pendingChanges > 0 && !isSyncing && (
                        <button
                            onClick={() => syncNow()}
                            className="ml-2 px-4 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/20 rounded-xl text-[10px] font-black text-primary uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                        >
                            Sync Now
                        </button>
                    )}

                    {isSyncing && (
                        <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden ml-2">
                            <motion.div 
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
