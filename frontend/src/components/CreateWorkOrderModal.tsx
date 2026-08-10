import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
    X, ChevronDown, Check, Plus, Search, 
    ClipboardList, Wrench, Calendar, Users, 
    FileText, ShieldCheck, Trash2, AlertCircle,
    Package, Info, Clock, ExternalLink,
    ShieldAlert, TrendingUp, Camera, ImageIcon, Upload, Paperclip, File,
    Type, Box, Link as LinkIcon, FileSignature, Barcode, Gauge, CircleCheck, Edit3, GripVertical
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAssets, useLocations, useUsers, useTeams, useChecklists, usePurchaseOrders, useLinkPoToWorkOrder, useParts } from '../hooks/useData';
import type { Asset, Location, User, Team, Checklist, PurchaseOrder } from '../types';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { toast } from 'react-hot-toast';
import { AnimatePresence, Reorder } from 'framer-motion';
import { PartInspector } from './PartInspector';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface CreateWorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultAssetId?: string | null;
    defaultLocationId?: string | null;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({ isOpen, onClose, defaultAssetId, defaultLocationId }) => {
    const { createWorkOrder, uploadFile: uploadWorkOrderFile } = useWorkOrders();
    const { data: assets = [] } = useAssets();
    const { data: locations = [] } = useLocations();
    const { data: users = [] } = useUsers();
    const { data: teams = [] } = useTeams();
    const { data: checklists = [] } = useChecklists();
    const { data: purchaseOrders = [] } = usePurchaseOrders();
    const linkPoToWorkOrder = useLinkPoToWorkOrder();

    // Fetch Work Order Configuration settings from the backend
    const { data: woSettings = [] } = useQuery<any[]>({
        queryKey: ['wo-settings'],
        queryFn: async () => {
            const response = await api.get('/settings');
            const data = Array.isArray(response.data) ? response.data : [];
            return data.filter((s: any) => s.key.startsWith('wo.'));
        },
        staleTime: 60000,
    });

    // Helper: get field config (Optional | Required | Hidden)
    const fieldConf = (field: string): 'Optional' | 'Required' | 'Hidden' => {
        const key = `wo.conf.create.${field}`;
        return (woSettings.find((s: any) => s.key === key)?.value as any) || 'Optional';
    };

    // Form State
    const [activeTab, setActiveTab] = useState<'Create' | 'Templates'>('Create');
    const [activeSection, setActiveSection] = useState('details');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Corrective');
    const [priority, setPriority] = useState('Medium');
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(defaultAssetId || null);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(defaultLocationId || null);

    useEffect(() => {
        if (isOpen) {
            setSelectedAssetId(defaultAssetId || null);
            setSelectedLocationId(defaultLocationId || null);
        }
    }, [isOpen, defaultAssetId, defaultLocationId]);

    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [duration, setDuration] = useState<number | ''>('');
    const [primaryAssigneeId, setPrimaryAssigneeId] = useState<string | null>(null);
    const [teamId, setTeamId] = useState<string | null>(null);
    const [additionalAssigneeIds, setAdditionalAssigneeIds] = useState<string[]>([]);
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [documents, setDocuments] = useState<File[]>([]);
    const documentInputRef = useRef<HTMLInputElement>(null);
    const [signatureRequired, setSignatureRequired] = useState(false);
    const [requiresLOTO, setRequiresLOTO] = useState(false);
    const [isDowntimeEvent, setIsDowntimeEvent] = useState(false);
    const [haltProduction, setHaltProduction] = useState(false);
    
    // Auto-fill Location when an Asset is selected
    useEffect(() => {
        if (selectedAssetId && assets) {
            const asset = assets.find(a => a.id === selectedAssetId);
            if (asset && asset.locationId) {
                setSelectedLocationId(asset.locationId);
            }
        }
    }, [selectedAssetId, assets]);

    const [tasks, setTasks] = useState<any[]>([]);
    const [parts, setParts] = useState<any[]>([]);
    const [selectedPartForInspector, setSelectedPartForInspector] = useState<any | null>(null);
    const { data: allParts = [] } = useParts();

    const addPart = (part: any) => {
        if (parts.some(p => p.id === part.id)) return;
        setParts(prev => [...prev, { id: part.id, name: part.name, quantity: 1, part: part }]);
    };

    const updatePartQuantity = (partId: string, quantity: number) => {
        setParts(prev => prev.map(p => p.id === partId ? { ...p, quantity } : p));
    };

    const removePart = (partId: string) => {
        setParts(prev => prev.filter(p => p.id !== partId));
    };

    const addTask = () => {
        const id = Math.random().toString(36).substr(2, 9);
        setTasks(prev => [...prev, { 
            id, 
            text: '', 
            type: 'Inspection', 
            isRequired: false, 
            isExpanded: false,
            requirements: { notes: false, photo: false, url: false, reading: false, signature: false, barcode: false }
        }]);
    };

    const removeTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const updateTask = (id: string, updates: any) => {
        if (updates.text) {
            const isDuplicate = tasks.some(t => t.id !== id && t.text.toLowerCase() === updates.text.toLowerCase());
            if (isDuplicate) {
                toast.error('Task with this protocol already exists');
            }
        }
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
    const [checklistSearch, setChecklistSearch] = useState('');
    const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
    const [poSearch, setPoSearch] = useState('');

    const sections = [
        { id: 'details', label: 'Work Order Details', icon: <FileText className="w-4 h-4" /> },
        { id: 'photos', label: 'Photos', icon: <Camera className="w-4 h-4" /> },
        { id: 'specs', label: 'Job Specifications', icon: <Wrench className="w-4 h-4" /> },
        { id: 'dates', label: 'Dates & Duration', icon: <Calendar className="w-4 h-4" /> },
        { id: 'assignment', label: 'Assignment & Team', icon: <Users className="w-4 h-4" /> },
        { id: 'tasks', label: 'Tasks & Checklists', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'documents', label: 'Documents & Reference', icon: <Paperclip className="w-4 h-4" /> },
        { id: 'purchase-order', label: 'Purchase Order', icon: <Package className="w-4 h-4" /> },
        { id: 'parts', label: 'Parts Inventory', icon: <Info className="w-4 h-4" /> },
    ];

    // Dropdown Visibility State
    const [dropdowns, setDropdowns] = useState({
        category: false, priority: false, asset: false, location: false, assignee: false, team: false, additionalAssignee: false, checklist: false, po: false, parts: false
    });

    const [assetSearch, setAssetSearch] = useState('');
    const [locationSearch, setLocationSearch] = useState('');

    const DRAFT_KEY = 'wo_create_draft';

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setCategory('Corrective');
        setPriority('Medium');
        setSelectedAssetId(null);
        setSelectedLocationId(null);
        setStartDate('');
        setDueDate('');
        setDuration('');
        setPrimaryAssigneeId(null);
        setTeamId(null);
        setAdditionalAssigneeIds([]);
        setTasks([]);
        setPhotos([]);
        setPhotoPreviews([]);
        setDocuments([]);
        setSignatureRequired(false);
        setRequiresLOTO(false);
        setIsDowntimeEvent(false);
        setHaltProduction(false);
        setSelectedChecklistId(null);
        setSelectedPoId(null);
        localStorage.removeItem(DRAFT_KEY);
    };

    // Reset form when modal is opened to ensure no previously entered inputs persist
    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.ctrlKey && e.key === 'Enter') handleSubmit();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [title, isOpen]);

    if (!isOpen) return null;

    const categories = ['Preventive', 'Corrective', 'Emergency', 'Inspection', 'Safety', 'Other'];
    const priorities = [
        { label: 'None', color: 'bg-white/5 text-muted-foreground/60', icon: <AlertCircle className="w-3.5 h-3.5" /> },
        { label: 'Low', color: 'bg-blue-500/10 text-blue-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
        { label: 'Medium', color: 'bg-orange-500/10 text-orange-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
        { label: 'High', color: 'bg-red-500/10 text-red-400', icon: <AlertCircle className="w-3.5 h-3.5" /> }
    ];

    const toggleDropdown = (key: keyof typeof dropdowns) => {
        setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAddPhotos = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        setPhotos(prev => [...prev, ...newFiles]);
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddDocuments = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        setDocuments(prev => [...prev, ...newFiles]);
    };

    const handleRemoveDocument = (index: number) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const getDocIcon = (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (['pdf'].includes(ext)) return { bg: 'bg-red-50', text: 'text-red-500', label: 'PDF' };
        if (['doc', 'docx'].includes(ext)) return { bg: 'bg-blue-50', text: 'text-blue-500', label: 'DOC' };
        if (['xls', 'xlsx', 'csv'].includes(ext)) return { bg: 'bg-emerald-50', text: 'text-emerald-500', label: 'XLS' };
        if (['ppt', 'pptx'].includes(ext)) return { bg: 'bg-orange-50', text: 'text-orange-500', label: 'PPT' };
        if (['zip', 'rar', '7z'].includes(ext)) return { bg: 'bg-purple-50', text: 'text-purple-500', label: 'ZIP' };
        return { bg: 'bg-slate-50', text: 'text-slate-500', label: ext.toUpperCase() || 'FILE' };
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleSubmit = async () => {
        if (!title) return;

        // Validate fields that are marked Required in Configuration settings
        if (fieldConf('description') === 'Required' && !description) {
            toast.error('Description is required (configured in Work Order Settings)');
            return;
        }
        if (fieldConf('priority') === 'Required' && (!priority || priority === 'None')) {
            toast.error('Priority is required (configured in Work Order Settings)');
            return;
        }
        if (fieldConf('primaryWorker') === 'Required' && !primaryAssigneeId) {
            toast.error('Primary Worker is required (configured in Work Order Settings)');
            return;
        }
        if (fieldConf('assignedAsset') === 'Required' && !selectedAssetId) {
            toast.error('Assigned Asset is required (configured in Work Order Settings)');
            return;
        }
        if (fieldConf('assignedLocation') === 'Required' && !selectedLocationId) {
            toast.error('Assigned Location is required (configured in Work Order Settings)');
            return;
        }
        if (fieldConf('dueDate') === 'Required' && !dueDate) {
            toast.error('Due Date is required (configured in Work Order Settings)');
            return;
        }

        // Map frontend categories to backend maintenanceType enum
        const maintenanceTypeMap: Record<string, string> = {
            'Preventive': 'PREVENTIVE',
            'Corrective': 'CORRECTIVE',
            'Emergency': 'EMERGENCY',
            'Inspection': 'INSPECTION',
            'Safety': 'SAFETY',
            'Other': 'OTHER'
        };

        const finalPriority = priority === 'None' ? undefined : priority.toUpperCase();
        const finalMaintenanceType = maintenanceTypeMap[category] || 'OTHER';

        try {
            const createdWo = await createWorkOrder.mutateAsync({
                title, 
                description, 
                priority: finalPriority as any,
                maintenanceType: finalMaintenanceType,
                assetId: selectedAssetId || undefined,
                locationId: selectedLocationId || undefined,
                startDate: startDate ? new Date(startDate).toISOString() : undefined,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                estimatedHours: duration !== '' ? Number(duration) : 0,
                assignedToId: primaryAssigneeId === 'unassigned' || !primaryAssigneeId ? undefined : primaryAssigneeId,
                assignedTeamId: teamId || undefined,
                technicianIds: additionalAssigneeIds.length > 0 ? additionalAssigneeIds : undefined,
                checklistId: selectedChecklistId || undefined,
                signatureRequired,
                requiresLOTO,
                isDowntimeEvent,
                haltProduction,
                tasks: tasks.filter(t => t.text.trim() !== '').map(t => ({
                    text: t.text,
                    type: t.type,
                    status: 'Todo',
                    isRequired: t.isRequired,
                    requirements: t.requirements
                })),
                parts: parts.length > 0 ? parts.map(p => ({
                    id: p.id,
                    quantity: p.quantity
                })) : undefined
            });

            // Upload photos after WO is created (requires a real ID)
            if (photos.length > 0 && createdWo?.id) {
                const uploadResults = await Promise.allSettled(
                    photos.map(file => uploadWorkOrderFile.mutateAsync({ id: createdWo.id, file }))
                );
                const failed = uploadResults.filter(r => r.status === 'rejected').length;
                if (failed > 0) {
                    toast.error(`Work Order created, but ${failed} photo(s) failed to upload.`);
                }
            }

            // Upload documents after photos
            if (documents.length > 0 && createdWo?.id) {
                const docResults = await Promise.allSettled(
                    documents.map(file => uploadWorkOrderFile.mutateAsync({ id: createdWo.id, file }))
                );
                const failedDocs = docResults.filter(r => r.status === 'rejected').length;
                if (failedDocs > 0) {
                    toast.error(`Work Order created, but ${failedDocs} document(s) failed to upload.`);
                }
            }

            // Link selected Purchase Order to this WO
            if (selectedPoId && createdWo?.id) {
                try {
                    await linkPoToWorkOrder.mutateAsync({ poId: selectedPoId, workOrderId: createdWo.id });
                } catch {
                    toast.error('Work Order created, but failed to link the Purchase Order.');
                }
            }

            toast.success('Work Order Created Successfully');
            resetForm();
            onClose();
        } catch (error: any) {
            console.error("Failed to create work order:", error);
            const errMsg = error.response?.data?.message || error.message || 'Unknown error';
            toast.error(`System Blockade: ${Array.isArray(errMsg) ? errMsg.join(', ') : errMsg}`);
        }
    };

    const assetList = Array.isArray(assets) ? assets : (assets as any)?.items || [];
    const locationList = Array.isArray(locations) ? locations : (locations as any)?.items || [];
    const userList = Array.isArray(users) ? users : (users as any)?.items || [];
    const teamList = Array.isArray(teams) ? teams : (teams as any)?.items || [];

    const selectedAsset = assetList.find((a: Asset) => a.id === selectedAssetId);
    const selectedLocation = locationList.find((l: Location) => l.id === selectedLocationId);
    
    // Hierarchical Locations for Dropdown
    const getHierarchicalLocations = () => {
        const result: { id: string, name: string, level: number, path: string }[] = [];
        
        const process = (parentId: string | null, level: number, currentPath: string) => {
            const children = locationList.filter((l: any) => l.parentId === parentId);
            children.forEach((child: any) => {
                const combinedPath = currentPath ? `${currentPath} > ${child.name}` : child.name;
                result.push({ 
                    id: child.id, 
                    name: child.name, 
                    level,
                    path: combinedPath
                });
                process(child.id, level + 1, combinedPath);
            });
        };
        
        process(null, 0, "");
        return result;
    };

    const hierarchicalLocations = getHierarchicalLocations();
    const filteredLocations = hierarchicalLocations.filter(l => l.name.toLowerCase().includes(locationSearch.toLowerCase()));
    const filteredAssets = assetList.filter((a: Asset) => a.name.toLowerCase().includes(assetSearch.toLowerCase()));

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(`section-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return ReactDOM.createPortal((
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            
            <div className="relative bg-[#F8FAFC] w-full max-w-[1200px] h-[95vh] sm:h-[92vh] rounded-t-[28px] sm:rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border border-white/20">
                {/* Mobile drag indicator */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>
                {/* Header */}
                <div className="bg-[#F8FAFC] px-4 sm:px-8 py-2 sm:py-3 border-b border-slate-200 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-[16px] sm:text-[22px] font-black text-[#0F172A] tracking-tight leading-tight">Create Work Order</h2>
                            <p className="hidden sm:block text-[12px] text-primary font-black uppercase tracking-widest mt-0.5">Asset Intelligence & Management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => setActiveTab('Create')} className={cn("px-3 sm:px-4 py-1.5 text-[11px] sm:text-[12px] font-bold rounded-lg transition-all", activeTab === 'Create' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}>Create</button>
                            <button onClick={() => setActiveTab('Templates')} className={cn("px-3 sm:px-4 py-1.5 text-[11px] sm:text-[12px] font-bold rounded-lg transition-all", activeTab === 'Templates' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}>Templates</button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col sm:flex-row overflow-hidden bg-white">
                    {activeTab === 'Create' ? (
                        <>
                            {/* Mobile Section Nav — horizontal scrollable pills */}
                            <div className="sm:hidden bg-slate-50 border-b border-slate-100 px-3 py-2 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
                                {sections.map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-[11px] font-black transition-all shrink-0",
                                            activeSection === section.id
                                                ? "bg-primary text-white shadow-md shadow-primary/30"
                                                : "bg-white border border-slate-200 text-slate-500"
                                        )}
                                    >
                                        {section.icon}
                                        {section.label}
                                    </button>
                                ))}
                            </div>

                            {/* Desktop Side Navigation */}
                            <div className="hidden sm:flex w-[260px] bg-slate-50 border-r border-slate-100 p-6 flex-col gap-2 overflow-y-auto custom-scrollbar">
                                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sections</p>
                                {sections.map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-[13px]",
                                            activeSection === section.id 
                                                ? "bg-primary/10 text-primary" 
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-xl transition-colors", activeSection === section.id ? "bg-white shadow-sm" : "bg-slate-50")}>
                                            {section.icon}
                                        </div>
                                        {section.label}
                                    </button>
                                ))}
                                
                                <div className="mt-auto pt-6 border-t border-slate-50">
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <p className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                            Data Integrity
                                        </p>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-primary h-full transition-all duration-500" 
                                                style={{ width: `${(title ? 33 : 0) + (category ? 33 : 0) + (selectedAssetId ? 34 : 0)}%` }} 
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Complete required fields to achieve 100% readiness.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Scrollable Form */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar bg-slate-50/50 shadow-[inset_0_-20px_40px_-20px_rgba(0,0,0,0.05)]" id="modal-form-content">
                                {/* Section Details */}
                                <section id="section-details" className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-[20px] font-black text-black">Basic Information</h3>
                                        <p className="text-[13px] text-slate-900 font-bold">Provide the core details for this maintenance operation.</p>
                                    </div>
                                    <div className="bg-white p-4 sm:p-8 rounded-[16px] sm:rounded-[24px] border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                                                Work Order Title <span className="text-red-500">*</span>
                                                {title && <Check className="w-4 h-4 text-emerald-500" />}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="E.g. Monthly maintenance for HVAC System B"
                                                className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-[15px] focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-primary transition-all font-bold text-slate-900 placeholder:text-slate-500"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                            />
                                        </div>
                                        {fieldConf('description') !== 'Hidden' && <div className="space-y-2">
                                            <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                                                Detailed Description
                                                {fieldConf('description') === 'Required' && <span className="text-red-500">*</span>}
                                            </label>
                                            <textarea
                                                rows={4}
                                                placeholder="Outline the steps, potential risks, and expected outcome..."
                                                className="w-full px-5 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-[15px] focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-primary transition-all font-bold text-slate-900 placeholder:text-slate-300 resize-none"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </div>}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="space-y-2 relative">
                                                <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight">Category</label>
                                                <button onClick={() => toggleDropdown('category')} className="w-full flex items-center justify-between px-5 py-3.5 bg-white border-2 border-slate-400 rounded-2xl group hover:border-slate-500 transition-all">
                                                    <span className={cn("text-[14px] font-bold", category ? "text-slate-900" : "text-slate-400")}>{category || "Select category"}</span>
                                                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", dropdowns.category && "rotate-180")} />
                                                </button>
                                                {dropdowns.category && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-2xl shadow-2xl z-[50] py-2 animate-in slide-in-from-top-2 duration-200">
                                                        {categories.map(cat => (
                                                            <button key={cat} onClick={() => { setCategory(cat); toggleDropdown('category'); }} className="w-full text-left px-5 py-3 text-[14px] font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-all">{cat}</button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {fieldConf('priority') !== 'Hidden' && <div className="space-y-2 relative">
                                                <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                                                    Priority Level
                                                    {fieldConf('priority') === 'Required' && <span className="text-red-500">*</span>}
                                                </label>
                                                <button onClick={() => toggleDropdown('priority')} className="w-full flex items-center justify-between px-5 py-3.5 bg-white border-2 border-slate-400 rounded-2xl group hover:border-slate-500 transition-all">
                                                    <div className="flex items-center gap-2">
                                                        {priorities.find(p => p.label === priority)?.icon}
                                                        <span className={cn("px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider", priorities.find(p => p.label === priority)?.color)}>{priority}</span>
                                                    </div>
                                                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", dropdowns.priority && "rotate-180")} />
                                                </button>
                                                {dropdowns.priority && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-2xl shadow-2xl z-[50] py-2">
                                                        {priorities.map(p => (
                                                            <button 
                                                                key={p.label} 
                                                                id={`priority-${p.label.toLowerCase()}`}
                                                                onClick={() => { setPriority(p.label); toggleDropdown('priority'); }} 
                                                                className="w-full flex items-center justify-between px-5 py-3 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                                            >
                                                                <span className={cn("px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider", p.color)}>{p.label}</span>
                                                                {priority === p.label && <Check className="w-4 h-4 text-primary" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>}
                                        </div>
                                        {category === 'Emergency' && (
                                            <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-[14px] font-black text-red-900 flex items-center gap-2">
                                                        <ShieldAlert className="w-4 h-4 text-red-500" />
                                                        Emergency Stop & Halt Production
                                                    </h4>
                                                    <p className="text-[12px] text-red-700 font-medium mt-1 max-w-[80%]">
                                                        Enabling this will recursively flag this asset and its parent hierarchy as EMERGENCY_STOP and initiate an immediate LOTO tag-out.
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => setHaltProduction(!haltProduction)}
                                                    className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none", haltProduction ? "bg-red-500" : "bg-red-200")}
                                                >
                                                    <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", haltProduction ? "translate-x-5" : "translate-x-0")} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Photos Section */}
                                <section id="section-photos" className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-[20px] font-black text-black">Photos</h3>
                                        <p className="text-[13px] text-slate-900 font-bold">Attach before/after images or evidence of the issue.</p>
                                    </div>
                                    <div className="bg-white p-4 sm:p-8 rounded-[16px] sm:rounded-[24px] border border-slate-200 shadow-sm space-y-4 sm:space-y-5">
                                        {/* Upload Zone */}
                                        <div
                                            className="relative border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                            onClick={() => photoInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-indigo-50/50'); }}
                                            onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-indigo-50/50'); }}
                                            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-indigo-50/50'); handleAddPhotos(e.dataTransfer.files); }}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Camera className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[14px] font-black text-slate-700">Drop images here or <span className="text-primary underline underline-offset-2">browse</span></p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-1">PNG, JPG, WEBP up to 20MB each</p>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl">
                                                <Upload className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[12px] font-black text-primary uppercase tracking-wider">Upload Photos</span>
                                            </div>
                                            <input
                                                ref={photoInputRef}
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => handleAddPhotos(e.target.files)}
                                            />
                                        </div>

                                        {/* Preview Grid */}
                                        {photoPreviews.length > 0 && (
                                            <div className="grid grid-cols-4 gap-4">
                                                {photoPreviews.map((src, i) => (
                                                    <div key={i} className="relative group rounded-2xl overflow-hidden border-2 border-slate-100 aspect-square shadow-sm">
                                                        <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleRemovePhoto(i); }}
                                                                className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="absolute bottom-2 left-2 right-2">
                                                            <p className="text-[10px] text-white font-bold truncate drop-shadow bg-black/40 rounded px-1.5 py-0.5">{photos[i]?.name}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Add more slot */}
                                                <button
                                                    onClick={() => photoInputRef.current?.click()}
                                                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-indigo-50/20 transition-all"
                                                >
                                                    <ImageIcon className="w-5 h-5 text-slate-300" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Add More</span>
                                                </button>
                                            </div>
                                        )}

                                        {photos.length > 0 && (
                                            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-[12px] font-bold text-slate-600 flex items-center gap-2">
                                                    <Camera className="w-3.5 h-3.5 text-primary" />
                                                    {photos.length} photo{photos.length !== 1 ? 's' : ''} selected — will upload after save
                                                </span>
                                                <button onClick={() => { setPhotos([]); setPhotoPreviews([]); }} className="text-[11px] font-black text-red-400 hover:text-red-600 uppercase tracking-wider transition-colors">Clear All</button>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Section Specs */}
                                <section id="section-specs" className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-[20px] font-black text-black">Job Specifications</h3>
                                        <p className="text-[13px] text-slate-900 font-bold">Connect this work order to specific equipment and locations.</p>
                                    </div>
                                    <div className="bg-white p-4 sm:p-8 rounded-[16px] sm:rounded-[24px] border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="space-y-2 relative">
                                                <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight">Asset</label>
                                                <button onClick={() => toggleDropdown('asset')} className="w-full flex items-center justify-between px-5 py-4 bg-white border-2 border-slate-400 rounded-2xl hover:border-slate-500 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                                            <Wrench className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                        <span className={cn("text-[14px] font-bold", selectedAsset ? "text-slate-900" : "text-slate-400")}>{selectedAsset?.name || "Scan or Find Asset"}</span>
                                                    </div>
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                </button>
                                                {dropdowns.asset && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-2xl shadow-2xl z-[60] overflow-hidden flex flex-col">
                                                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                                                            <div className="relative">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                                <input className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-medium outline-none" placeholder="Search assets..." value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} autoFocus />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                                            {filteredAssets.length === 0 ? (
                                                                <div className="px-5 py-8 text-center text-slate-400 text-[13px] font-medium italic">No assets found</div>
                                                            ) : (
                                                                filteredAssets.map((a: Asset) => (
                                                                    <button key={a.id} onClick={() => { setSelectedAssetId(a.id); toggleDropdown('asset'); }} className="w-full text-left px-5 py-3.5 text-[13px] font-bold text-slate-600 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between">
                                                                        <span>{a.name} <span className="text-[10px] text-slate-400 ml-2">SN: {a.serialNumber || 'N/A'}</span></span>
                                                                        {selectedAssetId === a.id && <Check className="w-4 h-4 text-primary" />}
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2 relative">
                                                <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight">Location</label>
                                                <button onClick={() => toggleDropdown('location')} className="w-full flex items-center justify-between px-5 py-4 bg-white border-2 border-slate-400 rounded-2xl hover:border-slate-500 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                        <span className={cn("text-[14px] font-bold", selectedLocation ? "text-slate-900" : "text-slate-400")}>{selectedLocation?.name || "Select Location"}</span>
                                                    </div>
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                </button>
                                                {dropdowns.location && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-2xl shadow-2xl z-[60] overflow-hidden flex flex-col">
                                                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                                                            <div className="relative">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                                <input className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-medium outline-none" placeholder="Search locations..." value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} autoFocus />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                                            {filteredLocations.length === 0 ? (
                                                                <div className="px-5 py-8 text-center text-slate-400 text-[13px] font-medium italic">No locations found</div>
                                                            ) : (
                                                                filteredLocations.map((l: { id: string, name: string, level: number, path: string }) => (
                                                                    <button 
                                                                        key={l.id} 
                                                                        onClick={() => { setSelectedLocationId(l.id); toggleDropdown('location'); }} 
                                                                        className="w-full text-left px-5 py-3.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between group transition-all"
                                                                        style={{ paddingLeft: `${(l.level * 16) + 20}px` }}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span className={cn("text-[13px] font-bold transition-colors", selectedLocationId === l.id ? "text-primary" : "text-slate-700 group-hover:text-primary")}>
                                                                                {locationSearch ? l.path : l.name}
                                                                            </span>
                                                                            {!locationSearch && l.level > 0 && (
                                                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">Sub-Location</span>
                                                                            )}
                                                                        </div>
                                                                        {selectedLocationId === l.id && <Check className="w-4 h-4 text-primary stroke-[3px]" />}
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section Dates */}
                                <section id="section-dates" className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-[20px] font-black text-black">Timeline & Planning</h3>
                                        <p className="text-[13px] text-slate-900 font-bold">Set scheduling parameters and time allocation.</p>
                                    </div>
                                    <div className="bg-white p-4 sm:p-8 rounded-[16px] sm:rounded-[24px] border border-slate-200 shadow-sm space-y-4 sm:space-y-8">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight">Deployment Date</label>
                                                <div className="relative group">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black group-focus-within:text-primary transition-colors pointer-events-none" />
                                                    <input type="datetime-local" className="w-full pl-12 pr-5 py-3.5 bg-white border-2 border-slate-400 rounded-2xl text-[14px] font-black text-black focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer shadow-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight">SLA Due Date</label>
                                                <div className="relative group">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black group-focus-within:text-red-500 transition-colors pointer-events-none" />
                                                    <input type="datetime-local" className="w-full pl-12 pr-5 py-3.5 bg-white border-2 border-slate-400 rounded-2xl text-[14px] font-black text-black focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer shadow-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight">Estimated Labor Duration <span className="text-[10px] text-slate-400 ml-1 font-bold">(In Hours)</span></label>
                                            <div className="relative group">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black group-focus-within:text-primary transition-colors pointer-events-none" />
                                                <input type="number" step="0.5" placeholder="0.0" className="w-full pl-12 pr-5 py-3.5 bg-white border-2 border-slate-400 rounded-2xl text-[15px] font-black text-black focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm placeholder:text-slate-500" value={duration} onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))} />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section Assignment */}
                                <section id="section-assignment" className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-[20px] font-black text-black">Assign Operations</h3>
                                        <p className="text-[13px] text-slate-900 font-bold">Designate the primary technician and operational team.</p>
                                    </div>
                                    <div className="bg-white p-4 sm:p-8 rounded-[16px] sm:rounded-[24px] border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                        <div className="space-y-2 relative">
                                            <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight">Lead Technician</label>
                                            <button onClick={() => toggleDropdown('assignee')} className="w-full flex items-center justify-between px-5 py-4 bg-white border-2 border-slate-400 rounded-2xl hover:border-slate-500 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                                                        <Users className="w-4 h-4 transition-transform group-hover:scale-110" />
                                                    </div>
                                                    <span className={cn("text-[14px] font-bold", primaryAssigneeId ? "text-slate-900" : "text-slate-400")}>
                                                        {userList.find((u: any) => u.id === primaryAssigneeId || u.userOrgId === primaryAssigneeId)?.name || "Assign Member"}
                                                    </span>
                                                </div>
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            </button>
                                            {dropdowns.assignee && (
                                                <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-2xl shadow-2xl z-[50] py-2 max-h-64 overflow-y-auto custom-scrollbar">
                                                    <button onClick={() => { setPrimaryAssigneeId('unassigned'); toggleDropdown('assignee'); }} className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 transition-all border-b border-slate-50">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold shadow-sm">U</div>
                                                        <span className="text-[14px] font-bold text-slate-600">Unassigned</span>
                                                        {primaryAssigneeId === 'unassigned' && <Check className="w-4 h-4 text-primary ml-auto" />}
                                                    </button>
                                                    {userList.map((u: User) => (
                                                        <button key={u.userOrgId || u.id} onClick={() => { setPrimaryAssigneeId(u.userOrgId || u.id); toggleDropdown('assignee'); }} className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 transition-all">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-bold shadow-sm">{u.name[0]}</div>
                                                            <span className="text-[14px] font-bold text-slate-600">{u.name}</span>
                                                            {(primaryAssigneeId === u.id || primaryAssigneeId === u.userOrgId) && <Check className="w-4 h-4 text-primary ml-auto" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2 relative">
                                            <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight">Maintenance Team</label>
                                            <button onClick={() => toggleDropdown('team')} className="w-full flex items-center justify-between px-5 py-4 bg-white border-2 border-slate-400 rounded-2xl hover:border-slate-500 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                                                        <Users className="w-4 h-4 text-emerald-500" />
                                                    </div>
                                                    <span className={cn("text-[14px] font-bold", teamId ? "text-slate-900" : "text-slate-400")}>
                                                        {teamList.find((t: any) => t.id === teamId)?.name || "Assign Team"}
                                                    </span>
                                                </div>
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            </button>
                                            {dropdowns.team && (
                                                <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-2xl shadow-2xl z-[50] py-2 max-h-64 overflow-y-auto custom-scrollbar">
                                                    {teamList.map((t: Team) => (
                                                        <button key={t.id} onClick={() => { setTeamId(t.id); toggleDropdown('team'); }} className="w-full text-left px-5 py-3.5 hover:bg-slate-50 flex items-center justify-between transition-all">
                                                            <span className="text-[14px] font-bold text-slate-600">{t.name}</span>
                                                            {teamId === t.id && <Check className="w-4 h-4 text-primary" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {/* Additional Assignees */}
                                        <div className="col-span-2 space-y-2 relative">
                                            <label className="text-[13px] font-black text-slate-950 uppercase tracking-tight">Additional Assignee(s)</label>
                                            <button onClick={() => toggleDropdown('additionalAssignee')} className="w-full flex items-center justify-between px-5 py-4 bg-white border-2 border-slate-400 rounded-2xl hover:border-slate-500 transition-all">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {additionalAssigneeIds.length === 0 ? (
                                                        <span className="text-[14px] font-bold text-slate-400">Select additional technicians...</span>
                                                    ) : (
                                                        additionalAssigneeIds.map(id => {
                                                            const u = userList.find((u: any) => u.id === id || u.userOrgId === id);
                                                            return u ? (
                                                                <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-primary rounded-lg text-[12px] font-black">
                                                                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black">{u.name[0]}</span>
                                                                    {u.name}
                                                                    <button onClick={(e) => { e.stopPropagation(); setAdditionalAssigneeIds(prev => prev.filter(pid => pid !== id)); }} className="ml-0.5 hover:text-red-500 transition-colors">
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            ) : null;
                                                        })
                                                    )}
                                                </div>
                                                <ChevronDown className={cn("w-4 h-4 text-slate-400 flex-shrink-0 transition-transform", dropdowns.additionalAssignee && "rotate-180")} />
                                            </button>
                                            {dropdowns.additionalAssignee && (
                                                <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-2xl shadow-2xl z-[50] py-2 max-h-64 overflow-y-auto custom-scrollbar">
                                                    {userList
                                                        .filter((u: any) => u.id !== primaryAssigneeId && u.userOrgId !== primaryAssigneeId)
                                                        .map((u: User) => {
                                                            const uid = u.userOrgId || u.id;
                                                            const isSelected = additionalAssigneeIds.includes(uid);
                                                            return (
                                                                <button
                                                                    key={uid}
                                                                    onClick={() => {
                                                                        setAdditionalAssigneeIds(prev =>
                                                                            isSelected ? prev.filter(id => id !== uid) : [...prev, uid]
                                                                        );
                                                                    }}
                                                                    className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 transition-all"
                                                                >
                                                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shadow-sm", isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary")}>{u.name[0]}</div>
                                                                    <span className="text-[14px] font-bold text-slate-600 flex-1">{u.name}</span>
                                                                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                                                                </button>
                                                            );
                                                        })
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Section Tasks */}
                                <section id="section-tasks" className="space-y-6 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-[20px] font-black text-black">Tasks & Checklists</h3>
                                            <p className="text-[13px] text-slate-900 font-bold">Attach a saved checklist and/or add inline tasks.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <button
                                                    onClick={() => toggleDropdown('checklist')}
                                                    className="px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[13px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-100 transition-all"
                                                >
                                                    <ClipboardList className="w-4 h-4" />
                                                    {selectedChecklistId ? 'Change Checklist' : 'Add Checklist'}
                                                </button>
                                                {/* Checklist Dropdown - existing logic remains same */}
                                                {dropdowns.checklist && (
                                                    <div className="absolute top-full right-0 mt-2 w-[340px] popover-solid rounded-2xl shadow-2xl z-[60] overflow-hidden flex flex-col animate-in slide-in-from-top-2 duration-200">
                                                        {/* ... (existing dropdown content kept) ... */}
                                                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Select a Saved Checklist</p>
                                                            <div className="relative">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                                <input className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-medium outline-none" placeholder="Search checklists..." value={checklistSearch} onChange={(e) => setChecklistSearch(e.target.value)} autoFocus />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
                                                            {(checklists as Checklist[]).filter(c => c.title.toLowerCase().includes(checklistSearch.toLowerCase())).map((cl: Checklist) => (
                                                                <button key={cl.id} onClick={() => { setSelectedChecklistId(cl.id); setChecklistSearch(''); toggleDropdown('checklist'); }} className="w-full text-left px-5 py-3.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center justify-between group transition-all">
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className={cn("text-[13px] font-bold transition-colors", selectedChecklistId === cl.id ? "text-primary" : "text-slate-700 group-hover:text-primary")}>{cl.title}</span>
                                                                        <span className="text-[11px] text-slate-400 font-medium">{cl._count?.items ?? cl.items?.length ?? 0} items</span>
                                                                    </div>
                                                                    {selectedChecklistId === cl.id && <Check className="w-4 h-4 text-primary stroke-[3px]" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={addTask}
                                                className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-[13px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-100 transition-all border border-primary/20 shadow-sm"
                                            >
                                                <Plus className="w-4 h-4" /> Add Task
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {tasks.length === 0 && !selectedChecklistId && (
                                            <div className="bg-white p-12 rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                                                    <ClipboardList className="w-8 h-8" />
                                                </div>
                                                <p className="text-[14px] font-black text-slate-400 italic uppercase tracking-widest">No protocols currently active for this mission.</p>
                                                <button onClick={addTask} className="mt-4 text-[13px] font-black text-primary hover:underline uppercase tracking-widest">Add your first task</button>
                                            </div>
                                        )}

                                        {selectedChecklistId && (() => {
                                            const cl = (checklists as Checklist[]).find(c => c.id === selectedChecklistId);
                                            if (!cl) return null;
                                            return (
                                                <div className="flex items-center justify-between px-6 py-5 bg-emerald-50 border-2 border-emerald-200 rounded-[28px] shadow-sm animate-in zoom-in-95 duration-300">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                                                            <ClipboardList className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[16px] font-black text-emerald-800 italic uppercase">Procedure: {cl.title}</p>
                                                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">{cl._count?.items ?? cl.items?.length ?? 0} Inspection Items Locked</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setSelectedChecklistId(null)} className="p-3 text-emerald-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><X className="w-5 h-5" /></button>
                                                </div>
                                            );
                                        })()}

                                        <Reorder.Group axis="y" values={tasks} onReorder={setTasks} className="space-y-6">
                                            {tasks.map((task) => (
                                                <Reorder.Item key={task.id} value={task} className="relative group/task">
                                                    <div className="p-8 pb-10 bg-white border border-slate-200 rounded-[32px] space-y-8 relative overflow-hidden hover:border-primary/30 transition-all shadow-sm">
                                                        <div className="flex items-start gap-4">
                                                            {/* Grip Handle */}
                                                            <div className="mt-4 text-slate-400 cursor-grab active:cursor-grabbing hover:bg-slate-50 p-2 rounded-xl transition-all">
                                                                <GripVertical className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1 space-y-4">
                                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                                                <div className="flex-1 relative group/input">
                                                                    <input 
                                                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-300 rounded-[22px] text-[15px] font-black text-slate-800 focus:bg-white focus:border-primary outline-none transition-all placeholder:text-slate-300 placeholder:italic pr-12"
                                                                        placeholder="Describe the specialized task..."
                                                                        value={task.text}
                                                                        onChange={(e) => updateTask(task.id, { text: e.target.value })}
                                                                    />
                                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within/input:opacity-100 transition-opacity">
                                                                        <CircleCheck className="w-5 h-5 text-primary" />
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="relative group/type">
                                                                    <select 
                                                                        className="appearance-none px-8 py-4 bg-white border-2 border-slate-300 rounded-[22px] text-[15px] font-black text-slate-700 outline-none focus:border-primary transition-all cursor-pointer pr-12"
                                                                        value={task.type}
                                                                        onChange={(e) => updateTask(task.id, { type: e.target.value })}
                                                                    >
                                                                        <option>Inspection</option>
                                                                        <option>Number</option>
                                                                        <option>Status</option>
                                                                        <option>Text</option>
                                                                        <option>Part</option>
                                                                    </select>
                                                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/type:rotate-180 transition-transform" />
                                                                </div>

                                                                <button onClick={() => removeTask(task.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>

                                                            {/* Action Row */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-[14px] text-[12px] font-[900] uppercase tracking-wider hover:bg-blue-50 transition-all border-2 border-blue-100 shadow-sm">
                                                                        <Box className="w-4 h-4" />
                                                                        ADD ASSET
                                                                    </button>
                                                                    
                                                                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border-2 border-slate-100 shadow-sm">
                                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-black text-slate-600">
                                                                            {primaryAssigneeId ? users.find(u => u.id === primaryAssigneeId)?.name?.[0] : 'J'}
                                                                        </div>
                                                                        <span className="text-[13px] font-black text-slate-500 pr-2">{primaryAssigneeId ? users.find(u => u.id === primaryAssigneeId)?.name : 'jason daniel'}</span>
                                                                        <button className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                                                                            <Edit3 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>

                                                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-[14px] text-[12px] font-[900] uppercase tracking-wider hover:bg-blue-50 transition-all border-2 border-blue-100 shadow-sm">
                                                                        <Wrench className="w-4 h-4" />
                                                                        INSTRUCTIONS
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center gap-3 pr-2">
                                                                    <span className="text-[14px] font-black text-slate-400">Required</span>
                                                                    <button 
                                                                        onClick={() => updateTask(task.id, { isRequired: !task.isRequired })}
                                                                        className={cn(
                                                                            "w-12 h-6 rounded-full transition-all relative",
                                                                            task.isRequired ? "bg-blue-500" : "bg-slate-200"
                                                                        )}
                                                                    >
                                                                        <div className={cn(
                                                                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                                                            task.isRequired ? "left-7" : "left-1"
                                                                        )} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Expanded Requirements */}
                                                            <div className="border-t border-slate-50 pt-6">
                                                                <button 
                                                                    onClick={() => updateTask(task.id, { isExpanded: !task.isExpanded })}
                                                                    className="w-full flex items-center justify-between group/expand"
                                                                >
                                                                    <span className="text-[15px] font-[900] text-slate-900">Additional Requirements</span>
                                                                    <ChevronDown className={cn("w-6 h-6 text-slate-300 group-hover/expand:text-slate-600 transition-all", !task.isExpanded && "-rotate-90")} />
                                                                </button>
                                                                
                                                                {task.isExpanded && (
                                                                    <div className="mt-8 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                        {[
                                                                            { id: 'notes', label: 'Notes', desc: 'Require technician to add a note with this task.', icon: <Type className="w-5 h-5" /> },
                                                                            { id: 'photo', label: 'Photo', desc: 'Require technician to upload images (up to 20).', icon: <ImageIcon className="w-5 h-5" /> },
                                                                            { id: 'url', label: 'URL', desc: 'Require technician to attach a relevant link.', icon: <LinkIcon className="w-5 h-5" /> },
                                                                            { id: 'reading', label: 'Meter Reading', desc: 'Require technician to record a meter reading.', icon: <Gauge className="w-5 h-5" /> },
                                                                            { id: 'signature', label: 'Signature', desc: 'Require technician to sign off on this task.', icon: <FileSignature className="w-5 h-5" /> },
                                                                            { id: 'barcode', label: 'Barcode', desc: 'Require technician to scan a barcode/QR code.', icon: <Barcode className="w-5 h-5" /> }
                                                                        ].map((item) => (
                                                                            <div key={item.id} className="p-5 bg-[#fdfdfd] border border-slate-100 rounded-[20px] flex items-center justify-between hover:border-slate-200 transition-all shadow-sm">
                                                                                <div className="flex items-center gap-5">
                                                                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100/50">
                                                                                        {item.icon}
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-[15px] font-[900] text-slate-900">{item.label}</p>
                                                                                        <p className="text-[13px] font-bold text-slate-400">{item.desc}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <button 
                                                                                    onClick={() => updateTask(task.id, { requirements: { ...task.requirements, [item.id]: !task.requirements[item.id] } })}
                                                                                    className={cn(
                                                                                        "w-12 h-6 rounded-full transition-all relative",
                                                                                        task.requirements?.[item.id] ? "bg-blue-500" : "bg-slate-200"
                                                                                    )}
                                                                                >
                                                                                    <div className={cn(
                                                                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                                                                        task.requirements?.[item.id] ? "left-7" : "left-1"
                                                                                    )} />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                        </Reorder.Group>
                                    </div>
                                </section>

                                {/* Documents & Reference Section */}
                                <section id="section-documents" className="space-y-6 pb-4">
                                    <div className="space-y-1">
                                        <h3 className="text-[20px] font-black text-black">Documents & Reference</h3>
                                        <p className="text-[13px] text-slate-900 font-bold">Attach manuals, SOPs, safety data sheets, or any reference files.</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm space-y-5">
                                        {/* Upload Zone */}
                                        <div
                                            className="relative border-2 border-dashed border-slate-300 rounded-2xl p-7 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-indigo-50/20 transition-all cursor-pointer group"
                                            onClick={() => documentInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-indigo-50/40'); }}
                                            onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-indigo-50/40'); }}
                                            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-indigo-50/40'); handleAddDocuments(e.dataTransfer.files); }}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Paperclip className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[14px] font-black text-slate-700">Drop files here or <span className="text-primary underline underline-offset-2">browse</span></p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-1">PDF, DOCX, XLSX, PPT, ZIP and more · Up to 20MB</p>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl group-hover:bg-primary/10 transition-colors">
                                                <Upload className="w-3.5 h-3.5 text-slate-500 group-hover:text-primary transition-colors" />
                                                <span className="text-[12px] font-black text-slate-500 group-hover:text-primary uppercase tracking-wider transition-colors">Upload Files</span>
                                            </div>
                                            <input
                                                ref={documentInputRef}
                                                type="file"
                                                multiple
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip,.rar,.7z"
                                                onChange={(e) => handleAddDocuments(e.target.files)}
                                            />
                                        </div>

                                        {/* File List */}
                                        {documents.length > 0 ? (
                                            <div className="space-y-2">
                                                {documents.map((doc, i) => {
                                                    const icon = getDocIcon(doc);
                                                    return (
                                                        <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-200 transition-all">
                                                            <div className={`w-10 h-10 rounded-xl ${icon.bg} flex items-center justify-center flex-shrink-0`}>
                                                                <span className={`text-[10px] font-black ${icon.text}`}>{icon.label}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[13px] font-bold text-slate-800 truncate">{doc.name}</p>
                                                                <p className="text-[11px] text-slate-400 font-medium">{formatFileSize(doc.size)}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveDocument(i)}
                                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                                title="Remove file"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                                                    <span className="text-[12px] font-bold text-slate-600 flex items-center gap-2">
                                                        <File className="w-3.5 h-3.5 text-primary" />
                                                        {documents.length} file{documents.length !== 1 ? 's' : ''} staged — will upload after save
                                                    </span>
                                                    <button onClick={() => setDocuments([])} className="text-[11px] font-black text-red-400 hover:text-red-600 uppercase tracking-wider transition-colors">Clear All</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 py-1">
                                                <File className="w-4 h-4" />
                                                <span className="text-[12px] font-medium italic">No reference files attached yet.</span>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Compliance & Safety Section */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pb-4">
                                    <div 
                                        onClick={() => setRequiresLOTO(!requiresLOTO)}
                                        className={cn(
                                            "p-6 rounded-[24px] border-2 transition-all cursor-pointer group relative overflow-hidden",
                                            requiresLOTO ? "bg-red-50 border-red-200" : "bg-white border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", requiresLOTO ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-slate-50 text-slate-400")}>
                                                <ShieldAlert className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className={cn("text-[15px] font-black italic uppercase", requiresLOTO ? "text-red-700" : "text-slate-700")}>LOTO Required</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Safety Lock-out/Tag-out</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => setIsDowntimeEvent(!isDowntimeEvent)}
                                        className={cn(
                                            "p-6 rounded-[24px] border-2 transition-all cursor-pointer group relative overflow-hidden",
                                            isDowntimeEvent ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", isDowntimeEvent ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-slate-50 text-slate-400")}>
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className={cn("text-[15px] font-black italic uppercase", isDowntimeEvent ? "text-amber-700" : "text-slate-700")}>Downtime Event</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asset Health Impact</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase Order Section */}
                                <section id="section-purchase-order" className="space-y-6 pb-4">
                                    <div className="space-y-1">
                                        <h3 className="text-[20px] font-black text-black">Purchase Order</h3>
                                        <p className="text-[13px] text-slate-900 font-bold">Link an existing Purchase Order to track parts procurement for this work order.</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm space-y-5">
                                        {/* Selected PO card */}
                                        {selectedPoId ? (() => {
                                            const po = (purchaseOrders as PurchaseOrder[]).find(p => p.id === selectedPoId);
                                            if (!po) return null;
                                            const statusColors: Record<string, string> = {
                                                DRAFT: 'bg-slate-100 text-slate-600',
                                                PENDING_APPROVAL: 'bg-amber-50 text-amber-700',
                                                APPROVED: 'bg-emerald-50 text-emerald-700',
                                                ORDERED: 'bg-blue-50 text-blue-700',
                                                RECEIVED: 'bg-teal-50 text-teal-700',
                                                COMPLETED: 'bg-green-50 text-green-700',
                                                DENIED: 'bg-red-50 text-red-600',
                                                CANCELLED: 'bg-slate-50 text-slate-400',
                                            };
                                            return (
                                                <div className="flex items-center justify-between px-5 py-4 bg-indigo-50 border-2 border-primary/30 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow shadow-primary/30">
                                                            <Package className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[14px] font-black text-primary">{po.number}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {po.vendor && <span className="text-[11px] text-slate-500 font-medium">{po.vendor.name}</span>}
                                                                <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider', statusColors[po.status] || 'bg-slate-100 text-slate-600')}>{po.status.replace('_', ' ')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedPoId(null)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Unlink PO"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })() : (
                                            <div className="flex items-center gap-2 text-slate-400 py-1">
                                                <Package className="w-4 h-4" />
                                                <span className="text-[12px] font-medium italic">No purchase order linked yet.</span>
                                            </div>
                                        )}

                                        {/* PO Picker */}
                                        <div className="relative">
                                            <button
                                                onClick={() => toggleDropdown('po')}
                                                className="w-full flex items-center justify-between px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl hover:border-primary/40 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                                        <Package className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="text-[14px] font-bold text-slate-400">
                                                        {selectedPoId ? 'Change Purchase Order...' : 'Select a Purchase Order...'}
                                                    </span>
                                                </div>
                                                <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', dropdowns.po && 'rotate-180')} />
                                            </button>

                                            {dropdowns.po && (
                                                <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-2xl shadow-2xl z-[60] overflow-hidden flex flex-col">
                                                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Purchase Order</p>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                            <input
                                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-medium outline-none"
                                                                placeholder="Search by PO number or vendor..."
                                                                value={poSearch}
                                                                onChange={(e) => setPoSearch(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                                                        {(() => {
                                                            const filtered = (purchaseOrders as PurchaseOrder[]).filter(po =>
                                                                po.number.toLowerCase().includes(poSearch.toLowerCase()) ||
                                                                (po.vendor?.name || '').toLowerCase().includes(poSearch.toLowerCase())
                                                            );
                                                            if (filtered.length === 0) {
                                                                return (
                                                                    <div className="px-5 py-8 text-center text-slate-400 text-[13px] font-medium italic">
                                                                        {purchaseOrders.length === 0 ? 'No purchase orders found.' : 'No results match your search.'}
                                                                    </div>
                                                                );
                                                            }
                                                            const statusColors: Record<string, string> = {
                                                                DRAFT: 'bg-slate-100 text-slate-500',
                                                                PENDING_APPROVAL: 'bg-amber-50 text-amber-600',
                                                                APPROVED: 'bg-emerald-50 text-emerald-600',
                                                                ORDERED: 'bg-blue-50 text-blue-600',
                                                                RECEIVED: 'bg-teal-50 text-teal-600',
                                                                COMPLETED: 'bg-green-50 text-green-600',
                                                                DENIED: 'bg-red-50 text-red-500',
                                                                CANCELLED: 'bg-slate-50 text-slate-400',
                                                            };
                                                            return filtered.map((po: PurchaseOrder) => {
                                                                const alreadyLinked = !!po.workOrderId && po.workOrderId !== selectedPoId;
                                                                const isSelected = selectedPoId === po.id;
                                                                return (
                                                                    <button
                                                                        key={po.id}
                                                                        disabled={alreadyLinked}
                                                                        onClick={() => {
                                                                            setSelectedPoId(po.id);
                                                                            setPoSearch('');
                                                                            toggleDropdown('po');
                                                                        }}
                                                                        className={cn(
                                                                            'w-full text-left px-5 py-3.5 border-b border-slate-50 last:border-0 flex items-center justify-between gap-3 transition-all',
                                                                            alreadyLinked ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50 cursor-pointer'
                                                                        )}
                                                                    >
                                                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={cn('text-[13px] font-bold truncate', isSelected ? 'text-primary' : 'text-slate-800')}>{po.number}</span>
                                                                                <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0', statusColors[po.status] || 'bg-slate-100 text-slate-500')}>{po.status.replace('_', ' ')}</span>
                                                                                {alreadyLinked && <span className="text-[10px] font-black bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Already Linked</span>}
                                                                            </div>
                                                                            <span className="text-[11px] text-slate-400 font-medium">
                                                                                {po.vendor?.name || 'No vendor'}{po.totalCost ? ` · $${po.totalCost.toLocaleString()}` : ''}
                                                                            </span>
                                                                        </div>
                                                                        {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0 stroke-[3px]" />}
                                                                    </button>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Signature Section */}
                                <div className="bg-primary p-8 rounded-[24px] shadow-xl shadow-primary/20 flex items-center justify-between text-white">
                                    <div className="space-y-1">
                                        <h3 className="text-[18px] font-black">Mandatory Completion Signature</h3>
                                        <p className="text-white/70 text-[13px] font-medium leading-loose">Verify security and quality standards by requiring technician validation upon completion.</p>
                                    </div>
                                    <button 
                                        onClick={() => setSignatureRequired(!signatureRequired)}
                                        className={cn(
                                            "px-10 py-4 rounded-2xl transition-all font-black text-[13px] uppercase tracking-[0.1em] shadow-lg",
                                            signatureRequired ? "bg-white text-primary" : "bg-primary/100/50 border-2 border-white/20 text-white"
                                        )}
                                    >
                                        {signatureRequired ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>

                                {/* Parts Section */}
                                <section id="section-parts" className="space-y-6 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-[20px] font-black text-black">Parts Inventory</h3>
                                            <p className="text-[13px] text-slate-900 font-bold">Select parts from inventory to add to this work order.</p>
                                        </div>
                                        <div className="relative">
                                            <button 
                                                type="button"
                                                onClick={() => toggleDropdown('parts')} 
                                                className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-[13px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-100 transition-all border border-primary/20 shadow-sm"
                                            >
                                                <Plus className="w-4 h-4" /> Add Parts
                                            </button>
                                            {dropdowns.parts && (
                                                <div className="absolute right-0 mt-2 w-[340px] bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl max-h-48 overflow-y-auto z-[60]">
                                                    <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Select Part to Add</p>
                                                    {allParts.length === 0 && <p className="text-[12px] text-slate-400 italic">No parts found in inventory.</p>}
                                                    {allParts.map((p: any) => (
                                                        <button 
                                                            type="button"
                                                            key={p.id} 
                                                            onClick={() => { 
                                                                addPart(p); 
                                                                toggleDropdown('parts'); 
                                                            }} 
                                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-lg text-[13px] font-bold text-slate-600 transition-all flex items-center justify-between"
                                                        >
                                                            <span>{p.name}</span>
                                                            <span className="text-[11px] text-slate-400">#{p.partNumber || 'N/A'}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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
                                                    <th className="px-6 py-4 text-[14px] font-extrabold text-slate-800"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {parts.map((p: any) => {
                                                    const actualPart = p.part || p;
                                                    const unitCost = Number(p.unitCost || actualPart?.cost || 0);
                                                    const qty = Number(p.quantity || 0);
                                                    const totalCost = Number(p.totalCost || unitCost * qty);
                                                    const locationName = actualPart?.location?.name || 'No Location';
                                                    const rawStatus = actualPart?.status || (actualPart?.quantity > (actualPart?.minQuantity || 5) ? 'In stock' : 'Non-stock');

                                                    return (
                                                        <tr 
                                                            key={p.id} 
                                                            onClick={() => setSelectedPartForInspector(actualPart)}
                                                            className="hover:bg-slate-50/20 transition-all cursor-pointer group/row"
                                                        >
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col">
                                                                    <span 
                                                                        className="text-[15px] font-bold text-blue-600 group-hover/row:underline text-left w-fit"
                                                                    >
                                                                        {p.name || actualPart?.name || 'Unknown Part'}
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
                                                            <td className="px-6 py-5">
                                                                <input 
                                                                    type="number" 
                                                                    min="1"
                                                                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-400" 
                                                                    value={qty} 
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => updatePartQuantity(p.id, Math.max(1, Number(e.target.value)))}
                                                                />
                                                            </td>
                                                            <td className="px-6 py-5 text-[15px] font-bold text-slate-700">
                                                                ${totalCost.toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <button 
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); removePart(p.id); }} 
                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {parts.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-16 text-center text-[14px] font-bold text-slate-400 italic">
                                                            No planned parts requested for this mission.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {parts.length > 0 && (
                                        <div className="flex justify-end items-center gap-3 pr-6 pt-2">
                                            <span className="text-[18px] font-black text-slate-800">Total:</span>
                                            <span className="text-[18px] font-black text-slate-900">
                                                ${parts.reduce((acc: number, p: any) => {
                                                    const actualPart = p.part || p;
                                                    const unitCost = Number(p.unitCost || actualPart?.cost || 0);
                                                    const qty = Number(p.quantity || 0);
                                                    const totalCost = Number(p.totalCost || unitCost * qty);
                                                    return acc + totalCost;
                                                }, 0).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            {/* Templates Header / Toolbar */}
                            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                                <div className="relative flex-1 max-w-[800px]">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search" 
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all font-medium"
                                    />
                                </div>
                                <button className="ml-6 px-6 py-3 bg-[#4F46E5] text-white rounded-xl text-[14px] font-bold flex items-center gap-2 hover:bg-[#4338CA] transition-all shadow-sm">
                                    <Plus className="w-4 h-4" />
                                    Add New Template
                                </button>
                            </div>
                            
                            {/* Empty State */}
                            <div className="flex-1 flex items-center justify-center p-20 bg-white">
                                <div className="max-w-md text-center">
                                    <div className="w-full h-px bg-gray-100 mb-20" />
                                    <p className="text-[15px] text-[#1E293B] font-medium">
                                        You don't have any templates yet. Click 'Add New Template' to get started.
                                    </p>
                                    <div className="w-full h-px bg-gray-100 mt-20" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-[#F8FAFC] px-4 sm:px-10 py-3 border-t border-slate-100 flex items-center justify-between z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                    <div className="hidden sm:flex items-center gap-6">
                        <div className="flex items-center gap-2 group cursor-help">
                            <Info className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                            <span className="text-[12px] text-slate-700 font-bold uppercase tracking-widest">Keyboard shortcuts active</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        {activeTab === 'Create' && (
                            <>
                                <button onClick={onClose} className="px-4 sm:px-8 py-3 text-[13px] sm:text-[14px] font-black text-slate-950 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200 sm:border-0">Discard</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!title || createWorkOrder.isPending}
                                    className={cn(
                                        "flex-1 sm:flex-none px-6 sm:px-12 py-3 sm:py-4 bg-primary text-white rounded-[16px] sm:rounded-[20px] text-[13px] sm:text-[14px] font-black shadow-xl shadow-indigo-200 transition-all active:scale-95 group",
                                        (!title || createWorkOrder.isPending) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {createWorkOrder.isPending ? "Syncing..." : "Publish Work Order"}
                                        <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                    </span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {selectedPartForInspector && (
                    <PartInspector
                        part={selectedPartForInspector}
                        onClose={() => setSelectedPartForInspector(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    ), document.body);
};
