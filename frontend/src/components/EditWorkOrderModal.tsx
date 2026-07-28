import React, { useState, useEffect, useRef } from 'react';
import { 
    X, ChevronDown, Search, Plus,
    Wrench, Calendar, Trash2, AlertCircle,
    Clock, ImageIcon, Edit3, Type, Box,
    Link as LinkIcon, FileSignature, Barcode, Gauge, Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
    useAssets, useLocations, useUsers, useTeams, usePurchaseOrders, useParts, useCategories
} from '../hooks/useData';
import type { Asset, Location, User, Team } from '../types';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { type WorkOrderSync } from '../lib/db';
import { toast } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { PartInspector } from './PartInspector';

interface EditWorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrder: WorkOrderSync;
}

export const EditWorkOrderModal: React.FC<EditWorkOrderModalProps> = ({ isOpen, onClose, workOrder }) => {
    const { updateWorkOrder, uploadFile: uploadWorkOrderFile } = useWorkOrders();
    const { data: assets = [] } = useAssets();
    const { data: locations = [] } = useLocations();
    const { data: users = [] } = useUsers();
    const { data: teams = [] } = useTeams();
    const isLocked = !!(workOrder as any)?.signatureUrl || !!(workOrder as any)?.signedById;
    const { data: purchaseOrders = [] } = usePurchaseOrders();
    const { data: allParts = [] } = useParts();
    const { data: orgCategories = [] } = useCategories('WORK_ORDER');

    // Form State
    const [title, setTitle] = useState(workOrder?.title || '');
    const [description, setDescription] = useState(workOrder?.description || '');
    const [category, setCategory] = useState(workOrder?.category || 'Corrective');
    const [priority, setPriority] = useState(workOrder?.priority || 'Medium');
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(workOrder?.assetId || null);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(workOrder?.locationId || null);
    
    // Date formatting for input type="datetime-local" (YYYY-MM-DDTHH:mm) in local timezone
    const formatDateForInput = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
    };

    const [startDate, setStartDate] = useState(formatDateForInput(workOrder?.startDate));
    const [dueDate, setDueDate] = useState(formatDateForInput(workOrder?.dueDate));
    const [duration, setDuration] = useState<number | ''>(workOrder?.estimatedHours || '');
    const [primaryAssigneeId, setPrimaryAssigneeId] = useState<string | null>(workOrder?.assignedToId || null);
    const [teamId, setTeamId] = useState<string | null>(workOrder?.assignedTeamId || null);
    
    const [photos, setPhotos] = useState<File[]>([]);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // Tasks State
    const [tasks, setTasks] = useState<any[]>(workOrder?.tasks && workOrder.tasks.length > 0 ? workOrder.tasks : [
        { id: '1', text: 'Check and record operating voltage and Amperes.', type: 'Number', status: 'Todo', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }, isExpanded: false },
        { id: '2', text: 'Check and service drain pump, if any.', type: 'Inspection', status: 'Todo', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }, isExpanded: false },
        { id: '3', text: 'Perform functional test of thermostat.', type: 'Status', status: 'Todo', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }, isExpanded: false },
        { id: '4', text: 'Check refrigerant leak in the system.', type: 'Inspection', status: 'Todo', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }, isExpanded: false },
        { id: '5', text: 'Check the refrigerant pressure.', type: 'Number', status: 'Todo', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }, isExpanded: false },
        { id: '6', text: 'check and comb dented fins of cooling coil.', type: 'Inspection', status: 'Todo', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }, isExpanded: false },
        { id: '7', text: 'Check the Insulation of the refrigerant pipe.', type: 'Inspection', status: 'Todo', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }, isExpanded: false },
        { id: '8', text: 'Check the Electrical wiring connections.', type: 'Inspection', status: 'Todo', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }, isExpanded: false },
        { id: '9', text: 'Clean electrical components', type: 'Status', status: 'Todo', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }, isExpanded: false },
        { id: '10', text: 'Check any Unusual noise and vibration of the units', type: 'Inspection', status: 'Todo', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }, isExpanded: false }
    ]);

    const [signatureRequired, setSignatureRequired] = useState(workOrder?.requiresSignature || false);
    const [selectedPoId, setSelectedPoId] = useState<string | null>(workOrder?.purchaseOrderId || null);
    const [parts, setParts] = useState<any[]>(workOrder?.partsUsed || []);
    const [technicianIds, setTechnicianIds] = useState<string[]>(workOrder?.technicians?.map((t: any) => t.user?.id || t.userId) || []);
    const [selectedPartForInspector, setSelectedPartForInspector] = useState<any | null>(null);

    
    // Dropdown Visibility
    const [dropdowns, setDropdowns] = useState({
        category: false, priority: false, asset: false, location: false, assignee: false, team: false, additionalAssignee: false, po: false, parts: false
    });

    useEffect(() => {
        if (workOrder) {
            setTitle(workOrder.title);
            setDescription(workOrder.description || '');
            setCategory(workOrder.category || 'Corrective');
            setPriority(workOrder.priority || 'Medium');
            setSelectedAssetId(workOrder.assetId || null);
            setSelectedLocationId(workOrder.locationId || null);
            setStartDate(formatDateForInput(workOrder.startDate));
            setDueDate(formatDateForInput(workOrder.dueDate));
            setDuration(workOrder.estimatedHours || '');
            setPrimaryAssigneeId(workOrder.assignedToId || null);
            setTeamId(workOrder.assignedTeamId || null);
            setTechnicianIds(workOrder.technicians?.map((t: any) => t.user?.id || t.userId) || []);
            setParts(workOrder.partsUsed || []);
            setSelectedPoId(workOrder.purchaseOrderId || null);
            // Re-populate tasks if they exist
            if (workOrder.tasks) setTasks(workOrder.tasks);
        }
    }, [workOrder, isOpen]);

    if (!isOpen) return null;

    const categories = orgCategories.length > 0 ? orgCategories.map((c: any) => c.name) : ['Preventive', 'Corrective', 'Emergency', 'Inspection', 'Safety', 'Other'];
    const priorities = [
        { label: 'None', color: 'bg-white/5 text-muted-foreground/60', icon: <AlertCircle className="w-3.5 h-3.5" /> },
        { label: 'Low', color: 'bg-blue-500/10 text-blue-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
        { label: 'Medium', color: 'bg-orange-500/10 text-orange-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
        { label: 'High', color: 'bg-red-500/10 text-red-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
        { label: 'Critical', color: 'bg-purple-500/10 text-purple-400', icon: <AlertCircle className="w-3.5 h-3.5" /> }
    ];

    const toggleDropdown = (key: keyof typeof dropdowns) => {
        setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAddPhotos = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        setPhotos(prev => [...prev, ...newFiles]);
    };

    const addTask = () => {
        setTasks(prev => [...prev, { 
            id: crypto.randomUUID(), 
            text: '', 
            type: 'Inspection', 
            status: 'Todo', 
            assignedToId: null,
            isRequired: false,
            requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false },
            isExpanded: true 
        }]);
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

    const removeTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const addPart = (part: any) => {
        if (parts.some(p => p.partId === part.id)) return;
        setParts(prev => [...prev, { partId: part.id, name: part.name, quantity: 1, part: part }]);
    };

    const updatePartQuantity = (partId: string, quantity: number) => {
        setParts(prev => prev.map(p => p.partId === partId ? { ...p, quantity } : p));
    };

    const removePart = (partId: string) => {
        setParts(prev => prev.filter(p => p.partId !== partId));
    };

    const toggleTechnician = (userId: string) => {
        setTechnicianIds(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleSave = async () => {
        if (!title) return;

        try {
            const updates: any = {
                title,
                description: description || undefined,
                priority: priority.toUpperCase(),
                category: category || undefined,
                assetId: selectedAssetId || undefined,
                locationId: selectedLocationId || undefined,
                startDate: startDate ? new Date(startDate).toISOString() : undefined,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                estimatedHours: duration !== '' ? Number(duration) : 0,
                assignedToId: primaryAssigneeId || undefined,
                assignedTeamId: teamId || undefined,
                technicianIds: technicianIds.length > 0 ? technicianIds : undefined,
                signatureRequired: signatureRequired,
                tasks: tasks.map(t => ({
                    text: t.text,
                    type: t.type,
                    status: t.status,
                    isRequired: t.isRequired,
                    requirements: t.requirements
                })),
                parts: parts.map(p => ({
                    partId: p.partId,
                    quantity: p.quantity
                }))
            };

            await updateWorkOrder.mutateAsync({ id: workOrder.id, data: updates });

            // Upload photos if any
            if (photos.length > 0) {
                await Promise.all(
                    photos.map(file => uploadWorkOrderFile.mutateAsync({ id: workOrder.id, file }))
                );
            }

            toast.success('Mission Updated Successfully');
            onClose();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            toast.error(`System Failure: ${errorMessage}`);
        }
    };

    const assetList = Array.isArray(assets) ? assets : (assets as any)?.items || [];
    const locationList = Array.isArray(locations) ? locations : (locations as any)?.items || [];
    const userList = Array.isArray(users) ? users : (users as any)?.items || [];
    const teamList = Array.isArray(teams) ? teams : (teams as any)?.items || [];

    const selectedAsset = assetList.find((a: Asset) => a.id === selectedAssetId);
    const selectedLocation = locationList.find((l: Location) => l.id === selectedLocationId);
    
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-[1200px] h-[92vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-10 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-[24px] font-black text-slate-800">Edit Work Order</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#fdfdfd]">
                    {isLocked && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 select-none">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-[13px] font-black text-amber-800">FDA 21 CFR Part 11 Compliance Lock</h4>
                                <p className="text-[12px] font-medium text-amber-700 mt-0.5">
                                    This work order is digitally signed. Editing is disabled to preserve regulatory audit integrity. If revisions are required, the work order must be formally reopened from the detail page.
                                </p>
                            </div>
                        </div>
                    )}
                    {/* Work Order Details */}
                    <section className="space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-[18px] font-black text-slate-800">Work Order Details</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Work Order Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-[15px] font-bold text-slate-800 outline-none focus:border-primary transition-all"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-[15px] font-bold text-slate-800 outline-none focus:border-primary transition-all resize-none"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 relative">
                                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                                    <button onClick={() => toggleDropdown('category')} className="w-full flex items-center justify-between px-5 py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                                        <span className="text-[14px] font-bold text-slate-700">{category}</span>
                                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", dropdowns.category && "rotate-180")} />
                                    </button>
                                    {dropdowns.category && (
                                        <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-xl shadow-xl z-50 py-2 border border-slate-100">
                                            {categories.map(cat => (
                                                <button key={cat} onClick={() => { setCategory(cat); toggleDropdown('category'); }} className="w-full text-left px-5 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-all">{cat}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Priority</label>
                                    <button onClick={() => toggleDropdown('priority')} className="w-full flex items-center justify-between px-5 py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                                        <span className="text-[14px] font-bold text-slate-700">{priority}</span>
                                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", dropdowns.priority && "rotate-180")} />
                                    </button>
                                    {dropdowns.priority && (
                                        <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-xl shadow-xl z-50 py-2 border border-slate-100">
                                            {priorities.map(p => (
                                                <button key={p.label} onClick={() => { setPriority(p.label); toggleDropdown('priority'); }} className="w-full text-left px-5 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-all">{p.label}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Photos</label>
                                <div className="border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-[#fafafa]/50">
                                    <button 
                                        onClick={() => photoInputRef.current?.click()}
                                        className="px-6 py-2.5 border border-slate-200 bg-white rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-slate-50 translate-all shadow-sm"
                                    >
                                        Upload
                                    </button>
                                    <p className="text-[13px] font-bold text-slate-400">or Drop Images</p>
                                    <input ref={photoInputRef} type="file" multiple className="hidden" onChange={(e) => handleAddPhotos(e.target.files)} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Job Specifications */}
                    <section className="space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-[18px] font-black text-slate-800">Job Specifications</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 relative">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Asset</label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Scan or Find Asset"
                                        className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:border-primary shadow-sm"
                                        value={selectedAsset?.name || ''}
                                        readOnly
                                        onClick={() => toggleDropdown('asset')}
                                    />
                                    {selectedAssetId && (
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedAssetId(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {dropdowns.asset && (
                                    <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-xl shadow-xl z-50 py-2 border border-slate-100 max-h-48 overflow-y-auto custom-scrollbar">
                                        {assetList.map((a: Asset) => (
                                            <button key={a.id} onClick={() => { setSelectedAssetId(a.id); toggleDropdown('asset'); }} className="w-full text-left px-5 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all">{a.name}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Location</label>
                                <button onClick={() => toggleDropdown('location')} className="w-full flex items-center justify-between px-5 py-3.5 bg-[#f3f4f6]/50 border border-slate-200 rounded-xl hover:bg-slate-100/50 transition-all text-left">
                                    <span className="text-[14px] font-bold text-slate-600">{selectedLocation?.name || 'Suite B'}</span>
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                </button>
                                {dropdowns.location && (
                                    <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-xl shadow-xl z-50 py-2 border border-slate-100">
                                        {locationList.map((l: Location) => (
                                            <button key={l.id} onClick={() => { setSelectedLocationId(l.id); toggleDropdown('location'); }} className="w-full text-left px-5 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all">{l.name}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Timeline */}
                    <section className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Start Date</label>
                            <div className="relative">
                                <input type="datetime-local" className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <Clock className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Due Date</label>
                            <div className="relative">
                                <input type="datetime-local" className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <Clock className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Duration (as hours)</label>
                            <input type="number" className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none" value={duration} onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))} />
                        </div>
                    </section>

                    {/* Assignment */}
                    <section className="space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-[18px] font-black text-slate-800">Assignment & Team</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 relative">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Primary Assignee</label>
                                <button onClick={() => toggleDropdown('assignee')} className="w-full flex items-center justify-between px-5 py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-black">
                                            {userList.find((u: any) => u.id === primaryAssigneeId || u.userOrgId === primaryAssigneeId)?.name[0] || 'Unassigned'[0]}
                                        </div>
                                        <span className="text-[14px] font-bold text-slate-700">
                                            {userList.find((u: any) => u.id === primaryAssigneeId || u.userOrgId === primaryAssigneeId)?.name || 'Unassigned'}
                                        </span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                </button>
                                {dropdowns.assignee && (
                                    <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-xl shadow-xl z-50 py-2 border border-slate-100">
                                        {userList.map((u: User) => (
                                            <button key={u.id} onClick={() => { setPrimaryAssigneeId(u.userOrgId || u.id); toggleDropdown('assignee'); }} className="w-full text-left px-5 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">{u.name[0]}</div>
                                                {u.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Team</label>
                                <button onClick={() => toggleDropdown('team')} className="w-full flex items-center justify-between px-5 py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-left">
                                    <span className="text-[14px] font-bold text-slate-700">
                                        {teamList.find((t: any) => t.id === teamId)?.name || ''}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                </button>
                                {dropdowns.team && (
                                    <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-xl shadow-xl z-50 py-2 border border-slate-100">
                                        {teamList.map((t: Team) => (
                                            <button key={t.id} onClick={() => { setTeamId(t.id); toggleDropdown('team'); }} className="w-full text-left px-5 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all">{t.name}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="col-span-2 space-y-2 relative">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Additional Assignee(s)</label>
                                <div 
                                    onClick={() => toggleDropdown('additionalAssignee')}
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl min-h-[50px] flex flex-wrap items-center gap-2 cursor-pointer hover:border-slate-300 transition-all"
                                >
                                    {technicianIds.length === 0 && <span className="text-[14px] text-slate-300 font-bold">Select...</span>}
                                    {technicianIds.map(tid => {
                                        const u = userList.find((u: any) => (u.userOrgId || u.id) === tid);
                                        return (
                                            <div key={tid} className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[12px] font-black">
                                                {u?.name || 'User'}
                                                <X onClick={(e) => { e.stopPropagation(); toggleTechnician(tid); }} className="w-3 h-3 hover:text-blue-800" />
                                            </div>
                                        );
                                    })}
                                    <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
                                </div>
                                {dropdowns.additionalAssignee && (
                                    <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-xl shadow-xl z-50 py-2 border border-slate-100 max-h-48 overflow-y-auto">
                                        {userList.map((u: User) => (
                                            <button 
                                                key={u.id} 
                                                onClick={() => toggleTechnician(u.userOrgId || u.id)} 
                                                className={cn(
                                                    "w-full text-left px-5 py-2.5 text-[14px] font-bold transition-all flex items-center justify-between",
                                                    technicianIds.includes(u.userOrgId || u.id) ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <span>{u.name}</span>
                                                {technicianIds.includes(u.userOrgId || u.id) && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Parts */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[18px] font-black text-slate-800">Parts</h3>
                            <button onClick={() => toggleDropdown('parts')} className="px-5 py-2 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all">Add Parts</button>
                        </div>
                        {dropdowns.parts && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl max-h-48 overflow-y-auto">
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
                                                key={p.partId} 
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
                                                        onChange={(e) => updatePartQuantity(p.partId, Math.max(1, Number(e.target.value)))}
                                                    />
                                                </td>
                                                <td className="px-6 py-5 text-[15px] font-bold text-slate-700">
                                                    ${totalCost.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removePart(p.partId); }} 
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

                    {/* Tasks & Checklists */}
                    <section className="space-y-8 pb-20">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[18px] font-black text-slate-800">Tasks & Checklists</h3>
                            <div className="flex gap-3">
                                <button onClick={addTask} className="px-5 py-2.5 border border-slate-200 bg-white rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm">Add Task</button>
                                <button className="px-5 py-2.5 border border-slate-200 bg-white rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm">Add Checklist</button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {tasks.map((task) => (
                                <div key={task.id} className="relative group/task">
                                    <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <div className="p-8 space-y-6">
                                            {/* Task Header Row */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <input 
                                                        type="text"
                                                        placeholder="Clean air filter & check its condition"
                                                        className="w-full px-4 py-3 bg-[#fdfdfd] border-2 border-slate-100 rounded-xl text-[15px] font-bold text-slate-800 outline-none focus:border-primary transition-all"
                                                        value={task.text}
                                                        onChange={(e) => updateTask(task.id, { text: e.target.value })}
                                                    />
                                                </div>
                                                <div className="relative group/type">
                                                    <select 
                                                        className="appearance-none flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl text-[14px] font-bold text-slate-600 outline-none pr-10 cursor-pointer hover:border-primary/30 transition-all"
                                                        value={task.type || 'Inspection'}
                                                        onChange={(e) => updateTask(task.id, { type: e.target.value })}
                                                    >
                                                        <option value="Inspection">Inspection</option>
                                                        <option value="Number">Number</option>
                                                        <option value="Status">Status</option>
                                                        <option value="Text">Text</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                </div>
                                                <button onClick={() => removeTask(task.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Action Buttons & Toggle Row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-[14px] text-[12px] font-[900] uppercase tracking-wider hover:bg-blue-50 transition-all border-2 border-blue-100 shadow-sm">
                                                        <Box className="w-4 h-4" />
                                                        ADD ASSET
                                                    </button>
                                                    
                                                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border-2 border-slate-100 shadow-sm">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-black text-slate-600">
                                                            {workOrder.assignee?.[0] || 'J'}
                                                        </div>
                                                        <span className="text-[13px] font-black text-slate-500 pr-2">{workOrder.assignee || 'jason daniel'}</span>
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

                                            {/* Requirements Expandable Section */}
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
                                        {/* Drag Handle visual hint */}
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity cursor-grab">
                                            {[...Array(6)].map((_, i) => <div key={i} className="w-1 h-1 bg-slate-300 rounded-full" />)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={addTask}
                            className="w-full py-4 border-2 border-blue-100 bg-blue-50/10 rounded-2xl flex items-center justify-center gap-3 text-blue-600 hover:bg-blue-50 transition-all group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[15px] font-black uppercase tracking-widest">Add Tasks</span>
                        </button>
                    </section>

                    {/* Documents & Reference */}
                    <section className="space-y-8 pb-32">
                        <div className="space-y-1">
                            <h3 className="text-[18px] font-black text-slate-800">Documents & Reference</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Files</label>
                                <div className="border border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 bg-[#fafafa]/30">
                                    <button 
                                        onClick={() => photoInputRef.current?.click()}
                                        className="px-8 py-3 border border-slate-200 bg-white rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Upload
                                    </button>
                                    <p className="text-[13px] font-bold text-slate-400">or Drop Files</p>
                                </div>
                                <button className="text-[14px] font-bold text-blue-600 hover:underline">Add from Saved Files</button>
                            </div>

                            <div className="space-y-3 pt-6 relative">
                                <label className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Purchase Order</label>
                                <div 
                                    onClick={() => toggleDropdown('po')}
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all"
                                >
                                    <span className={cn("text-[14px] font-bold", selectedPoId ? "text-slate-800" : "text-slate-400")}>
                                        {purchaseOrders.find((p: any) => p.id === selectedPoId)?.number || 'Select...'}
                                    </span>
                                    <ChevronDown className="w-5 h-5 text-slate-300" />
                                </div>
                                
                                {dropdowns.po && (
                                    <div className="absolute top-full left-0 right-0 mt-2 popover-solid rounded-xl shadow-xl z-50 py-2 border border-slate-100 max-h-48 overflow-y-auto custom-scrollbar">
                                        <button 
                                            onClick={() => { setSelectedPoId(null); toggleDropdown('po'); }}
                                            className="w-full text-left px-5 py-2.5 text-[14px] font-bold text-slate-400 hover:bg-slate-50 transition-all"
                                        >
                                            None / Clear
                                        </button>
                                        {purchaseOrders.map((p: any) => (
                                            <button 
                                                key={p.id} 
                                                onClick={() => { setSelectedPoId(p.id); toggleDropdown('po'); }}
                                                className="w-full text-left px-5 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                            >
                                                {p.number} - {p.vendor?.name || 'No Vendor'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-[14px] font-black text-slate-800">Signature Required</h4>
                                    <p className="text-[12px] font-bold text-slate-400">Require technicians to upload a signature image in order to complete this work order.</p>
                                </div>
                                <button 
                                    onClick={() => setSignatureRequired(!signatureRequired)}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-all relative",
                                        signatureRequired ? "bg-blue-600" : "bg-slate-200"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                        signatureRequired ? "left-7" : "left-1"
                                    )} />
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-10 py-3 border-t border-slate-100 flex items-center justify-end gap-3 bg-white z-10">
                    <button onClick={onClose} className="px-8 py-2.5 border border-slate-200 rounded-xl text-[14px] font-black text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                    <button 
                        disabled={isLocked}
                        onClick={handleSave} 
                        className={cn(
                            "px-8 py-2.5 rounded-xl text-[14px] font-black transition-all",
                            isLocked 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 active:scale-95"
                        )}
                    >
                        {isLocked ? 'Locked (Signed)' : 'Save Changes'}
                    </button>
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
    );
};
