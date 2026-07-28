import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    AlertTriangle, 
    ChevronDown, 
    Camera, 
    FileText, 
    Link as LinkIcon, 
    User, 
    XCircle,
    ExternalLink,
    Trash2,
    Loader2
} from 'lucide-react';
import { api } from '../lib/api';
import React, { useState, useRef } from 'react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface ChecklistRendererProps {
    workOrder: any;
}

export const ChecklistRenderer = ({ workOrder }: ChecklistRendererProps) => {
    const queryClient = useQueryClient();
    const [isOtherTasksExpanded, setIsOtherTasksExpanded] = useState(true);
    
    // States for local values
    const [localValues, setLocalValues] = useState<Record<string, string>>(() => 
        workOrder.checklistResponses?.reduce((acc: any, curr: any) => ({
            ...acc,
            [curr.checklistItemId]: curr.responseValue || ''
        }), {}) || {}
    );

    const [localNotes, setLocalNotes] = useState<Record<string, string>>(() => 
        workOrder.checklistResponses?.reduce((acc: any, curr: any) => ({
            ...acc,
            [curr.checklistItemId]: curr.notes || ''
        }), {}) || {}
    );

    const [localUrls, setLocalUrls] = useState<Record<string, string>>(() => 
        workOrder.checklistResponses?.reduce((acc: any, curr: any) => ({
            ...acc,
            [curr.checklistItemId]: curr.url || ''
        }), {}) || {}
    );

    const [localPhotos, setLocalPhotos] = useState<Record<string, string>>(() => 
        workOrder.checklistResponses?.reduce((acc: any, curr: any) => ({
            ...acc,
            [curr.checklistItemId]: curr.photoUrl || ''
        }), {}) || {}
    );

    // Visibility toggles for Notes and URL inputs
    const [activeNotesInput, setActiveNotesInput] = useState<Record<string, boolean>>({});
    const [activeUrlInput, setActiveUrlInput] = useState<Record<string, boolean>>({});

    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const saveResponseMutation = useMutation({
        mutationFn: async ({ 
            itemId, 
            value, 
            notes, 
            url, 
            photoUrl 
        }: { 
            itemId: string; 
            value: string; 
            notes?: string; 
            url?: string; 
            photoUrl?: string; 
        }) => {
            return api.post(`/work-orders/${workOrder.id}/checklist-responses`, {
                checklistItemId: itemId,
                responseValue: value,
                passed: value === 'Completed',
                notes: notes || null,
                url: url || null,
                photoUrl: photoUrl || null
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders', workOrder.id] });
        },
        onError: () => {
            toast.error('Mission Protocol Error: Failed to record task status.');
        }
    });

    const uploadPhotoMutation = useMutation({
        mutationFn: async ({ itemId, file }: { itemId: string; file: File }) => {
            const formData = new FormData();
            formData.append('file', file);
            
            // 1. Upload file to work order attachments
            const uploadRes = await api.post(`/work-orders/${workOrder.id}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const photoUrl = uploadRes.data.url;

            // 2. Update checklist response with photo URL
            return api.post(`/work-orders/${workOrder.id}/checklist-responses`, {
                checklistItemId: itemId,
                responseValue: localValues[itemId] || 'Incomplete',
                passed: localValues[itemId] === 'Completed',
                notes: localNotes[itemId] || null,
                url: localUrls[itemId] || null,
                photoUrl: photoUrl
            });
        },
        onSuccess: (_, variables) => {
            setLocalPhotos(prev => ({ ...prev, [variables.itemId]: _.data.photoUrl }));
            queryClient.invalidateQueries({ queryKey: ['work-orders', workOrder.id] });
            toast.success('Task photo attached successfully.');
        },
        onError: () => {
            toast.error('Failed to upload task photo.');
        }
    });

    const handleValueChange = (itemId: string, value: string) => {
        setLocalValues(prev => ({ ...prev, [itemId]: value }));
        saveResponseMutation.mutate({
            itemId,
            value,
            notes: localNotes[itemId],
            url: localUrls[itemId],
            photoUrl: localPhotos[itemId]
        });
    };

    const handleNotesChange = (itemId: string, notes: string) => {
        setLocalNotes(prev => ({ ...prev, [itemId]: notes }));
    };

    const handleNotesBlur = (itemId: string) => {
        saveResponseMutation.mutate({
            itemId,
            value: localValues[itemId] || 'Incomplete',
            notes: localNotes[itemId],
            url: localUrls[itemId],
            photoUrl: localPhotos[itemId]
        });
    };

    const handleUrlChange = (itemId: string, url: string) => {
        setLocalUrls(prev => ({ ...prev, [itemId]: url }));
    };

    const handleUrlBlur = (itemId: string) => {
        saveResponseMutation.mutate({
            itemId,
            value: localValues[itemId] || 'Incomplete',
            notes: localNotes[itemId],
            url: localUrls[itemId],
            photoUrl: localPhotos[itemId]
        });
    };

    const handleFileChange = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadPhotoMutation.mutate({ itemId, file });
        }
    };

    const handleRemovePhoto = (itemId: string) => {
        setLocalPhotos(prev => ({ ...prev, [itemId]: '' }));
        saveResponseMutation.mutate({
            itemId,
            value: localValues[itemId] || 'Incomplete',
            notes: localNotes[itemId],
            url: localUrls[itemId],
            photoUrl: ''
        });
    };

    const applyTemplateMutation = useMutation({
        mutationFn: async (templateId: string) => {
            return api.post(`/work-orders/${workOrder.id}/apply-template`, { templateId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders', workOrder.id] });
            toast.success('Mission protocols initialized.');
        },
        onError: () => {
            toast.error('Mission Protocol Error: Failed to apply template.');
        }
    });

    const items = workOrder.checklist?.items || [];

    if (!workOrder.checklist || !items.length) {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[20px] font-black italic uppercase tracking-tight text-slate-300">Tasks & Checklists</h3>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => applyTemplateMutation.mutate('template_ac_comprehensive')}
                            disabled={applyTemplateMutation.isPending}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            Apply Standard Protocol
                        </button>
                        <button className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                            Edit
                        </button>
                    </div>
                </div>
                <div className="p-16 rounded-[48px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center bg-slate-50/30">
                    <div className="w-20 h-20 rounded-[32px] bg-white shadow-sm flex items-center justify-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-300 italic mb-2">No Mission Protocols Attached</p>
                    <p className="text-[11px] font-bold text-slate-400 opacity-60">Use the button above to apply the standard industrial AC maintenance protocol.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header section matches image */}
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[20px] font-black italic uppercase tracking-tight">Tasks & Checklists</h3>
                <button className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                    Edit
                </button>
            </div>

            {/* Collapsible Container */}
            <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                <button 
                    onClick={() => setIsOtherTasksExpanded(!isOtherTasksExpanded)}
                    className="w-full px-8 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-all"
                >
                    <span className="text-[14px] font-[900] text-slate-700 tracking-tight">Other Tasks</span>
                    <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", isOtherTasksExpanded ? "" : "-rotate-90")} />
                </button>

                <div className={cn(
                    "px-8 pb-8 space-y-6 transition-all duration-500",
                    isOtherTasksExpanded ? "opacity-100" : "max-h-0 opacity-0 pointer-events-none overflow-hidden"
                )}>
                    {items.map((item: any, index: number) => {
                        const val = localValues[item.id] || '';
                        const notes = localNotes[item.id] || '';
                        const url = localUrls[item.id] || '';
                        const photo = localPhotos[item.id] || '';

                        const isNotesVisible = activeNotesInput[item.id] || !!notes;
                        const isUrlVisible = activeUrlInput[item.id] || !!url;
                        const isUploadingPhoto = uploadPhotoMutation.isPending && uploadPhotoMutation.variables?.itemId === item.id;

                        return (
                            <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-[24px] space-y-4 hover:border-blue-100 transition-all group/task">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[14px] font-black text-slate-700">
                                        <span className="text-slate-400 mr-2">{index + 1}.</span>
                                        {item.task}
                                    </h4>
                                    <div className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                                        <User className="w-5 h-5" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        {item.dataType === 'PASS_FAIL' || item.dataType === 'MULTIPLE_CHOICE' ? (
                                            <div className="relative">
                                                <select 
                                                    value={val}
                                                    onChange={(e) => handleValueChange(item.id, e.target.value)}
                                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[14px] font-bold text-slate-600 outline-none hover:border-slate-200 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="Incomplete">Incomplete</option>
                                                    <option value="On Hold">On Hold</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                            </div>
                                        ) : (
                                            /* TEXT/READING/NUMBER Input */
                                            <div className="relative">
                                                <input 
                                                    type="text"
                                                    value={val}
                                                    onChange={(e) => setLocalValues(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                    onBlur={(e) => handleValueChange(item.id, e.target.value)}
                                                    placeholder="Capture reading or state..."
                                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[14px] font-bold text-slate-600 outline-none hover:border-slate-200 focus:bg-white transition-all"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <button className="p-2 text-slate-300 hover:text-red-500 transition-all">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Dynamic inputs for Photo, Notes, URL */}
                                {(isNotesVisible || isUrlVisible || photo || isUploadingPhoto) && (
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                                        {/* Notes Textarea */}
                                        {isNotesVisible && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Task Notes</label>
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                                    onBlur={() => handleNotesBlur(item.id)}
                                                    placeholder="Enter task observations or notes..."
                                                    className="w-full bg-white border border-slate-100 rounded-xl p-3 text-[13px] font-bold text-slate-600 focus:border-slate-200 outline-none transition-all shadow-sm"
                                                    rows={2}
                                                />
                                            </div>
                                        )}

                                        {/* URL Input */}
                                        {isUrlVisible && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reference URL</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={url}
                                                        onChange={(e) => handleUrlChange(item.id, e.target.value)}
                                                        onBlur={() => handleUrlBlur(item.id)}
                                                        placeholder="https://example.com/reference"
                                                        className="w-full bg-white border border-slate-100 rounded-xl pl-3 pr-10 py-2.5 text-[13px] font-bold text-slate-600 focus:border-slate-200 outline-none transition-all shadow-sm"
                                                    />
                                                    {url && (
                                                        <a 
                                                            href={url} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-500 transition-colors"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Attached Photo Preview / Uploading */}
                                        {(photo || isUploadingPhoto) && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Attached Photo</label>
                                                {isUploadingPhoto ? (
                                                    <div className="w-32 h-20 rounded-xl border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                                                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                                    </div>
                                                ) : (
                                                    <div className="relative w-32 h-20 rounded-xl overflow-hidden group/photo-preview border border-slate-100 shadow-sm bg-white">
                                                        <img 
                                                            src={photo} 
                                                            alt="Task attachment" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo-preview:opacity-100 flex items-center justify-center gap-2 transition-all duration-200">
                                                            <a 
                                                                href={photo} 
                                                                target="_blank" 
                                                                rel="noreferrer" 
                                                                className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                            <button 
                                                                onClick={() => handleRemovePhoto(item.id)} 
                                                                className="p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-all"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Task Footer Actions */}
                                <div className="flex items-center gap-6 pt-2 border-t border-slate-50">
                                    <button 
                                        onClick={() => fileInputRefs.current[item.id]?.click()}
                                        className="flex items-center gap-2 text-[11px] font-black text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-all"
                                    >
                                        <Camera className="w-3.5 h-3.5" />
                                        Photo
                                    </button>
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        ref={(el) => { fileInputRefs.current[item.id] = el; }}
                                        onChange={(e) => handleFileChange(item.id, e)}
                                        className="hidden"
                                    />

                                    <div className="w-[1px] h-3 bg-slate-200" />
                                    
                                    <button 
                                        onClick={() => setActiveNotesInput(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                        className={cn(
                                            "flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all",
                                            isNotesVisible ? "text-blue-600 font-[900]" : "text-slate-400 hover:text-blue-500"
                                        )}
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        Notes
                                    </button>

                                    <div className="w-[1px] h-3 bg-slate-200" />
                                    
                                    <button 
                                        onClick={() => setActiveUrlInput(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                        className={cn(
                                            "flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all",
                                            isUrlVisible ? "text-blue-600 font-[900]" : "text-slate-400 hover:text-blue-500"
                                        )}
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        URL
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ChecklistRenderer;
