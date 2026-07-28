import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Reorder } from 'framer-motion';
import { 
    X, Edit3, Plus, Trash2, 
    ChevronDown, Clock, Package, Activity,
    Calendar as CalendarIcon, Gauge, Settings,
    Type, Info, Search, Copy, ChevronRight, Check,
    GripVertical
} from 'lucide-react';
import { 
    useAssets, 
    useCategories, 
    useLocations, 
    useParts, 
    useMeters,
    useUsers,
    useTeams,
    usePreventiveMaintenance
} from '../hooks/useData';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface CreatePMModalProps {
    isOpen: boolean;
    onClose: () => void;
    schedule?: any;
}

interface AssetRow {
    id: string;
    assetId: string;
    locationId: string;
    meterId: string;
    startDate: string;
    endDate?: string;
    timezone?: string;
    assignedToId: string;
    additionalWorkers?: string;
    teamId?: string;
}

export const CreatePMModal: React.FC<CreatePMModalProps> = ({ isOpen, onClose, schedule }) => {
    const [pmName, setPmName] = useState('Untitled PM');
    const [description] = useState('');
    const [woTitle, setWoTitle] = useState('');
    const [woDescription, setWoDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE'>('MEDIUM');
    const [isEditingName, setIsEditingName] = useState(false);
    
    // Schedule Dropdown Trigger
    const [showScheduleMenu, setShowScheduleMenu] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const scheduleButtonRef = useRef<HTMLButtonElement>(null);
    const [scheduleMenuCoords, setScheduleMenuCoords] = useState<{ top: number; left: number; width: number } | null>(null);

    useEffect(() => {
        if (showScheduleMenu && scheduleButtonRef.current) {
            const rect = scheduleButtonRef.current.getBoundingClientRect();
            setScheduleMenuCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width
            });
        } else {
            setScheduleMenuCoords(null);
        }
    }, [showScheduleMenu]);

    // Advanced WO Details state
    const [createNow, setCreateNow] = useState(false);
    const [durationHours, setDurationHours] = useState(1);
    const [requiresSignature, setRequiresSignature] = useState(false);
    const [plannedParts, setPlannedParts] = useState<{ partId: string; quantity: number }[]>([]);
    const [plannedTasks, setPlannedTasks] = useState<any[]>([]);
    const [checklists, setChecklists] = useState<{
        id: string;
        title: string;
        isCollapsed: boolean;
        tasks: {
            id: string;
            task: string;
            type: string;
            isRequired: boolean;
            requirements: any;
        }[];
    }[]>(() => [
        {
            id: crypto.randomUUID(),
            title: 'Misc',
            isCollapsed: false,
            tasks: [
                {
                    id: crypto.randomUUID(),
                    task: 'Clean air filter & check its condition',
                    type: 'Status',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'Check & Clean the Evaporator coil',
                    type: 'Status',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'Check the condenser coil and clean',
                    type: 'Status',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'Check the operation of evaporator fan motor',
                    type: 'Inspection',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'Check the operation of condenser fan motor',
                    type: 'Inspection',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'Check and record operating voltage and Amperes.',
                    type: 'Number',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'Check and service drain pump,if any',
                    type: 'Inspection',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'Perform functional test of thermostat',
                    type: 'Status',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'Check refrigerant leak in the system',
                    type: 'Inspection',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'Check the refrigerant pressure',
                    type: 'Number',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'check and comb dented fins of cooling coil',
                    type: 'Inspection',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                },
                {
                    id: crypto.randomUUID(),
                    task: 'Check the Insulation of the refrigerant pipe',
                    type: 'Inspection',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                }
            ]
        }
    ]);

    const addChecklist = () => {
        setChecklists(prev => [...prev, {
            id: crypto.randomUUID(),
            title: 'Misc',
            isCollapsed: false,
            tasks: [
                {
                    id: crypto.randomUUID(),
                    task: 'New Task',
                    type: 'Status',
                    isRequired: false,
                    requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                }
            ]
        }]);
    };

    const removeChecklist = (id: string) => {
        setChecklists(prev => prev.filter(c => c.id !== id));
    };

    const toggleChecklistCollapse = (id: string) => {
        setChecklists(prev => prev.map(c => c.id === id ? { ...c, isCollapsed: !c.isCollapsed } : c));
    };

    const updateChecklistTitle = (id: string, title: string) => {
        setChecklists(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    };

    const addTaskToChecklist = (checklistId: string) => {
        setChecklists(prev => prev.map(c => c.id === checklistId ? {
            ...c,
            tasks: [...c.tasks, {
                id: crypto.randomUUID(),
                task: '',
                type: 'Inspection',
                isRequired: false,
                requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
            }]
        } : c));
    };

    const removeTaskFromChecklist = (checklistId: string, taskId: string) => {
        setChecklists(prev => prev.map(c => c.id === checklistId ? {
            ...c,
            tasks: c.tasks.filter(t => t.id !== taskId)
        } : c));
    };

    const updateTaskInChecklist = (checklistId: string, taskId: string, updates: any) => {
        setChecklists(prev => prev.map(c => c.id === checklistId ? {
            ...c,
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        } : c));
    };

    const addPlannedTask = () => {
        setPlannedTasks(prev => [...prev, { 
            id: crypto.randomUUID(), 
            task: '', 
            type: 'Inspection', 
            isRequired: false, 
            isExpanded: true,
            requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
        }]);
    };

    const updatePlannedTask = (id: string, updates: any) => {
        if (updates.task) {
            const isDuplicate = plannedTasks.some(t => t.id !== id && t.task.toLowerCase() === updates.task.toLowerCase());
            if (isDuplicate) {
                toast.error('Task with this protocol already exists');
            }
        }
        setPlannedTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };
    const [checklistId] = useState('');
    const [dueDateTime, setDueDateTime] = useState('09:00 AM');
    const [inactivePeriods, setInactivePeriods] = useState<{ startDate: string; endDate: string; reason?: string }[]>([]);
    const [createWOType, setCreateWOType] = useState<'AHEAD' | 'ON_DAY'>('AHEAD');
    const [advanceNoticeDays, setAdvanceNoticeDays] = useState(1);
    const [meterWODueValue, setMeterWODueValue] = useState(1);
    const [meterWODueUnit, setMeterWODueUnit] = useState<'HOURS' | 'DAYS' | 'WEEKS'>('DAYS');
    const [meterTriggerType, setMeterTriggerType] = useState<'INTERVAL' | 'THRESHOLD' | 'RELATIVE'>('INTERVAL');
    const [isScheduleActive, setIsScheduleActive] = useState(false);
    const [activeDropdownTaskId, setActiveDropdownTaskId] = useState<string | null>(null);

    const TASK_TYPES_LIST = [
        'Status',
        'Text',
        'Number',
        'Meter',
        'Inspection',
        'Multiple Choice',
        'Signature',
        'Checkbox',
        'Warning',
        'Multiselect'
    ];

    // Frequency state
    const [freqType, setFreqType] = useState<'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS' | 'METER' | 'HYBRID'>('MONTHS');
    const [freqValue, setFreqValue] = useState(1);
    const { data: assets } = useAssets();
    const { data: locations } = useLocations();
    const { createPM, updatePM, uploadAttachment } = usePreventiveMaintenance();
    const { data: categories } = useCategories('WORK_ORDER');
    const { data: parts } = useParts();
    // const { data: checklists } = useChecklists();
    const { data: meters } = useMeters();
    const { data: users } = useUsers();
    const { data: teams } = useTeams();

    // File Upload State
    const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    const [assetPickerSearch, setAssetPickerSearch] = useState('');
    const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([]);

    // Premium Features State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isFloating] = useState(false);
    const [isSeasonal] = useState(false);
    const [startMonth] = useState(1);
    const [endMonth] = useState(12);
    const [meterId] = useState('');
    const [meterInterval, setMeterInterval] = useState(100);

    const [assetRows, setAssetRows] = useState<AssetRow[]>([
        { 
            id: crypto.randomUUID(), 
            assetId: '', 
            locationId: '', 
            meterId: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            timezone: '(UTC+05:30) Asia/Calcutta',
            assignedToId: '',
            additionalWorkers: '',
            teamId: ''
        }
    ]);

    const addRow = () => {
        setAssetRows([...assetRows, { 
            id: crypto.randomUUID(), 
            assetId: '', 
            locationId: '', 
            meterId: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            timezone: '(UTC+05:30) Asia/Calcutta',
            assignedToId: '',
            additionalWorkers: '',
            teamId: ''
        }]);
    };

    const handleConfirmAssets = () => {
        const selectedAssets = assets?.filter(a => pickerSelectedIds.includes(a.id)) || [];
        const newRows = selectedAssets.map(asset => ({
            id: crypto.randomUUID(),
            assetId: asset.id,
            locationId: asset.locationId || '',
            meterId: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            timezone: '(UTC+05:30) Asia/Calcutta',
            assignedToId: '',
            additionalWorkers: '',
            teamId: ''
        }));
        setAssetRows([...assetRows, ...newRows]);
        setIsAssetPickerOpen(false);
        setPickerSelectedIds([]);
    };

    const removeRow = (id: string) => {
        if (assetRows.length > 1) {
            setAssetRows(assetRows.filter(row => row.id !== id));
        }
    };

    const updateRow = (id: string, field: keyof AssetRow, value: string) => {
        setAssetRows(assetRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    React.useEffect(() => {
        if (schedule && isOpen) {
            setPmName(schedule.name || 'Untitled PM');
            setWoTitle(schedule.woTitle || '');
            setWoDescription(schedule.woDescription || schedule.description || '');
            setCategoryId(schedule.categoryId || '');
            setPriority(schedule.priority || 'MEDIUM');
            setDurationHours(schedule.durationHours || 1);
            setRequiresSignature(schedule.requiresSignature || false);
            setFreqType(schedule.frequencyType || 'MONTHS');
            setFreqValue(schedule.frequencyValue || 1);
            if (schedule.frequencyType) setIsScheduleActive(true);
            setAdvanceNoticeDays(schedule.advanceNoticeDays || 1);
            setDueDateTime(schedule.dueDateTime || '09:00 AM');
            setCreateWOType(schedule.createWOType || 'AHEAD');
            if (schedule.meterWODueValue) setMeterWODueValue(schedule.meterWODueValue);
            if (schedule.meterWODueUnit) setMeterWODueUnit(schedule.meterWODueUnit);
            if (schedule.meterTriggerType) setMeterTriggerType(schedule.meterTriggerType);
            if (schedule.meterInterval) setMeterInterval(schedule.meterInterval);
            if (schedule.plannedParts) {
                setPlannedParts(schedule.plannedParts.map((p: any) => ({ partId: p.partId, quantity: p.quantity })));
            }
            if (schedule.plannedTasks && schedule.plannedTasks.length > 0) {
                setChecklists([
                    {
                        id: crypto.randomUUID(),
                        title: 'Misc',
                        isCollapsed: false,
                        tasks: schedule.plannedTasks.map((t: any) => ({
                            id: t.id || crypto.randomUUID(),
                            task: t.task,
                            type: t.type || 'Status',
                            isRequired: t.isRequired || false,
                            requirements: t.requirements || { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false }
                        }))
                    }
                ]);
                setPlannedTasks([]);
            } else {
                setChecklists([
                    {
                        id: crypto.randomUUID(),
                        title: 'Misc',
                        isCollapsed: false,
                        tasks: [
                            { id: crypto.randomUUID(), task: 'Clean air filter & check its condition', type: 'Status', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'Check & Clean the Evaporator coil', type: 'Status', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'Check the condenser coil and clean', type: 'Status', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'Check the operation of evaporator fan motor', type: 'Inspection', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'Check the operation of condenser fan motor', type: 'Inspection', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'Check and record operating voltage and Amperes.', type: 'Number', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'Check and service drain pump,if any', type: 'Inspection', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'Perform functional test of thermostat', type: 'Status', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'Check refrigerant leak in the system', type: 'Inspection', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'Check the refrigerant pressure', type: 'Number', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'check and comb dented fins of cooling coil', type: 'Inspection', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } },
                            { id: crypto.randomUUID(), task: 'Check the Insulation of the refrigerant pipe', type: 'Inspection', isRequired: false, requirements: { notes: false, photo: false, url: false, signature: false, reading: false, barcode: false } }
                        ]
                    }
                ]);
                setPlannedTasks([]);
            }
            if (schedule.inactivePeriods) {
                setInactivePeriods(schedule.inactivePeriods);
            }
            if (schedule.assetId) {
                setAssetRows([{
                    id: crypto.randomUUID(),
                    assetId: schedule.assetId,
                    locationId: schedule.locationId || '',
                    meterId: schedule.meterId || '',
                    startDate: schedule.nextDueDate ? new Date(schedule.nextDueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    assignedToId: schedule.assignedToId || ''
                }]);
            }
        }
    }, [schedule, isOpen]);

    const handleCreate = async () => {
        try {
            if (!isScheduleActive) {
                toast.error('You must add a Schedule before creating a PM');
                return;
            }
            
            const validRows = assetRows.filter(row => row.assetId);
            if (validRows.length === 0) {
                toast.error('You must select at least one Asset');
                return;
            }

            for (const row of validRows) {
                
                const payload = {
                    name: pmName,
                    description: woDescription,
                    woTitle: woTitle || undefined,
                    woDescription: woDescription || undefined,
                    categoryId: categoryId || undefined,
                    priority: priority,
                    assetId: row.assetId,
                    assignedToId: row.assignedToId || undefined,
                    checklistId: checklistId || undefined,
                    frequencyType: freqType,
                    // Calendar fields: used by Calendar & Hybrid
                    frequencyValue: (freqType === 'METER') ? undefined : freqValue,
                    advanceNoticeDays: advanceNoticeDays,
                    nextDueDate: (freqType === 'METER') ? undefined : new Date(row.startDate).toISOString(),
                    status: 'ACTIVE' as any,
                    durationHours,
                    requiresSignature,
                    createNow,
                    dueDateTime,
                    createWOType,
                    // Meter fields: used by Meter & Hybrid
                    meterWODueValue: (freqType === 'METER' || freqType === 'HYBRID') ? meterWODueValue : undefined,
                    meterWODueUnit: (freqType === 'METER' || freqType === 'HYBRID') ? meterWODueUnit : undefined,
                    meterTriggerType: (freqType === 'METER' || freqType === 'HYBRID') ? meterTriggerType : undefined,
                    meterInterval: (freqType === 'METER' || freqType === 'HYBRID') ? meterInterval : undefined,
                    meterId: (freqType === 'METER' || freqType === 'HYBRID') ? meterId : undefined,
                    inactivePeriods,
                    assets: assetRows.map(row => ({
                        assetId: row.assetId,
                        locationId: row.locationId,
                        meterId: row.meterId,
                        startDate: row.startDate,
                        assignedToId: row.assignedToId || undefined
                    })),
                    plannedParts,
                    plannedTasks: [
                        ...plannedTasks,
                        ...checklists.flatMap(c => c.tasks.map(t => ({
                            task: t.task || 'New Task',
                            type: t.type,
                            isRequired: t.isRequired,
                            requirements: t.requirements
                        })))
                    ],
                    isFloating,
                    isSeasonal,
                    startMonth: isSeasonal ? startMonth : undefined,
                    endMonth: isSeasonal ? endMonth : undefined,
                };

                let response;
                if (schedule?.id) {
                    response = await updatePM.mutateAsync({ id: schedule.id, ...payload } as any);
                } else {
                    response = await createPM.mutateAsync(payload);
                }

                if (response?.id && queuedFiles.length > 0) {
                    await Promise.all(
                        queuedFiles.map(file => uploadAttachment.mutateAsync({ id: response.id, file }))
                    );
                }
            }
            toast.success(schedule ? 'Preventive Maintenance updated successfully' : 'Preventive Maintenance defined successfully');
            onClose();
        } catch (error: any) {
            console.error("Failed to create PM:", error);
            toast.error(error.response?.data?.message || 'Failed to create PM schedule');
        }
    };

    const renderModalContent = () => {
        return (
            <div className="space-y-6">
                {/* PM Title */}
                <div className="space-y-2">
                    <label className="text-[14px] font-bold text-slate-700">PM Title <span className="text-rose-500">*</span></label>
                    <input 
                        type="text" 
                        value={pmName}
                        onChange={(e) => setPmName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-primary transition-all font-medium"
                    />
                </div>

                {/* Work Order Title */}
                <div className="space-y-2">
                    <label className="text-[14px] font-bold text-slate-700">Work Order Title <span className="text-rose-500">*</span></label>
                    <input 
                        type="text" 
                        value={woTitle}
                        onChange={(e) => setWoTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-primary transition-all font-medium"
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-[14px] font-bold text-slate-700">Description</label>
                    <textarea 
                        value={woDescription}
                        onChange={(e) => setWoDescription(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-primary transition-all font-medium min-h-[120px] resize-none"
                    />
                </div>

                {/* Create Now & Callout */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            checked={createNow}
                            onChange={(e) => setCreateNow(e.target.checked)}
                            className="w-5 h-5 border-2 border-slate-200 rounded-md accent-primary cursor-pointer"
                            id="createNow"
                        />
                        <label htmlFor="createNow" className="text-[14px] font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                            Create first Work Order Now?
                            <div className="p-1 bg-slate-50 rounded-full text-slate-400"><Info className="w-3.5 h-3.5" /></div>
                        </label>
                    </div>
                    
                    {createNow && (
                        <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/50 border border-blue-100/60 rounded-xl text-blue-800 text-[13px] font-medium leading-relaxed">
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <span>Create first work order cannot be edited after work order has been created</span>
                        </div>
                    )}
                </div>

                {/* Priority & Category */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-slate-700">Priority</label>
                        <div className="relative">
                            <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none appearance-none font-medium pr-10"
                            >
                                <option value="NONE">None</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-slate-700">Category</label>
                        <div className="relative">
                            <select 
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none appearance-none font-medium pr-10"
                            >
                                <option value="">Select Category...</option>
                                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                    <label className="text-[14px] font-bold text-slate-700">Duration (as hours)</label>
                    <input 
                        type="number" 
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-primary transition-all font-medium"
                    />
                </div>

                {/* Signature */}
                <div className="space-y-4">
                    <label className="text-[14px] font-bold text-slate-700">Signature</label>
                    <div className="flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={() => setRequiresSignature(!requiresSignature)}
                            className={cn(
                                "w-11 h-6 rounded-full transition-colors relative",
                                requiresSignature ? "bg-primary" : "bg-slate-200"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                requiresSignature ? "left-6" : "left-1"
                            )} />
                        </button>
                        <span className="text-[14px] font-medium text-slate-600">Requires Signature</span>
                    </div>
                </div>

                {/* Attachments */}
                <div className="space-y-6 pt-4">
                    <h4 className="text-[18px] font-bold text-slate-900">Attachments</h4>
                    
                    <div className="space-y-4">
                        <input 
                            type="file" 
                            ref={photoInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files) setQueuedFiles([...queuedFiles, ...Array.from(e.target.files)]);
                            }}
                        />
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            multiple 
                            onChange={(e) => {
                                if (e.target.files) setQueuedFiles([...queuedFiles, ...Array.from(e.target.files)]);
                            }}
                        />
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-slate-600">Photos</label>
                            <div className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => photoInputRef.current?.click()} className="px-5 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all bg-white">Upload</button>
                                    <span className="text-[13px] text-slate-400">or Drop Images</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">Max: 200MB · Videos up to 150MB</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-slate-600">Files</label>
                            <div className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-5 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all bg-white">Upload</button>
                                    <span className="text-[13px] text-slate-400">or Drop Files</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">Max: 200MB · Videos up to 150MB</p>
                        </div>

                        <button type="button" className="text-[13px] font-bold text-primary hover:underline">Add from Saved Files</button>
                    </div>
                </div>

                {/* Parts */}
                <div className="space-y-6 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[18px] font-bold text-slate-900">Parts</h4>
                        <button 
                            type="button"
                            onClick={() => setPlannedParts([...plannedParts, { partId: '', quantity: 1 }])}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                        >
                            Add Parts
                        </button>
                    </div>

                    <div className="space-y-3">
                        {plannedParts.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <Package className="w-5 h-5 text-slate-400" />
                                <select 
                                    value={p.partId}
                                    onChange={(e) => {
                                        const next = [...plannedParts];
                                        next[idx].partId = e.target.value;
                                        setPlannedParts(next);
                                    }}
                                    className="flex-1 bg-transparent text-[14px] font-bold text-slate-700 outline-none"
                                >
                                    <option value="">Select Replacement Part...</option>
                                    {parts?.map(part => <option key={part.id} value={part.id}>{part.name}</option>)}
                                </select>
                                
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1">
                                    <span className="text-[12px] font-bold text-slate-400">Qty:</span>
                                    <input 
                                        type="number" 
                                        min="1"
                                        value={p.quantity} 
                                        onChange={(e) => {
                                            const next = [...plannedParts];
                                            next[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                                            setPlannedParts(next);
                                        }}
                                        className="w-12 text-[13px] font-bold text-slate-700 outline-none text-center"
                                    />
                                </div>

                                <button type="button" onClick={() => setPlannedParts(plannedParts.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {plannedParts.length === 0 && (
                            <div className="py-12 border border-slate-100 rounded-2xl flex items-center justify-center">
                                <p className="text-[13px] text-slate-400 font-medium italic">No line items have been added yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Checklist Section */}
                <div className="space-y-6 pt-4 border-t border-slate-50">
                    {checklists.map((c) => (
                        <div key={c.id} className="bg-white border border-slate-200 rounded-[20px] p-6 space-y-4 shadow-sm">
                            {/* Checklist Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <input 
                                    type="text" 
                                    value={c.title} 
                                    onChange={(e) => updateChecklistTitle(c.id, e.target.value)}
                                    className="text-[16px] font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 focus:border-b focus:border-slate-300 w-64 px-1"
                                    placeholder="Enter Checklist Title..."
                                />
                                <div className="flex items-center gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => removeChecklist(c.id)}
                                        className="text-[14px] font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                                    >
                                        Remove Checklist
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => toggleChecklistCollapse(c.id)}
                                        className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-500"
                                    >
                                        <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", !c.isCollapsed && "rotate-180")} />
                                    </button>
                                </div>
                            </div>

                            {/* Checklist Tasks */}
                            {!c.isCollapsed && (
                                <div className="space-y-4 pt-2">
                                    <Reorder.Group axis="y" values={c.tasks} onReorder={(newTasks) => {
                                        setChecklists(prev => prev.map(ch => ch.id === c.id ? { ...ch, tasks: newTasks } : ch));
                                    }} className="space-y-4">
                                        {c.tasks.map((task) => (
                                            <Reorder.Item key={task.id} value={task} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-3 sm:p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-2 flex-1">
                                                {/* Grip Dots */}
                                                <div className="text-slate-400 cursor-grab active:cursor-grabbing flex items-center justify-center p-1 shrink-0">
                                                    <GripVertical className="w-4 h-4 text-slate-400" />
                                                </div>
                                                
                                                {/* Task Text */}
                                                <input 
                                                    type="text"
                                                    value={task.task}
                                                    onChange={(e) => updateTaskInChecklist(c.id, task.id, { task: e.target.value })}
                                                    placeholder="Describe the specialized task..."
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] font-medium text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-300 min-w-0"
                                                />
                                            </div>
                                            
                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Type Selector */}
                                                <div className="relative flex-1 sm:flex-initial sm:min-w-[140px]">
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdownTaskId(activeDropdownTaskId === task.id ? null : task.id);
                                                        }}
                                                        className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] font-bold text-slate-700 outline-none hover:border-primary transition-all cursor-pointer h-[42px]"
                                                    >
                                                        <span>{task.type}</span>
                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                    </button>

                                                    {activeDropdownTaskId === task.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-[100]" onClick={() => setActiveDropdownTaskId(null)} />
                                                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-[110] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-[280px] overflow-y-auto custom-scrollbar">
                                                                {TASK_TYPES_LIST.map((type) => (
                                                                    <button
                                                                        key={type}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            updateTaskInChecklist(c.id, task.id, { type });
                                                                            setActiveDropdownTaskId(null);
                                                                        }}
                                                                        className={cn(
                                                                            "w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 text-[14px] font-bold transition-colors text-left",
                                                                            task.type === type ? "text-blue-600 bg-blue-50/20" : "text-slate-700"
                                                                        )}
                                                                    >
                                                                        <span>{type}</span>
                                                                        {task.type === type && (
                                                                            <Check className="w-4 h-4 text-blue-600 stroke-[3px]" />
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {/* Delete button */}
                                                <button 
                                                    type="button"
                                                    onClick={() => removeTaskFromChecklist(c.id, task.id)}
                                                    className="p-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all h-[42px] flex items-center justify-center border border-slate-200"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>
                                    {/* Add Tasks inside Checklist Button */}
                                    <button 
                                        type="button"
                                        onClick={() => addTaskToChecklist(c.id)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/5 border border-primary/20 hover:bg-primary/10 rounded-xl text-[13px] font-bold text-primary transition-all mt-4"
                                    >
                                        <Plus className="w-4 h-4" /> Add Tasks
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="flex items-center gap-3 pt-4">
                        <button 
                            type="button"
                            onClick={addPlannedTask}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-primary/20 rounded-xl text-[13px] font-bold text-primary hover:bg-primary/5 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Tasks
                        </button>
                        <button 
                            type="button"
                            onClick={addChecklist}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-primary/20 rounded-xl text-[13px] font-bold text-primary hover:bg-primary/5 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Checklist
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    if (schedule) {
        // Edit mode directly renders the centered Edit Work Order Details modal
        return (
            <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-[20px] font-bold text-slate-900">Edit Work Order Details</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 pb-24 space-y-8 custom-scrollbar">
                        {renderModalContent()}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-end gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                        <button 
                            onClick={handleCreate}
                            disabled={updatePM.isPending || !pmName}
                            className={cn(
                                "px-8 py-2.5 rounded-xl text-[14px] font-black transition-all border shadow-sm",
                                (updatePM.isPending || !pmName)
                                ? "bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100"
                                : "bg-primary text-white border-transparent hover:opacity-90 active:scale-[0.98]"
                            )}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-10 py-5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        {isEditingName ? (
                            <input 
                                autoFocus
                                value={pmName}
                                onChange={(e) => setPmName(e.target.value)}
                                onBlur={() => setIsEditingName(false)}
                                className="text-[20px] font-semibold text-slate-900 border-b-2 border-primary outline-none px-1"
                            />
                        ) : (
                            <h2 className="text-[20px] font-semibold text-slate-900">{pmName}</h2>
                        )}
                        <button onClick={() => setIsEditingName(true)} className="p-1 hover:bg-slate-50 rounded text-slate-400">
                            <Edit3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="px-6 py-2.5 text-[14px] font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                        Cancel
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 md:py-16 bg-white">
                <div className="max-w-[1400px] mx-auto space-y-20">
                    
                    {/* Top Row: Details & Schedules */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-6">
                        
                        {/* Work Order Details Header */}
                        <div className="space-y-2 order-1 lg:order-1">
                            <h3 className="text-[18px] font-bold text-slate-800">
                                Work Order details <span className="text-rose-500">*</span>
                            </h3>
                            <p className="text-[14px] text-slate-500 font-medium leading-relaxed max-w-xl">
                                Specify the details of the work order that will be generated by this preventive maintenance trigger.
                            </p>
                        </div>

                        {/* Schedules Header */}
                        <div className="space-y-2 order-3 lg:order-2 mt-6 lg:mt-0">
                            <h3 className="text-[18px] font-bold text-slate-800">Schedules</h3>
                            <p className="text-[14px] text-slate-500 font-medium leading-relaxed max-w-xl">
                                Specify maintenance triggers and blackout periods.
                            </p>
                        </div>

                        {/* Work Order Details Card */}
                        <div className="border border-slate-100 rounded-3xl p-6 md:p-10 bg-slate-50/20 flex flex-col items-center justify-center min-h-[160px] order-2 lg:order-3">
                                {showAdvanced ? (
                                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                                        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                                            {/* Header */}
                                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                                <h3 className="text-[20px] font-bold text-slate-900">Add Work Order Details</h3>
                                                <button onClick={() => setShowAdvanced(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 overflow-y-auto p-8 pb-24 space-y-8 custom-scrollbar">
                                                {renderModalContent()}
                                            </div>

                                            {/* Footer */}
                                            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-end gap-3">
                                                <button onClick={() => setShowAdvanced(false)} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                                                <button onClick={() => setShowAdvanced(false)} className="px-8 py-2.5 bg-primary text-white rounded-xl text-[14px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">Add Work Order Details</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setShowAdvanced(true)}
                                        className="px-12 py-3 bg-white border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-700 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all w-full md:w-auto flex items-center gap-2 justify-center"
                                    >
                                        <Plus className="w-4 h-4" /> Add Work Order Details
                                    </button>
                                )}
                        </div>

                        {/* Schedules Card */}
                        <div className="relative flex flex-col order-4 lg:order-4">
                            <div className="border border-slate-100 rounded-3xl p-6 md:p-10 bg-slate-50/20 flex flex-col items-center justify-center min-h-[160px] flex-grow">
                                    {isScheduleActive ? (
                                        <div className="w-full flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                                    {freqType === 'METER' ? <Gauge className="w-5 h-5" /> : freqType === 'HYBRID' ? <Settings className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-[15px] font-bold text-slate-900">
                                                        {freqType === 'METER' ? 'Meter Trigger' : freqType === 'HYBRID' ? 'Hybrid (Calendar + Meter)' : 'Calendar Schedule'}
                                                    </h4>
                                                    <p className="text-[13px] text-slate-500 font-semibold mt-0.5">
                                                        {freqType === 'METER' 
                                                            ? `Triggers every ${meterInterval} units` 
                                                            : freqType === 'HYBRID'
                                                            ? `Every ${freqValue} ${freqType.toLowerCase()} or ${meterInterval} units`
                                                            : `Every ${freqValue} ${freqType.toLowerCase()} at ${dueDateTime}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowCalendarModal(true)} 
                                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => { setIsScheduleActive(false); }} 
                                                    className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center w-full max-w-2xl relative">
                                            <button 
                                                ref={scheduleButtonRef}
                                                onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                                                className="flex-grow py-4 bg-white border border-slate-200 rounded-xl text-[15px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 group"
                                            >
                                                <Plus className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform duration-300" />
                                                Add Schedule
                                            </button>

                                            {showScheduleMenu && scheduleMenuCoords && createPortal(
                                                <>
                                                    <div className="fixed inset-0 z-[9999]" onClick={() => setShowScheduleMenu(false)} />
                                                    <div 
                                                        className="fixed w-[400px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-3 z-[10000] animate-in fade-in zoom-in-95 duration-200"
                                                        style={{
                                                            bottom: `${window.innerHeight - scheduleMenuCoords.top + 8}px`,
                                                            left: `${scheduleMenuCoords.left + scheduleMenuCoords.width / 2}px`,
                                                            transform: 'translateX(-50%)',
                                                        }}
                                                    >
                                                        <button 
                                                            onClick={() => { setFreqType('MONTHS'); setShowCalendarModal(true); setShowScheduleMenu(false); setIsScheduleActive(true); }}
                                                            className="w-full flex items-start gap-5 p-5 rounded-[20px] hover:bg-slate-50 transition-all text-left group"
                                                        >
                                                            <CalendarIcon className="w-6 h-6 text-indigo-500" />
                                                            <div className="flex-1">
                                                                 <p className="text-[15px] font-bold text-slate-900 mb-1">Calendar</p>
                                                                 <p className="text-[13px] text-slate-500">Fixed intervals vs trigger dates</p>
                                                            </div>
                                                        </button>
                                                        <button 
                                                            onClick={() => { setFreqType('METER'); setShowCalendarModal(true); setShowScheduleMenu(false); setIsScheduleActive(true); }}
                                                            className="w-full flex items-start gap-5 p-5 rounded-[20px] hover:bg-slate-50 transition-all text-left"
                                                        >
                                                            <Gauge className="w-6 h-6 text-amber-500" />
                                                            <div className="flex-1">
                                                                 <p className="text-[15px] font-bold text-slate-900 mb-1">Meter Readings</p>
                                                                 <p className="text-[13px] text-slate-500">Based on technical usage limits</p>
                                                            </div>
                                                        </button>
                                                        <button 
                                                            onClick={() => { setFreqType('HYBRID'); setShowCalendarModal(true); setShowScheduleMenu(false); setIsScheduleActive(true); }}
                                                            className="w-full flex items-start gap-5 p-5 rounded-[20px] hover:bg-slate-50 transition-all text-left"
                                                        >
                                                            <Settings className="w-6 h-6 text-rose-500" />
                                                            <div className="flex-1">
                                                                 <p className="text-[15px] font-bold text-slate-900 mb-1">Hybrid (Both)</p>
                                                                 <p className="text-[13px] text-slate-500">Whichever comes first</p>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </>,
                                                document.body
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                    </div>

                    {/* Assets & Locations Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-[16px] font-bold text-slate-800">Assets & Locations</h3>
                                <p className="text-[13px] text-slate-500 font-medium">Select Asset and Locations, assign them to the schedule, and define assignees and start dates.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={addRow} className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-md text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                                    <Plus className="w-3.5 h-3.5" /> Add Row
                                </button>
                                <button 
                                    onClick={() => setIsAssetPickerOpen(true)}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-md text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Bulk Select Assets
                                </button>
                            </div>
                        </div>

                        {/* Choose Assets Modal */}
                        {isAssetPickerOpen && (
                            <div className="fixed inset-0 z-[1001] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                                <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
                                    {/* Header */}
                                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="text-[18px] font-bold text-slate-900">Choose Assets</h3>
                                        <button onClick={() => setIsAssetPickerOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Toolbar */}
                                    <div className="p-6 border-b border-slate-50">
                                        <div className="relative max-w-sm">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text"
                                                placeholder="Search"
                                                value={assetPickerSearch}
                                                onChange={(e) => setAssetPickerSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-blue-400 rounded-md text-[14px] outline-none shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Table Content */}
                                    <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left min-w-[800px]">
                                            <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                                                <tr>
                                                    <th className="w-12 px-6 py-4">
                                                        <div 
                                                            onClick={() => {
                                                                const visible = (assets || []).filter(a => a.name.toLowerCase().includes(assetPickerSearch.toLowerCase()));
                                                                if (pickerSelectedIds.length === visible.length) setPickerSelectedIds([]);
                                                                else setPickerSelectedIds(visible.map(v => v.id));
                                                            }}
                                                            className={cn(
                                                                "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                                                                pickerSelectedIds.length > 0 && pickerSelectedIds.length === (assets || []).filter(a => a.name.toLowerCase().includes(assetPickerSearch.toLowerCase())).length
                                                                ? "bg-primary border-primary" : "border-slate-300"
                                                            )}
                                                        >
                                                            {pickerSelectedIds.length > 0 && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4 text-[13px] font-bold text-slate-700 border-l border-slate-50">Name</th>
                                                    <th className="px-6 py-4 text-[13px] font-bold text-slate-700 border-l border-slate-50">Barcode</th>
                                                    <th className="px-6 py-4 text-[13px] font-bold text-slate-700 border-l border-slate-50">Description</th>
                                                    <th className="px-6 py-4 text-[13px] font-bold text-slate-700 border-l border-slate-50">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {(assets || [])
                                                    .filter(a => a.name.toLowerCase().includes(assetPickerSearch.toLowerCase()))
                                                    .map(asset => (
                                                        <tr key={asset.id} className="hover:bg-blue-50/30 group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                                                    <div 
                                                                        onClick={() => setPickerSelectedIds(prev => prev.includes(asset.id) ? prev.filter(id => id !== asset.id) : [...prev, asset.id])}
                                                                        className={cn(
                                                                            "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                                                                            pickerSelectedIds.includes(asset.id) ? "bg-primary border-primary" : "border-slate-300"
                                                                        )}
                                                                    >
                                                                        {pickerSelectedIds.includes(asset.id) && <Check className="w-3 h-3 text-white" />}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-[13px] font-bold text-slate-700">{asset.name}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[13px] text-slate-500 font-mono">{asset.barCode || '-'}</span>
                                                                    <Copy className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-primary transition-all" />
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-[13px] text-slate-500 font-medium max-w-xs truncate" title={asset.description}>{asset.description || '-'}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={cn(
                                                                    "text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                                                                    asset.status === 'OPERATIONAL' ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-50"
                                                                )}>
                                                                    {asset.status || '-'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-white">
                                        <span className="text-[14px] font-black text-slate-900">{pickerSelectedIds.length} Assets selected</span>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setIsAssetPickerOpen(false)}
                                                className="px-6 py-2 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleConfirmAssets}
                                                disabled={pickerSelectedIds.length === 0}
                                                className={cn(
                                                    "px-8 py-2 rounded-xl text-[14px] font-black transition-all shadow-sm",
                                                    pickerSelectedIds.length === 0 
                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                                    : "bg-primary text-white hover:opacity-90 active:scale-[0.98]"
                                                )}
                                            >
                                                Confirm Assets
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Desktop Table View */}
                        <div className="hidden md:block w-full overflow-x-auto border border-slate-200 rounded-2xl shadow-sm custom-scrollbar bg-white">
                            <table className="w-full border-collapse table-fixed min-w-[1400px]">
                                <thead>
                                    <tr className="bg-slate-50/60">
                                        <th className="w-12 border-r border-b border-slate-100"></th>
                                        <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-b border-slate-100">Asset</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-b border-slate-100">Location</th>
                                        {(freqType === 'METER' || freqType === 'HYBRID') && (
                                            <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-b border-slate-100">Target Meter</th>
                                        )}
                                        <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-b border-slate-100">Start Date</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-b border-slate-100">End Date</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-b border-slate-100">Timezone</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-b border-slate-100">Assigned To</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-b border-slate-100">Additional Workers</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-b border-slate-100">Teams</th>
                                        <th className="px-6 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {assetRows.map((row, index) => (
                                        <tr key={row.id} className="hover:bg-slate-50/50">
                                            <td className="border-r border-b border-slate-200 text-center text-[12px] font-semibold text-blue-400">
                                                {index + 1}
                                            </td>
                                            <td className="border-r border-b border-slate-200 p-0">
                                                <div className="relative h-full flex items-center px-4">
                                                    <select 
                                                        value={row.assetId} 
                                                        onChange={(e) => updateRow(row.id, 'assetId', e.target.value)}
                                                        className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-10"
                                                    >
                                                        <option value="">Select Equipment...</option>
                                                        {assets?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                </div>
                                            </td>
                                            <td className="border-r border-b border-slate-200 p-0">
                                                <div className="relative h-full flex items-center px-4">
                                                    <select
                                                        value={
                                                            row.locationId ||
                                                            (row.assetId ? (assets?.find(a => a.id === row.assetId)?.locationId || '') : '')
                                                        }
                                                        onChange={(e) => updateRow(row.id, 'locationId', e.target.value)}
                                                        className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-10"
                                                    >
                                                        <option value="">Select Location...</option>
                                                        {locations?.map(l => (
                                                            <option key={l.id} value={l.id}>{l.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                </div>
                                            </td>
                                            {(freqType === 'METER' || freqType === 'HYBRID') && (
                                                <td className="border-r border-b border-slate-200 p-0">
                                                    <div className="relative h-full flex items-center px-4">
                                                        <select 
                                                            value={row.meterId} 
                                                            onChange={(e) => updateRow(row.id, 'meterId', e.target.value)}
                                                            className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-10"
                                                        >
                                                            <option value="">No Meter...</option>
                                                            {meters?.filter(m => m.assetId === row.assetId).map(m => (
                                                                <option key={m.id} value={m.id}>{m.name}</option>
                                                            ))}
                                                        </select>
                                                        <Gauge className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                    </div>
                                                </td>
                                            )}
                                            <td className="border-r border-b border-slate-200 p-0">
                                                <div className="relative h-full flex items-center px-4">
                                                    <input 
                                                        type="date" 
                                                        value={row.startDate} 
                                                        onChange={(e) => updateRow(row.id, 'startDate', e.target.value)} 
                                                        className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none h-10" 
                                                    />
                                                </div>
                                            </td>
                                            <td className="border-r border-b border-slate-200 p-0">
                                                <div className="relative h-full flex items-center px-4">
                                                    <input 
                                                        type="date" 
                                                        value={row.endDate} 
                                                        onChange={(e) => updateRow(row.id, 'endDate', e.target.value)} 
                                                        className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none h-10" 
                                                    />
                                                </div>
                                            </td>
                                            <td className="border-r border-b border-slate-200 p-0">
                                                <div className="relative h-full flex items-center px-4">
                                                    <select 
                                                        value={row.timezone} 
                                                        onChange={(e) => updateRow(row.id, 'timezone', e.target.value)}
                                                        className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-10"
                                                    >
                                                        <option value="(UTC+05:30) Asia/Calcutta">(UTC+05:30) Asia/Calcutta</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                </div>
                                            </td>
                                            <td className="border-r border-b border-slate-200 p-0">
                                                <div className="relative h-full flex items-center px-4">
                                                    <select 
                                                        value={row.assignedToId} 
                                                        onChange={(e) => updateRow(row.id, 'assignedToId', e.target.value)}
                                                        className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-10"
                                                    >
                                                        <option value="">Select User...</option>
                                                        {users?.map(u => <option key={(u as any).userOrgId || u.id} value={(u as any).userOrgId || u.id}>{u.name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                </div>
                                            </td>
                                            <td className="border-r border-b border-slate-200 p-0">
                                                <div className="relative h-full flex items-center px-4">
                                                    <select 
                                                        value={row.additionalWorkers} 
                                                        onChange={(e) => updateRow(row.id, 'additionalWorkers', e.target.value)}
                                                        className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-10"
                                                    >
                                                        <option value="">Select Workers...</option>
                                                        {users?.map(u => <option key={(u as any).userOrgId || u.id} value={(u as any).userOrgId || u.id}>{u.name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                </div>
                                            </td>
                                            <td className="border-r border-b border-slate-200 p-0">
                                                <div className="relative h-full flex items-center px-4">
                                                    <select 
                                                        value={row.teamId} 
                                                        onChange={(e) => updateRow(row.id, 'teamId', e.target.value)}
                                                        className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-10"
                                                    >
                                                        <option value="">Select Team...</option>
                                                        {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                </div>
                                            </td>
                                            <td className="border-b border-slate-200 p-0">
                                                <div className="flex items-center justify-center h-10">
                                                    <button onClick={() => removeRow(row.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card-Based List View */}
                        <div className="md:hidden space-y-4">
                            {assetRows.map((row, index) => (
                                <div key={row.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative shadow-xs">
                                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                                        <span className="text-[13px] font-black text-slate-800 uppercase tracking-wider">
                                            Equipment Entry #{index + 1}
                                        </span>
                                        <button 
                                            onClick={() => removeRow(row.id)}
                                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {/* Asset Selection */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</label>
                                            <div className="relative bg-white border border-slate-200 rounded-xl px-3 h-11 flex items-center">
                                                <select 
                                                    value={row.assetId} 
                                                    onChange={(e) => updateRow(row.id, 'assetId', e.target.value)}
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6"
                                                >
                                                    <option value="">Select Equipment...</option>
                                                    {assets?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Location Selection */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                                            <div className="relative bg-white border border-slate-200 rounded-xl px-3 h-11 flex items-center">
                                                <select
                                                    value={row.locationId || (row.assetId ? (assets?.find(a => a.id === row.assetId)?.locationId || '') : '')}
                                                    onChange={(e) => updateRow(row.id, 'locationId', e.target.value)}
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6"
                                                >
                                                    <option value="">Select Location...</option>
                                                    {locations?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Target Meter (Conditional) */}
                                        {(freqType === 'METER' || freqType === 'HYBRID') && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Meter</label>
                                                <div className="relative bg-white border border-slate-200 rounded-xl px-3 h-11 flex items-center">
                                                    <select 
                                                        value={row.meterId} 
                                                        onChange={(e) => updateRow(row.id, 'meterId', e.target.value)}
                                                        className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6"
                                                    >
                                                        <option value="">No Meter...</option>
                                                        {meters?.filter(m => m.assetId === row.assetId).map(m => (
                                                            <option key={m.id} value={m.id}>{m.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Start Date */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                                            <input 
                                                type="date" 
                                                value={row.startDate} 
                                                onChange={(e) => updateRow(row.id, 'startDate', e.target.value)} 
                                                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-[13px] font-medium text-slate-700 outline-none" 
                                            />
                                        </div>

                                        {/* End Date */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
                                            <input 
                                                type="date" 
                                                value={row.endDate || ''} 
                                                onChange={(e) => updateRow(row.id, 'endDate', e.target.value)} 
                                                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-[13px] font-medium text-slate-700 outline-none" 
                                            />
                                        </div>

                                        {/* Timezone */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timezone</label>
                                            <div className="relative bg-white border border-slate-200 rounded-xl px-3 h-11 flex items-center">
                                                <select 
                                                    value={row.timezone || '(UTC+05:30) Asia/Calcutta'} 
                                                    onChange={(e) => updateRow(row.id, 'timezone', e.target.value)}
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6"
                                                >
                                                    <option value="(UTC+05:30) Asia/Calcutta">(UTC+05:30) Asia/Calcutta</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Assigned To */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned To</label>
                                            <div className="relative bg-white border border-slate-200 rounded-xl px-3 h-11 flex items-center">
                                                <select 
                                                    value={row.assignedToId} 
                                                    onChange={(e) => updateRow(row.id, 'assignedToId', e.target.value)}
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6"
                                                >
                                                    <option value="">Select User...</option>
                                                    {users?.map(u => <option key={(u as any).userOrgId || u.id} value={(u as any).userOrgId || u.id}>{u.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Additional Workers */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Workers</label>
                                            <div className="relative bg-white border border-slate-200 rounded-xl px-3 h-11 flex items-center">
                                                <select 
                                                    value={row.additionalWorkers || ''} 
                                                    onChange={(e) => updateRow(row.id, 'additionalWorkers', e.target.value)}
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6"
                                                >
                                                    <option value="">Select Workers...</option>
                                                    {users?.map(u => <option key={(u as any).userOrgId || u.id} value={(u as any).userOrgId || u.id}>{u.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Teams */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teams</label>
                                            <div className="relative bg-white border border-slate-200 rounded-xl px-3 h-11 flex items-center">
                                                <select 
                                                    value={row.teamId || ''} 
                                                    onChange={(e) => updateRow(row.id, 'teamId', e.target.value)}
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6"
                                                >
                                                    <option value="">Select Team...</option>
                                                    {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="mt-auto px-4 md:px-10 py-6 md:py-8 border-t border-slate-100 bg-white flex items-center justify-between">
                <button onClick={onClose} className="text-[14px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleCreate}
                        disabled={schedule ? updatePM.isPending : createPM.isPending}
                        className="px-12 py-4 bg-primary text-white rounded-2xl text-[14px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3"
                    >
                        {(schedule ? updatePM.isPending : createPM.isPending) && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {(schedule ? updatePM.isPending : createPM.isPending) ? 'Deploying...' : schedule ? 'Save Strategy' : 'Deploy PM Strategy'}
                    </button>
                </div>
            </div>

            {/* Centered Add Calendar Schedule Modal */}
            {showCalendarModal && (
                <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-[20px] font-bold text-slate-900">
                                {freqType === 'METER' ? 'Add Meter Schedule' : freqType === 'HYBRID' ? 'Add Hybrid Schedule' : 'Add Calendar Schedule'}
                            </h3>
                            <button onClick={() => { setShowCalendarModal(false); }} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 pb-24 space-y-8 custom-scrollbar text-left">
                            {/* Schedule Type */}
                            <div className="space-y-2">
                                <label className="text-[14px] font-bold text-slate-700">Schedule Type</label>
                                <div className="relative">
                                    <select 
                                        disabled
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] appearance-none font-medium pr-10 text-slate-500 cursor-not-allowed"
                                    >
                                        <option>Regular Interval</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-12">
                                {/* ── CALENDAR TRIGGER (shown for Calendar & Hybrid) ── */}
                                {(freqType !== 'METER') && (
                                    <div className="space-y-10">
                                        {freqType === 'HYBRID' && (
                                            <div className="flex items-center gap-3">
                                                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                                                <span className="text-[13px] font-black uppercase tracking-widest text-indigo-500">Calendar Trigger</span>
                                                <div className="flex-1 h-px bg-indigo-100" />
                                            </div>
                                        )}
                                        {/* WOs Due Section */}
                                        <div className="grid grid-cols-[140px,1fr] gap-6 items-start">
                                            <div className="pt-2">
                                                <span className="text-[14px] font-bold text-slate-800">WOs Due</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[14px] text-slate-500 w-12">Every</span>
                                                    <input type="number" value={freqValue} onChange={(e) => setFreqValue(parseInt(e.target.value))} className="w-24 h-11 border border-slate-200 rounded-lg px-3 font-bold text-slate-800 focus:border-primary outline-none" />
                                                    <select
                                                        value={freqType === 'HYBRID' ? 'MONTHS' : freqType}
                                                        onChange={(e) => {
                                                            if (freqType !== 'HYBRID') setFreqType(e.target.value as any);
                                                            else setFreqType('HYBRID');
                                                        }}
                                                        className="h-11 border border-slate-200 rounded-lg px-3 bg-white font-bold text-slate-700 min-w-[140px]"
                                                    >
                                                        <option value="DAYS">Day(s)</option>
                                                        <option value="WEEKS">Week(s)</option>
                                                        <option value="MONTHS">Month(s)</option>
                                                        <option value="YEARS">Year(s)</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[14px] text-slate-500 w-12">At</span>
                                                    <div className="relative">
                                                        <input type="text" value={dueDateTime} onChange={(e) => setDueDateTime(e.target.value)} className="w-[180px] h-11 border border-slate-200 rounded-lg px-4 font-bold text-slate-800 focus:border-primary outline-none" />
                                                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Create WOs Section */}
                                        <div className="grid grid-cols-[140px,1fr] gap-6 items-start border-t border-slate-100 pt-10">
                                            <div className="pt-2 flex items-center gap-2">
                                                <span className="text-[14px] font-bold text-slate-800 flex items-center gap-1.5">
                                                    Create WOs
                                                    <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold">i</div>
                                                </span>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="flex flex-col gap-5">
                                                    <label className="flex items-center gap-4 cursor-pointer group">
                                                        <div className="relative flex items-center justify-center">
                                                            <input type="radio" name="createType" checked={createWOType === 'AHEAD'} onChange={() => setCreateWOType('AHEAD')} className="sr-only" />
                                                            <div className={cn("w-5 h-5 rounded-full border-2 transition-all", createWOType === 'AHEAD' ? "border-primary" : "border-slate-300")} />
                                                            {createWOType === 'AHEAD' && <div className="absolute w-2.5 h-2.5 rounded-full bg-primary" />}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <input type="number" value={advanceNoticeDays} onChange={(e) => setAdvanceNoticeDays(parseInt(e.target.value))} className="w-20 h-11 border border-slate-200 rounded-lg px-3 font-bold text-slate-800" />
                                                            <select className="h-11 border border-slate-200 rounded-lg px-3 bg-white font-bold text-slate-700">
                                                                <option>Day(s)</option>
                                                            </select>
                                                            <span className="text-[14px] text-slate-500">before the due date</span>
                                                        </div>
                                                    </label>
                                                    <label className="flex items-center gap-4 cursor-pointer group">
                                                        <div className="relative flex items-center justify-center">
                                                            <input type="radio" name="createType" checked={createWOType === 'ON_DAY'} onChange={() => setCreateWOType('ON_DAY')} className="sr-only" />
                                                            <div className={cn("w-5 h-5 rounded-full border-2 transition-all", createWOType === 'ON_DAY' ? "border-primary" : "border-slate-300")} />
                                                            {createWOType === 'ON_DAY' && <div className="absolute w-2.5 h-2.5 rounded-full bg-primary" />}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[14px] text-slate-500">On the due date</span>
                                                        </div>
                                                    </label>
                                                </div>
                                                <div className="flex items-center gap-3 pt-2">
                                                    <span className="text-[14px] text-slate-500 w-12 text-right invisible md:visible">At</span>
                                                    <div className="relative">
                                                        <input type="text" value={dueDateTime} onChange={(e) => setDueDateTime(e.target.value)} className="w-[220px] h-11 border border-slate-200 rounded-lg px-4 font-bold text-slate-800" />
                                                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── METER TRIGGER (shown for Meter & Hybrid) ── */}
                                {(freqType === 'METER' || freqType === 'HYBRID') && (
                                    <div className="space-y-10">
                                        {freqType === 'HYBRID' && (
                                            <div className="flex items-center gap-3 mt-4">
                                                <div className="flex-1 h-px bg-rose-100" />
                                                <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 border border-rose-100 rounded-full">
                                                    <Settings className="w-3.5 h-3.5 text-rose-500" />
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-rose-500">Meter Trigger — Whichever Comes First</span>
                                                </div>
                                                <div className="flex-1 h-px bg-rose-100" />
                                            </div>
                                        )}

                                        {/* Header Notice */}
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-[14px] text-slate-500 font-medium leading-relaxed">
                                            When editing the PM's records, you can set a specific meter and unit baseline for each record applied to this schedule.
                                        </div>

                                        {/* Create WOs — Meter */}
                                        <div className="grid grid-cols-[140px,1fr] gap-6 items-start">
                                            <div className="pt-2">
                                                <span className="text-[14px] font-bold text-slate-800">Create WOs</span>
                                            </div>
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <span className="text-[14px] text-slate-500">When a reading</span>
                                                <select
                                                    value={meterTriggerType}
                                                    onChange={(e) => setMeterTriggerType(e.target.value as any)}
                                                    className="h-11 border border-slate-200 rounded-lg px-4 bg-white font-bold text-slate-700 min-w-[180px]"
                                                >
                                                    <option value="INTERVAL">Reaches every</option>
                                                    <option value="THRESHOLD">Reaches value</option>
                                                    <option value="RELATIVE">Increases by</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={meterInterval}
                                                    onChange={(e) => setMeterInterval(parseFloat(e.target.value))}
                                                    className="w-24 h-11 border border-slate-200 rounded-lg px-3 font-bold text-slate-800 text-center"
                                                />
                                                <span className="text-[14px] text-slate-500">units</span>
                                            </div>
                                        </div>

                                        {/* WOs Due — Meter */}
                                        <div className="grid grid-cols-[140px,1fr] gap-6 items-start border-t border-slate-100 pt-10">
                                            <div className="pt-2">
                                                <span className="text-[14px] font-bold text-slate-800">WOs Due</span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <input
                                                    type="number"
                                                    value={meterWODueValue}
                                                    onChange={(e) => setMeterWODueValue(parseInt(e.target.value))}
                                                    className="w-24 h-11 border border-slate-200 rounded-lg px-3 font-bold text-slate-800 text-center"
                                                />
                                                <select
                                                    value={meterWODueUnit}
                                                    onChange={(e) => setMeterWODueUnit(e.target.value as 'HOURS' | 'DAYS' | 'WEEKS')}
                                                    className="h-11 border border-slate-200 rounded-lg px-4 bg-white font-bold text-slate-700 min-w-[140px]"
                                                >
                                                    <option value="HOURS">Hour(s)</option>
                                                    <option value="DAYS">Day(s)</option>
                                                    <option value="WEEKS">Week(s)</option>
                                                </select>
                                                <span className="text-[14px] text-slate-500">after creation</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Inactive Periods */}
                            <div className="pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-[14px] font-bold text-slate-800 flex items-center gap-1.5">
                                        Inactive Periods
                                        <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold">i</div>
                                    </span>
                                    <button type="button" onClick={() => setInactivePeriods([...inactivePeriods, { startDate: '', endDate: '' }])} className="text-[14px] font-bold text-primary hover:underline ml-2">+ Add Period</button>
                                </div>
                                <div className="space-y-3">
                                    {inactivePeriods.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white p-3 border border-slate-100 rounded-xl shadow-xs animate-in slide-in-from-left-2 duration-200">
                                            <CalendarIcon className="w-4 h-4 text-slate-300" />
                                            <input type="date" value={p.startDate} onChange={(e) => { const n = [...inactivePeriods]; n[idx].startDate = e.target.value; setInactivePeriods(n); }} className="flex-1 text-[13px] outline-none font-bold text-slate-700" />
                                            <span className="text-slate-300">→</span>
                                            <input type="date" value={p.endDate} onChange={(e) => { const n = [...inactivePeriods]; n[idx].endDate = e.target.value; setInactivePeriods(n); }} className="flex-1 text-[13px] outline-none font-bold text-slate-700" />
                                            <button type="button" onClick={() => setInactivePeriods(inactivePeriods.filter((_, i) => i !== idx))} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-end gap-3">
                            <button type="button" onClick={() => { setShowCalendarModal(false); }} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                            <button type="button" onClick={() => { setIsScheduleActive(true); setShowCalendarModal(false); }} className="px-8 py-2.5 bg-primary text-white rounded-xl text-[14px] font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatePMModal;
