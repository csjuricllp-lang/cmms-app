import React, { useState, useRef, useEffect } from 'react';
import { useWorkOrderDetail, useWorkOrders } from '../hooks/useWorkOrders';
import { useUsers, useParts } from '../hooks/useData';
import { 
  ChevronLeft, Calendar, MapPin, Box, Check, Clock, 
  Package, Camera, Send, FileSignature, 
  Trash2, RotateCcw, AlertTriangle, Loader2,
  Printer, X, Bookmark, Link, DollarSign, Edit3, MoreHorizontal,
  FileText, ExternalLink, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { HoldReasonModal } from '../components/HoldReasonModal';
import AddTimeModal from '../components/AddTimeModal';
import AddCostModal from '../components/AddCostModal';
import AddPartModal from '../components/AddPartModal';
import { AddSavedFileModal } from '../components/AddSavedFileModal';
import { DeferWorkOrderModal } from '../components/DeferWorkOrderModal';
import { EditWorkOrderModal } from '../components/EditWorkOrderModal';
import { LinkWorkOrderModal } from '../components/LinkWorkOrderModal';

const formatDuration = (hours: number) => {
  const totalSeconds = Math.round(hours * 3600);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  return `${hours.toFixed(1)}h`;
};

interface MobileWorkOrderDetailProps {
  id: string;
  onClose: () => void;
  asOverlay?: boolean;
}

export const MobileWorkOrderDetail: React.FC<MobileWorkOrderDetailProps> = ({ id, onClose, asOverlay = false }) => {
  const { data: order, isLoading } = useWorkOrderDetail(id);
  const { 
    updateStatus, 
    addTimeLog, 
    consumePart, 
    uploadFile, 
    removeFile, 
    addComment,
    startTimer,
    pauseTimer,
    toggleBookmark,
    updateWorkOrder,
    share,
    unshare,
    removeLink,
    deferWorkOrder,
    resumeWorkOrder
  } = useWorkOrders();

  const { data: usersData } = useUsers();
  const { data: partsData } = useParts();
  
  const users = (Array.isArray(usersData) ? usersData : (usersData as any)?.items || []) as any[];
  const parts = (Array.isArray(partsData) ? partsData : (partsData as any)?.items || []) as any[];

  const userLocal = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<string>('Overview');

  // Modal open states
  const [isAddTimeModalOpen, setIsAddTimeModalOpen] = useState(false);
  const [isAddCostModalOpen, setIsAddCostModalOpen] = useState(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isAddSavedFileModalOpen, setIsAddSavedFileModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDeferModalOpen, setIsDeferModalOpen] = useState(false);

  // Timer states
  const [elapsedTime, setElapsedTime] = useState<string>('');
  
  // Extract current userOrgId from token
  const currentUserOrgId = React.useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userOrgId || null;
    } catch (e) {
      return null;
    }
  }, []);

  // Find if there is an active running timer log for the current user
  const activeTimeLog = React.useMemo(() => {
    if (!order || !order.timeLogs || !currentUserOrgId) return null;
    return order.timeLogs.find((log: any) => log.userId === currentUserOrgId && !log.endTime) || null;
  }, [order?.timeLogs, currentUserOrgId]);

  useEffect(() => {
    if (!activeTimeLog || !activeTimeLog.startTime) {
      setElapsedTime('');
      return;
    }

    const updateTimer = () => {
      const start = new Date(activeTimeLog.startTime).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;

      if (diffMs < 0) {
        setElapsedTime('00:00:00');
        return;
      }

      const secs = Math.floor(diffMs / 1000) % 60;
      const mins = Math.floor(diffMs / (1000 * 60)) % 60;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));

      const pad = (num: number) => String(num).padStart(2, '0');
      setElapsedTime(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeTimeLog]);

  // Signature Pad Refs & States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Time logging states
  const [logHours, setLogHours] = useState(0);
  const [logMinutes, setLogMinutes] = useState(0);
  const [logCategory, setLogCategory] = useState('Wrench Time');
  const [logDescription, setLogDescription] = useState('');

  // Parts logging states
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);

  // Chat/Comment state
  const [newComment, setNewComment] = useState('');

  // Local Checklist Responses Cache
  const [localResponses, setLocalResponses] = useState<Record<string, string>>({});
  const [isHoldReasonModalOpen, setIsHoldReasonModalOpen] = useState(false);

  useEffect(() => {
    if (order?.checklistResponses) {
      const initial: Record<string, string> = {};
      order.checklistResponses.forEach((res: any) => {
        initial[res.checklistItemId] = res.responseValue;
      });
      setLocalResponses(initial);
    }
  }, [order]);

  // Touch Signature drawing logic
  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const startDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getTouchPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getTouchPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Initialize Canvas styles
  useEffect(() => {
    if (showCompleteForm && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [showCompleteForm]);

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Hydrating details...</span>
      </div>
    );
  }

  // Handle Checklist items updates
  const handleChecklistItemChange = async (itemId: string, value: string) => {
    setLocalResponses(prev => ({ ...prev, [itemId]: value }));
    try {
      await api.post(`/work-orders/${id}/checklist-responses`, {
        checklistItemId: itemId,
        responseValue: value,
      });
      toast.success('Task updated');
    } catch {
      toast.error('Offline queue: Task queued for sync');
    }
  };

  // Handle Log Time Submit
  const handleLogTime = async () => {
    const totalHours = Number(logHours) + (Number(logMinutes) / 60);
    if (totalHours <= 0) {
      toast.error('Duration must be greater than zero');
      return;
    }
    const currentWorker = users.find(u => u.userId === userLocal.id) || users[0];
    
    try {
      await addTimeLog.mutateAsync({
        workOrderId: id,
        data: {
          userId: currentWorker?.userOrgId || undefined,
          hoursLogged: totalHours,
          hourlyRate: currentWorker?.hourlyRate || 0,
          startTime: new Date().toISOString(),
          category: logCategory.toUpperCase().replace(' ', '_'),
          description: logDescription || 'Logged via mobile view'
        }
      });
      setLogHours(0);
      setLogMinutes(0);
      setLogDescription('');
    } catch {
      toast.error('Failed to log labor time');
    }
  };

  // Handle Log Part Submit
  const handleLogPart = async () => {
    if (!selectedPartId || partQty <= 0) {
      toast.error('Please select a part and valid quantity');
      return;
    }
    try {
      await consumePart.mutateAsync({
        workOrderId: id,
        partId: selectedPartId,
        quantity: partQty
      });
      setSelectedPartId('');
      setPartQty(1);
      toast.success('Part logged successfully');
    } catch {
      toast.error('Failed to log part usage');
    }
  };

  // Handle Sign-off Submit
  const handleCompleteWorkOrder = async () => {
    let signatureUrl = '';
    if (hasSignature && canvasRef.current) {
      signatureUrl = canvasRef.current.toDataURL();
    }

    try {
      await updateStatus.mutateAsync({
        id,
        status: 'COMPLETED',
        resolutionNotes,
        rootCauseCode: 'MAINTENANCE_COMPLETED',
        // Note: signature parameter matches endpoint
        signature: signatureUrl || undefined
      } as any);
      setShowCompleteForm(false);
      onClose();
      toast.success('Work Order Completed successfully!');
    } catch {
      toast.error('Failed to complete work order');
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await uploadFile.mutateAsync({ id, file });
        toast.success('Photo uploaded');
      } catch {
        toast.error('Offline queue: Photo queued for sync');
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment.mutateAsync({ workOrderId: id, text: newComment });
      setNewComment('');
      toast.success('Comment posted');
    } catch {
      toast.error('Failed to post comment');
    }
  };

  const content = (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <button 
          onClick={onClose}
          className="flex items-center gap-1 text-muted-foreground active:scale-95 transition-all py-1.5 pr-2 pl-1"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[12px] font-black uppercase tracking-widest">Back</span>
        </button>

        <span className="text-[14px] font-black tracking-widest italic uppercase">
          WO #{order.woNumber || id.slice(0, 5).toUpperCase()}
        </span>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="p-1.5 hover:text-primary active:scale-95 text-muted-foreground rounded-lg transition-all"
            title="Print Work Order"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:text-primary active:scale-95 text-muted-foreground rounded-lg transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Secondary Status & Action Row */}
      <div className="bg-card px-4 py-3 border-b border-white/5 flex flex-col gap-3">
        {(order as any).deferredUntilDate && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl">
            <span className="text-[12px] font-black text-orange-700 uppercase tracking-tight">
              Deferred to {new Date((order as any).deferredUntilDate).toLocaleDateString()}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          {/* Status selector */}
          <div className="relative">
            <select
              value={order.status?.toUpperCase().replace(' ', '_')}
              onChange={(e) => {
                const status = e.target.value;
                if (status === 'ON_HOLD') {
                  setIsHoldReasonModalOpen(true);
                } else {
                  updateStatus.mutate({ id, status }, {
                    onSuccess: () => {
                      toast.success(`Status updated to ${status}`);
                    }
                  });
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl text-[12px] font-black uppercase tracking-wider text-foreground outline-none cursor-pointer"
            >
              <option value="OPEN">🟢 OPEN</option>
              <option value="IN_PROGRESS">🔵 IN PROGRESS</option>
              <option value="ON_HOLD">🟡 ON HOLD</option>
              <option value="COMPLETED">⚫ COMPLETED</option>
            </select>
          </div>

          {/* Defer or Resume Action */}
          {(order as any).deferredUntilDate ? (
            <button 
              onClick={() => resumeWorkOrder.mutate(id)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Resume
            </button>
          ) : (
            <button 
              onClick={() => setIsDeferModalOpen(true)}
              className="px-4 py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
            >
              Defer
            </button>
          )}

          {/* Start/Stop Timer button */}
          <button
            onClick={async () => {
              if (activeTimeLog) {
                await pauseTimer.mutateAsync(id);
              } else {
                await startTimer.mutateAsync(id);
              }
            }}
            disabled={startTimer.isPending || pauseTimer.isPending}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-xl text-[12px] font-black transition-all shadow-sm active:scale-95 disabled:opacity-50",
              activeTimeLog 
                ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20" 
                : "bg-background border-border text-primary hover:bg-muted"
            )}
          >
            <Clock className={cn("w-3.5 h-3.5", activeTimeLog ? "text-rose-500 animate-spin" : "text-primary")} style={{ animationDuration: activeTimeLog ? '8s' : undefined }} />
            {activeTimeLog ? `Stop (${elapsedTime})` : 'Start Timer'}
          </button>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center justify-between px-1 text-muted-foreground border-t border-white/5 pt-2 mt-1">
          <button
            onClick={() => setIsAddTimeModalOpen(true)}
            className="p-2 hover:text-primary active:scale-95 rounded-lg transition-all flex flex-col items-center gap-1"
            title="Add Time"
          >
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Time</span>
          </button>

          <button
            onClick={() => setIsAddCostModalOpen(true)}
            className="p-2 hover:text-primary active:scale-95 rounded-lg transition-all flex flex-col items-center gap-1"
            title="Add Cost"
          >
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Cost</span>
          </button>

          <button
            onClick={() => setIsAddPartModalOpen(true)}
            className="p-2 hover:text-primary active:scale-95 rounded-lg transition-all flex flex-col items-center gap-1"
            title="Add Part"
          >
            <Package className="w-5 h-5 text-amber-500" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Part</span>
          </button>

          <button
            onClick={() => toggleBookmark.mutate({ id: order.id, isBookmarked: !order.isBookmarked })}
            className={cn(
              "p-2 active:scale-95 rounded-lg transition-all flex flex-col items-center gap-1",
              order.isBookmarked ? "text-yellow-500" : "hover:text-primary text-muted-foreground"
            )}
            title="Bookmark"
          >
            <Bookmark className={cn("w-5 h-5", order.isBookmarked && "fill-current")} />
            <span className="text-[9px] font-bold uppercase tracking-tight">Save</span>
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 hover:text-primary active:scale-95 rounded-lg transition-all flex flex-col items-center gap-1"
            title="Edit Detail"
          >
            <Edit3 className="w-5 h-5 text-blue-500" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Edit</span>
          </button>

          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="p-2 hover:text-primary active:scale-95 rounded-lg transition-all flex flex-col items-center gap-1"
            title="Link Work Order"
          >
            <Link className="w-5 h-5 text-indigo-500" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Link</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={cn(
                "p-2 active:scale-95 rounded-lg transition-all flex flex-col items-center gap-1",
                isMoreMenuOpen ? "text-primary bg-muted" : "hover:text-primary text-muted-foreground"
              )}
              title="More Actions"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-tight">More</span>
            </button>
            
            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-2 bg-background border border-border rounded-2xl shadow-2xl z-[80] py-2 w-48 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    window.print();
                  }}
                  className="w-full text-left px-4 py-3 text-[12px] font-bold text-foreground hover:bg-muted transition-all uppercase tracking-wider flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-muted-foreground" />
                  Print Mission
                </button>
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsHoldReasonModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-[12px] font-bold text-foreground hover:bg-muted transition-all uppercase tracking-wider flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Hold Reason
                </button>
                <button
                  onClick={async () => {
                    setIsMoreMenuOpen(false);
                    try {
                      const res = await share.mutateAsync(order.id);
                      const shareUrl = res?.data?.shareUrl || `${window.location.origin}/vendor-portal/${res?.data?.token}`;
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success("Share link copied!");
                    } catch {
                      toast.error("Failed to generate share link");
                    }
                  }}
                  className="w-full text-left px-4 py-3 text-[12px] font-bold text-foreground hover:bg-muted transition-all uppercase tracking-wider flex items-center gap-2"
                >
                  <Link className="w-4 h-4 text-indigo-500" />
                  Share Order
                </button>
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsAddSavedFileModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-[12px] font-bold text-foreground hover:bg-muted transition-all uppercase tracking-wider flex items-center gap-2"
                >
                  <Box className="w-4 h-4 text-primary" />
                  Add Saved File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Tabs */}
      <div className="flex border-b border-white/5 bg-card sticky top-[49px] z-40 overflow-x-auto scrollbar-hide flex-nowrap whitespace-nowrap">
        {[
          { id: 'Overview', label: 'Overview' },
          { id: 'Tasks', label: 'Tasks' },
          { id: 'Labor', label: 'Labor' },
          { id: 'Parts', label: 'Parts' },
          { id: 'Costs', label: 'Costs' },
          { id: 'Files', label: 'Files' },
          { id: 'Activity', label: 'Activity' },
          { id: 'Links', label: 'Links' },
          { id: 'Provider Portal', label: 'Provider Portal' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-5 py-3.5 text-[11px] font-black uppercase tracking-widest relative border-b-2 transition-colors shrink-0",
              activeTab === tab.id 
                ? "border-primary text-primary font-black" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'Overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-[18px] font-black uppercase tracking-tight mb-2">{order.title}</h2>
                {order.description && (
                  <p className="text-[14px] text-muted-foreground font-medium leading-relaxed bg-card border border-border p-4 rounded-2xl">
                    {order.description}
                  </p>
                )}
              </div>

              {/* Mission Metrics Summary (Mobile Friendly) */}
              <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Active Parts</p>
                    <p className="text-[16px] font-black text-foreground mt-1">{order.partsUsed?.length || 0}</p>
                  </div>
                  <div className="w-px h-8 bg-white/5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Mission Capital</p>
                    </div>
                    <p className="text-[16px] font-black text-foreground mt-1">
                      ${(
                        (order.partsUsed?.reduce((acc: number, p: any) => acc + Number(p.totalCost || 0), 0) || 0) +
                        (order.timeLogs?.reduce((acc: number, l: any) => acc + Number(l.totalCost || 0), 0) || 0) +
                        ((order as any).expenses?.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0) || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                <label className="cursor-pointer group shrink-0">
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handleCameraCapture}
                  />
                  <div className="w-12 h-12 border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all">
                    <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                </label>
              </div>

              {/* Specs Grid */}
              <div className="bg-card rounded-2xl border border-border p-4 space-y-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Box className="w-5 h-5 text-primary/75" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Asset</p>
                      <button className="text-[14px] font-black mt-1 text-primary hover:underline text-left">
                        {(order.asset as any)?.name || order.assetName || 'No Asset Assigned'}
                      </button>
                    </div>
                  </div>
                  {/* Asset status badge */}
                  <span className="px-3 py-1 bg-emerald-500/15 text-emerald-500 border border-emerald-500/10 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0">
                    {(order.asset as any)?.status || 'OPERATION'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-primary/75" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Priority</p>
                      <select
                        value={order.priority || 'MEDIUM'}
                        onChange={(e) => {
                          const priority = e.target.value;
                          updateWorkOrder.mutate({ id, data: { priority } }, {
                            onSuccess: () => {
                              toast.success(`Priority updated to ${priority}`);
                            }
                          });
                        }}
                        className="text-[14px] font-black mt-1 bg-transparent border-none text-primary uppercase outline-none cursor-pointer font-sans"
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary/75" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Sector Location</p>
                    <p className="text-[14px] font-black mt-1">{order.locationName || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary/75" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Deadline</p>
                    <p className="text-[14px] font-black mt-1">
                      {order.dueDate ? new Date(order.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Flexible'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Selector / Sign-Off button */}
              {order.status !== 'COMPLETED' && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowCompleteForm(true)}
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Sign-Off Work Order
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* 2. TASKS TAB */}
          {activeTab === 'Tasks' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="text-[16px] font-black uppercase tracking-tight mb-2">Protocol Tasks</h3>
              
              {order.checklist?.items?.length > 0 ? (
                <div className="space-y-3">
                  {order.checklist.items.map((item: any, index: number) => {
                    const response = localResponses[item.id] || 'Incomplete';
                    
                    return (
                      <div key={item.id} className="p-4 bg-card border border-border rounded-2xl space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-[14px] font-bold text-foreground leading-snug">
                            <span className="text-muted-foreground mr-1.5">{index + 1}.</span>
                            {item.task}
                          </h4>
                          {item.isRequired && (
                            <span className="text-[8px] bg-rose-500/15 text-rose-500 border border-rose-500/10 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider shrink-0">
                              Req
                            </span>
                          )}
                        </div>

                        {/* Input options based on type */}
                        <div className="relative">
                          {item.dataType === 'PASS_FAIL' || item.dataType === 'MULTIPLE_CHOICE' ? (
                            <select 
                              value={response}
                              onChange={(e) => handleChecklistItemChange(item.id, e.target.value)}
                              className="w-full h-11 bg-muted border border-border rounded-xl px-4 text-[13px] font-bold text-foreground outline-none cursor-pointer"
                            >
                              <option value="Incomplete">Incomplete</option>
                              <option value="Completed">Completed</option>
                              <option value="Pass">Pass</option>
                              <option value="Fail">Fail</option>
                              <option value="On Hold">On Hold</option>
                            </select>
                          ) : (
                            <input 
                              type="text"
                              value={response}
                              onChange={(e) => setLocalResponses(prev => ({ ...prev, [item.id]: e.target.value }))}
                              onBlur={(e) => handleChecklistItemChange(item.id, e.target.value)}
                              placeholder="Record reading value..."
                              className="w-full h-11 bg-muted border border-border rounded-xl px-4 text-[13px] font-bold text-foreground outline-none"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 border-2 border-dashed border-border rounded-3xl text-center flex flex-col items-center justify-center gap-2">
                  <AlertTriangle className="w-7 h-7 text-muted-foreground opacity-30" />
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">No active checklists</p>
                </div>
              )}
            </motion.div>
          )}

          {/* 3. LABOR TAB */}
          {activeTab === 'Labor' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-[16px] font-black uppercase tracking-tight">Labor Hours</h3>
                <button
                  onClick={() => setIsAddTimeModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Add Time
                </button>
              </div>

              <div className="space-y-3">
                {(order.timeLogs || []).map((log: any) => {
                  const workerName = log.user?.user?.name || log.user?.name || 'Technician';
                  const durationStr = formatDuration(Number(log.hoursLogged || 0));
                  const costVal = Number(log.totalCost || 0);
                  
                  return (
                    <div key={log.id} className="p-4 bg-card border border-border rounded-2xl flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-[14px] font-bold text-foreground">{workerName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          {log.startTime ? new Date(log.startTime).toLocaleDateString() : 'N/A'} • {log.category?.replace('_', ' ') || 'Wrench Time'}
                        </p>
                        {log.description && <p className="text-[11px] text-muted-foreground/80 mt-1 italic">"{log.description}"</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-black text-foreground">{durationStr}</p>
                        {costVal > 0 && <p className="text-[11px] text-emerald-500 font-bold mt-0.5">${costVal.toFixed(2)}</p>}
                      </div>
                    </div>
                  );
                })}

                {(!order.timeLogs || order.timeLogs.length === 0) && (
                  <div className="py-12 border border-border border-dashed rounded-3xl text-center text-muted-foreground/60 italic text-[12px] font-bold uppercase tracking-widest">
                    No labor hours logged yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 4. PARTS TAB */}
          {activeTab === 'Parts' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-[16px] font-black uppercase tracking-tight">Parts Consumed</h3>
                <button
                  onClick={() => setIsAddPartModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  Add Part
                </button>
              </div>

              <div className="space-y-3">
                {(order.partsUsed || []).map((part: any) => {
                  const unitCost = Number(part.unitCost || 0);
                  const qty = Number(part.quantity || 0);
                  const totalCost = Number(part.totalCost || unitCost * qty);
                  
                  return (
                    <div key={part.id} className="p-4 bg-card border border-border rounded-2xl flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-[14px] font-bold text-foreground">{part.part?.name || 'Unknown Part'}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          {part.part?.partNumber || 'No Ref'} • {part.part?.location?.name || 'No Location'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-black text-foreground">Qty: {qty}</p>
                        <p className="text-[11px] text-emerald-500 font-bold mt-0.5">${totalCost.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}

                {(!order.partsUsed || order.partsUsed.length === 0) && (
                  <div className="py-12 border border-border border-dashed rounded-3xl text-center text-muted-foreground/60 italic text-[12px] font-bold uppercase tracking-widest">
                    No parts consumed yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 5. COSTS TAB */}
          {activeTab === 'Costs' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-[16px] font-black uppercase tracking-tight">Mission Expenses</h3>
                <button
                  onClick={() => setIsAddCostModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Add Cost
                </button>
              </div>

              <div className="space-y-3">
                {((order as any).expenses || []).map((expense: any) => (
                  <div key={expense.id} className="p-4 bg-card border border-border rounded-2xl flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[14px] font-bold text-foreground">{expense.description || 'Miscellaneous Expense'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                        {new Date(expense.createdAt).toLocaleDateString()} • {expense.category || 'Mission Supply'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-black text-foreground">${Number(expense.amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}

                {(!((order as any).expenses) || (order as any).expenses.length === 0) && (
                  <div className="py-12 border border-border border-dashed rounded-3xl text-center text-muted-foreground/60 italic text-[12px] font-bold uppercase tracking-widest">
                    No additional expenses logged yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 6. FILES TAB */}
          {activeTab === 'Files' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-[16px] font-black uppercase tracking-tight">Documentation</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAddSavedFileModalOpen(true)}
                    className="px-3 py-2 bg-card border border-border text-muted-foreground text-[10px] font-black uppercase tracking-wider rounded-xl active:scale-95 transition-all"
                  >
                    From Saved
                  </button>
                  <label className="cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleCameraCapture}
                    />
                    <div className="px-3 py-2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider rounded-xl active:scale-95 transition-all flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Upload
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(order.files || []).map((file: any) => (
                  <div key={file.id} className="relative aspect-square rounded-2xl border border-border overflow-hidden bg-card flex flex-col justify-end group">
                    <a href={file.url} target="_blank" rel="noreferrer" className="absolute inset-0 z-0 flex items-center justify-center">
                      {file.mimeType?.startsWith('image/') ? (
                        <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground/50 p-2 text-center">
                          <FileText className="w-12 h-12 mb-1 text-primary" />
                          <span className="text-[10px] font-bold uppercase text-primary/80">Tap to Open</span>
                        </div>
                      )}
                    </a>
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-2.5 flex items-center justify-between gap-1.5 backdrop-blur-sm z-10">
                      <a href={file.url} target="_blank" rel="noreferrer" className="text-[11px] font-black text-white truncate flex-1 uppercase tracking-tight hover:underline flex items-center gap-1">
                        <span className="truncate">{file.filename}</span>
                      </a>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={file.url} target="_blank" rel="noreferrer" className="p-1 bg-slate-800 rounded text-blue-400">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete file?')) {
                              removeFile.mutate({ id, fileId: file.id });
                            }
                          }}
                          className="p-1 bg-slate-800 rounded text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {(!order.files || order.files.length === 0) && (
                  <div className="col-span-2 py-12 border border-border border-dashed rounded-3xl text-center text-muted-foreground/60 italic text-[12px] font-bold uppercase tracking-widest">
                    No files uploaded yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 7. ACTIVITY TAB */}
          {activeTab === 'Activity' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="text-[16px] font-black uppercase tracking-tight">Activity Feed</h3>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {/* Cornerstone event */}
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-black shrink-0 italic">
                    {(order as any).creator?.name?.[0] || 'S'}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {(order as any).creator?.name || 'System Agent'} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                    </p>
                    <p className="text-[13px] font-bold text-foreground mt-0.5">Mission Established: {order.title}</p>
                  </div>
                </div>

                {/* Status history */}
                {(order.statusHistory || []).map((history: any, idx: number) => (
                  <div key={`hist-${idx}`} className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-black text-slate-400 shrink-0 uppercase">
                      {history.user?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {history.user?.name || 'System Agent'} • {new Date(history.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[13px] font-bold text-foreground mt-0.5">
                        Status Changed: <span className="text-primary">{history.oldStatus || 'NONE'}</span> → <span className="text-emerald-500">{history.newStatus}</span>
                      </p>
                    </div>
                  </div>
                ))}

                {/* Comments */}
                {[...(order.comments || [])].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((comment: any, idx: number) => {
                  const initials = comment.user?.name ? comment.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'US';
                  const isSelf = comment.user?.userId === userLocal.id;

                  return (
                    <div 
                      key={`comment-${idx}`} 
                      className={cn(
                        "flex items-start gap-2.5 max-w-[85%] rounded-2xl p-3 text-[13px]",
                        isSelf 
                          ? "bg-primary text-primary-foreground ml-auto" 
                          : "bg-muted text-foreground"
                      )}
                    >
                      {!isSelf && (
                        <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          {initials}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[10px] opacity-60 leading-none mb-1">
                          {comment.user?.name || 'Worker'}
                        </p>
                        <p className="font-medium leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add comment */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post brief report or question..."
                  className="flex-1 h-11 bg-muted border border-border rounded-xl px-4 text-[13px] font-bold outline-none"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="w-11 h-11 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/10 active:scale-95 disabled:opacity-50 transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* 8. LINKS TAB */}
          {activeTab === 'Links' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="text-[16px] font-black uppercase tracking-tight">Mission Links</h3>
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Link className="w-3.5 h-3.5" />
                  Link Order
                </button>
              </div>

              <div className="space-y-3">
                {[...(order.linkedWorkOrders || []), ...(order.linkedFromOrders || [])].map((link: any) => {
                  const target = link.targetWorkOrder || link.sourceWorkOrder;
                  const isSource = !!link.targetWorkOrder;
                  return (
                    <div key={link.id} className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-[11px] font-black text-muted-foreground">
                          #{String(target.workOrderNo || '').padStart(3, '0')}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-foreground">{target.title}</p>
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">
                            {isSource ? `→ ${link.linkType || 'RELATED'}` : `← ${link.linkType || 'RELATED'}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Revoke this association?')) {
                            removeLink.mutate(link.id);
                          }
                        }}
                        className="p-2 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {(!order.linkedWorkOrders?.length && !order.linkedFromOrders?.length) && (
                  <div className="py-12 border border-border border-dashed rounded-3xl text-center text-muted-foreground/60 italic text-[12px] font-bold uppercase tracking-widest">
                    No work orders linked yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 9. PROVIDER PORTAL TAB */}
          {activeTab === 'Provider Portal' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h3 className="text-[16px] font-black uppercase tracking-tight">Provider Portal</h3>
                <div className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={order.isShared}
                    onChange={(e) => {
                      if (e.target.checked) share.mutate(order.id);
                      else unshare.mutate(order.id);
                    }}
                  />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </div>

              {order.isShared && order.shareToken && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl space-y-3">
                  <div>
                    <h4 className="text-[12px] font-black text-primary uppercase tracking-widest">Collaborator Access Link</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Share with external agents for secure updates.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-[12px] font-bold text-muted-foreground truncate shadow-inner">
                      {window.location.origin}/public/wo/{order.shareToken}
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/public/wo/${order.shareToken}`);
                        toast.success('Link copied!');
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 bg-card border border-border rounded-2xl text-center space-y-2">
                <h4 className="text-[14px] font-black text-foreground uppercase tracking-tight">Collaborate With Vendors</h4>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Assign a vendor to this Work Order to set up a live provider portal link. Vendors can view updates and upload files without needing a system account.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Signature & Sign-Off slide-up Dialog */}
      <AnimatePresence>
        {showCompleteForm && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompleteForm(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-card border-t border-border rounded-t-[32px] p-6 space-y-6 shadow-2xl z-10 pb-safe-bottom"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-black uppercase tracking-tight flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-emerald-500" />
                  Sign-Off Mission
                </h3>
                <button 
                  onClick={() => setShowCompleteForm(false)}
                  className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-[10px] font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Closeout Resolution Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Summarize changes, maintenance actions, or findings..."
                  className="w-full min-h-[90px] p-4 bg-muted border border-border rounded-2xl text-[14px] font-bold outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Draw Hand Signature</label>
                  {hasSignature && (
                    <button
                      onClick={clearSignature}
                      className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {/* Touch Signature Canvas */}
                <div className="border border-dashed border-border rounded-2xl overflow-hidden bg-muted h-[150px] relative">
                  <canvas
                    ref={canvasRef}
                    width={350}
                    height={150}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair touch-none"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/45 text-[11px] font-bold uppercase tracking-widest">
                      Sign with finger here
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleCompleteWorkOrder}
                disabled={!resolutionNotes.trim()}
                className={cn(
                  "w-full py-4 text-white rounded-xl text-[13px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50",
                  resolutionNotes.trim()
                    ? "bg-emerald-600 shadow-emerald-500/10"
                    : "bg-muted text-muted-foreground cursor-not-allowed border border-border shadow-none"
                )}
              >
                <Check className="w-4 h-4" />
                Submit Verification
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <HoldReasonModal
        isOpen={isHoldReasonModalOpen}
        onClose={() => setIsHoldReasonModalOpen(false)}
        onSubmit={(reason) => {
          updateStatus.mutate({ id, status: 'ON_HOLD', onHoldReason: reason }, {
            onSuccess: () => {
              toast.success(`Status updated to ON_HOLD`);
            }
          });
        }}
      />
      <DeferWorkOrderModal
        isOpen={isDeferModalOpen}
        onClose={() => setIsDeferModalOpen(false)}
        onSubmit={(data) => {
          deferWorkOrder.mutate({ id, data });
        }}
      />

      <AddTimeModal 
        isOpen={isAddTimeModalOpen} 
        onClose={() => setIsAddTimeModalOpen(false)} 
        workOrderId={order.id}
        defaultWorkerId={order.assignedToId}
      />

      <AddCostModal 
        isOpen={isAddCostModalOpen} 
        onClose={() => setIsAddCostModalOpen(false)} 
        workOrderId={order.id}
        defaultUserId={order.assignedToId}
      />

      <AddPartModal 
        isOpen={isAddPartModalOpen} 
        onClose={() => setIsAddPartModalOpen(false)} 
        workOrderId={order.id}
        onPartsAdded={() => setActiveTab('ACTIONS')}
      />

      <EditWorkOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        workOrder={order}
      />

      <LinkWorkOrderModal 
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        currentWorkOrder={order}
      />

      <AddSavedFileModal
        isOpen={isAddSavedFileModalOpen}
        onClose={() => setIsAddSavedFileModalOpen(false)}
        workOrderId={order.id}
      />
    </div>
  );

  if (asOverlay) {
    return (
      <div className="fixed inset-0 z-[500] bg-background overflow-y-auto">
        {content}
      </div>
    );
  }

  return content;
};
