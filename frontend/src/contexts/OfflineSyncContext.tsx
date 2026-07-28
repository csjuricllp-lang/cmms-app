import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db } from '../lib/db';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface OfflineSyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  mediaCount: number;
  dataCount: number;
  syncNow: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);
  const [dataCount, setDataCount] = useState(0);

  // Monitor Network Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Count pending changes
  const updatePendingCount = useCallback(async () => {
    const dirtyWOs = await db.workOrders.where('isDirty').equals(1).count();
    const queueItems = await db.syncQueue.count();
    const mCount = await db.mediaQueue.count();
    const dCount = dirtyWOs + queueItems;
    
    setDataCount(dCount);
    setMediaCount(mCount);
    setPendingChanges(dCount + mCount);
  }, []);

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  const [syncRetryCount, setSyncRetryCount] = useState(0);

  // Sync Logic
  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      const dirtyWOs = await db.workOrders.where('isDirty').equals(1).toArray();
      const queueItems = await db.syncQueue.toArray();
      const mediaItems = await db.mediaQueue.toArray();

      if (dirtyWOs.length === 0 && queueItems.length === 0 && mediaItems.length === 0) return;

      setIsSyncing(true);
      
      // 1. Process Data Sync
      if (dirtyWOs.length > 0 || queueItems.length > 0) {
        const payload = [
            ...dirtyWOs.map(wo => ({
            entity: 'work-order',
            action: wo.isNew ? 'CREATE' : 'UPDATE',
            data: wo,
            timestamp: Date.now()
            })),
            ...queueItems.map(item => ({
            entity: item.entity,
            action: item.action,
            data: item.payload,
            timestamp: item.timestamp
            }))
        ];

        await api.post('/sync/push', payload);

        await db.transaction('rw', db.workOrders, db.syncQueue, async () => {
            for (const wo of dirtyWOs) {
            await db.workOrders.update(wo.id, { isDirty: 0, isNew: 0 });
            }
            await db.syncQueue.clear();
        });
      }

      // 2. Process Media Sync (Optimized: Load one-by-one to prevent OOM on mobile)
      const mediaIds = await db.mediaQueue.toCollection().primaryKeys();
      
      for (const id of mediaIds) {
        const item = await db.mediaQueue.get(id);
        if (!item) continue;

        const formData = new FormData();
        formData.append('file', item.file, item.fileName);
        
        if (item.workOrderId) {
            formData.append('entityType', 'WorkOrder');
            formData.append('entityId', item.workOrderId);
        } else if (item.requestId) {
            formData.append('entityType', 'Request');
            formData.append('entityId', item.requestId);
        } else if (item.pmScheduleId) {
            formData.append('entityType', 'PMSchedule');
            formData.append('entityId', item.pmScheduleId);
        }

        const endpoint = '/files/offline-queue';

        if (endpoint) {
            try {
                await api.post(endpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                await db.mediaQueue.delete(id);
                // Update count after each success
                setMediaCount(prev => Math.max(0, prev - 1));
            } catch (error: any) {
                if (error.response?.status === 401) {
                    console.error("Sync Auth Failure: Stopping queue");
                    return; // Stop processing if unauthorized
                }
                throw error; // Re-throw to trigger backoff
            }
        }
      }

      setPendingChanges(0);
      setSyncRetryCount(0); // Reset on success
      toast.success('Offline data and media synced successfully');
    } catch (error: any) {
      if (error.response?.status === 401) return; // Silent on auth error (handled above)
      
      console.error('Sync failed:', error);
      setSyncRetryCount(prev => prev + 1);
      
      // Exponential backoff
      const delay = Math.min(Math.pow(2, syncRetryCount) * 1000, 60000);
      const jitter = Math.random() * 1000;
      
      setTimeout(() => syncNow(), delay + jitter);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, syncRetryCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncNow();
    }
  }, [isOnline, syncNow]);

  return (
    <OfflineSyncContext.Provider value={{ isOnline, isSyncing, pendingChanges, mediaCount, dataCount, syncNow }}>
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext);
  if (context === undefined) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
};
