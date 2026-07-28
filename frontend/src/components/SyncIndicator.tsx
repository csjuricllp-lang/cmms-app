import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useOfflineSync } from '../contexts/OfflineSyncContext';

export const SyncIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingChanges, syncNow } = useOfflineSync();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 animate-pulse">
        <CloudOff className="w-4 h-4" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Offline</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Syncing...</span>
      </div>
    );
  }

  if (pendingChanges > 0) {
    return (
      <button
        onClick={syncNow}
        className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 text-warning rounded-lg border border-warning/20 hover:bg-warning/20 transition-all group"
      >
        <AlertCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {pendingChanges} Pending {pendingChanges === 1 ? 'Change' : 'Changes'}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-lg border border-success/20 opacity-60 hover:opacity-100 transition-opacity">
      <Cloud className="w-4 h-4" />
      <span className="text-[11px] font-bold uppercase tracking-wider">Synced</span>
    </div>
  );
};
