import { 
    X, ChevronDown, DollarSign, Edit3, 
    MoreHorizontal, Plus, Clock, Package, Bookmark, Link, ImageIcon, Send,
    CheckCircle2, Circle, Type, FileText, 
    FileSignature, Barcode, Gauge, Trash2, Paperclip, Sparkles, Link2, Info,
    Check, RotateCcw, AlertTriangle, Printer, Copy
} from 'lucide-react';
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { type WorkOrderSync } from '../lib/db';
import { useWorkOrders, useWorkOrderDetail } from '../hooks/useWorkOrders';
import { CompletionWizard } from './CompletionWizard';
import { LOTOWizard } from './LOTOWizard';
import { ChecklistRenderer } from './ChecklistRenderer';
import AddTimeModal from './AddTimeModal';
import AddCostModal from './AddCostModal';
import AddPartModal from './AddPartModal';
import AddSavedFileModal from './AddSavedFileModal';
import { EditWorkOrderModal } from './EditWorkOrderModal';
import { LinkWorkOrderModal } from './LinkWorkOrderModal';
import { PartInspector } from './PartInspector';
import { HoldReasonModal } from './HoldReasonModal';

// Helper to format duration from hours logged decimal
const formatDuration = (hours: number) => {
    const totalSeconds = Math.round(hours * 3600);
    if (totalSeconds < 60) {
        return `${totalSeconds}s`;
    }
    const totalMinutes = Math.round(totalSeconds / 60);
    if (totalMinutes < 60) {
        return `${totalMinutes}m`;
    }
    const totalHours = hours;
    return `${totalHours.toFixed(1)}h`;
};

// Helper to format date-time as MM/DD/YY - hh:mm AM/PM
const formatDateTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const year = String(d.getFullYear()).slice(-2);
    
    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = pad(hours);
    
    return `${month}/${day}/${year} - ${hoursStr}:${minutes} ${ampm}`;
};

interface WorkOrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrder: WorkOrderSync;
    initialTab?: string;
    autoOpenLinkModal?: boolean;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({ isOpen, onClose, workOrder: shallowWorkOrder, initialTab, autoOpenLinkModal }) => {
    const { data: workOrder } = useWorkOrderDetail(shallowWorkOrder?.id || null);
    const displayOrder = workOrder || shallowWorkOrder;

    const [activeTab, setActiveTab] = useState(initialTab || 'Overview');
    const { 
        updateStatus, 
        completeLOTO, 
        addComment, 
        toggleBookmark, 
        uploadFile, 
        removeFile,
        share,
        unshare,
        removeLink,
        approveWorkOrder,
        reviewWorkOrder,
        startTimer,
        pauseTimer
    } = useWorkOrders();

    const [isEditingCloseoutNotes, setIsEditingCloseoutNotes] = useState(false);
    const [closeoutNotesValue, setCloseoutNotesValue] = useState('');
    const [isCompletionWizardOpen, setIsCompletionWizardOpen] = React.useState(false);
    const [isLOTOWizardOpen, setIsLOTOWizardOpen] = React.useState(false);
    const [isAddTimeModalOpen, setIsAddTimeModalOpen] = React.useState(false);
    const [isAddCostModalOpen, setIsAddCostModalOpen] = React.useState(false);
    const [isAddPartModalOpen, setIsAddPartModalOpen] = React.useState(false);
    const [isAddSavedFileModalOpen, setIsAddSavedFileModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(autoOpenLinkModal || false);
    const [newComment, setNewComment] = React.useState('');
    const [selectedPartForInspector, setSelectedPartForInspector] = useState<any | null>(null);
    const [isHoldReasonModalOpen, setIsHoldReasonModalOpen] = useState(false);

    const [elapsedTime, setElapsedTime] = useState<string>('');

    // Extract current user role from token
    const currentUserRole = React.useMemo(() => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role?.toUpperCase() || null;
        } catch (e) {
            return null;
        }
    }, []);

    const isManagerOrAdmin = ['ADMINISTRATOR', 'OWNER', 'MANAGER', 'ADMIN', 'LIMITED ADMINISTRATOR', 'MAINTENANCE MANAGER'].includes(currentUserRole || '');

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
        if (!displayOrder || !displayOrder.timeLogs || !currentUserOrgId) return null;
        return displayOrder.timeLogs.find((log: any) => log.userId === currentUserOrgId && !log.endTime) || null;
    }, [displayOrder?.timeLogs, currentUserOrgId]);

    React.useEffect(() => {
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

    React.useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    if (!isOpen || !displayOrder) return null;

    const order = displayOrder as WorkOrderSync;
    const isLocked = !!(order as any).signatureUrl || !!(order as any).signedById;
    const hasPhotos = !!(order.files && order.files.length > 0);
    const hasNotes = !!(order.resolutionNotes && order.resolutionNotes.trim().length > 0);
    const hasParts = !!(order.partsUsed && order.partsUsed.length > 0);
    const hasTime = !!((order.timeLogs && order.timeLogs.length > 0) || ((order as any).actualHours && (order as any).actualHours > 0));
    const hasChecklist = !!(order.tasks && order.tasks.length > 0);

    const handleApproval = (status: 'APPROVED' | 'REJECTED') => {
        let notes = undefined;
        if (status === 'REJECTED') {
            notes = window.prompt("Please provide a reason for rejection:");
            if (notes === null) return; // User cancelled
        }
        approveWorkOrder.mutate({ workOrderId: order.id, status, notes });
    };

    const handleReview = (status: 'CLOSED' | 'IN_PROGRESS') => {
        if (status === 'IN_PROGRESS') {
            const notes = window.prompt("Please provide a reason for returning this work order to the technician:");
            if (notes === null) return; // User cancelled
            reviewWorkOrder.mutate({ workOrderId: displayOrder.id, status, notes });
        } else {
            reviewWorkOrder.mutate({ workOrderId: displayOrder.id, status });
        }
    };

    const handleStatusUpdate = (newStatus: string) => {
        if (newStatus === 'COMPLETED') {
            setIsCompletionWizardOpen(true);
            return;
        }
        const currentStatusNormalized = displayOrder.status?.toUpperCase().replace(' ', '_');
        if (newStatus === 'ON_HOLD' && currentStatusNormalized === 'IN_PROGRESS') {
            setIsHoldReasonModalOpen(true);
            return;
        }
        updateStatus.mutate({ id: displayOrder.id, status: newStatus });
    };

    const handleCompletion = (data: { resolutionNotes: string; rcaCode: string; signature?: string }) => {
        updateStatus.mutate({ 
            id: displayOrder.id, 
            status: 'COMPLETED', 
            resolutionNotes: data.resolutionNotes,
            rootCauseCode: data.rcaCode,
            signatureUrl: data.signature
        });
        setIsCompletionWizardOpen(false);
    };

    const handleLOTOComplete = (data: { lockVerified: boolean; tagVerified: boolean; energyVerified: boolean }) => {
        completeLOTO.mutate({ workOrderId: displayOrder.id, data });
        setIsLOTOWizardOpen(false);
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        addComment.mutate({ workOrderId: displayOrder.id, text: newComment });
        setNewComment('');
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-4xl h-[85vh] max-h-[900px] bg-white shadow-2xl flex flex-col rounded-2xl animate-in zoom-in-95 duration-300 overflow-hidden ring-1 ring-black/5">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-7 border-b border-slate-50 bg-white sticky top-0 z-[60]">
                    <h2 className="text-[26px] font-[900] text-slate-950 tracking-tight flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="w-2.5 h-10 bg-blue-600 rounded-full shadow-lg shadow-blue-200" />
                            <span className="uppercase italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-950 to-slate-700">WO #{(displayOrder as any).workOrderNo || displayOrder.id.substring(0,3).toUpperCase()}</span>
                        </div>
                        {((displayOrder as any).request?.id || (displayOrder as any).requestId) && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm">
                                <span className="text-[12px] font-black text-indigo-700 uppercase tracking-widest italic">
                                    From REQ-{((displayOrder as any).request?.id || (displayOrder as any).requestId).split('-')[0].toUpperCase()}
                                </span>
                            </div>
                        )}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => window.print()}
                            className="p-2.5 hover:bg-blue-50 hover:text-blue-600 rounded-2xl text-slate-400 transition-all border border-transparent hover:border-blue-100 shadow-sm"
                            title="Export to PDF"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2.5 hover:bg-slate-100/50 rounded-2xl text-slate-500 transition-all hover:text-slate-900 hover:rotate-90"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    <div className="sticky top-0 z-[60] bg-white flex flex-col">
                        {order.status === 'PENDING_APPROVAL' && (
                            <div className="px-8 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-black text-amber-900 uppercase tracking-tight">Mission Approval Required</h4>
                                        <p className="text-[12px] font-bold text-amber-700/70">This work order requires manager sign-off before execution can commence.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        disabled={approveWorkOrder.isPending}
                                        onClick={() => handleApproval('REJECTED')}
                                        className="px-6 py-2.5 bg-white border border-amber-200 text-amber-700 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        disabled={approveWorkOrder.isPending}
                                        onClick={() => handleApproval('APPROVED')}
                                        className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                                    >
                                        {approveWorkOrder.isPending ? 'Processing...' : 'Approve Mission'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {(order.status === 'COMPLETED' || order.status === 'Complete' || order.status === 'COMPLETE') && isManagerOrAdmin && (
                            <div className="px-8 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-black text-emerald-900 uppercase tracking-tight">Manager Closeout Review</h4>
                                        <p className="text-[12px] font-bold text-emerald-700/70">Verify mission requirements before final closure.</p>
                                    </div>
                                    <div className="ml-6 flex items-center gap-4 hidden md:flex">
                                        <div className="flex items-center gap-1.5" title={hasPhotos ? "Photos attached" : "No photos attached"}>
                                            {hasPhotos ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                                            <span className={cn("text-[10px] font-black uppercase tracking-wider", hasPhotos ? "text-slate-700" : "text-slate-400 opacity-60")}>Photos</span>
                                        </div>
                                        <div className="flex items-center gap-1.5" title={hasNotes ? "Closeout notes documented" : "No closeout notes"}>
                                            {hasNotes ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                                            <span className={cn("text-[10px] font-black uppercase tracking-wider", hasNotes ? "text-slate-700" : "text-slate-400 opacity-60")}>Notes</span>
                                        </div>
                                        <div className="flex items-center gap-1.5" title={hasParts ? "Parts logged" : "No parts logged"}>
                                            {hasParts ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                                            <span className={cn("text-[10px] font-black uppercase tracking-wider", hasParts ? "text-slate-700" : "text-slate-400 opacity-60")}>Parts</span>
                                        </div>
                                        <div className="flex items-center gap-1.5" title={hasTime ? "Labor hours recorded" : "No time recorded"}>
                                            {hasTime ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                                            <span className={cn("text-[10px] font-black uppercase tracking-wider", hasTime ? "text-slate-700" : "text-slate-400 opacity-60")}>Time</span>
                                        </div>
                                        <div className="flex items-center gap-1.5" title={hasChecklist ? "Checklist tasks present" : "No checklist tasks"}>
                                            {hasChecklist ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
                                            <span className={cn("text-[10px] font-black uppercase tracking-wider", hasChecklist ? "text-slate-700" : "text-slate-400 opacity-60")}>Checklist</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        disabled={reviewWorkOrder.isPending}
                                        onClick={() => handleReview('IN_PROGRESS')}
                                        className="px-6 py-2.5 bg-white border border-rose-200 text-rose-700 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        Return to Tech
                                    </button>
                                    <button 
                                        disabled={reviewWorkOrder.isPending}
                                        onClick={() => handleReview('CLOSED')}
                                        className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        {reviewWorkOrder.isPending ? 'Processing...' : 'Approve & Close'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Action Bar */}
                        <div className="px-8 py-5 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4 md:gap-6">
                            {isLocked ? (
                                <div className="flex items-center gap-3 select-none">
                                    <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-black text-slate-500 cursor-not-allowed">
                                        <FileSignature className="w-4 h-4 text-slate-400" />
                                        <span className="uppercase tracking-tight">{displayOrder.status || 'Open'} (Signed)</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const reason = window.prompt('FDA 21 CFR Part 11: Enter audit reason to unlock and reopen this work order:');
                                            if (reason) {
                                                updateStatus.mutate({ id: displayOrder.id, status: 'IN_PROGRESS', reopenReason: reason } as any);
                                            }
                                        }}
                                        className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 border border-amber-300 text-white rounded-2xl text-[14px] font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Unlock to Edit
                                    </button>
                                </div>
                            ) : (
                                <div className="relative group/status dropdown">
                                    <button className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[14px] font-black text-slate-800 hover:border-blue-400 transition-all shadow-sm active:scale-95">
                                        <div className="w-4 h-4 rounded-full border-4 border-slate-100 border-t-blue-600" />
                                        <span className="uppercase tracking-tight">{displayOrder.status || 'Open'}</span>
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    </button>
                                    <div className="hidden group-focus-within/status:block absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-[70] py-2 w-48">
                                        {['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].map(status => (
                                            <button 
                                                key={status}
                                                onClick={() => handleStatusUpdate(status)}
                                                className="w-full text-left px-4 py-2 text-[14px] font-bold text-gray-600 hover:bg-slate-50 hover:text-primary transition-all uppercase"
                                            >
                                                {status.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
 
                            <div className="flex flex-wrap items-center gap-1 text-slate-500 border-l border-slate-100 pl-4 ml-2">
                                <div className="relative group/tooltip">
                                    <button 
                                        onClick={() => setIsAddTimeModalOpen(true)}
                                        className="p-2 hover:text-primary hover:bg-slate-50 rounded-lg transition-all outline-none"
                                    >
                                        <Clock className="w-5 h-5" />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-xl text-[12px] font-bold text-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-[100]">
                                        Add Time
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
                                    </div>
                                </div>
                                <div className="relative group/tooltip">
                                    <button 
                                        className="p-2 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
                                        onClick={() => setIsAddCostModalOpen(true)}
                                    >
                                        <DollarSign className="w-5 h-5" />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-xl text-[12px] font-bold text-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-[100]">
                                        Add Cost
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
                                    </div>
                                </div>

                                <div className="relative group/tooltip">
                                    <button 
                                        className="p-2 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
                                        onClick={() => setIsAddPartModalOpen(true)}
                                    >
                                        <Package className="w-5 h-5" />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-xl text-[12px] font-bold text-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-[100]">
                                        Add Part
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
                                    </div>
                                </div>

                                <div className="relative group/tooltip">
                                    <button 
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            order.isBookmarked ? "text-yellow-500 bg-yellow-50" : "hover:text-primary hover:bg-slate-50 text-slate-400"
                                        )}
                                        onClick={() => toggleBookmark.mutate({ id: order.id, isBookmarked: !order.isBookmarked })}
                                    >
                                        <Bookmark className={cn("w-5 h-5", order.isBookmarked && "fill-current")} />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-xl text-[12px] font-bold text-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-[100]">
                                        {order.isBookmarked ? 'Remove Bookmark' : 'Bookmark Mission'}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
                                    </div>
                                </div>

                                <div className="relative group/tooltip">
                                    <button 
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="p-2 hover:text-primary hover:bg-slate-50 rounded-lg transition-all"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-xl text-[12px] font-bold text-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-[100]">
                                        Edit Detail
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
                                    </div>
                                </div>

                                <div className="relative group/tooltip">
                                    <button 
                                        onClick={() => setIsLinkModalOpen(true)}
                                        className="p-2 hover:text-primary hover:bg-slate-50 text-slate-400 rounded-lg transition-all"
                                    >
                                        <Link className="w-5 h-5" />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-xl text-[12px] font-bold text-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-[100]">
                                        Link Work Order
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
                                    </div>
                                </div>

                                <div className="relative group/tooltip">
                                    <button className="p-2 hover:text-primary hover:bg-slate-50 rounded-lg transition-all">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-xl text-[12px] font-bold text-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-[100]">
                                        More Actions
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={async () => {
                                if (activeTimeLog) {
                                    await pauseTimer.mutateAsync(displayOrder.id);
                                } else {
                                    await startTimer.mutateAsync(displayOrder.id);
                                }
                            }}
                            disabled={startTimer.isPending || pauseTimer.isPending}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 border rounded-xl text-[14px] font-black transition-all shadow-sm group",
                                activeTimeLog 
                                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" 
                                    : "bg-white border-gray-200 text-blue-600 hover:bg-slate-50"
                            )}
                        >
                            <Clock className={cn("w-4 h-4", activeTimeLog ? "text-rose-500 animate-spin" : "text-blue-500")} style={{ animationDuration: activeTimeLog ? '8s' : undefined }} />
                            {activeTimeLog ? `Stop Timer (${elapsedTime})` : 'Start Timer'}
                        </button>
                    </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="px-8 border-b border-gray-50 flex items-center gap-8 bg-white sticky top-[84px] z-[40] overflow-x-auto scrollbar-hide">
                        {['Overview', 'Tasks', 'Labor', 'Parts', 'Costs', 'Files', 'Activity', 'Links', 'Provider Portal'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "pb-5 pt-5 text-[14px] font-black transition-all relative whitespace-nowrap uppercase tracking-widest",
                                    activeTab === tab ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-full shadow-lg shadow-blue-200" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Mission Metrics Summary */}
                    <div className="px-8 py-7 border-b border-gray-50 flex flex-wrap items-center justify-between bg-white gap-4">
                        <div className="flex flex-wrap items-center gap-6 md:gap-14">
                            <div className="space-y-1">
                                <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Active Parts</p>
                                <p className="text-[18px] font-black text-slate-950">{order.partsUsed?.length || 0}</p>
                            </div>
                            <div className="w-px h-10 bg-slate-100" />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Mission Capital</p>
                                    <Info className="w-4 h-4 text-blue-400" />
                                </div>
                                <p className="text-[18px] font-black text-slate-950">
                                    ${(
                                        (order.partsUsed?.reduce((acc: number, p: any) => acc + Number(p.totalCost || 0), 0) || 0) +
                                        (order.timeLogs?.reduce((acc: number, l: any) => acc + Number(l.totalCost || 0), 0) || 0) +
                                        ((order as any).expenses?.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0) || 0)
                                    ).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <label className="cursor-pointer group">
                            <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        uploadFile.mutate({ id: displayOrder.id, file });
                                    }
                                }}
                            />
                            <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-[22px] flex items-center justify-center text-slate-300 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
                                 <ImageIcon className="w-7 h-7 group-hover:scale-110 transition-transform" />
                            </div>
                        </label>
                    </div>


                    <div className="p-8">
                        {activeTab === 'Overview' && (
                            <div className="bg-white rounded-3xl animate-in fade-in zoom-in duration-500">
                                <div className="space-y-8">
                                    {displayOrder.description && (
                                        <div className="space-y-4">
                                            <h3 className="text-[17px] font-[900] text-slate-800 tracking-tight uppercase italic underline decoration-blue-500/30 underline-offset-8 decoration-4">Mission Intelligence</h3>
                                            <p className="text-[15px] text-slate-500 leading-relaxed max-w-2xl font-medium">
                                                {displayOrder.description}
                                            </p>
                                            <div className="h-px bg-gray-100 w-full pt-4" />
                                        </div>
                                    )}

                                    {/* Details Grid */}
                                    <div className="space-y-7">
                                        <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-1 md:gap-0 items-center">
                                            <span className="text-[15px] font-bold text-slate-500">Asset</span>
                                            <div className="flex items-center justify-between">
                                                <button className="text-[15px] font-extrabold text-blue-600 hover:underline text-left">
                                                    {(order.asset as any)?.name || order.assetName || 'No Asset Assigned'}
                                                </button>
                                                <select className="px-5 py-2 border border-gray-100 rounded-xl text-[13px] font-black uppercase tracking-widest text-emerald-600 bg-white outline-none cursor-pointer hover:border-blue-100 transition-all">
                                                    <option>{(order.asset as any)?.status || 'Operation'}</option>
                                                    <option>Down</option>
                                                    <option>Limited</option>
                                                </select>
                                            </div>
                                        </div>

                                        {((order as any).request?.id || (order as any).requestId) && (
                                            <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-1 md:gap-0 items-center">
                                                <span className="text-[15px] font-bold text-slate-500">Originated From</span>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-[13px] font-black text-indigo-700 uppercase tracking-widest italic shadow-sm">
                                                        Request REQ-{((order as any).request?.id || (order as any).requestId).split('-')[0].toUpperCase()}
                                                    </span>
                                                    {((order as any).request?.guestName || (order as any).request?.requester?.user?.name) && (
                                                        <span className="text-[13px] font-medium text-slate-600">
                                                            by {((order as any).request?.guestName || (order as any).request?.requester?.user?.name)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-1 md:gap-0 items-center">
                                            <span className="text-[15px] font-bold text-slate-500">Priority</span>
                                            <div className="relative group w-fit">
                                                <div className="flex items-center gap-3 px-4 py-1.5 rounded-lg bg-slate-50 border border-slate-100 transition-all cursor-pointer hover:border-blue-200">
                                                    <span className="text-[13px] font-black text-slate-700 uppercase tracking-widest">{order.priority || 'MEDIUM'}</span>
                                                    <ChevronDown className="w-4 h-4 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-1 md:gap-0 items-start">
                                            <span className="text-[15px] font-bold text-slate-500 mt-2">Closeout Notes</span>
                                            <div className="relative group">
                                                {!isEditingCloseoutNotes ? (
                                                    <div className="flex items-center justify-between min-h-[44px]">
                                                        <span className="text-[15px] font-bold text-slate-700 opacity-60 italic py-2">
                                                            {order.resolutionNotes || 'No notes archived for this mission.'}
                                                        </span>
                                                        <button 
                                                            onClick={() => {
                                                                setIsEditingCloseoutNotes(true);
                                                                setCloseoutNotesValue(order.resolutionNotes || '');
                                                            }}
                                                            className="p-2.5 hover:bg-blue-50 rounded-2xl text-blue-500 hover:text-blue-600 transition-all ml-4 shadow-sm bg-white border border-blue-50"
                                                        >
                                                            <Edit3 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="relative flex items-start gap-3">
                                                                <textarea 
                                                                    autoFocus
                                                                    value={closeoutNotesValue}
                                                                    onChange={(e) => setCloseoutNotesValue(e.target.value)}
                                                                    className="w-full min-h-[120px] p-4 bg-white border-2 border-blue-500 rounded-2xl text-[15px] font-bold text-slate-800 outline-none shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all resize-none"
                                                                    placeholder="Transmit mission reconciliation intelligence..."
                                                                />
                                                                <button 
                                                                    disabled={updateStatus.isPending}
                                                                    onClick={() => {
                                                                        updateStatus.mutate({ id: order.id, status: order.status, resolutionNotes: closeoutNotesValue });
                                                                        setIsEditingCloseoutNotes(false);
                                                                    }}
                                                                    className="w-10 h-10 bg-white border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                                >
                                                                    <Check className="w-5 h-5 text-emerald-600" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setIsEditingCloseoutNotes(false)}
                                                                    className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                                                >
                                                                    <RotateCcw className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-black uppercase tracking-widest italic hover:scale-105 transition-all shadow-lg shadow-blue-200">
                                                                Auto-generate summary
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {(order as any).signatureUrl && (
                                            <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-1 md:gap-0 items-start">
                                                <span className="text-[15px] font-bold text-slate-500 mt-2">Technician Sign-off</span>
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block w-fit">
                                                    <img src={(order as any).signatureUrl} alt="Technician Signature" className="max-h-24 object-contain rounded-lg bg-white p-2 border border-slate-100 shadow-sm" />
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Verified Digital Signature</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-1 md:gap-0 items-center">
                                            <span className="text-[15px] font-bold text-slate-400">Created</span>
                                            <p className="text-[15px] font-bold text-slate-700">
                                                <span className="font-black opacity-40">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} 
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span> by <button className="text-blue-600 font-extrabold hover:underline italic">{(order as any).creator?.name || 'System Agent'}</button>
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-1 md:gap-0 items-center">
                                            <span className="text-[15px] font-bold text-slate-400">Last Updated</span>
                                            <p className="text-[15px] font-bold text-slate-700">
                                                <span className="font-black opacity-40">
                                                    {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} 
                                                    {order.updatedAt ? new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-1 md:gap-0 items-center">
                                            <span className="text-[15px] font-bold text-slate-400">Due Date</span>
                                            <p className="text-[15px] font-bold text-slate-700">
                                                {order.dueDate ? (
                                                    <span className="font-black opacity-40">{new Date(order.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {new Date(order.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                ) : (
                                                    <span className="italic text-slate-300">No Deadline Established</span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-1 md:gap-0 items-center">
                                            <span className="text-[15px] font-bold text-slate-400">Primary Assignee</span>
                                            <button className="text-[15px] font-black uppercase tracking-tight text-blue-600 hover:underline w-fit italic">
                                                {(order.assignedTo as any)?.user?.name || 'Mission Pending Assignment'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Mission Tasks section */}
                                    <div className="pt-10 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[18px] font-black italic uppercase tracking-tight text-slate-800">Mission Tasks</h3>
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-blue-100">
                                                {order.tasks?.length || 0} Protocols
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            {(order.tasks || []).map((task: any, idx: number) => (
                                                <div key={`task-view-${idx}`} className={cn(
                                                    "p-6 rounded-[24px] border transition-all flex items-center justify-between group",
                                                    task.status === 'COMPLETED' ? "bg-emerald-50/30 border-emerald-100" : "bg-slate-50 border-slate-100 hover:border-blue-100"
                                                )}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                            task.status === 'COMPLETED' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-white border border-slate-200 text-slate-300"
                                                        )}>
                                                            {task.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-md border-2 border-slate-200" />}
                                                        </div>
                                                        <div>
                                                            <p className={cn("text-[15px] font-bold italic transition-all", task.status === 'COMPLETED' ? "text-emerald-700 line-through opacity-50" : "text-slate-700 uppercase tracking-tight")}>
                                                                {task.text}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.type || 'Inspection'}</span>
                                                                {task.isRequired && <span className="text-[8px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded font-black uppercase tracking-widest border border-red-100">Required</span>}
                                                            </div>
                                                            {/* Requirement Indicators */}
                                                            <div className="flex items-center gap-1.5 mt-2">
                                                                {task.requirements?.notes && <div className="p-1 bg-blue-50 text-blue-500 rounded-md border border-blue-100" title="Notes Required"><Type className="w-3 h-3" /></div>}
                                                                {task.requirements?.photo && <div className="p-1 bg-blue-50 text-blue-500 rounded-md border border-blue-100" title="Photo Required"><ImageIcon className="w-3 h-3" /></div>}
                                                                {task.requirements?.url && <div className="p-1 bg-blue-50 text-blue-500 rounded-md border border-blue-100" title="Link Required"><Link className="w-3 h-3" /></div>}
                                                                {task.requirements?.reading && <div className="p-1 bg-blue-50 text-blue-500 rounded-md border border-blue-100" title="Reading Required"><Gauge className="w-3 h-3" /></div>}
                                                                {task.requirements?.signature && <div className="p-1 bg-blue-50 text-blue-500 rounded-md border border-blue-100" title="Signature Required"><FileSignature className="w-3 h-3" /></div>}
                                                                {task.requirements?.barcode && <div className="p-1 bg-blue-50 text-blue-500 rounded-md border border-blue-100" title="Barcode Required"><Barcode className="w-3 h-3" /></div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!order.tasks || order.tasks.length === 0) && (
                                                <div className="p-10 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
                                                    <p className="text-[13px] font-bold text-slate-400 italic uppercase tracking-widest opacity-60">No protocols currently active for this mission.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Parts Consumed Section */}
                                    {order.partsUsed && order.partsUsed.length > 0 && (
                                        <div className="pt-10 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[18px] font-black italic uppercase tracking-tight text-slate-800">Parts Consumed</h3>
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-blue-100">
                                                    {order.partsUsed.length} Line Item{order.partsUsed.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            <div className="w-full border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 bg-slate-50/20">
                                                            <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800">Name</th>
                                                            <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800">Status</th>
                                                            <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800">Cost</th>
                                                            <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800">Quantity</th>
                                                            <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800">Total Cost</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {order.partsUsed.map((part: any) => {
                                                            const unitCost = Number(part.unitCost || 0);
                                                            const qty = Number(part.quantity || 0);
                                                            const totalCost = Number(part.totalCost || unitCost * qty);
                                                            const locationName = part.part?.location?.name || 'No Location';
                                                            const rawStatus = part.part?.status || (part.part?.quantity > (part.part?.minQuantity || 5) ? 'In stock' : 'Non-stock');

                                                            return (
                                                                <tr 
                                                                    key={part.id} 
                                                                    onClick={() => setSelectedPartForInspector(part.part)}
                                                                    className="hover:bg-slate-50/20 transition-all cursor-pointer group/row"
                                                                >
                                                                    <td className="px-6 py-5">
                                                                        <div className="flex flex-col">
                                                                            <span 
                                                                                className="text-[15px] font-bold text-blue-600 group-hover/row:underline text-left w-fit"
                                                                            >
                                                                                {part.part?.name || 'Unknown Part'}
                                                                            </span>
                                                                            <span className="text-[12px] text-slate-400 font-bold mt-1">
                                                                                {locationName}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-5">
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-md text-[13px] font-bold bg-slate-100/70 text-slate-600">
                                                                            {rawStatus}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-5 text-[15px] font-bold text-slate-700">
                                                                        ${unitCost.toFixed(2)}
                                                                    </td>
                                                                    <td className="px-6 py-5 text-[15px] font-bold text-slate-700">
                                                                        {qty}
                                                                    </td>
                                                                    <td className="px-6 py-5 text-[15px] font-bold text-slate-700">
                                                                        ${totalCost.toFixed(2)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="flex justify-end items-center gap-3 pr-6 pt-2">
                                                <span className="text-[18px] font-black text-slate-800">Total:</span>
                                                <span className="text-[18px] font-black text-slate-900">
                                                    ${order.partsUsed.reduce((acc: number, part: any) => {
                                                        const unitCost = Number(part.unitCost || 0);
                                                        const qty = Number(part.quantity || 0);
                                                        const totalCost = Number(part.totalCost || unitCost * qty);
                                                        return acc + totalCost;
                                                    }, 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Documentation Section */}
                                    <div className="pt-10 space-y-6 pb-20">
                                        <h3 className="text-[18px] font-black italic uppercase tracking-tight text-slate-800">Documentation & Reference</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[13px] font-black uppercase tracking-widest text-slate-700">Reference Media</span>
                                                </div>
                                                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                                    {(order.files || []).map((file: any) => (
                                                        <a 
                                                            key={file.id} 
                                                            href={file.url} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            title={file.filename}
                                                            className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex-shrink-0 overflow-hidden hover:border-blue-500 hover:scale-105 transition-all flex items-center justify-center relative group/media shadow-sm"
                                                        >
                                                            {file.mimeType?.startsWith('image/') ? (
                                                                <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center text-blue-500 p-1">
                                                                    <FileText className="w-6 h-6" />
                                                                    <span className="text-[7px] font-black uppercase truncate max-w-[56px] text-slate-500 mt-0.5">{file.filename}</span>
                                                                </div>
                                                            )}
                                                        </a>
                                                    ))}
                                                    {(!order.files || order.files.length === 0) && <div className="text-[11px] font-bold text-slate-400 italic">No media transmitted.</div>}
                                                </div>
                                            </div>

                                            <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                        <DollarSign className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[13px] font-black uppercase tracking-widest text-slate-700">Procurement</span>
                                                </div>
                                                <p className="text-[14px] font-bold text-slate-600">
                                                    {order.purchaseOrderId ? `Linked PO Ref: ${order.purchaseOrderId}` : 'No PO Link Reconciliation Required'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Tasks' && (
                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                <ChecklistRenderer workOrder={order} />
                            </div>
                        )}

                        {activeTab === 'Labor' && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-end pr-2">
                                    <button 
                                        className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white text-slate-800 rounded-xl text-[14px] font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                        onClick={() => setIsAddTimeModalOpen(true)}
                                    >
                                        <Clock className="w-5 h-5 text-slate-800" />
                                        Add Time
                                    </button>
                                </div>

                                <div className="w-full border border-slate-100 rounded-2xl bg-white shadow-sm overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Worker</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Start Date</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Duration</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Hourly Rate</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Cost</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Date Created</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Created By</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Record Type</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Add to Total Cost</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider">Add to Total Time</th>
                                                <th className="px-6 py-4 text-[13px] font-black text-slate-600 uppercase tracking-wider"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(order.timeLogs || []).map((log: any) => {
                                                const workerName = log.user?.user?.name || 'Technician';
                                                const initial = workerName.charAt(0).toUpperCase();
                                                const recordType = log.description === 'Automated Log (Clock-In)' ? 'Timer' : 'Manual';
                                                
                                                // Formatting rates and costs
                                                const rateVal = Number(log.hourlyRate || 0);
                                                const costVal = Number(log.totalCost || 0);
                                                const rateStr = rateVal > 0 ? `$${rateVal.toFixed(2)}` : 'N/A';
                                                const costStr = costVal > 0 ? `$${costVal.toFixed(2)}` : 'N/A';
                                                
                                                // Format duration
                                                const durationStr = formatDuration(Number(log.hoursLogged || 0));
                                                
                                                // Category display (e.g. "Other T..." for "Other Time")
                                                const categoryRaw = log.category || 'N/A';
                                                const categoryStr = categoryRaw.length > 7 ? categoryRaw.substring(0, 7) + '...' : categoryRaw;

                                                return (
                                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                        {/* Worker */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[13px] font-black text-slate-700 uppercase">
                                                                    {initial}
                                                                </div>
                                                                <span className="text-[14px] font-bold text-slate-800">{workerName}</span>
                                                            </div>
                                                        </td>
                                                        {/* Start Date */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-600">
                                                            {log.startTime ? formatDateTime(log.startTime) : 'N/A'}
                                                        </td>
                                                        {/* Duration */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-600">
                                                            {durationStr}
                                                        </td>
                                                        {/* Hourly Rate */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-600">
                                                            {rateStr}
                                                        </td>
                                                        {/* Cost */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-600">
                                                            {costStr}
                                                        </td>
                                                        {/* Category */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-600" title={categoryRaw}>
                                                            {categoryStr}
                                                        </td>
                                                        {/* Date Created */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-600">
                                                            {log.createdAt ? formatDateTime(log.createdAt) : 'N/A'}
                                                        </td>
                                                        {/* Created By */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[13px] font-black text-slate-700 uppercase">
                                                                    {initial}
                                                                </div>
                                                                <span className="text-[14px] font-bold text-slate-800">{workerName}</span>
                                                            </div>
                                                        </td>
                                                        {/* Record Type */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-600">
                                                            {recordType}
                                                        </td>
                                                        {/* Add to Total Cost */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-600">
                                                            Yes
                                                        </td>
                                                        {/* Add to Total Time */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium text-slate-600">
                                                            Yes
                                                        </td>
                                                        {/* Actions */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <button 
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(`${workerName} - ${durationStr} - ${categoryRaw}`);
                                                                        toast.success('Log details copied to clipboard');
                                                                    }}
                                                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                                                    title="Copy Log Details"
                                                                >
                                                                    <Copy className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                                                </button>
                                                                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                                                    <MoreHorizontal className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {(!order.timeLogs || order.timeLogs.length === 0) && (
                                                <tr>
                                                    <td colSpan={12} className="px-6 py-12 text-center text-[14px] font-medium text-slate-400 italic">
                                                        No labor hours logged yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Parts' && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-end gap-3">
                                    <button 
                                        onClick={() => setIsAddPartModalOpen(true)}
                                        className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[14px] font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => setIsAddPartModalOpen(true)}
                                        className="flex items-center gap-2 px-5 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-[14px] font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-slate-700">
                                            <path d="M12 3l8 4.5v9l-8 4.5-8-4.5v-9z" />
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M16 16h5M18.5 13.5v5" />
                                        </svg>
                                        Add Parts
                                    </button>
                                </div>

                                <div className="w-full border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/20">
                                                <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800">Name</th>
                                                <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800">Status</th>
                                                <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800">Cost</th>
                                                <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800">Quantity</th>
                                                <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800">Total Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(order.partsUsed || []).map((part: any) => {
                                                const unitCost = Number(part.unitCost || 0);
                                                const qty = Number(part.quantity || 0);
                                                const totalCost = Number(part.totalCost || unitCost * qty);
                                                const locationName = part.part?.location?.name || 'No Location';
                                                const rawStatus = part.part?.status || (part.part?.quantity > (part.part?.minQuantity || 5) ? 'In stock' : 'Non-stock');

                                                return (
                                                    <tr 
                                                        key={part.id} 
                                                        onClick={() => setSelectedPartForInspector(part.part)}
                                                        className="hover:bg-slate-50/20 transition-all cursor-pointer group/row"
                                                    >
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span 
                                                                    className="text-[15px] font-bold text-blue-600 group-hover/row:underline text-left w-fit"
                                                                >
                                                                    {part.part?.name || 'Unknown Part'}
                                                                </span>
                                                                <span className="text-[12px] text-slate-400 font-bold mt-1">
                                                                    {locationName}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-md text-[13px] font-bold bg-slate-100/70 text-slate-600">
                                                                {rawStatus}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-[15px] font-bold text-slate-700">
                                                            ${unitCost.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-5 text-[15px] font-bold text-slate-700">
                                                            {qty}
                                                        </td>
                                                        <td className="px-6 py-5 text-[15px] font-bold text-slate-700">
                                                            ${totalCost.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {(!order.partsUsed || order.partsUsed.length === 0) && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-16 text-center text-[14px] font-bold text-slate-400 italic">
                                                        No parts consumed on this mission yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end items-center gap-3 pr-6 pt-4">
                                    <span className="text-[18px] font-black text-slate-800">Total:</span>
                                    <span className="text-[18px] font-black text-slate-900">
                                        ${(order.partsUsed || []).reduce((acc: number, part: any) => {
                                            const unitCost = Number(part.unitCost || 0);
                                            const qty = Number(part.quantity || 0);
                                            const totalCost = Number(part.totalCost || unitCost * qty);
                                            return acc + totalCost;
                                        }, 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                        {activeTab === 'Costs' && (
                            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                                <div className="flex items-center justify-between px-2">
                                    <div className="space-y-1">
                                        <h3 className="text-[20px] font-black italic uppercase tracking-tight">Technical Expenses</h3>
                                        <p className="text-[12px] text-muted-foreground font-bold italic opacity-60">Reconcile additional mission costs and procurement totals.</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsAddCostModalOpen(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest italic hover:scale-105 transition-all shadow-lg shadow-primary/20"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Cost
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {((displayOrder as any).expenses || []).map((expense: any) => (
                                        <div key={expense.id} className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-between group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                                    <DollarSign className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[15px] font-black italic text-foreground uppercase tracking-tight">{expense.description || 'Miscellaneous Expense'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">{new Date(expense.createdAt).toLocaleDateString()} • {expense.category || 'Mission Supply'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[18px] font-black italic text-foreground tracking-tighter">${Number(expense.amount || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {((displayOrder as any).expenses || []).length === 0 && (
                                        <div className="py-20 border-2 border-dashed border-slate-100 rounded-[48px] flex flex-col items-center justify-center text-center bg-slate-50/20">
                                            <div className="w-16 h-16 rounded-[24px] bg-white shadow-sm flex items-center justify-center mb-6">
                                                <DollarSign className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <p className="text-[14px] font-black uppercase tracking-widest text-slate-300 italic mb-1">No Additional Expenses Logged</p>
                                            <p className="text-[11px] font-bold text-slate-400 opacity-60">Track procurement costs outside of standard parts and labor.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Files' && (
                            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                                <div className="flex items-center justify-between px-2">
                                    <div className="space-y-1">
                                        <h3 className="text-[20px] font-black italic uppercase tracking-tight">Mission Documentation</h3>
                                        <p className="text-[12px] text-muted-foreground font-bold italic opacity-60">Manage technical blueprints, site photos, and completion media.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setIsAddSavedFileModalOpen(true)}
                                            className="px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest italic hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            Add from Saved Files
                                        </button>
                                        <label className="cursor-pointer">
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        uploadFile.mutate({ id: displayOrder.id, file });
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest italic hover:scale-105 transition-all shadow-lg shadow-primary/20">
                                                <Plus className="w-4 h-4" />
                                                Upload Media
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(order.files || []).map((file: any) => (
                                        <div key={file.id} className="relative group/file p-4 bg-white border border-slate-100 rounded-[32px] hover:border-blue-200 transition-all shadow-sm">
                                            <div className="aspect-[4/3] rounded-[24px] bg-slate-50 border border-slate-100 overflow-hidden mb-4 relative">
                                                {file.mimeType?.startsWith('image/') ? (
                                                    <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <FileText className="w-12 h-12" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/file:opacity-100 transition-all flex items-center justify-center gap-3">
                                                    <a 
                                                        href={file.url} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all active:scale-95"
                                                    >
                                                        <ImageIcon className="w-5 h-5" />
                                                    </a>
                                                    <button 
                                                        onClick={() => removeFile.mutate({ id: displayOrder.id, fileId: file.id })}
                                                        className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white hover:bg-rose-600 transition-all active:scale-95"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="px-2">
                                                <p className="text-[14px] font-black italic text-slate-800 truncate uppercase tracking-tight">{file.filename}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {(!order.files || order.files.length === 0) && (
                                        <div className="col-span-full py-20 border-2 border-dashed border-slate-100 rounded-[48px] flex flex-col items-center justify-center text-center bg-slate-50/20">
                                            <div className="w-16 h-16 rounded-[24px] bg-white shadow-sm flex items-center justify-center mb-6">
                                                <ImageIcon className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <p className="text-[14px] font-black uppercase tracking-widest text-slate-300 italic mb-1">No Mission Media Transmitted</p>
                                            <p className="text-[11px] font-bold text-slate-400 opacity-60">Upload site photos or technical manuals for this mission.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Links' && (
                            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-[24px] font-black text-slate-800 tracking-tight">Links</h3>
                                    <button 
                                        onClick={() => setIsLinkModalOpen(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[16px] font-bold hover:bg-slate-50 transition-all shadow-sm group"
                                    >
                                        <Link2 className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        Link Work Orders
                                    </button>
                                </div>

                                {((order.linkedWorkOrders || []).length === 0 && (order.linkedFromOrders || []).length === 0) ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-40">
                                        <p className="text-[14px] font-bold text-slate-400 italic">No work orders linked</p>
                                    </div>
                                ) : (
                                    /* Active Links Details - Only show if links exist */
                                    <div className="space-y-6 pt-6 border-t border-slate-50">
                                        <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-widest italic px-2">Established Dependencies</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[...(order.linkedWorkOrders || []), ...(order.linkedFromOrders || [])].map((link: any) => {
                                                const target = link.targetWorkOrder || link.sourceWorkOrder;
                                                const isSource = !!link.targetWorkOrder;
                                                return (
                                                    <div key={link.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group/link-item hover:border-blue-200 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[12px] font-black text-slate-400">
                                                                #{String(target.workOrderNo || '').padStart(3, '0')}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[13px] font-black text-slate-800 truncate">{target.title}</p>
                                                                <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">
                                                                    {isSource ? `→ ${link.linkType || 'RELATED'}` : `← ${link.linkType || 'RELATED'}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                if(confirm('Are you sure you want to revoke this mission association?')) {
                                                                    removeLink.mutate(link.id);
                                                                }
                                                            }}
                                                            className="p-2 opacity-0 group-hover/link-item:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Activity' && (
                            <div className="flex flex-col animate-in slide-in-from-bottom-4 duration-500">
                                {/* Activity List */}
                                <div className="space-y-8 pb-[240px]">
                                    {/* Mission Established Cornerstone */}
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[12px] font-black text-white shrink-0 italic">
                                            {(displayOrder as any).creator?.name?.[0] || 'S'}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight italic underline decoration-blue-500/20 underline-offset-4">{(displayOrder as any).creator?.name || 'System Agent'}</span>
                                                <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{displayOrder.createdAt ? new Date(displayOrder.createdAt).toLocaleString() : ''}</span>
                                            </div>
                                            <p className="text-[14px] font-bold text-slate-500 italic">Mission Established: {displayOrder.title}</p>
                                        </div>
                                    </div>

                                    {/* Dynamic Status History */}
                                    {(order.statusHistory || []).map((history: any, idx: number) => (
                                        <div key={`hist-${idx}`} className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[14px] font-black text-slate-400 shrink-0 uppercase">
                                                {history.user?.name?.[0] || 'U'}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[15px] font-black text-slate-800">{history.user?.name || 'System Agent'}</span>
                                                    <span className="text-[12px] font-bold text-slate-400">{new Date(history.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-[15px] font-bold text-slate-600">Work Order Status Changed: <span className="text-primary">{history.oldStatus || 'NONE'}</span> → <span className="text-emerald-500">{history.newStatus}</span></p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Comments */}
                                    {[...(order.comments || [])].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((comment: any, idx: number) => (
                                        <div key={`comment-${idx}`} className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[14px] font-black text-slate-400 shrink-0 uppercase">
                                                {comment.user?.name?.[0] || 'U'}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[15px] font-black text-slate-800">{comment.user?.name || 'Unknown Agent'}</span>
                                                    <span className="text-[12px] font-bold text-slate-400">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-[15px] font-bold text-slate-600 leading-relaxed">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Message Input */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100">
                                    <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/50 transition-all">
                                        <textarea 
                                            className="w-full pl-6 pr-12 pt-5 pb-16 bg-transparent text-[15px] font-bold text-slate-800 outline-none resize-none min-h-[120px]"
                                            placeholder="Write a message..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddComment();
                                                }
                                            }}
                                        />
                                        <div className="absolute bottom-4 left-4 flex items-center gap-4">
                                            <button className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-all">
                                                <Paperclip className="w-5 h-5" />
                                            </button>
                                            <button className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-all">
                                                <Sparkles className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={handleAddComment}
                                            disabled={!newComment.trim()}
                                            className="absolute bottom-4 right-4 p-2 bg-transparent text-slate-300 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-300 transition-all active:scale-90"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'Provider Portal' && (
                            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                                <div className="flex items-center justify-between px-2">
                                    <div className="space-y-1">
                                        <h3 className="text-[20px] font-black italic uppercase tracking-tight text-slate-800">Provider Portal</h3>
                                        <p className="text-[15px] font-bold text-slate-500">Create a public link for this Work Order.</p>
                                    </div>
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
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </div>
                                </div>

                                {order.isShared && order.shareToken && (
                                    <div className="p-8 bg-blue-50 border border-blue-100 rounded-[32px] space-y-4 animate-in fade-in slide-in-from-top-4">
                                        <div className="space-y-1">
                                            <h4 className="text-[15px] font-black text-blue-800 uppercase tracking-widest italic">Mission Access Link Established</h4>
                                            <p className="text-[13px] font-bold text-blue-600/60">Share this link with external agents for secure collaboration.</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 px-5 py-3 bg-white border border-blue-200 rounded-2xl text-[14px] font-bold text-slate-600 truncate shadow-inner">
                                                {window.location.origin}/public/wo/{order.shareToken}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/public/wo/${order.shareToken}`);
                                                    toast.success('Link copied to mission clipboard.');
                                                }}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                                            >
                                                Copy Link
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="p-20 bg-white border border-slate-100 rounded-[32px] shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                                    <h4 className="text-[18px] font-black text-slate-800">Keep Vendors in the Loop</h4>
                                    <div className="space-y-1 max-w-md">
                                        <p className="text-[14px] font-bold text-slate-400">Assign a vendor to this Work Order to create the provider portal.</p>
                                        <p className="text-[14px] font-bold text-slate-400">They'll be able to track updates and stay connected—no extra accounts needed.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CompletionWizard
                isOpen={isCompletionWizardOpen}
                onClose={() => setIsCompletionWizardOpen(false)}
                onComplete={handleCompletion}
                workOrderTitle={displayOrder.title}
            />

            <LOTOWizard 
                isOpen={isLOTOWizardOpen} 
                onClose={() => setIsLOTOWizardOpen(false)} 
                onComplete={handleLOTOComplete} 
                workOrderTitle={displayOrder.title}
            />

            <AddTimeModal 
                isOpen={isAddTimeModalOpen} 
                onClose={() => setIsAddTimeModalOpen(false)} 
                workOrderId={displayOrder.id}
                defaultWorkerId={displayOrder.assignedToId}
            />

            <AddCostModal 
                isOpen={isAddCostModalOpen} 
                onClose={() => setIsAddCostModalOpen(false)} 
                workOrderId={displayOrder.id}
                defaultUserId={displayOrder.assignedToId}
            />

            <AddPartModal 
                isOpen={isAddPartModalOpen} 
                onClose={() => setIsAddPartModalOpen(false)} 
                workOrderId={displayOrder.id}
                onPartsAdded={() => setActiveTab('Parts')}
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
                workOrderId={displayOrder.id}
            />

            <AnimatePresence>
                {selectedPartForInspector && (
                    <PartInspector
                        part={selectedPartForInspector}
                        onClose={() => setSelectedPartForInspector(null)}
                    />
                )}
            </AnimatePresence>
            <HoldReasonModal
                isOpen={isHoldReasonModalOpen}
                onClose={() => setIsHoldReasonModalOpen(false)}
                onSubmit={(reason) => {
                    updateStatus.mutate({ id: displayOrder.id, status: 'ON_HOLD', onHoldReason: reason });
                }}
            />
        </div>
    );
};
