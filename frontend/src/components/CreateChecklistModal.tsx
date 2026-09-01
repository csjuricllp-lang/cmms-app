import React, { useState } from 'react';
import { 
    X, Plus, ChevronRight, 
    Mic, Paperclip, ChevronDown, Layout, 
    FileSpreadsheet, Info, GripVertical,
    Camera, Link as LinkIcon, AlertTriangle,
    Type, Hash, List, Activity, PenTool, CheckSquare,
    CircleCheck, ListChecks, Trash2,
    CheckCircle, Settings, Loader2, ArrowRight, Save, Wand2, Check,
    Wrench, MoreVertical, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AssetSelectionModal } from './AssetSelectionModal';
import { ImportChecklistsModal } from './ImportChecklistsModal';

interface CreateChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'builder' | 'blank';

const TASK_TYPES = [
    { name: 'Status', icon: Activity, color: 'text-orange-500' },
    { name: 'Text', icon: Type, color: 'text-primary' },
    { name: 'Number', icon: Hash, color: 'text-blue-400' },
    { name: 'Inspection', icon: CircleCheck, color: 'text-cyan-500' },
    { name: 'Multiple Choice', icon: ListChecks, color: 'text-emerald-500' },
    { name: 'Meter', icon: Activity, color: 'text-purple-500' },
    { name: 'Signature', icon: PenTool, color: 'text-teal-500' },
    { name: 'Checkbox', icon: CheckSquare, color: 'text-rose-500' },
    { name: 'Warning', icon: AlertTriangle, color: 'text-orange-600' },
    { name: 'Multiselect', icon: List, color: 'text-pink-500' },
];

export const CreateChecklistModal: React.FC<CreateChecklistModalProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [step, setStep] = useState<Step>('builder');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tasks, setTasks] = useState<any[]>([
        { id: '1', type: 'Status', label: 'Status', instruction: '', isRequired: false, showStatusMenu: false }
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const { data: assetsResponse } = useQuery({
        queryKey: ['assets'],
        queryFn: async () => {
            const res = await api.get('/assets');
            return Array.isArray(res.data) ? res.data : (res.data.items || []);
        }
    });
    const assets = assetsResponse || [];

    const handleGenerate = async () => {
        if (!prompt) {
            toast.error('Please describe the checklist first');
            return;
        }
        setIsGenerating(true);
        try {
            const res = await api.post('/checklists/generate', { 
                prompt, 
                assetId: selectedAsset?.id 
            });
            const data = res.data;
            setTitle(data.title);
            setDescription(data.description);
            setTasks(data.tasks.map((t: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                ...t,
                isRequired: true,
                showStatusMenu: false
            })));
            setStep('blank');
            toast.success('AI Protocol Generated');
        } catch (error) {
            toast.error('Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    const handleAddTask = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newTask = {
            id: newId,
            type: 'Status',
            label: 'Untitled Task',
            instruction: '',
            isRequired: false,
            showStatusMenu: false
        };
        setTasks([...tasks, newTask]);
    };

    const updateTask = (id: string, updates: any) => {
        if (updates.label) {
            const isDuplicate = tasks.some(t => t.id !== id && t.label.toLowerCase() === updates.label.toLowerCase());
            if (isDuplicate) {
                toast.error('This protocol step already exists');
            }
        }
        setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const removeTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(tasks.filter(t => t.id !== id));
    };

    const handleCreateChecklist = async () => {
        if (!title) {
            toast.error('Procedure Title is required');
            return;
        }
        setIsSaving(true);
        try {
            await api.post('/checklists', {
                title,
                description,
                items: tasks.map((t, i) => ({
                    task: t.label,
                    instruction: t.instruction || undefined,
                    instructionPhotos: t.instructionPhotos?.length ? t.instructionPhotos : undefined,
                    instructionUrlTitle: t.instructionUrlTitle || undefined,
                    instructionUrl: t.instructionUrl || undefined,
                    requireNotes: !!t.notes,
                    requirePhoto: !!t.photo,
                    requireUrl: !!t.url,
                    dataType: t.type.toUpperCase().replace(' ', '_'),
                    isRequired: t.isRequired,
                    order: i
                }))
            });
            toast.success('Checklist published');
            queryClient.invalidateQueries({ queryKey: ['checklists'] });
            onClose();
            setStep('builder');
            setTitle('');
            setDescription('');
            setTasks([{ id: '1', type: 'Status', label: 'Status', instruction: '', isRequired: false, showStatusMenu: false }]);
        } catch (error) {
            toast.error('Failed to publish');
        } finally {
            setIsSaving(false);
        }
    };

    if (step === 'blank') {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-[#FBFCFE] w-full h-full flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-10 py-5 border-b border-gray-100 bg-card">
                        <div className="flex items-center gap-4 text-[15px] font-bold">
                            <span className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setStep('builder')}>Checklists</span>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                            <span className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setStep('builder')}>Smart Builder</span>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                            <span className="text-foreground font-extrabold">Create Checklist</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={onClose} className="px-6 py-2.5 bg-muted hover:bg-gray-200 text-foreground/90 rounded-lg text-[14px] font-bold transition-all">
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateChecklist}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-[14px] font-bold transition-all shadow-md disabled:opacity-50"
                            >
                                {isSaving ? 'Creating...' : 'Create Checklist'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-8 bg-card flex flex-col items-center">
                            <div className="max-w-3xl w-full space-y-6 pb-20">
                                <div className="space-y-3">
                                    <input 
                                        type="text" 
                                        placeholder="Untitled Checklist *"
                                        className="w-full text-[28px] font-bold text-slate-800 placeholder:text-slate-400/70 outline-none bg-transparent"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <textarea 
                                        placeholder="Write a description..."
                                        className="w-full text-[16px] text-slate-600 font-medium placeholder:text-slate-400/70 outline-none bg-transparent resize-none h-10"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    <button className="flex items-center gap-2 px-4 py-1.5 border border-gray-100 rounded-full text-[13px] font-bold text-muted-foreground hover:bg-muted/50">
                                        <Plus className="w-4 h-4" />
                                        Add tag
                                    </button>
                                </div>

                                <div className="flex justify-end pt-6">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[14px] font-bold text-foreground/90">Mark All Tasks as Required</span>
                                        <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer p-1">
                                            <div className="w-3 h-3 bg-card rounded-full shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {tasks.map((task, index) => (
                                        <div key={task.id} className="relative group/task flex items-start gap-4">
                                            <div className="pt-6 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                                <GripVertical className="w-5 h-5 text-slate-200" />
                                            </div>
                                            <div className="flex-1 bg-white rounded-xl border border-blue-200/60 p-5 hover:border-blue-300 transition-all shadow-sm relative group/card">
                                                {/* Row 1: Input, Type Dropdown, 3-dots menu */}
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1">
                                                        <input 
                                                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-[14px] font-medium text-slate-800 outline-none focus:border-primary/80 transition-all placeholder:text-slate-400"
                                                            placeholder="Field Name *"
                                                            value={task.label === 'Untitled Task' ? '' : task.label}
                                                            onChange={(e) => updateTask(task.id, { label: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <button 
                                                            onClick={() => updateTask(task.id, { showTypeMenu: !task.showTypeMenu })}
                                                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-all text-[14px] font-medium text-slate-700 min-w-[140px]"
                                                        >
                                                            {(() => {
                                                                const typeConfig = TASK_TYPES.find(t => t.name === task.type) || TASK_TYPES[0];
                                                                const Icon = typeConfig.icon;
                                                                return <Icon className={cn("w-4 h-4", typeConfig.color)} />;
                                                            })()}
                                                            <span className="flex-1 text-left">{task.type}</span>
                                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                                        </button>
                                                        {task.showTypeMenu && (
                                                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 shadow-lg rounded-md py-1 z-50 w-[200px] max-h-64 overflow-y-auto">
                                                                {TASK_TYPES.map(typeConfig => {
                                                                    const Icon = typeConfig.icon;
                                                                    return (
                                                                        <button 
                                                                            key={typeConfig.name}
                                                                            onClick={() => updateTask(task.id, { type: typeConfig.name, showTypeMenu: false })}
                                                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-left"
                                                                        >
                                                                            <Icon className={cn("w-4 h-4", typeConfig.color)} />
                                                                            <span className="text-[13px] font-medium text-slate-700">{typeConfig.name}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="relative">
                                                        <button onClick={() => updateTask(task.id, { showOptionsMenu: !task.showOptionsMenu })} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-md hover:bg-slate-50">
                                                            <MoreVertical className="w-5 h-5" />
                                                        </button>
                                                        {task.showOptionsMenu && (
                                                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 shadow-lg rounded-md py-1 z-50 w-32">
                                                                <button onClick={(e) => removeTask(task.id, e)} className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-rose-500 hover:bg-rose-50 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Row 2: Instructions & Required */}
                                                <div className="flex items-center justify-between mt-4">
                                                    <button 
                                                        onClick={() => updateTask(task.id, { showInstructions: !task.showInstructions })}
                                                        className="flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                                                    >
                                                        <Wrench className="w-4 h-4" />
                                                        Instructions
                                                    </button>
                                                    <div className="flex items-center gap-3">
                                                        <Wrench className="w-4 h-4 text-slate-300 transform scale-x-[-1] opacity-0" />
                                                        <span className="text-[13px] font-medium text-slate-500">Required</span>
                                                        <button 
                                                            onClick={() => updateTask(task.id, { isRequired: !task.isRequired })}
                                                            className={cn("w-9 h-5 rounded-full transition-all relative border", task.isRequired ? "bg-primary border-primary" : "bg-white border-slate-200")}
                                                        >
                                                            <div className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all shadow-sm", task.isRequired ? "bg-white left-[18px]" : "bg-slate-300 left-0.5")} />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* Instructions Modal-Style Card */}
                                                {task.showInstructions && (
                                                    <div className="mt-4 p-6 bg-white border border-slate-200 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-200 relative z-10">
                                                        <h3 className="text-[20px] font-bold text-slate-800 mb-6 tracking-tight">Instructions</h3>
                                                        
                                                        <div className="space-y-6">
                                                            <div className="space-y-2.5">
                                                                <label className="text-[14px] font-medium text-slate-700">Description</label>
                                                                <textarea
                                                                    className="w-full p-4 bg-white border border-slate-300/80 rounded-lg text-[14px] text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none transition-all"
                                                                    rows={3}
                                                                    value={task.instruction || ''}
                                                                    onChange={(e) => updateTask(task.id, { instruction: e.target.value })}
                                                                />
                                                            </div>

                                                            <div className="space-y-2.5">
                                                                <label className="text-[14px] font-medium text-slate-700">Photos (Up To 20)</label>
                                                                <div className="w-full border border-dashed border-slate-300 rounded-lg bg-[#FCFDFD] p-4 flex flex-col items-center justify-center gap-4 hover:bg-slate-50 transition-colors relative min-h-[100px]">
                                                                    <input 
                                                                        type="file" 
                                                                        multiple 
                                                                        accept="image/*" 
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                                        title=""
                                                                        onChange={async (e) => {
                                                                            if (!e.target.files) return;
                                                                            const newPhotos = [...(task.instructionPhotos || [])];
                                                                            for (let i = 0; i < e.target.files.length; i++) {
                                                                                if (newPhotos.length >= 20) break;
                                                                                const file = e.target.files[i];
                                                                                const formData = new FormData();
                                                                                formData.append('file', file);
                                                                                try {
                                                                                    const res = await api.post('/files/upload', formData, {
                                                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                                                    });
                                                                                    newPhotos.push(res.data.url);
                                                                                } catch (err) {
                                                                                    toast.error('Failed to upload photo');
                                                                                }
                                                                            }
                                                                            updateTask(task.id, { instructionPhotos: newPhotos });
                                                                            // Reset input
                                                                            e.target.value = '';
                                                                        }} 
                                                                    />
                                                                    {task.instructionPhotos && task.instructionPhotos.length > 0 ? (
                                                                        <div className="flex flex-wrap gap-2 w-full justify-center relative z-20">
                                                                            {task.instructionPhotos.map((url: string, i: number) => (
                                                                                <div key={i} className="w-16 h-16 rounded-md border border-slate-200 overflow-hidden relative group/photo">
                                                                                    <img src={url} alt={`Instruction photo ${i+1}`} className="w-full h-full object-cover" />
                                                                                    <button 
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            updateTask(task.id, { 
                                                                                                instructionPhotos: task.instructionPhotos.filter((_: any, idx: number) => idx !== i)
                                                                                            });
                                                                                        }}
                                                                                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-4 pointer-events-none">
                                                                            <div className="px-4 py-2 bg-white border border-slate-300 rounded-md text-[14px] font-medium text-slate-600 shadow-sm">
                                                                                Upload
                                                                            </div>
                                                                            <span className="text-[15px] text-slate-800">or drop a photo</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2.5">
                                                                <label className="text-[14px] font-medium text-slate-700">URL</label>
                                                                <div className="flex gap-4">
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Title"
                                                                        className="flex-1 px-4 py-2.5 bg-white border border-slate-300/80 rounded-lg text-[14px] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                                                        value={task.instructionUrlTitle || ''}
                                                                        onChange={(e) => updateTask(task.id, { instructionUrlTitle: e.target.value })}
                                                                    />
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="http://"
                                                                        className="flex-[2] px-4 py-2.5 bg-white border border-slate-300/80 rounded-lg text-[14px] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                                                        value={task.instructionUrl || ''}
                                                                        onChange={(e) => updateTask(task.id, { instructionUrl: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-8 pt-2">
                                                            <button 
                                                                onClick={() => {
                                                                    updateTask(task.id, { instruction: '' });
                                                                    updateTask(task.id, { showInstructions: false });
                                                                }}
                                                                className="flex items-center gap-2 text-rose-500 hover:text-rose-600 text-[14px] font-medium transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Remove
                                                            </button>
                                                            <div className="flex items-center gap-3">
                                                                <button 
                                                                    onClick={() => updateTask(task.id, { showInstructions: false })}
                                                                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[14px] font-medium transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button 
                                                                    onClick={() => updateTask(task.id, { showInstructions: false })}
                                                                    className="px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-[14px] font-medium transition-colors"
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Additional Requirements */}
                                                <div className="mt-5 border border-blue-100/40 bg-[#FAFAFB] rounded-xl overflow-hidden">
                                                    <button 
                                                        onClick={() => updateTask(task.id, { isExpanded: !task.isExpanded })}
                                                        className="w-full flex items-center justify-between px-5 py-4 bg-transparent hover:bg-slate-50/50 transition-colors"
                                                    >
                                                        <span className="text-[14px] font-bold text-slate-800">Additional Requirements</span>
                                                        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", task.isExpanded && "rotate-180")} />
                                                    </button>
                                                    
                                                    {task.isExpanded && (
                                                        <div className="px-5 pb-5 space-y-2">
                                                            {[
                                                                { id: 'notes', label: 'Notes', desc: 'Require technician to add a note with this task.', icon: <FileText className="w-4 h-4 text-blue-500" /> },
                                                                { id: 'photo', label: 'Photo', desc: 'Require technician to upload images (up to 20).', icon: <Camera className="w-4 h-4 text-blue-500" /> },
                                                                { id: 'url', label: 'URL', desc: 'Require technician to attach a relevant link.', icon: <LinkIcon className="w-4 h-4 text-blue-500" /> },
                                                            ].map((item) => (
                                                                <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 last:pb-0">
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="mt-0.5 w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
                                                                            {item.icon}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[13px] font-bold text-slate-800">{item.label}</p>
                                                                            <p className="text-[12px] font-medium text-slate-500 mt-0.5">{item.desc}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => updateTask(task.id, { [item.id]: !task[item.id] })}
                                                                        className={cn("w-9 h-5 rounded-full transition-all relative border shrink-0", task[item.id] ? "bg-primary border-primary" : "bg-white border-slate-200")}
                                                                    >
                                                                        <div className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all shadow-sm", task[item.id] ? "bg-white left-[18px]" : "bg-slate-300 left-0.5")} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <button 
                                        onClick={handleAddTask}
                                        className="w-full py-4 bg-blue-50/20 hover:bg-blue-50 text-primary rounded-[24px] border-2 border-dashed border-blue-100 text-[14px] font-black flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] uppercase tracking-widest mt-4"
                                    >
                                        <Plus className="w-5 h-5 stroke-[3px]" />
                                        Add Protocol Step
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="w-72 border-l border-gray-100 bg-card p-6 space-y-8 overflow-y-auto">
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Add Items</h4>
                                <div className="space-y-4">
                                    <button onClick={handleAddTask} className="flex items-center gap-4 text-[14px] font-bold text-primary">
                                        <Plus className="w-4 h-4" />
                                        Add Task
                                    </button>
                                    <button className="flex items-center gap-4 text-[14px] font-bold text-primary">
                                        <List className="w-4 h-4" />
                                        Add Section
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Task Types</h4>
                                <div className="space-y-6">
                                    {TASK_TYPES.map((type) => (
                                        <button key={type.name} className="flex items-center gap-5 w-full group">
                                            <div className={cn("w-5 h-5 flex items-center justify-center", type.color)}>
                                                <type.icon className="w-full h-full" />
                                            </div>
                                            <span className="text-[14px] font-bold text-muted-foreground group-hover:text-primary transition-all uppercase tracking-tight">{type.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-[#FBFCFE] w-full h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-10 py-5 border-b border-gray-100 bg-card">
                    <div className="flex items-center gap-4 text-[15px] font-bold">
                        <span className="text-gray-400">Checklists</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                        <span className="text-foreground font-extrabold">Smart Builder</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="text-primary"><Info className="w-5 h-5" /></button>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><X className="w-6 h-6 text-gray-400" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
                    <div className="max-w-3xl w-full space-y-10">
                        <div className="text-center space-y-3">
                            <h2 className="text-[24px] font-bold text-foreground">Smart Checklist Builder</h2>
                            <p className="text-[14px] text-muted-foreground font-medium">Create professional maintenance checklists in seconds.</p>
                        </div>

                        <div className="bg-card rounded-[20px] border border-blue-100 p-6 space-y-6 ring-4 ring-primary/5 shadow-sm">
                            <textarea 
                                placeholder="What kind of checklist would you like to build?"
                                className="w-full h-24 bg-transparent text-[15px] font-medium outline-none resize-none placeholder:text-gray-300"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <button 
                                    onClick={() => setShowAssetPicker(true)}
                                    className="px-4 py-2 border border-blue-200 rounded-lg text-[13px] font-bold text-primary flex items-center gap-2 hover:bg-blue-50 transition-all"
                                >
                                    {selectedAsset ? selectedAsset.name : 'Select Asset'}
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <Mic className="w-4 h-4 text-blue-400 cursor-pointer hover:text-primary" />
                                    <Paperclip className="w-4 h-4 text-blue-400 cursor-pointer hover:text-primary" />
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-[14px] font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Generating...
                                            </>
                                        ) : 'Generate'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <AssetSelectionModal 
                            isOpen={showAssetPicker}
                            onClose={() => setShowAssetPicker(false)}
                            assets={assets}
                            onConfirm={(asset) => {
                                setSelectedAsset(asset);
                                setShowAssetPicker(false);
                            }}
                        />

                        <div className="pt-6 space-y-6">
                            <p className="text-[13px] text-gray-400 font-bold text-center">or create a checklist another way</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <button onClick={() => setStep('blank')} className="flex flex-col items-start p-6 bg-card border border-gray-100 rounded-2xl hover:border-primary/80 transition-all text-left shadow-sm hover:shadow-md group">
                                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-4 border border-gray-100 group-hover:bg-blue-50 group-hover:text-primary transition-all"><Plus className="w-5 h-5" /></div>
                                    <h3 className="text-[15px] font-bold text-foreground mb-1">Create from blank</h3>
                                    <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">Write your checklist from scratch</p>
                                </button>
                                <button className="flex flex-col items-start p-6 bg-card border border-gray-100 rounded-2xl hover:border-primary/80 transition-all text-left shadow-sm hover:shadow-md group">
                                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-4 border border-gray-100 group-hover:bg-blue-50 group-hover:text-primary transition-all"><Layout className="w-5 h-5" /></div>
                                    <h3 className="text-[15px] font-bold text-foreground mb-1">Use a template</h3>
                                    <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">Search the checklist library</p>
                                </button>
                                <button onClick={() => setShowImportModal(true)} className="flex flex-col items-start p-6 bg-card border border-gray-100 rounded-2xl hover:border-primary/80 transition-all text-left shadow-sm hover:shadow-md group">
                                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-4 border border-gray-100 group-hover:bg-blue-50 group-hover:text-primary transition-all"><FileSpreadsheet className="w-5 h-5" /></div>
                                    <h3 className="text-[15px] font-bold text-foreground mb-1">Bulk Data Import</h3>
                                    <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">Import checklists in bulk with our CSV templates</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

            <ImportChecklistsModal 
                isOpen={showImportModal} 
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    setShowImportModal(false);
                    onClose(); // Close the main modal after successful import
                    // Checklists page will auto-refresh due to its own hooks or can be triggered
                }}
            />
        </>
    );
};
