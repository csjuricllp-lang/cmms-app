import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets, useMeters, useMeterReadings, useAddMeterReading } from '../hooks/useData';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { 
  ChevronLeft, Box, MapPin, Barcode, 
  Calendar, Settings, 
  FileText, Zap, Camera, Plus, Loader2, AlertCircle, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { PriorityBadge } from '../components/PriorityBadge';

interface MobileAssetDetailProps {
  id: string;
}

export const MobileAssetDetail: React.FC<MobileAssetDetailProps> = ({ id }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'INFO' | 'WORK_ORDERS' | 'METERS' | 'ACTIONS'>('INFO');

  // Fetch Data
  const { data: assets, isLoading: isAssetsLoading, refetch: refetchAssets } = useAssets();
  const asset = useMemo(() => assets?.find((a: any) => a.id === id), [assets, id]);

  const { workOrders, isLoading: isWOsLoading } = useWorkOrders({ assetId: id });
  
  // Meter states
  const { data: meters } = useMeters({ assetId: id });
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
  const selectedMeter = useMemo(() => meters?.find(m => m.id === (selectedMeterId || meters?.[0]?.id)), [meters, selectedMeterId]);
  const { data: readings, isLoading: isReadingsLoading } = useMeterReadings(selectedMeter?.id);
  const addMeterReading = useAddMeterReading();
  const [newReadingVal, setNewReadingVal] = useState<string>('');

  // Status mutation
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/assets/${id}`, { status: newStatus });
      await refetchAssets();
      toast.success(`Asset status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update asset status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Log Meter Reading
  const handleAddReading = async () => {
    if (!selectedMeter?.id || !newReadingVal.trim()) {
      toast.error('Please enter a reading value');
      return;
    }
    const val = Number(newReadingVal);
    if (isNaN(val)) {
      toast.error('Please enter a valid number');
      return;
    }

    try {
      await addMeterReading.mutateAsync({
        meterId: selectedMeter.id,
        value: val
      });
      setNewReadingVal('');
      toast.success('Reading logged successfully');
    } catch {
      toast.error('Failed to save reading');
    }
  };

  // Camera file upload
  const [isUploading, setIsUploading] = useState(false);
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/assets/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refetchAssets();
      toast.success('Photo uploaded and linked to asset');
    } catch {
      toast.error('Failed to upload asset photo');
    } finally {
      setIsUploading(false);
    }
  };

  if (isAssetsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Hydrating Asset Details...</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <span className="text-sm font-bold text-foreground uppercase tracking-widest">Asset Registry Error</span>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">The requested asset could not be resolved in the organization registry.</p>
        <button onClick={() => navigate('/assets')} className="text-primary font-black uppercase text-[12px] hover:underline mt-2">Back to registry</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-50 bg-background/85 backdrop-blur-md px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <button 
          onClick={() => navigate('/assets')}
          className="flex items-center gap-1 text-muted-foreground active:scale-95 transition-all py-1.5 pr-3 pl-1"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[12px] font-black uppercase tracking-widest">Registry</span>
        </button>

        <span className="text-[14px] font-black tracking-widest italic uppercase truncate max-w-[150px]">
          {asset.name}
        </span>

        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border shrink-0",
          asset.status === 'OPERATIONAL' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
          asset.status === 'DOWN' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
          asset.status === 'MAINTENANCE' ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
          "bg-blue-500/10 border-blue-500/20 text-blue-500"
        )}>
          {asset.status || 'OPERATIONAL'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-card sticky top-[49px] z-40">
        {[
          { id: 'INFO', label: 'Info' },
          { id: 'WORK_ORDERS', label: 'Jobs' },
          { id: 'METERS', label: 'Meters' },
          { id: 'ACTIONS', label: 'Actions' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 text-center py-3.5 text-[11px] font-black uppercase tracking-widest relative border-b-2 transition-colors",
              activeTab === tab.id 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Body */}
      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          {/* INFO TAB */}
          {activeTab === 'INFO' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Asset Main Image / Context */}
              <div className="w-full h-44 rounded-2xl border border-border overflow-hidden bg-card relative shadow-inner">
                {asset.imageUrl ? (
                  <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/35">
                    <Box className="w-10 h-10" />
                    <span className="text-[10px] font-black uppercase tracking-widest">No Visual Blueprint</span>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div className="space-y-3 bg-card border border-border p-4 rounded-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Modify Node State</h3>
                <div className="grid grid-cols-4 gap-1.5">
                  {['OPERATIONAL', 'DOWN', 'MAINTENANCE', 'STANDBY'].map((state) => (
                    <button
                      key={state}
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(state)}
                      className={cn(
                        "py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all active:scale-95",
                        asset.status?.toUpperCase() === state
                          ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/15"
                          : "bg-muted border-border text-muted-foreground"
                      )}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

              {/* Identity Parameters */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Identity Parameters</h3>
                <div className="bg-card rounded-2xl border border-border p-4 space-y-4 shadow-sm">
                  {[
                    { label: 'Asset Name', value: asset.name, icon: Box },
                    { label: 'Category', value: asset.category || 'General Machinery', icon: Settings },
                    { label: 'Sector Location', value: asset.location?.name || 'Mobile / Field', icon: MapPin },
                    { label: 'Barcode Ref', value: asset.barCode || 'Uncoded', icon: Barcode },
                    { label: 'Serial Number', value: asset.serialNumber || 'N/A', icon: FileText },
                    { label: 'Model Number', value: asset.model || 'N/A', icon: Settings },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <item.icon className="w-4.5 h-4.5 text-primary/75 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{item.label}</p>
                        <p className="text-[13px] font-black mt-1.5 truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Procurement & Depreciation */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Procurement Lifecycle</h3>
                <div className="bg-card rounded-2xl border border-border p-4 space-y-4 shadow-sm">
                  {[
                    { label: 'Purchase Price', value: asset.purchasePrice ? `$${Number(asset.purchasePrice).toLocaleString()}` : '$10,000.00' },
                    { label: 'Purchase Date', value: asset.purchaseDate ? format(new Date(asset.purchaseDate), 'MMMM d, yyyy') : 'June 30, 2015' },
                    { label: 'Residual Price', value: asset.residualValue ? `$${Number(asset.residualValue).toLocaleString()}` : '$1,000.00' },
                    { label: 'Expected Useful Life', value: asset.usefulLifeYears ? `${asset.usefulLifeYears} Years` : '10 Years' },
                    { label: 'Warranty Expiration', value: asset.warrantyExpiration ? format(new Date(asset.warrantyExpiration), 'MMMM d, yyyy') : 'May 11, 2026' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-0.5">
                      <span className="text-[12px] font-bold text-muted-foreground">{item.label}</span>
                      <span className="text-[13px] font-black text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* WORK ORDERS TAB */}
          {activeTab === 'WORK_ORDERS' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="text-[16px] font-black uppercase tracking-tight">Active Maintenance Jobs</h3>

              {isWOsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Hydrating jobs...</span>
                </div>
              ) : workOrders && workOrders.length > 0 ? (
                <div className="space-y-4">
                  {workOrders.map((wo: any) => (
                    <div 
                      key={wo.id}
                      onClick={() => navigate(`/work-orders?id=${wo.id}`)}
                      className="bg-card rounded-2xl border border-border p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all active:scale-[0.98] flex flex-col gap-2 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-bold text-muted-foreground border border-border uppercase tracking-wider">
                          #{String(wo.woNumber || wo.id.slice(0, 3)).padStart(3, '0')}
                        </span>
                        <PriorityBadge priority={wo.priority} />
                      </div>
                      <h4 className="text-[14px] font-black leading-tight text-foreground">{wo.title}</h4>
                      <div className="flex items-center justify-between text-muted-foreground text-[11px] font-bold mt-2">
                        <span className="uppercase tracking-widest">{wo.status}</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 opacity-65" />
                          <span>{wo.dueDate ? format(new Date(wo.dueDate), 'MM/dd/yy') : 'Flexible'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 border-2 border-dashed border-border rounded-3xl text-center flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="w-7 h-7 text-muted-foreground opacity-30" />
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">No maintenance protocols active</p>
                </div>
              )}
            </motion.div>
          )}

          {/* METERS TAB */}
          {activeTab === 'METERS' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {meters && meters.length > 0 ? (
                <>
                  {/* Select active meter */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Select Active Telemetry Meter</label>
                    <select
                      value={selectedMeterId || ''}
                      onChange={(e) => setSelectedMeterId(e.target.value)}
                      className="w-full h-11 bg-card border border-border rounded-xl px-4 text-[13px] font-bold text-foreground outline-none cursor-pointer"
                    >
                      {meters.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.unit || 'No unit'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Meter Quick Reading Input */}
                  <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <Zap className="w-4 h-4 text-primary" />
                      <h3 className="text-[13px] font-black uppercase tracking-widest text-foreground">Log Meter Value</h3>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        value={newReadingVal}
                        onChange={(e) => setNewReadingVal(e.target.value)}
                        placeholder={`Enter reading (${selectedMeter?.unit || ''})`}
                        className="flex-1 h-11 bg-muted border border-border rounded-xl px-4 text-[14px] font-bold outline-none"
                      />
                      <button
                        onClick={handleAddReading}
                        disabled={addMeterReading.isPending || !newReadingVal.trim()}
                        className="px-6 h-11 bg-primary text-primary-foreground text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/95 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        {addMeterReading.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Readings log list */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Recent Readings</h4>
                    
                    {isReadingsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      </div>
                    ) : readings && readings.length > 0 ? (
                      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-white/5 shadow-sm">
                        {readings.slice(0, 8).map((r: any) => (
                          <div key={r.id} className="p-4 flex items-center justify-between">
                            <div>
                              <span className="text-[15px] font-black text-foreground">{r.value}</span>
                              <span className="text-[12px] text-muted-foreground font-bold ml-1">{selectedMeter?.unit}</span>
                              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{r.user?.name || 'System'}</p>
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground">
                              {format(new Date(r.createdAt), 'MM/dd/yy - hh:mm a')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 border border-border border-dashed rounded-3xl text-center text-muted-foreground/45 text-[11px] font-bold uppercase tracking-widest">
                        No telemetry readings logged.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 border-2 border-dashed border-border rounded-3xl text-center flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="w-7 h-7 text-muted-foreground opacity-30" />
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">No telemetry meters linked</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ACTIONS TAB */}
          {activeTab === 'ACTIONS' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Media Capture (Camera Integration) */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Upload Asset Visuals</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer bg-card border border-border hover:border-primary/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-sm active:scale-95 transition-all">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" // Forces back camera on mobile
                      className="hidden" 
                      onChange={handleCameraCapture}
                      disabled={isUploading}
                    />
                    <Camera className="w-6 h-6 text-primary" />
                    <span className="text-[12px] font-black uppercase tracking-wider">Take Photo</span>
                  </label>
                  
                  <label className="cursor-pointer bg-card border border-border hover:border-primary/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-sm active:scale-95 transition-all">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCameraCapture}
                      disabled={isUploading}
                    />
                    <Box className="w-6 h-6 text-primary" />
                    <span className="text-[12px] font-black uppercase tracking-wider">Upload File</span>
                  </label>
                </div>

                {isUploading && (
                  <div className="flex items-center justify-center gap-2 py-2 text-[11px] font-bold uppercase text-muted-foreground tracking-widest animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Uploading asset visual...
                  </div>
                )}
              </div>

              {/* Maintenance triggers */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Protocol Actions</h3>
                <button
                  onClick={() => navigate('/work-orders')} // or create WO route
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Initiate Work Order
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
