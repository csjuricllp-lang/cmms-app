import React, { useState } from 'react';
import { 
    X, Plus, ChevronRight, 
    Mic, Paperclip, ChevronDown, Layout, 
    FileSpreadsheet, Info, GripVertical,
    Camera, Link as LinkIcon, AlertTriangle,
    Type, Hash, List, Activity, PenTool, CheckSquare,
    CheckCircle2, ListChecks, Trash2,
    CheckCircle, Settings, Loader2, ArrowRight, Save, Wand2, Check
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
    { name: 'Text', icon: Type, color: 'text-blue-500' },
    { name: 'Number', icon: Hash, color: 'text-blue-400' },
    { name: 'Inspection', icon: CheckCircle2, color: 'text-cyan-500' },
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
                    instruction: t.instruction,
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
                    <div className="flex items-center justify-between px-10 py-5 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-4 text-[15px] font-bold">
                            <span className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setStep('builder')}>Checklists</span>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                            <span className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setStep('builder')}>Smart Builder</span>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                            <span className="text-gray-900 font-extrabold">Create Checklist</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[14px] font-bold transition-all">
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateChecklist}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[14px] font-bold transition-all shadow-md disabled:opacity-50"
                            >
                                {isSaving ? 'Creating...' : 'Create Checklist'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-8 bg-white flex flex-col items-center">
                            <div className="max-w-3xl w-full space-y-6 pb-20">
                                <div className="space-y-3">
                                    <input 
                                        type="text" 
                                        placeholder="Untitled Checklist *"
                                        className="w-full text-[28px] font-bold text-gray-900 placeholder:text-gray-200 outline-none"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <textarea 
                                        placeholder="Write a description..."
                                        className="w-full text-[16px] text-gray-500 font-medium placeholder:text-gray-300 outline-none bg-transparent resize-none h-10"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    <button className="flex items-center gap-2 px-4 py-1.5 border border-gray-100 rounded-full text-[13px] font-bold text-gray-500 hover:bg-gray-50">
                                        <Plus className="w-4 h-4" />
                                        Add tag
                                    </button>
                                </div>

                                <div className="flex justify-end pt-6">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[14px] font-bold text-gray-700">Mark All Tasks as Required</span>
                                        <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer p-1">
                                            <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {tasks.map((task, index) => (
                                        <div key={task.id} className="relative group/task flex items-start gap-4">
                                            <div className="pt-6 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                                <GripVertical className="w-5 h-5 text-slate-200" />
                                            </div>
                                            <div className="flex-1 bg-white rounded-[24px] border border-slate-200 p-6 space-y-5 hover:border-blue-400 transition-all shadow-sm relative overflow-hidden group/card">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[13px]">
                                                            {index + 1}
                                                        </div>
                                                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{task.type} Protocol</span>
                                                    </div>
                                                    <button onClick={(e) => removeTask(task.id, e)} className="p-2 text-slate-300 hover:text-rose-500 transition-all">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <div className="relative group/input">
                                                        <input 
                                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-300"
                                                            placeholder="Describe the specialized inspection protocol..."
                                                            value={task.label}
                                                            onChange={(e) => updateTask(task.id, { label: e.target.value })}
                                                        />
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-all text-blue-500">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <div 
                                                            onClick={() => updateTask(task.id, { showStatusMenu: !task.showStatusMenu })}
                                                            className="flex items-center justify-between px-4 py-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-all shadow-inner"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Settings className="w-4 h-4 text-slate-400" />
                                                                <span className="text-[14px] font-bold text-slate-600">Configure result processing...</span>
                                                            </div>
                                                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", task.showStatusMenu && "rotate-180")} />
                                                        </div>

                                                        {task.showStatusMenu && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[24px] shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200 py-2">
                                                                <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-blue-50 transition-all group">
                                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                        <CheckCircle className="w-5 h-5" />
                                                                    </div>
                                                                    <span className="text-[14px] font-bold text-gray-700 group-hover:text-blue-700 transition-colors">Pass / Fail</span>
                                                                </button>
                                                                <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-blue-50 transition-all group">
                                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                        <Activity className="w-5 h-5" />
                                                                    </div>
                                                                    <span className="text-[14px] font-bold text-gray-700 group-hover:text-blue-700 transition-colors">Good / Fair / Poor</span>
                                                                </button>
                                                                <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-blue-50 transition-all group">
                                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                        <Settings className="w-5 h-5" />
                                                                    </div>
                                                                    <span className="text-[14px] font-bold text-gray-700 group-hover:text-blue-700 transition-colors">Custom Statuses</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="pt-6 border-t border-slate-50">
                                                    <button 
                                                        onClick={() => updateTask(task.id, { isExpanded: !task.isExpanded })}
                                                        className="w-full flex items-center justify-between group/expand"
                                                    >
                                                        <span className="text-[13px] font-black text-slate-800 uppercase italic tracking-tight">Additional Requirements</span>
                                                        <ChevronDown className={cn("w-5 h-5 text-slate-300 group-hover/expand:text-slate-600 transition-all", !task.isExpanded && "-rotate-90")} />
                                                    </button>
                                                    
                                                    {task.isExpanded && (
                                                        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            {[
                                                                { id: 'notes', label: 'Notes', desc: 'Require technician to add a note with this task.', icon: <Type className="w-5 h-5" /> },
                                                                { id: 'photo', label: 'Photo', desc: 'Require technician to upload images (up to 20).', icon: <Camera className="w-5 h-5" /> },
                                                                { id: 'url', label: 'URL', desc: 'Require technician to attach a relevant link.', icon: <LinkIcon className="w-5 h-5" /> },
                                                            ].map((item) => (
                                                                <div key={item.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between group/req hover:bg-white hover:border-blue-100 transition-all">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 border border-blue-100/50 shadow-inner group-hover/req:scale-110 transition-transform">
                                                                            {item.icon}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[14px] font-black text-slate-800">{item.label}</p>
                                                                            <p className="text-[11px] font-bold text-slate-400">{item.desc}</p>
                                                                        </div>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => updateTask(task.id, { [item.id]: !task[item.id] })}
                                                                        className={cn("w-10 h-5 rounded-full transition-all relative", task[item.id] ? "bg-blue-600" : "bg-slate-300")}
                                                                    >
                                                                        <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm", task[item.id] ? "left-6" : "left-1")} />
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
                                        className="w-full py-4 bg-blue-50/20 hover:bg-blue-50 text-blue-600 rounded-[24px] border-2 border-dashed border-blue-100 text-[14px] font-black flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] uppercase tracking-widest mt-4"
                                    >
                                        <Plus className="w-5 h-5 stroke-[3px]" />
                                        Add Protocol Step
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="w-72 border-l border-gray-100 bg-white p-6 space-y-8 overflow-y-auto">
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Add Items</h4>
                                <div className="space-y-4">
                                    <button onClick={handleAddTask} className="flex items-center gap-4 text-[14px] font-bold text-blue-600">
                                        <Plus className="w-4 h-4" />
                                        Add Task
                                    </button>
                                    <button className="flex items-center gap-4 text-[14px] font-bold text-blue-600">
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
                                            <span className="text-[14px] font-bold text-gray-500 group-hover:text-blue-600 transition-all uppercase tracking-tight">{type.name}</span>
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
                <div className="flex items-center justify-between px-10 py-5 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-4 text-[15px] font-bold">
                        <span className="text-gray-400">Checklists</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                        <span className="text-gray-900 font-extrabold">Smart Builder</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="text-blue-600"><Info className="w-5 h-5" /></button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-6 h-6 text-gray-400" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
                    <div className="max-w-3xl w-full space-y-10">
                        <div className="text-center space-y-3">
                            <h2 className="text-[24px] font-bold text-gray-900">Smart Checklist Builder</h2>
                            <p className="text-[14px] text-gray-500 font-medium">Create professional maintenance checklists in seconds.</p>
                        </div>

                        <div className="bg-white rounded-[20px] border border-blue-100 p-6 space-y-6 ring-4 ring-blue-500/5 shadow-sm">
                            <textarea 
                                placeholder="What kind of checklist would you like to build?"
                                className="w-full h-24 bg-transparent text-[15px] font-medium outline-none resize-none placeholder:text-gray-300"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <button 
                                    onClick={() => setShowAssetPicker(true)}
                                    className="px-4 py-2 border border-blue-200 rounded-lg text-[13px] font-bold text-blue-600 flex items-center gap-2 hover:bg-blue-50 transition-all"
                                >
                                    {selectedAsset ? selectedAsset.name : 'Select Asset'}
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <Mic className="w-4 h-4 text-blue-400 cursor-pointer hover:text-blue-600" />
                                    <Paperclip className="w-4 h-4 text-blue-400 cursor-pointer hover:text-blue-600" />
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[14px] font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
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
                                <button onClick={() => setStep('blank')} className="flex flex-col items-start p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-400 transition-all text-left shadow-sm hover:shadow-md group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all"><Plus className="w-5 h-5" /></div>
                                    <h3 className="text-[15px] font-bold text-gray-900 mb-1">Create from blank</h3>
                                    <p className="text-[13px] text-gray-500 font-medium leading-relaxed">Write your checklist from scratch</p>
                                </button>
                                <button className="flex flex-col items-start p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-400 transition-all text-left shadow-sm hover:shadow-md group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all"><Layout className="w-5 h-5" /></div>
                                    <h3 className="text-[15px] font-bold text-gray-900 mb-1">Use a template</h3>
                                    <p className="text-[13px] text-gray-500 font-medium leading-relaxed">Search the checklist library</p>
                                </button>
                                <button onClick={() => setShowImportModal(true)} className="flex flex-col items-start p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-400 transition-all text-left shadow-sm hover:shadow-md group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all"><FileSpreadsheet className="w-5 h-5" /></div>
                                    <h3 className="text-[15px] font-bold text-gray-900 mb-1">Bulk Data Import</h3>
                                    <p className="text-[13px] text-gray-500 font-medium leading-relaxed">Import checklists in bulk with our CSV templates</p>
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
