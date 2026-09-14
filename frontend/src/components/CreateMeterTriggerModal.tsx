import { useState, useRef } from 'react';
import { X, Plus, CheckSquare, Paperclip, Image } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateMeterTriggerModalProps {
    isOpen: boolean;
    onClose: () => void;
    meter: any;
}

const CONDITION_MAP: Record<string, string> = {
    exceeds:     'EXCEEDS',
    reaches:     'REACHES',
    falls_below: 'FALLS_BELOW',
    increases_by:'INCREASES_BY',
};

export const CreateMeterTriggerModal = ({ isOpen, onClose, meter }: CreateMeterTriggerModalProps) => {
    const queryClient = useQueryClient();
    const imageInputRef = useRef<HTMLInputElement>(null);
    const filesInputRef = useRef<HTMLInputElement>(null);

    // Trigger Details
    const [triggerMode, setTriggerMode] = useState<'INTERVAL' | 'ONE_TIME'>('INTERVAL');
    const [meterCondition, setMeterCondition] = useState('exceeds');
    const [meterValue, setMeterValue] = useState(100);
    const [dueValue, setDueValue] = useState(0);
    const [dueUnit, setDueUnit] = useState('DAYS');

    // Work Order Details
    const [woTitle, setWoTitle] = useState('');
    const [woDescription, setWoDescription] = useState('');
    const [priority, setPriority] = useState('');
    const [categoryId, setCategoryId] = useState('');

    // Location & Asset
    const [locationId, setLocationId] = useState('');
    const [assetId, setAssetId] = useState(meter?.assetId || '');

    // Workers
    const [assignedToId, setAssignedToId] = useState('');

    // Checklist
    const [checklistId, setChecklistId] = useState('');
    const [showChecklistPicker, setShowChecklistPicker] = useState(false);

    // Signature
    const [requiresSignature, setRequiresSignature] = useState(false);

    // Tasks
    const [tasks, setTasks] = useState<string[]>([]);
    const [newTask, setNewTask] = useState('');

    // Files (queued for upload after PM is created)
    const [queuedImages, setQueuedImages] = useState<File[]>([]);
    const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);

    // Fetch data
    const { data: users }      = useQuery<any[]>({ queryKey: ['users'],      queryFn: async () => (await api.get('/users')).data });
    const { data: categories } = useQuery<any[]>({ queryKey: ['categories'], queryFn: async () => (await api.get('/categories')).data });
    const { data: locations }  = useQuery<any[]>({ queryKey: ['locations'],  queryFn: async () => (await api.get('/locations')).data });
    const { data: assets }     = useQuery<any[]>({ queryKey: ['assets'],     queryFn: async () => (await api.get('/assets')).data });
    const { data: checklists } = useQuery<any[]>({ queryKey: ['checklists'], queryFn: async () => (await api.get('/checklists')).data });

    const uploadFilesToPM = async (pmId: string, files: File[]) => {
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                await api.post(`/preventive-maintenance/${pmId}/attachments`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } catch (err) {
                console.error('Failed to upload file:', file.name, err);
            }
        }
    };

    const createMutation = useMutation({
        mutationFn: async () => {
            const condition = CONDITION_MAP[meterCondition] || 'EXCEEDS';
            const meterTriggerType = `${condition}_${triggerMode}`;
            
            const payload: any = {
                name: woTitle || 'Meter Trigger PM',
                woTitle,
                woDescription,
                frequencyType: 'METER',
                meterInterval: Number(meterValue),
                meterTriggerType,
                meterWODueValue: Number(dueValue),
                meterWODueUnit: dueUnit,
                meterId: meter?.id,
                assetId: assetId || meter?.assetId,
                priority: priority || undefined,
                categoryId: categoryId || undefined,
                checklistId: checklistId || undefined,
                assignedToId: assignedToId || undefined,
                requiresSignature,
                plannedTasks: tasks.map((t, i) => ({ task: t, order: i })),
                status: 'ACTIVE',
                assets: [{
                    assetId: assetId || meter?.assetId,
                    meterId: meter?.id,
                    startDate: new Date().toISOString().split('T')[0],
                    assignedToId: assignedToId || '',
                }],
            };
            const response = await api.post('/preventive-maintenance', payload);
            const pmId = response.data?.id;

            // Upload queued files if any
            if (pmId) {
                const allFiles = [...queuedImages, ...queuedFiles];
                if (allFiles.length > 0) {
                    setUploadingFiles(true);
                    await uploadFilesToPM(pmId, allFiles);
                    setUploadingFiles(false);
                }
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pm-schedules'] });
            toast.success('Work Order Trigger created!');
            onClose();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to create trigger');
        },
    });

    const handleSubmit = () => {
        if (!woTitle.trim()) { toast.error('Work Order Title is required'); return; }
        createMutation.mutate();
    };

    const addTask = () => {
        if (newTask.trim()) { setTasks([...tasks, newTask.trim()]); setNewTask(''); }
    };

    const selectedChecklist = (checklists || []).find((c: any) => c.id === checklistId);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 8 }}
                    className="w-full max-w-[1020px] h-[88vh] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-white">
                        <div className="flex items-center gap-3">
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
                            <h2 className="text-[17px] font-bold text-slate-900">Create Work Order Trigger</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                            <button
                                onClick={handleSubmit}
                                disabled={createMutation.isPending}
                                className="px-4 py-2 text-[13px] font-semibold bg-slate-100 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                {createMutation.isPending ? (uploadingFiles ? 'Uploading files...' : 'Creating...') : 'Create Trigger'}
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* LEFT PANEL */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 border-r border-slate-200 bg-white">

                            {/* Trigger Details */}
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900 mb-4">Trigger Details</h3>
                                <div className="space-y-2 mb-5">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input type="radio" name="triggerMode" checked={triggerMode === 'INTERVAL'} onChange={() => setTriggerMode('INTERVAL')} className="w-4 h-4 accent-blue-600" />
                                        <span className="text-[13px] text-slate-700">Trigger every time</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input type="radio" name="triggerMode" checked={triggerMode === 'ONE_TIME'} onChange={() => setTriggerMode('ONE_TIME')} className="w-4 h-4 accent-blue-600" />
                                        <span className="text-[13px] text-slate-700">One-time trigger</span>
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">When meter reading <span className="text-rose-500">*</span></label>
                                        <select value={meterCondition} onChange={(e) => setMeterCondition(e.target.value)} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors appearance-none">
                                            <option value="exceeds">Exceeds</option>
                                            <option value="reaches">Reaches</option>
                                            <option value="falls_below">Falls below</option>
                                            <option value="increases_by">Increases by</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Value ({meter?.unit || 'Units'}) <span className="text-rose-500">*</span></label>
                                        <input type="number" value={meterValue} onChange={(e) => setMeterValue(Number(e.target.value))} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors" />
                                    </div>
                                </div>
                                <div className="flex items-end gap-3">
                                    <div className="w-32">
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Due <span className="text-rose-500">*</span></label>
                                        <input type="number" value={dueValue} onChange={(e) => setDueValue(Number(e.target.value))} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors" />
                                    </div>
                                    <div className="w-48">
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Select Frequency <span className="text-rose-500">*</span></label>
                                        <select value={dueUnit} onChange={(e) => setDueUnit(e.target.value)} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors appearance-none">
                                            <option value="HOURS">Hours</option>
                                            <option value="DAYS">Days</option>
                                            <option value="WEEKS">Weeks</option>
                                            <option value="MONTHS">Months</option>
                                        </select>
                                    </div>
                                    <span className="text-[13px] text-slate-500 pb-2.5">after trigger</span>
                                </div>
                            </div>

                            {/* Work Order Details */}
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900 mb-4">Work Order Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Work Order Title <span className="text-rose-500">*</span></label>
                                        <input type="text" value={woTitle} onChange={(e) => setWoTitle(e.target.value)} autoFocus className="w-full h-10 border border-blue-400 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-500 ring-1 ring-blue-200 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Description</label>
                                        <textarea value={woDescription} onChange={(e) => setWoDescription(e.target.value)} rows={4} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors resize-y" />
                                    </div>

                                    {/* Images */}
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Images</label>
                                        <input
                                            type="file"
                                            ref={imageInputRef}
                                            className="hidden"
                                            accept="image/*,video/*"
                                            multiple
                                            onChange={(e) => {
                                                if (e.target.files) setQueuedImages(prev => [...prev, ...Array.from(e.target.files!)]);
                                            }}
                                        />
                                        <div
                                            className="border border-dashed border-slate-300 rounded-lg py-5 flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                                            onClick={() => imageInputRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
                                                setQueuedImages(prev => [...prev, ...dropped]);
                                            }}
                                        >
                                            <button type="button" className="px-5 py-2 border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors">Upload</button>
                                            <span className="text-[13px] text-slate-400">or Drop Images</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1">Max: 200MB · Videos up to 150MB</p>
                                        {queuedImages.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {queuedImages.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-700 font-medium">
                                                        <Image className="w-3 h-3" />
                                                        <span className="max-w-[120px] truncate">{f.name}</span>
                                                        <button onClick={() => setQueuedImages(prev => prev.filter((_, idx) => idx !== i))} className="text-blue-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Priority</label>
                                        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors appearance-none">
                                            <option value=""></option>
                                            <option value="NONE">None</option>
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Category</label>
                                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors appearance-none">
                                            <option value=""></option>
                                            {(categories || []).map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Location & Asset */}
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900 mb-4">Location &amp; Asset</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Location</label>
                                        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors appearance-none">
                                            <option value=""></option>
                                            {(locations || []).map((l: any) => (<option key={l.id} value={l.id}>{l.name}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Asset</label>
                                        <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors appearance-none">
                                            <option value=""></option>
                                            {(assets || []).map((a: any) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Files */}
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900 mb-1">Files</h3>
                                <p className="text-[12px] text-slate-500 mb-3">Add files to this work order by dropping them here or selecting from your computer.</p>
                                <input
                                    type="file"
                                    ref={filesInputRef}
                                    className="hidden"
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) setQueuedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                    }}
                                />
                                <div
                                    className="border border-dashed border-slate-300 rounded-lg py-5 flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => filesInputRef.current?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setQueuedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                                    }}
                                >
                                    <button type="button" className="px-5 py-2 border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors">Upload</button>
                                    <span className="text-[13px] text-slate-400">or Drop Files</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">Max: 200MB · Videos up to 150MB</p>
                                {queuedFiles.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {queuedFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium">
                                                <Paperclip className="w-3 h-3 text-slate-400" />
                                                <span className="max-w-[140px] truncate">{f.name}</span>
                                                <button onClick={() => setQueuedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tasks */}
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900 mb-3">Tasks</h3>
                                {tasks.length > 0 && (
                                    <div className="mb-3 space-y-1.5">
                                        {tasks.map((t, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[13px] text-slate-700 p-2 bg-slate-50 rounded-lg">
                                                <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                                                <span className="flex-1">{t}</span>
                                                <button onClick={() => setTasks(tasks.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newTask}
                                        onChange={(e) => setNewTask(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
                                        placeholder="Type a task and press Enter..."
                                        className="flex-1 h-9 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors"
                                    />
                                    <button onClick={addTask} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[12px] font-semibold rounded-lg hover:bg-blue-100 transition-colors">Add</button>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => { const inp = document.getElementById('task-input-trigger'); if (inp) (inp as HTMLInputElement).focus(); }} className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                                        <Plus className="w-4 h-4 text-blue-500" />Add Tasks
                                    </button>
                                    <button type="button" onClick={() => setShowChecklistPicker(true)} className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                                        <Plus className="w-4 h-4 text-blue-500" />Add Checklist
                                    </button>
                                </div>
                                {selectedChecklist && (
                                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-[12px] text-blue-700 font-semibold">
                                        <CheckSquare className="w-4 h-4" />
                                        Checklist: {selectedChecklist.title}
                                        <button onClick={() => setChecklistId('')} className="ml-auto text-blue-400 hover:text-rose-500"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT PANEL */}
                        <div className="w-[300px] shrink-0 overflow-y-auto px-6 py-6 space-y-7 bg-white">
                            <div>
                                <h3 className="text-[14px] font-bold text-slate-900 mb-3">Structure &amp; Settings</h3>
                                <input type="text" defaultValue={meter?.unit || 'Hours'} readOnly className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-500 bg-slate-50 outline-none cursor-default" />
                            </div>

                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-[14px] font-bold text-slate-900 mb-1">Workers &amp; Teams</h3>
                                <p className="text-[12px] text-slate-500 mb-4">Assign workers and teams to this work order</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Primary Assignee</label>
                                        <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-700 bg-white outline-none focus:border-blue-400 transition-colors appearance-none">
                                            <option value=""></option>
                                            {(users || []).map((u: any) => (<option key={u.id} value={u.id}>{u.user?.name || u.user?.email || u.name || u.email}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Additional Workers</label>
                                        <select className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-400 bg-slate-50 outline-none appearance-none cursor-not-allowed" disabled title="Multiple worker assignment requires a database upgrade">
                                            <option>Not available</option>
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-1">Requires database upgrade</p>
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Team</label>
                                        <select className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-400 bg-slate-50 outline-none appearance-none cursor-not-allowed" disabled title="Team assignment requires a database upgrade">
                                            <option>Not available</option>
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-1">Requires database upgrade</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-[14px] font-bold text-slate-900 mb-4">Assign Purchase Orders</h3>
                                <div>
                                    <label className="text-[12px] font-semibold text-slate-600 mb-1 block">Purchase Order</label>
                                    <select className="w-full h-10 border border-slate-300 rounded-lg px-3 text-[13px] text-slate-400 bg-slate-50 outline-none appearance-none cursor-not-allowed" disabled>
                                        <option>Not available</option>
                                    </select>
                                    <p className="text-[10px] text-slate-400 mt-1">Requires database upgrade</p>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-[14px] font-bold text-slate-900 mb-1">Signature Required</h3>
                                <p className="text-[12px] text-slate-500 mb-4">Require technicians to upload a signature image in order to complete this work order.</p>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <button type="button" onClick={() => setRequiresSignature(!requiresSignature)} className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${requiresSignature ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${requiresSignature ? 'left-5' : 'left-1'}`} />
                                    </button>
                                    <div>
                                        <p className="text-[13px] font-semibold text-slate-700">Requires Signature</p>
                                        <p className="text-[11px] text-slate-500">Work order will require a signature</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Checklist Picker Overlay */}
                {showChecklistPicker && (
                    <div className="absolute inset-0 z-[2100] flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                                <h3 className="text-[15px] font-bold text-slate-900">Select Checklist</h3>
                                <button onClick={() => setShowChecklistPicker(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                                {(checklists || []).length === 0 ? (
                                    <p className="text-[13px] text-slate-400 text-center py-10">No checklists found</p>
                                ) : (
                                    (checklists || []).map((c: any) => (
                                        <button
                                            key={c.id}
                                            onClick={() => { setChecklistId(c.id); setShowChecklistPicker(false); }}
                                            className={`w-full text-left px-6 py-3 text-[13px] hover:bg-blue-50 transition-colors ${checklistId === c.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                                        >
                                            {c.title}
                                        </button>
                                    ))
                                )}
                            </div>
                            <div className="px-6 py-3 border-t border-slate-200 flex justify-end">
                                <button onClick={() => setShowChecklistPicker(false)} className="px-4 py-2 text-[13px] font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AnimatePresence>
    );
};
