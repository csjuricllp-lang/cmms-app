import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, Plus, MapPin, Box, Paperclip, Send, X, Check, XCircle, AlertCircle, MessageSquare, SlidersHorizontal, ChevronDown, ArrowUpDown, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { PriorityBadge } from '../components/PriorityBadge';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import type { Asset, Location, User } from '../types';

interface MobileRequestsProps {
    requests: any[];
    locations: Location[];
    assets: Asset[];
    categories: any[];
    users: User[];
    teams: any[];
    checklists: any[];
    isLoading: boolean;
    createRequest: any;
    approveRequest: any;
    rejectRequest: any;
    updateRequest: any;
    fieldSettings: any;
    formTasks: any[];
    taskResponses: Record<string, boolean>;
    toggleTaskResponse: (id: string) => void;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    requestComments: Record<string, any[]>;
    setRequestComments: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
    setView: (view: 'registry' | 'settings') => void;
    visibleColumns: any;
    setVisibleColumns: any;
    onExportCSV: () => void;
}

export const MobileRequests: React.FC<MobileRequestsProps> = ({
    requests,
    locations,
    assets,
    categories = [],
    users,
    teams,
    checklists,
    isLoading,
    createRequest,
    approveRequest,
    rejectRequest,
    updateRequest,
    fieldSettings = {},
    formTasks = [],
    taskResponses,
    toggleTaskResponse,
    selectedFile,
    setSelectedFile,
    requestComments,
    setRequestComments,
    setView,
    visibleColumns,
    setVisibleColumns,
    onExportCSV
}) => {
    // Actions menu and Multi-select states
    const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
    const [isColumnsOpen, setIsColumnsOpen] = useState(false);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);

    // Tab filtering state
    const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
    const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('ALL');
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isLocationFilterOpen, setIsLocationFilterOpen] = useState(false);
    // Sort state
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isSortOpen, setIsSortOpen] = useState(false);
    
    // UI Drawer states
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [detailSubTab, setDetailSubTab] = useState<'overview' | 'comments'>('overview');

    // Create Request Form State
    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        priority: 'NONE',
        locationId: '',
        assetId: '',
    });

    // Detail Form State (for editing / approval options)
    const [detailTitle, setDetailTitle] = useState('');
    const [detailDescription, setDetailDescription] = useState('');
    const [detailPriority, setDetailPriority] = useState('NONE');
    const [detailLocationId, setDetailLocationId] = useState('');
    const [detailAssetId, setDetailAssetId] = useState('');
    const [detailPrimaryWorkerId, setDetailPrimaryWorkerId] = useState('');
    const [detailTeamId, setDetailTeamId] = useState('');
    const [detailChecklistId, setDetailChecklistId] = useState('');
    const [detailEstimatedDuration, setDetailEstimatedDuration] = useState('');
    const [detailSignatureRequired, setDetailSignatureRequired] = useState(false);
    const [detailImageUrl, setDetailImageUrl] = useState('');
    const [detailCategory, setDetailCategory] = useState('');
    const [detailStartDate, setDetailStartDate] = useState('');
    const [detailStartTime, setDetailStartTime] = useState('');
    const [detailDueDate, setDetailDueDate] = useState('');
    const [detailDueTime, setDetailDueTime] = useState('');
    const [chatMessage, setChatMessage] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const selectedRequest = useMemo(() => {
        return requests.find(r => r.id === selectedRequestId);
    }, [requests, selectedRequestId]);

    const isReadOnly = selectedRequest?.status === 'APPROVED' || selectedRequest?.status === 'REJECTED';

    // Populate detail form state when selecting a request
    useEffect(() => {
        if (selectedRequest) {
            setDetailTitle(selectedRequest.title || '');
            setDetailDescription(selectedRequest.description || '');
            setDetailPriority(selectedRequest.priority || 'NONE');
            
            const startStr = selectedRequest.startDate || '';
            setDetailStartDate(startStr ? startStr.split('T')[0] : '');
            setDetailStartTime(startStr ? startStr.split('T')[1]?.slice(0, 5) : '');

            const dueStr = selectedRequest.dueDate || selectedRequest.workOrder?.dueDate || '';
            setDetailDueDate(dueStr ? dueStr.split('T')[0] : '');
            setDetailDueTime(dueStr ? dueStr.split('T')[1]?.slice(0, 5) : '');

            setDetailLocationId(selectedRequest.locationId || '');
            setDetailAssetId(selectedRequest.assetId || '');
            setDetailPrimaryWorkerId(selectedRequest.workOrder?.assignedToId || '');
            setDetailTeamId(selectedRequest.workOrder?.assignedTeamId || '');
            setDetailChecklistId(selectedRequest.workOrder?.checklistId || '');
            setDetailEstimatedDuration(selectedRequest.estimatedDuration || '');
            setDetailSignatureRequired(selectedRequest.signatureRequired || false);
            setDetailImageUrl(selectedRequest.imageUrl || '');
            setDetailCategory(selectedRequest.category || '');
            setChatMessage('');
        }
    }, [selectedRequest]);

    // Helpers
    const getInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
    };

    const getMergedISOString = (dateStr: string, timeStr: string) => {
        if (!dateStr) return undefined;
        const d = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
        return !isNaN(d.getTime()) ? d.toISOString() : undefined;
    };

    const PRIORITY_WEIGHTS: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'title': return 'Title';
            case 'asset': return 'Asset';
            case 'category': return 'Category';
            case 'priority': return 'Priority';
            default: return 'Submitted Date';
        }
    };

    // Filter requests
    const filteredRequests = useMemo(() => {
        let list = [...requests];
        
        // Tab Status Filter
        if (activeTab !== 'ALL') {
            list = list.filter(r => r.status?.toUpperCase() === activeTab);
        }

        // Priority Filter
        if (selectedPriorityFilter !== 'ALL') {
            list = list.filter(r => (r.priority || 'NONE').toUpperCase() === selectedPriorityFilter);
        }

        // Location Filter
        if (selectedLocationFilter !== 'ALL') {
            list = list.filter(r => r.locationId === selectedLocationFilter);
        }

        // Assignee Filter
        if (selectedAssigneeIds.length > 0) {
            list = list.filter(r => {
                const woAssigneeId = r.workOrder?.assignedToId || r.workOrder?.assignedTo?.userOrgId;
                return woAssigneeId && selectedAssigneeIds.includes(woAssigneeId);
            });
        }

        // Asset Filter
        if (selectedAssetIds.length > 0) {
            list = list.filter(r => r.assetId && selectedAssetIds.includes(r.assetId));
        }
        
        // Search Term Filter
        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            list = list.filter(r => 
                (r.title || '').toLowerCase().includes(query) ||
                (r.description || '').toLowerCase().includes(query) ||
                (r.asset?.name || '').toLowerCase().includes(query) ||
                (r.location?.name || '').toLowerCase().includes(query) ||
                (r.requester?.user?.name || r.guestName || '').toLowerCase().includes(query)
            );
        }
        
        // Sort
        list.sort((a, b) => {
            let valA: any, valB: any;
            switch (sortBy) {
                case 'title':
                    valA = (a.title || '').toLowerCase();
                    valB = (b.title || '').toLowerCase();
                    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                case 'asset':
                    valA = (a.asset?.name || '').toLowerCase();
                    valB = (b.asset?.name || '').toLowerCase();
                    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                case 'category':
                    valA = (a.category || '').toLowerCase();
                    valB = (b.category || '').toLowerCase();
                    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                case 'priority':
                    valA = PRIORITY_WEIGHTS[(a.priority || 'NONE').toUpperCase()] ?? 0;
                    valB = PRIORITY_WEIGHTS[(b.priority || 'NONE').toUpperCase()] ?? 0;
                    return sortOrder === 'desc' ? valB - valA : valA - valB;
                default: // createdAt
                    valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return sortOrder === 'desc' ? valB - valA : valA - valB;
            }
        });

        return list;
    }, [requests, activeTab, searchTerm, selectedPriorityFilter, selectedLocationFilter, selectedAssigneeIds, selectedAssetIds, sortBy, sortOrder]);

    // Handlers
    const handleCreateRequest = () => {
        if (fieldSettings.title?.create === 'Required' && !createForm.title.trim()) {
            toast.error('Title is required');
            return;
        }
        if (fieldSettings.description?.create === 'Required' && !createForm.description.trim()) {
            toast.error('Description is required');
            return;
        }
        if (fieldSettings.location?.create === 'Required' && !createForm.locationId) {
            toast.error('Operational Location is required');
            return;
        }
        if (fieldSettings.asset?.create === 'Required' && !createForm.assetId) {
            toast.error('Asset is required');
            return;
        }

        createRequest.mutate(createForm, {
            onSuccess: () => {
                setIsCreateDrawerOpen(false);
                setCreateForm({
                    title: '',
                    description: '',
                    priority: 'NONE',
                    locationId: '',
                    assetId: '',
                });
                setSelectedFile(null);
            }
        });
    };

    const handleSendComment = () => {
        if (!chatMessage.trim() || !selectedRequestId) return;
        
        const newComment = {
            id: Math.random().toString(36).substr(2, 9),
            text: chatMessage.trim(),
            sender: 'You',
            timestamp: new Date()
        };

        setRequestComments(prev => ({
            ...prev,
            [selectedRequestId]: [...(prev[selectedRequestId] || []), newComment]
        }));
        setChatMessage('');
    };

    const handleSaveRequestOnly = () => {
        if (!selectedRequestId) return;
        updateRequest.mutate({
            id: selectedRequestId,
            title: detailTitle,
            description: detailDescription,
            priority: detailPriority,
            locationId: detailLocationId || null,
            assetId: detailAssetId || null
        }, {
            onSuccess: () => {
                setIsDetailDrawerOpen(false);
            }
        });
    };

    const handleApproveRequest = async () => {
        if (!selectedRequestId) return;

        // Validation checks for Required fields during Approval
        if (fieldSettings.title?.approve === 'Required' && !detailTitle.trim()) {
            toast.error('Title is required');
            return;
        }
        if (fieldSettings.description?.approve === 'Required' && !detailDescription.trim()) {
            toast.error('Description is required');
            return;
        }
        if (fieldSettings.priority?.approve === 'Required' && (!detailPriority || detailPriority === 'NONE')) {
            toast.error('Priority is required');
            return;
        }
        if (fieldSettings.location?.approve === 'Required' && !detailLocationId) {
            toast.error('Location is required');
            return;
        }
        if (fieldSettings.asset?.approve === 'Required' && !detailAssetId) {
            toast.error('Asset is required');
            return;
        }
        if (fieldSettings.category?.approve === 'Required' && !detailCategory) {
            toast.error('Category is required');
            return;
        }
        if (fieldSettings.worker?.approve === 'Required' && !detailPrimaryWorkerId) {
            toast.error('Primary Worker is required');
            return;
        }
        if (fieldSettings.team?.approve === 'Required' && !detailTeamId) {
            toast.error('Team assignment is required');
            return;
        }
        if (fieldSettings.checklists?.approve === 'Required' && !detailChecklistId) {
            toast.error('Checklist is required');
            return;
        }
        if (fieldSettings.start?.approve === 'Required' && !detailStartDate) {
            toast.error('Start Date is required');
            return;
        }
        if (fieldSettings.dueDate?.approve === 'Required' && !detailDueDate) {
            toast.error('Due Date is required');
            return;
        }
        if (fieldSettings.duration?.approve === 'Required' && !detailEstimatedDuration) {
            toast.error('Estimated Duration is required');
            return;
        }

        try {
            // 1. Pre-save request edits prior to approval
            await api.patch(`/requests/${selectedRequestId}`, {
                title: detailTitle,
                description: detailDescription,
                priority: detailPriority,
                locationId: detailLocationId || null,
                assetId: detailAssetId || null
            });
            
            // 2. Dispatch approval mutation with configuration
            approveRequest.mutate({
                id: selectedRequestId,
                assignedToId: detailPrimaryWorkerId || null,
                priority: detailPriority,
                dueDate: getMergedISOString(detailDueDate, detailDueTime),
                startDate: getMergedISOString(detailStartDate, detailStartTime),
                assignedTeamId: detailTeamId || null,
                checklistId: detailChecklistId || null,
                estimatedHours: detailEstimatedDuration || null,
                signatureRequired: detailSignatureRequired
            }, {
                onSuccess: () => {
                    setIsDetailDrawerOpen(false);
                }
            });
        } catch (err) {
            toast.error('Failed to save request changes before approval');
        }
    };

    const handleRejectRequest = () => {
        if (!selectedRequestId) return;
        rejectRequest.mutate(selectedRequestId, {
            onSuccess: () => {
                setIsDetailDrawerOpen(false);
            }
        });
    };

    const toggleRequestSelection = (id: string) => {
        setSelectedRequestIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkApprove = async () => {
        if (selectedRequestIds.length === 0) return;
        const loadingToast = toast.loading(`Approving ${selectedRequestIds.length} requests...`);
        try {
            for (const id of selectedRequestIds) {
                await approveRequest.mutateAsync({ id });
            }
            toast.dismiss(loadingToast);
            toast.success(`Successfully approved ${selectedRequestIds.length} requests`);
            setSelectedRequestIds([]);
            setIsMultiSelectMode(false);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to approve one or more requests');
        }
    };

    const handleBulkReject = async () => {
        if (selectedRequestIds.length === 0) return;
        const loadingToast = toast.loading(`Rejecting ${selectedRequestIds.length} requests...`);
        try {
            for (const id of selectedRequestIds) {
                await rejectRequest.mutateAsync(id);
            }
            toast.dismiss(loadingToast);
            toast.success(`Successfully rejected ${selectedRequestIds.length} requests`);
            setSelectedRequestIds([]);
            setIsMultiSelectMode(false);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to reject one or more requests');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
                return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
            case 'REJECTED':
                return 'bg-red-500/10 border-red-500/20 text-red-500';
            case 'PENDING':
            default:
                return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 font-outfit">
            {/* Header & Search */}
            <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md px-4 py-3 border-b border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
                        Requests
                    </h1>
                    <div className="flex items-center gap-2">
                        {isMultiSelectMode ? (
                            <button
                                onClick={() => {
                                    setIsMultiSelectMode(false);
                                    setSelectedRequestIds([]);
                                }}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[11px] font-black uppercase tracking-wider transition-all"
                            >
                                Cancel
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsMultiSelectMode(true)}
                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50 rounded-full text-[11px] font-black uppercase tracking-wider transition-all"
                            >
                                Select
                            </button>
                        )}
                        <button
                            onClick={() => setIsCreateDrawerOpen(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-[11px] font-black uppercase tracking-wider shadow-[0_4px_12px_rgba(79,70,229,0.3)] active:scale-95 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Create
                        </button>
                        <div className="relative">
                            <button 
                                onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
                                className="p-2.5 bg-card border border-border rounded-full text-muted-foreground hover:text-foreground transition-all shrink-0 active:scale-95 flex items-center justify-center"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <AnimatePresence>
                                {isMoreActionsOpen && (
                                    <>
                                        <div className="fixed inset-0 z-50" onClick={() => setIsMoreActionsOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-border z-[60] py-1 overflow-hidden"
                                        >
                                            <button 
                                                onClick={() => {
                                                    setIsMoreActionsOpen(false);
                                                    setView('settings');
                                                }}
                                                className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 border-b border-border/50"
                                            >
                                                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                                                Edit Form
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setIsMoreActionsOpen(false);
                                                    setIsColumnsOpen(true);
                                                }}
                                                className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 border-b border-border/50"
                                            >
                                                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                                                Columns
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setIsMoreActionsOpen(false);
                                                    onExportCSV();
                                                }}
                                                className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                            >
                                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                                                Export CSV
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Search + Sort + Filter row */}
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search requests..."
                            className="w-full h-11 pl-10 pr-9 bg-muted border border-border rounded-xl text-[14px] text-foreground focus:outline-none focus:bg-background focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {/* Sort button */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="h-11 flex items-center gap-1.5 px-3 bg-card border border-border rounded-xl text-xs font-bold text-muted-foreground active:scale-95 transition-all"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span className="hidden xs:block">{getSortLabel()}</span>
                        </button>
                        <AnimatePresence>
                            {isSortOpen && (
                                <>
                                    <div className="fixed inset-0 z-[100]" onClick={() => setIsSortOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        className="absolute top-full right-0 mt-1 w-52 bg-card border border-border rounded-2xl shadow-2xl z-[110] py-1.5 overflow-hidden"
                                    >
                                        <div className="px-4 py-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Sort By</div>
                                        {[
                                            { id: 'createdAt', label: 'Submitted Date' },
                                            { id: 'title', label: 'Title' },
                                            { id: 'asset', label: 'Asset' },
                                            { id: 'category', label: 'Category' },
                                            { id: 'priority', label: 'Priority' },
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => { setSortBy(opt.id); setIsSortOpen(false); }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-bold transition-colors text-left",
                                                    sortBy === opt.id ? "text-indigo-600 bg-indigo-50/10" : "text-foreground hover:bg-muted"
                                                )}
                                            >
                                                {opt.label}
                                                {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                            </button>
                                        ))}
                                        <div className="h-px bg-border mx-3 my-1" />
                                        <div className="px-4 py-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Order</div>
                                        {(['desc', 'asc'] as const).map(o => (
                                            <button
                                                key={o}
                                                onClick={() => { setSortOrder(o); setIsSortOpen(false); }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-bold transition-colors text-left",
                                                    sortOrder === o ? "text-indigo-600 bg-indigo-50/10" : "text-foreground hover:bg-muted"
                                                )}
                                            >
                                                {o === 'desc' ? 'Descending' : 'Ascending'}
                                                {sortOrder === o && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Filter button */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className={cn(
                            "h-11 w-11 border rounded-xl flex items-center justify-center transition-all bg-card active:scale-95 shrink-0 relative",
                            (selectedPriorityFilter !== 'ALL' || selectedLocationFilter !== 'ALL' || selectedAssigneeIds.length > 0 || selectedAssetIds.length > 0)
                                ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
                                : "border-border text-muted-foreground hover:text-foreground"
                        )}
                        title="Filter Requests"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        {(selectedPriorityFilter !== 'ALL' || selectedLocationFilter !== 'ALL' || selectedAssigneeIds.length > 0 || selectedAssetIds.length > 0) && (
                            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-indigo-600 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">
                                {[selectedPriorityFilter !== 'ALL' ? 1 : 0, selectedLocationFilter !== 'ALL' ? 1 : 0, selectedAssigneeIds.length > 0 ? 1 : 0, selectedAssetIds.length > 0 ? 1 : 0].reduce((a, b) => a + b, 0)}
                            </span>
                        )}
                    </button>
                </div>

                {/* Sub-navigation Status Tabs + Result count */}
                <div className="flex items-center gap-2">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
                        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0",
                                    activeTab === tab 
                                        ? "bg-primary border-primary text-white shadow-sm" 
                                        : "bg-muted border-border text-muted-foreground hover:bg-card"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <span className="text-[11px] font-black text-muted-foreground shrink-0">
                        <span className="text-foreground">{filteredRequests.length}</span> Result{filteredRequests.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Request List */}
            <div className="px-4 py-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Loading Requests...</span>
                    </div>
                ) : filteredRequests.length > 0 ? (
                    <div className="space-y-3 animate-in fade-in duration-300">

                        {filteredRequests.map(req => {
                            const reqIdShort = req.id.replace(/-/g, '').toUpperCase().slice(0, 8);
                            const requesterName = req.requester?.user?.name || req.guestName || 'Anonymous';
                            const woStatus = req.workOrder?.status;
                            const category = req.category || req.workOrder?.category || null;
                            const isSelected = selectedRequestIds.includes(req.id);
                            return (
                                <motion.div
                                    key={req.id}
                                    onClick={() => {
                                        if (isMultiSelectMode) {
                                            toggleRequestSelection(req.id);
                                        } else {
                                            setSelectedRequestId(req.id);
                                            setDetailSubTab('overview');
                                            setIsDetailDrawerOpen(true);
                                        }
                                    }}
                                    className={cn(
                                        "bg-card rounded-2xl border transition-all cursor-pointer overflow-hidden flex",
                                        isSelected ? "border-indigo-600 bg-indigo-50/5 dark:bg-indigo-950/10 shadow-md" : "border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
                                        isMultiSelectMode ? "active:scale-[0.99]" : "active:scale-[0.98]"
                                    )}
                                >
                                    {/* Checkbox for selection */}
                                    {isMultiSelectMode && (
                                        <div className="pl-4 pr-1 shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => toggleRequestSelection(req.id)}
                                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        {/* Card top: ID + Status + WO Status */}
                                        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/50">
                                            <span className="text-[10px] font-black font-mono text-muted-foreground uppercase tracking-widest">
                                                REQ-{reqIdShort}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {/* Request status badge */}
                                                {visibleColumns.status && (
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border shrink-0",
                                                        getStatusStyle(req.status)
                                                    )}>
                                                        {req.status || 'PENDING'}
                                                    </span>
                                                )}
                                                {/* WO Status badge */}
                                                {visibleColumns.woStatus && (
                                                    <>
                                                        {woStatus && (
                                                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground shrink-0">
                                                                {woStatus.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                        {!woStatus && (
                                                            <span className="text-[9px] font-medium italic text-muted-foreground/50 shrink-0">
                                                                unassigned
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card body */}
                                        <div className="px-4 py-3 flex gap-3 items-start">
                                            {/* Image placeholder */}
                                            {visibleColumns.image && (
                                                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                                                    {req.imageUrl ? (
                                                        <img src={req.imageUrl.startsWith('/files') ? `http://localhost:3000${req.imageUrl}` : req.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <svg className="w-5 h-5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1 space-y-1">
                                                <h3 className="text-[14px] font-black leading-tight text-foreground">
                                                    {req.title}
                                                </h3>
                                                {req.description && (
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {req.description}
                                                    </p>
                                                )}
                                                {visibleColumns.submittedBy && (
                                                    <p className="text-[11px] text-muted-foreground/80">
                                                        Submitted by: <span className="font-semibold text-foreground/80">{requesterName}</span>
                                                    </p>
                                                )}
                                            </div>

                                            {visibleColumns.priority && req.priority && req.priority !== 'NONE' && (
                                                <PriorityBadge priority={req.priority} />
                                            )}
                                        </div>

                                        {/* Card footer: asset, date, category */}
                                        <div className="px-4 py-2.5 border-t border-border/50 bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex flex-wrap items-center gap-3 min-w-0">
                                                {/* Asset */}
                                                {visibleColumns.asset && (
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        <Box className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                                        <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[120px]">
                                                            {req.asset?.name || <span className="italic opacity-50">No asset</span>}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Location */}
                                                {visibleColumns.location && (
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        <MapPin className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                                        <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[120px]">
                                                            {req.location?.name || <span className="italic opacity-50">No location</span>}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Team */}
                                                {visibleColumns.team && req.workOrder?.assignedTeam?.name && (
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        <Users className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                                        <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[120px]">
                                                            {req.workOrder.assignedTeam.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Category */}
                                                {visibleColumns.category && category && (
                                                    <span className="text-[10px] font-bold text-muted-foreground/70 bg-muted border border-border px-1.5 py-0.5 rounded">
                                                        {category}
                                                    </span>
                                                )}
                                                {/* Submitted date */}
                                                {visibleColumns.submittedDate && req.createdAt && (
                                                    <span className="text-[10px] font-medium text-muted-foreground/70">
                                                        {format(new Date(req.createdAt), 'MM/dd/yy, h:mm a')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 border-2 border-dashed border-border rounded-3xl">
                        <AlertCircle className="w-8 h-8 text-muted-foreground opacity-30" />
                        <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">No matching requests</span>
                    </div>
                )}
            </div>

            {/* Columns Customizer Drawer */}
            <AnimatePresence>
                {isColumnsOpen && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150]" onClick={() => setIsColumnsOpen(false)} />
                        <motion.div 
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-[160] overflow-hidden flex flex-col"
                        >
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 shrink-0">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                                    <span className="text-[16px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Toggle Columns</span>
                                </div>
                                <button onClick={() => setIsColumnsOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-4 max-h-[50vh] bg-white dark:bg-slate-900">
                                {[
                                    { id: 'image', label: 'Image' },
                                    { id: 'asset', label: 'Asset' },
                                    { id: 'status', label: 'Status' },
                                    { id: 'woStatus', label: 'Work Order Status' },
                                    { id: 'submittedDate', label: 'Submitted Date' },
                                    { id: 'category', label: 'Category' },
                                    { id: 'submittedBy', label: 'Submitted By' },
                                    { id: 'priority', label: 'Priority' },
                                    { id: 'team', label: 'Team' },
                                    { id: 'location', label: 'Location' }
                                ].map((col) => (
                                    <label key={col.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer group transition-colors border border-slate-100 dark:border-slate-800">
                                        <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600">{col.label}</span>
                                        <input 
                                            type="checkbox"
                                            checked={!!(visibleColumns as any)[col.id]}
                                            onChange={() => setVisibleColumns({ ...visibleColumns, [col.id]: !(visibleColumns as any)[col.id] })}
                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </label>
                                ))}
                            </div>
                            <div className="p-5 bg-slate-50 dark:bg-slate-800 flex items-center justify-end border-t border-slate-100 dark:border-slate-700 shrink-0">
                                <button 
                                    onClick={() => setIsColumnsOpen(false)}
                                    className="w-full py-3 bg-indigo-600 text-white font-black text-[15px] rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all text-center"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {isMultiSelectMode && selectedRequestIds.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 inset-x-4 z-50 bg-slate-900 dark:bg-slate-950 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4"
                    >
                        <div className="flex flex-col pl-2">
                            <span className="text-xs font-bold text-slate-400">Selection</span>
                            <span className="text-[15px] font-black">{selectedRequestIds.length} Selected</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkReject}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleBulkApprove}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
                            >
                                Approve
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Details Drawer */}
            <AnimatePresence>
                {isDetailDrawerOpen && selectedRequest && (
                    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full max-h-[90vh] bg-background border-t border-border rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl"
                        >
                            {/* Drawer Drag handle / Header */}
                            <div className="relative shrink-0 px-4 py-3 border-b border-border bg-card flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black uppercase bg-muted border border-border px-2.5 py-0.5 rounded-md text-muted-foreground">
                                        REQ-{selectedRequest.id.split('-')[0].toUpperCase()}
                                    </span>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0",
                                        getStatusStyle(selectedRequest.status)
                                    )}>
                                        {selectedRequest.status || 'PENDING'}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => setIsDetailDrawerOpen(false)}
                                    className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Inner Tab bar (Overview / Comments) */}
                            <div className="flex border-b border-border bg-card shrink-0">
                                <button
                                    onClick={() => setDetailSubTab('overview')}
                                    className={cn(
                                        "flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all",
                                        detailSubTab === 'overview'
                                            ? "border-indigo-600 text-indigo-600"
                                            : "border-transparent text-muted-foreground"
                                    )}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setDetailSubTab('comments')}
                                    className={cn(
                                        "flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5",
                                        detailSubTab === 'comments'
                                            ? "border-indigo-600 text-indigo-600"
                                            : "border-transparent text-muted-foreground"
                                    )}
                                >
                                    Discussion
                                    {(requestComments[selectedRequest.id] || []).length > 0 && (
                                        <span className="px-1.5 py-0.25 bg-indigo-600 text-white text-[9px] rounded-full font-black">
                                            {(requestComments[selectedRequest.id] || []).length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Drawer Content Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0 custom-scrollbar">
                                {detailSubTab === 'overview' ? (
                                    <>
                                        {selectedRequest.status === 'APPROVED' && (
                                            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5">
                                                <Check className="w-5 h-5 text-emerald-500 stroke-[3px] shrink-0" />
                                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                                    This request is Approved into Work Order <span className="underline">#{selectedRequest.workOrder?.id?.split('-')[0].toUpperCase()}</span>
                                                </span>
                                            </div>
                                        )}

                                        {selectedRequest.status === 'REJECTED' && (
                                            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5">
                                                <XCircle className="w-5 h-5 text-red-500 stroke-[3px] shrink-0" />
                                                <span className="text-xs font-bold text-red-800 dark:text-red-300">
                                                    This request was declined.
                                                </span>
                                            </div>
                                        )}

                                        {/* Basic Fields */}
                                        <div className="space-y-4">
                                            {fieldSettings.title?.approve !== 'Hidden' && (
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                        Title {fieldSettings.title?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <input 
                                                        value={detailTitle}
                                                        onChange={(e) => setDetailTitle(e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full h-11 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold disabled:opacity-75 disabled:bg-muted"
                                                    />
                                                </div>
                                            )}

                                            {fieldSettings.description?.approve !== 'Hidden' && (
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                        Description {fieldSettings.description?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <textarea 
                                                        value={detailDescription}
                                                        onChange={(e) => setDetailDescription(e.target.value)}
                                                        disabled={isReadOnly}
                                                        rows={3}
                                                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 transition-all font-medium disabled:opacity-75 disabled:bg-muted resize-none"
                                                    />
                                                </div>
                                            )}

                                            {fieldSettings.priority?.approve !== 'Hidden' && (
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                        Priority {fieldSettings.priority?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <select
                                                        value={detailPriority}
                                                        onChange={(e) => setDetailPriority(e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full h-11 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold disabled:opacity-75 disabled:bg-muted"
                                                    >
                                                        <option value="NONE">None</option>
                                                        <option value="LOW">Low</option>
                                                        <option value="MEDIUM">Medium</option>
                                                        <option value="HIGH">High</option>
                                                        <option value="CRITICAL">Critical</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                        {/* Image Upload */}
                                        {fieldSettings.images?.approve !== 'Hidden' && (
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                    Image {fieldSettings.images?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                </label>
                                                {detailImageUrl ? (
                                                    <div className="relative border border-border rounded-xl overflow-hidden bg-card">
                                                        <img 
                                                            src={detailImageUrl.startsWith('/files') ? `http://localhost:3000${detailImageUrl}` : detailImageUrl} 
                                                            alt="Request Attachment" 
                                                            className="w-full max-h-48 object-cover" 
                                                        />
                                                        {!isReadOnly && (
                                                            <button
                                                                onClick={() => setDetailImageUrl('')}
                                                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <label className={cn(
                                                        "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer transition-all",
                                                        isReadOnly ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-400 hover:bg-indigo-50/5 active:scale-98"
                                                    )}>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            disabled={isReadOnly || uploadingImage}
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file || !selectedRequestId) return;
                                                                setUploadingImage(true);
                                                                try {
                                                                    const formData = new FormData();
                                                                    formData.append('file', file);
                                                                    const res = await api.patch(`/requests/${selectedRequestId}`, { imageFile: file });
                                                                    setDetailImageUrl(res.data?.imageUrl || URL.createObjectURL(file));
                                                                    toast.success('Image uploaded');
                                                                } catch {
                                                                    // Fallback: show preview locally
                                                                    setDetailImageUrl(URL.createObjectURL(file));
                                                                } finally {
                                                                    setUploadingImage(false);
                                                                }
                                                            }}
                                                        />
                                                        {uploadingImage ? (
                                                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Paperclip className="w-5 h-5 text-muted-foreground/50 mb-1" />
                                                                <span className="text-[11px] font-bold text-muted-foreground">Upload Image</span>
                                                                <span className="text-[9px] text-muted-foreground/50">or drop image here</span>
                                                            </>
                                                        )}
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        {/* File Attachment */}
                                        {fieldSettings.files?.approve !== 'Hidden' && (
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                    Files {fieldSettings.files?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                </label>
                                                <input 
                                                    type="file"
                                                    disabled={isReadOnly}
                                                    className="w-full h-11 bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) toast.success(`Attached: ${file.name}`);
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Select Options (Location, Asset, Category, Dates) */}
                                        <div className="space-y-4 border-t border-border/40 pt-4">
                                            {fieldSettings.start?.approve !== 'Hidden' && (
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                        Start Date {fieldSettings.start?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="date"
                                                            value={detailStartDate}
                                                            onChange={(e) => setDetailStartDate(e.target.value)}
                                                            disabled={isReadOnly}
                                                            className="w-full h-11 bg-card border border-border rounded-xl px-3 text-xs focus:outline-none focus:border-indigo-600 transition-all font-semibold disabled:opacity-75 disabled:bg-muted"
                                                        />
                                                        <input
                                                            type="time"
                                                            value={detailStartTime}
                                                            onChange={(e) => setDetailStartTime(e.target.value)}
                                                            disabled={isReadOnly}
                                                            className="w-full h-11 bg-card border border-border rounded-xl px-3 text-xs focus:outline-none focus:border-indigo-600 transition-all font-semibold disabled:opacity-75 disabled:bg-muted"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {fieldSettings.dueDate?.approve !== 'Hidden' && (
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                        Due Date {fieldSettings.dueDate?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="date"
                                                            value={detailDueDate}
                                                            onChange={(e) => setDetailDueDate(e.target.value)}
                                                            disabled={isReadOnly}
                                                            className="w-full h-11 bg-card border border-border rounded-xl px-3 text-xs focus:outline-none focus:border-indigo-600 transition-all font-semibold disabled:opacity-75 disabled:bg-muted"
                                                        />
                                                        <input
                                                            type="time"
                                                            value={detailDueTime}
                                                            onChange={(e) => setDetailDueTime(e.target.value)}
                                                            disabled={isReadOnly}
                                                            className="w-full h-11 bg-card border border-border rounded-xl px-3 text-xs focus:outline-none focus:border-indigo-600 transition-all font-semibold disabled:opacity-75 disabled:bg-muted"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {fieldSettings.category?.approve !== 'Hidden' && (
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                        Category {fieldSettings.category?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <select
                                                        value={detailCategory}
                                                        onChange={(e) => setDetailCategory(e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full h-11 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold disabled:opacity-75 disabled:bg-muted"
                                                    >
                                                        <option value="">Select Category...</option>
                                                        {(categories || []).map((cat: any) => (
                                                            <option key={cat.id || cat.name} value={cat.name || cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {fieldSettings.location?.approve !== 'Hidden' && (
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                        Location {fieldSettings.location?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <select
                                                        value={detailLocationId}
                                                        onChange={(e) => setDetailLocationId(e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full h-11 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold disabled:opacity-75 disabled:bg-muted"
                                                    >
                                                        <option value="">Select Location...</option>
                                                        {locations.map(loc => (
                                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {fieldSettings.asset?.approve !== 'Hidden' && (
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                        Asset {fieldSettings.asset?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                    </label>
                                                    <select
                                                        value={detailAssetId}
                                                        onChange={(e) => setDetailAssetId(e.target.value)}
                                                        disabled={isReadOnly}
                                                        className="w-full h-11 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold disabled:opacity-75 disabled:bg-muted"
                                                    >
                                                        <option value="">Select Asset...</option>
                                                        {assets.map(asset => (
                                                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Approval Options Section (Only when status is PENDING) */}
                                        {!isReadOnly && (
                                            <div className="bg-card border border-border rounded-2xl p-4 space-y-4 mt-6">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-500 border-b border-border pb-2">
                                                    Dispatch & Approval Configuration
                                                </h4>

                                                {fieldSettings.worker?.approve !== 'Hidden' && (
                                                    <div className="space-y-1">
                                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                            Assign Worker (Primary) {fieldSettings.worker?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                        </label>
                                                        <select
                                                            value={detailPrimaryWorkerId}
                                                            onChange={(e) => setDetailPrimaryWorkerId(e.target.value)}
                                                            className="w-full h-11 bg-background border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                                        >
                                                            <option value="">Select Worker...</option>
                                                            {users.map(u => (
                                                                <option key={u.userOrgId || u.id} value={u.userOrgId || u.id}>{u.name} — {u.roleName}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {fieldSettings.team?.approve !== 'Hidden' && (
                                                    <div className="space-y-1">
                                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                            Assign Team {fieldSettings.team?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                        </label>
                                                        <select
                                                            value={detailTeamId}
                                                            onChange={(e) => setDetailTeamId(e.target.value)}
                                                            className="w-full h-11 bg-background border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                                        >
                                                            <option value="">Select Team...</option>
                                                            {teams.map(t => (
                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {fieldSettings.checklists?.approve !== 'Hidden' && (
                                                    <div className="space-y-1">
                                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                            Checklist {fieldSettings.checklists?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                        </label>
                                                        <select
                                                            value={detailChecklistId}
                                                            onChange={(e) => setDetailChecklistId(e.target.value)}
                                                            className="w-full h-11 bg-background border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                                        >
                                                            <option value="">Select Checklist...</option>
                                                            {checklists.map(chk => (
                                                                <option key={chk.id} value={chk.id}>{chk.title}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {fieldSettings.duration?.approve !== 'Hidden' && (
                                                    <div className="space-y-1">
                                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                                            Est. Duration (Hours) {fieldSettings.duration?.approve === 'Required' && <span className="text-rose-500">*</span>}
                                                        </label>
                                                        <input 
                                                            value={detailEstimatedDuration}
                                                            onChange={(e) => setDetailEstimatedDuration(e.target.value)}
                                                            placeholder="e.g. 2.5"
                                                            className="w-full h-11 bg-background border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                                        />
                                                    </div>
                                                )}

                                                {fieldSettings.signature?.approve !== 'Hidden' && (
                                                    <div className="flex items-center gap-3 py-1">
                                                        <input 
                                                            type="checkbox" 
                                                            id="mobDetailSig"
                                                            checked={detailSignatureRequired}
                                                            onChange={(e) => setDetailSignatureRequired(e.target.checked)}
                                                            className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                                        />
                                                        <label htmlFor="mobDetailSig" className="text-xs font-bold text-foreground cursor-pointer select-none">
                                                            Signature Required upon Completion {fieldSettings.signature?.approve === 'Required' && <span className="text-rose-500 ml-0.5">*</span>}
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* Comments Discussion List */
                                    <div className="flex flex-col h-[50vh] min-h-[300px]">
                                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 custom-scrollbar">
                                            {(!requestComments[selectedRequest.id] || requestComments[selectedRequest.id].length === 0) ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-2">
                                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <p className="text-xs font-bold text-muted-foreground">No updates yet</p>
                                                    <p className="text-[10px] text-muted-foreground/60 max-w-[200px]">
                                                        Post a message to append information to this request thread.
                                                    </p>
                                                </div>
                                            ) : (
                                                requestComments[selectedRequest.id].map(comment => (
                                                    <div key={comment.id} className="bg-card border border-border rounded-2xl p-3 shadow-sm space-y-2 animate-in fade-in slide-in-from-bottom duration-300">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase shrink-0">
                                                                    {getInitials(comment.sender)}
                                                                </div>
                                                                <span className="text-[11px] font-bold text-foreground lowercase">{comment.sender}</span>
                                                            </div>
                                                            <span className="text-[9px] text-muted-foreground font-bold">
                                                                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(comment.timestamp))}
                                                            </span>
                                                        </div>
                                                        <p className="bg-muted/40 border border-border/30 rounded-xl px-3 py-2 text-xs text-foreground font-semibold whitespace-pre-wrap">
                                                            {comment.text}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Comment Input */}
                                        <div className="border-t border-border pt-3 flex gap-2 shrink-0 bg-background">
                                            <input 
                                                value={chatMessage}
                                                onChange={(e) => setChatMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSendComment();
                                                }}
                                                placeholder="Write a note..."
                                                className="flex-1 h-11 bg-card border border-border rounded-xl px-3 text-xs focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                            />
                                            <button 
                                                onClick={handleSendComment}
                                                disabled={!chatMessage.trim()}
                                                className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons Footer (Overview only) */}
                            {detailSubTab === 'overview' && !isReadOnly && (
                                <div className="p-4 border-t border-border bg-card flex flex-col gap-2 shrink-0">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleRejectRequest}
                                            disabled={rejectRequest.isPending}
                                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                                        >
                                            Decline
                                        </button>
                                        <button 
                                            onClick={handleSaveRequestOnly}
                                            disabled={updateRequest.isPending || !detailTitle.trim()}
                                            className="flex-1 py-3 bg-muted border border-border text-foreground hover:bg-card text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            Save Details
                                        </button>
                                    </div>
                                    <button 
                                        onClick={handleApproveRequest}
                                        disabled={approveRequest.isPending || !detailTitle.trim()}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {approveRequest.isPending ? 'Spawning Work Order...' : 'Approve & Dispatch'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Drawer */}
            <AnimatePresence>
                {isCreateDrawerOpen && (
                    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full max-h-[85vh] bg-background border-t border-border rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl"
                        >
                            {/* Drawer Header */}
                            <div className="px-4 py-4 border-b border-border bg-card flex items-center justify-between shrink-0">
                                <h2 className="text-[17px] font-black uppercase tracking-wider text-foreground">Create Request</h2>
                                <button 
                                    onClick={() => setIsCreateDrawerOpen(false)}
                                    className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Form Body */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
                                {fieldSettings.title?.create !== 'Hidden' && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                            Title {fieldSettings.title?.create === 'Required' && <span className="text-rose-500">*</span>}
                                        </label>
                                        <input 
                                            value={createForm.title}
                                            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                                            placeholder="Summarize the problem..."
                                            className="w-full h-11 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                        />
                                    </div>
                                )}

                                {fieldSettings.description?.create !== 'Hidden' && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                            Description {fieldSettings.description?.create === 'Required' && <span className="text-rose-500">*</span>}
                                        </label>
                                        <textarea 
                                            value={createForm.description}
                                            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                            placeholder="Add details, symptoms, context..."
                                            rows={3}
                                            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 transition-all font-medium resize-none"
                                        />
                                    </div>
                                )}

                                {fieldSettings.priority?.create !== 'Hidden' && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                            Priority {fieldSettings.priority?.create === 'Required' && <span className="text-rose-500">*</span>}
                                        </label>
                                        <select
                                            value={createForm.priority}
                                            onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                                            className="w-full h-11 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                        >
                                            <option value="NONE">None</option>
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
                                )}

                                {fieldSettings.location?.create !== 'Hidden' && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                            Operational Location {fieldSettings.location?.create === 'Required' && <span className="text-rose-500">*</span>}
                                        </label>
                                        <select
                                            value={createForm.locationId}
                                            onChange={(e) => setCreateForm({ ...createForm, locationId: e.target.value })}
                                            className="w-full h-11 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                        >
                                            <option value="">Select Location...</option>
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {fieldSettings.asset?.create !== 'Hidden' && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                            Asset {fieldSettings.asset?.create === 'Required' && <span className="text-rose-500">*</span>}
                                        </label>
                                        <select
                                            value={createForm.assetId}
                                            onChange={(e) => setCreateForm({ ...createForm, assetId: e.target.value })}
                                            className="w-full h-11 bg-card border border-border rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-600 transition-all font-semibold"
                                        >
                                            <option value="">Select Asset...</option>
                                            {assets.map(asset => (
                                                <option key={asset.id} value={asset.id}>{asset.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Custom Form Tasks */}
                                {formTasks.length > 0 && (
                                    <div className="space-y-2.5 pt-2">
                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">Form Checklist Items</label>
                                        <div className="space-y-2">
                                            {formTasks.map(task => (
                                                <div key={task.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!taskResponses[task.id]}
                                                        onChange={() => toggleTaskResponse(task.id)}
                                                        className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500" 
                                                    />
                                                    <span className="text-xs font-bold text-foreground">{task.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Simple file upload dropzone */}
                                {(fieldSettings.images?.create !== 'Hidden' || fieldSettings.files?.create !== 'Hidden') && (
                                    <div className="space-y-1.5 pt-1">
                                        <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                                            Upload File/Image {(fieldSettings.images?.create === 'Required' || fieldSettings.files?.create === 'Required') && <span className="text-rose-500">*</span>}
                                        </label>
                                        <div className="border border-dashed border-border rounded-xl p-4 bg-card relative flex flex-col items-center justify-center hover:border-indigo-500 transition-all">
                                            <input 
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                accept={fieldSettings.images?.create !== 'Hidden' ? "image/*" : undefined}
                                            />
                                            <Paperclip className="w-5 h-5 text-muted-foreground mb-1" />
                                            <span className="text-xs font-bold text-muted-foreground text-center">
                                                {selectedFile ? selectedFile.name : 'Tap to select files/images'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Create Footer */}
                            <div className="p-4 border-t border-border bg-card flex gap-2 shrink-0">
                                <button 
                                    onClick={() => setIsCreateDrawerOpen(false)}
                                    className="flex-1 py-3 bg-muted border border-border text-foreground hover:bg-card text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleCreateRequest}
                                    disabled={createRequest.isPending || !createForm.title.trim()}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50"
                                >
                                    {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Filters Drawer */}
            <AnimatePresence>
                {isFilterDrawerOpen && (
                    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="w-full max-h-[80vh] bg-background border-t border-border rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl"
                        >
                            {/* Drawer Header */}
                            <div className="px-4 py-4 border-b border-border bg-card flex items-center justify-between shrink-0">
                                <h2 className="text-[17px] font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <SlidersHorizontal className="w-5 h-5 text-indigo-650" />
                                    Filter Registry
                                </h2>
                                <button 
                                    onClick={() => setIsFilterDrawerOpen(false)}
                                    className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Filters Body */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0 custom-scrollbar">
                                {/* Priority */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">Priority</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((prio) => (
                                            <button
                                                key={prio}
                                                type="button"
                                                onClick={() => setSelectedPriorityFilter(prio)}
                                                className={cn(
                                                    "py-2.5 rounded-xl text-xs font-black uppercase border transition-all active:scale-95",
                                                    selectedPriorityFilter === prio
                                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                                                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {prio.toLowerCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-1.5 relative">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider block">Operational Location</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsLocationFilterOpen(!isLocationFilterOpen)}
                                        className="w-full h-11 bg-card border border-border rounded-xl px-4 flex items-center justify-between text-sm font-semibold hover:border-indigo-650 transition-all cursor-pointer text-foreground"
                                    >
                                        <span className="truncate">
                                            {selectedLocationFilter === 'ALL' 
                                                ? 'All Locations' 
                                                : locations.find(l => l.id === selectedLocationFilter)?.name || 'All Locations'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                    </button>

                                    {isLocationFilterOpen && (
                                        <div className="mt-1 border border-border rounded-2xl bg-card overflow-hidden max-h-48 overflow-y-auto custom-scrollbar shadow-lg animate-in fade-in slide-in-from-top-1 z-30">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedLocationFilter('ALL');
                                                    setIsLocationFilterOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                                                    selectedLocationFilter === 'ALL' ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                                                )}
                                            >
                                                All Locations
                                            </button>
                                            {locations.map(loc => (
                                                <button
                                                    key={loc.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedLocationFilter(loc.id);
                                                        setIsLocationFilterOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                                                        selectedLocationFilter === loc.id ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                                                    )}
                                                >
                                                    {loc.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Assigned To */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">Assigned To</label>
                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                        {users.map((u: any) => {
                                            const uid = u.userOrgId || u.id;
                                            const isSelected = selectedAssigneeIds.includes(uid);
                                            return (
                                                <button
                                                    key={uid}
                                                    onClick={() => setSelectedAssigneeIds(prev => isSelected ? prev.filter(x => x !== uid) : [...prev, uid])}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-[12px] font-bold transition-all text-left",
                                                        isSelected ? "bg-indigo-600/10 border-indigo-600/30 text-indigo-600" : "bg-card border-border text-foreground"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground shrink-0">
                                                            {(u.name || '?')[0].toUpperCase()}
                                                        </div>
                                                        <span className="truncate">{u.name || 'Unknown'}</span>
                                                    </div>
                                                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                        {users.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-3">No users available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Asset */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">Asset</label>
                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                        {assets.map((a: any) => {
                                            const isSelected = selectedAssetIds.includes(a.id);
                                            return (
                                                <button
                                                    key={a.id}
                                                    onClick={() => setSelectedAssetIds(prev => isSelected ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-[12px] font-bold transition-all text-left",
                                                        isSelected ? "bg-indigo-600/10 border-indigo-600/30 text-indigo-600" : "bg-card border-border text-foreground"
                                                    )}
                                                >
                                                    <span className="truncate">{a.name}</span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                        {assets.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-3">No assets available</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Filters Footer */}
                            <div className="p-4 border-t border-border bg-card flex gap-3 shrink-0">
                                <button 
                                    onClick={() => {
                                        setSelectedPriorityFilter('ALL');
                                        setSelectedLocationFilter('ALL');
                                        setSelectedAssigneeIds([]);
                                        setSelectedAssetIds([]);
                                        setIsFilterDrawerOpen(false);
                                        toast.success('Filters cleared');
                                    }}
                                    className="flex-1 py-3 bg-muted border border-border text-foreground hover:bg-card text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                                >
                                    Reset All
                                </button>
                                <button 
                                    onClick={() => setIsFilterDrawerOpen(false)}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Action Button for Create Request */}
            <button
                onClick={() => setIsCreateDrawerOpen(true)}
                className="fixed bottom-20 right-4 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all z-40"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>
    );
};
