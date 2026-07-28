import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Plus, Trash2, ChevronDown, Calendar, 
    Gauge, Settings, Search, Check, Info, Package, MapPin
} from 'lucide-react';
import { 
    useAssets, 
    useLocations, 
    useUsers, 
    usePreventiveMaintenance 
} from '../hooks/useData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface AddAssetsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pmSchedule: any;
}

interface AssetRow {
    id: string;
    assetId: string;
    locationId: string;
    startDate: string;
    endDate?: string;
    timezone?: string;
    assignedToId: string;
}

export const AddAssetsModal: React.FC<AddAssetsModalProps> = ({ isOpen, onClose, pmSchedule }) => {
    const { data: assets } = useAssets();
    const { data: locations } = useLocations();
    const { data: usersData } = useUsers();
    const { createPM } = usePreventiveMaintenance();

    const users = (Array.isArray(usersData) ? usersData : (usersData as any)?.items || []) as any[];

    // Asset rows selection
    const [assetRows, setAssetRows] = useState<AssetRow[]>([]);
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    const [assetPickerSearch, setAssetPickerSearch] = useState('');
    const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([]);

    // Scheduling states
    const [showScheduleMenu, setShowScheduleMenu] = useState(false);
    const [activeScheduleTab, setActiveScheduleTab] = useState<'existing' | 'new'>('existing');
    const [newFreqType, setNewFreqType] = useState<'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS' | 'METER' | 'HYBRID'>('MONTHS');
    const [newFreqValue, setNewFreqValue] = useState(1);
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

    useEffect(() => {
        if (isOpen && pmSchedule) {
            // Initialize with an empty row or prepopulated based on design
            setAssetRows([
                {
                    id: crypto.randomUUID(),
                    assetId: '',
                    locationId: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: '',
                    timezone: '(UTC+05:30) Asia/Calcutta',
                    assignedToId: ''
                }
            ]);
            setActiveScheduleTab('existing');
        }
    }, [isOpen, pmSchedule]);

    const addRow = () => {
        setAssetRows(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                assetId: '',
                locationId: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                timezone: '(UTC+05:30) Asia/Calcutta',
                assignedToId: ''
            }
        ]);
    };

    const removeRow = (id: string) => {
        setAssetRows(prev => prev.filter(r => r.id !== id));
    };

    const updateRow = (id: string, field: keyof AssetRow, value: string) => {
        setAssetRows(prev => prev.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: value };
                if (field === 'assetId') {
                    // Auto-fill location
                    const asset = assets?.find((a: any) => a.id === value);
                    if (asset) {
                        updated.locationId = asset.locationId || '';
                    }
                }
                return updated;
            }
            return r;
        }));
    };

    const handleConfirmAssets = () => {
        const selectedAssets = assets?.filter((a: any) => pickerSelectedIds.includes(a.id)) || [];
        const newRows = selectedAssets.map((asset: any) => ({
            id: crypto.randomUUID(),
            assetId: asset.id,
            locationId: asset.locationId || '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            timezone: '(UTC+05:30) Asia/Calcutta',
            assignedToId: ''
        }));
        setAssetRows(prev => [...prev.filter(r => r.assetId), ...newRows]);
        setIsAssetPickerOpen(false);
        setPickerSelectedIds([]);
    };

    const handleSave = async () => {
        const validRows = assetRows.filter(r => r.assetId);
        if (validRows.length === 0) {
            toast.error("Please add at least one asset to schedule.");
            return;
        }

        try {
            // Determine the schedule details to copy/clone
            const frequencyType = activeScheduleTab === 'existing' ? pmSchedule.frequencyType : newFreqType;
            const frequencyValue = activeScheduleTab === 'existing' ? pmSchedule.frequencyValue : newFreqValue;

            // Clone details for each added row
            const promises = validRows.map(row => {
                const payload = {
                    name: pmSchedule.name,
                    description: pmSchedule.description || undefined,
                    woTitle: pmSchedule.woTitle || undefined,
                    woDescription: pmSchedule.woDescription || undefined,
                    categoryId: pmSchedule.categoryId || undefined,
                    priority: pmSchedule.priority,
                    assetId: row.assetId,
                    assignedToId: row.assignedToId || undefined,
                    checklistId: pmSchedule.checklistId || undefined,
                    frequencyType: frequencyType,
                    frequencyValue: frequencyValue,
                    advanceNoticeDays: pmSchedule.advanceNoticeDays || 7,
                    nextDueDate: row.startDate ? new Date(row.startDate).toISOString() : new Date().toISOString(),
                    status: 'ACTIVE' as any,
                    durationHours: pmSchedule.durationHours ? Number(pmSchedule.durationHours) : undefined,
                    requiresSignature: pmSchedule.requiresSignature || false,
                    createNow: false,
                    dueDateTime: pmSchedule.dueDateTime || undefined,
                    createWOType: pmSchedule.createWOType || undefined,
                    meterWODueValue: pmSchedule.meterWODueValue || undefined,
                    meterWODueUnit: pmSchedule.meterWODueUnit || undefined,
                    meterTriggerType: pmSchedule.meterTriggerType || undefined,
                    meterInterval: pmSchedule.meterInterval ? Number(pmSchedule.meterInterval) : undefined,
                    meterId: pmSchedule.meterId || undefined,
                    isFloating: pmSchedule.isFloating || false,
                    isSeasonal: pmSchedule.isSeasonal || false,
                    startMonth: pmSchedule.startMonth || undefined,
                    endMonth: pmSchedule.endMonth || undefined,
                    plannedParts: pmSchedule.plannedParts?.map((p: any) => ({ partId: p.partId, quantity: p.quantity })) || [],
                    plannedTasks: pmSchedule.plannedTasks?.map((t: any) => ({
                        task: t.task,
                        type: t.type,
                        isRequired: t.isRequired,
                        requirements: t.requirements
                    })) || []
                };
                return createPM.mutateAsync(payload);
            });

            await Promise.all(promises);
            toast.success("Assets assigned to schedule successfully");
            onClose();
        } catch (error: any) {
            console.error("Failed to add assets:", error);
            toast.error(error.response?.data?.message || "Failed to assign assets to schedule");
        }
    };

    if (!isOpen) return null;

    // Helper text for current schedule
    const getScheduleText = () => {
        if (!pmSchedule) return '';
        const value = pmSchedule.frequencyValue || 1;
        const type = (pmSchedule.frequencyType || 'MONTH').toLowerCase().replace('s', '');
        return `Due every ${value} ${type}${value > 1 ? 's' : ''}`;
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-10 py-5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-200" />
                    <h2 className="text-[20px] font-bold text-slate-900">Add Assets</h2>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all bg-white"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={createPM.isPending}
                        className={cn(
                            "px-8 py-2.5 rounded-xl text-[14px] font-black transition-all border shadow-sm",
                            createPM.isPending
                            ? "bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100"
                            : "bg-primary text-white border-transparent hover:opacity-90 active:scale-[0.98]"
                        )}
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[#FDFDFD]">
                
                {/* Schedules Section */}
                <div className="space-y-4">
                    <h3 className="text-[17px] font-bold text-slate-900">Schedules</h3>
                    <p className="text-[13.5px] text-slate-500 font-medium">Specify the date and time for the scheduled maintenance.</p>

                    <div className="border border-slate-200 rounded-[20px] p-6 bg-white shadow-xs inline-flex items-center gap-4">
                        <button
                            onClick={() => setActiveScheduleTab('existing')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all border",
                                activeScheduleTab === 'existing' 
                                ? "bg-slate-50 border-slate-300 text-slate-900" 
                                : "bg-white border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Select existing schedule
                        </button>

                        <div className="relative">
                            <button
                                ref={scheduleButtonRef}
                                onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all border",
                                    activeScheduleTab === 'new'
                                    ? "bg-slate-50 border-slate-300 text-slate-900"
                                    : "bg-white border-transparent text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Add Schedule
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>

                            {showScheduleMenu && scheduleMenuCoords && createPortal(
                                <>
                                    <div className="fixed inset-0 z-[9999]" onClick={() => setShowScheduleMenu(false)} />
                                    <div 
                                        className="fixed w-[360px] bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-2.5 z-[10000] animate-in fade-in zoom-in-95 duration-200"
                                        style={{
                                            bottom: `${window.innerHeight - scheduleMenuCoords.top + 8}px`,
                                            left: `${scheduleMenuCoords.left}px`,
                                        }}
                                    >
                                        <button 
                                            onClick={() => { setNewFreqType('MONTHS'); setActiveScheduleTab('new'); setShowScheduleMenu(false); }}
                                            className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all text-left"
                                        >
                                            <Calendar className="w-5 h-5 text-indigo-500 mt-0.5" />
                                            <div>
                                                <p className="text-[14px] font-bold text-slate-900 mb-0.5">Calendar</p>
                                                <p className="text-[12px] text-slate-500 font-medium">WOs due regularly, or when the previous is completed</p>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => { setNewFreqType('METER'); setActiveScheduleTab('new'); setShowScheduleMenu(false); }}
                                            className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all text-left"
                                        >
                                            <Gauge className="w-5 h-5 text-amber-500 mt-0.5" />
                                            <div>
                                                <p className="text-[14px] font-bold text-slate-900 mb-0.5">Meter readings</p>
                                                <p className="text-[12px] text-slate-500 font-medium">Creates WOs when readings meet specific criteria</p>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => { setNewFreqType('HYBRID'); setActiveScheduleTab('new'); setShowScheduleMenu(false); }}
                                            className="w-full flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all text-left"
                                        >
                                            <Settings className="w-5 h-5 text-rose-500 mt-0.5" />
                                            <div>
                                                <p className="text-[14px] font-bold text-slate-900 mb-0.5">Calendar OR meter readings</p>
                                                <p className="text-[12px] text-slate-500 font-medium">Uses both, based on whichever happens first</p>
                                            </div>
                                        </button>
                                    </div>
                                </>,
                                document.body
                            )}
                        </div>
                    </div>

                    {/* Schedule Active Panel Details */}
                    {activeScheduleTab === 'existing' && pmSchedule && (
                        <div className="flex items-center gap-3 p-4 bg-slate-50/60 border border-slate-100 rounded-2xl w-fit mt-3">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <div>
                                <span className="text-[13px] font-bold text-slate-800">{getScheduleText()}</span>
                                <span className="text-[12px] text-slate-400 font-medium ml-2">• created 1 month before due date</span>
                            </div>
                        </div>
                    )}

                    {activeScheduleTab === 'new' && (
                        <div className="flex items-center gap-4 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white">
                                <span className="text-[13px] font-bold text-slate-500">Every</span>
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={newFreqValue}
                                    onChange={(e) => setNewFreqValue(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-12 text-[13px] font-bold text-slate-800 outline-none text-center" 
                                />
                                <select 
                                    value={newFreqType} 
                                    onChange={(e) => setNewFreqType(e.target.value as any)}
                                    className="bg-transparent text-[13px] font-bold text-slate-800 outline-none cursor-pointer"
                                >
                                    <option value="DAYS">Days</option>
                                    <option value="WEEKS">Weeks</option>
                                    <option value="MONTHS">Months</option>
                                    <option value="YEARS">Years</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Assets Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-[17px] font-bold text-slate-900">Assets</h3>
                            <p className="text-[13.5px] text-slate-500 font-medium">Select Asset and Locations, assign them to the schedule, and define assignees and start dates.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={addRow}
                                className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
                            >
                                <Plus className="w-4 h-4" /> Add Row
                            </button>
                            <button 
                                onClick={() => setIsAssetPickerOpen(true)}
                                className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
                            >
                                Bulk Select Assets
                            </button>
                        </div>
                    </div>

                    {/* Choose Assets Modal */}
                    {isAssetPickerOpen && (
                        <div className="fixed inset-0 z-[1001] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                                {/* Header */}
                                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[18px] font-bold text-slate-900">Choose Assets</h3>
                                    <button onClick={() => setIsAssetPickerOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Toolbar */}
                                <div className="p-6 border-b border-slate-50">
                                    <div className="relative max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text"
                                            placeholder="Search assets..."
                                            value={assetPickerSearch}
                                            onChange={(e) => setAssetPickerSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] outline-none transition-all focus:border-primary font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Table Content */}
                                <div className="flex-1 overflow-auto custom-scrollbar p-6">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                <th className="w-12 py-3 px-4">
                                                    <input 
                                                        type="checkbox"
                                                        checked={pickerSelectedIds.length === (assets || []).length && (assets || []).length > 0}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setPickerSelectedIds(assets?.map((a: any) => a.id) || []);
                                                            } else {
                                                                setPickerSelectedIds([]);
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                    />
                                                </th>
                                                <th className="py-3 px-4">Asset Name</th>
                                                <th className="py-3 px-4">Location</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assets?.filter((a: any) => a.name.toLowerCase().includes(assetPickerSearch.toLowerCase())).map((a: any) => (
                                                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                    <td className="py-3 px-4">
                                                        <input 
                                                            type="checkbox"
                                                            checked={pickerSelectedIds.includes(a.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setPickerSelectedIds(prev => [...prev, a.id]);
                                                                } else {
                                                                    setPickerSelectedIds(prev => prev.filter(id => id !== a.id));
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-[13.5px] text-slate-800">{a.name}</td>
                                                    <td className="py-3 px-4 text-[13px] text-slate-500 font-medium">{a.location?.name || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/30">
                                    <button 
                                        onClick={() => setIsAssetPickerOpen(false)}
                                        className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleConfirmAssets}
                                        disabled={pickerSelectedIds.length === 0}
                                        className={cn(
                                            "px-6 py-2 rounded-xl text-[13px] font-bold transition-all shadow-xs",
                                            pickerSelectedIds.length === 0 
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                            : "bg-primary text-white hover:opacity-90 active:scale-[0.98]"
                                        )}
                                    >
                                        Confirm Assets ({pickerSelectedIds.length})
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assets Selection Table */}
                    <div className="w-full overflow-x-auto border border-slate-200 rounded-2xl shadow-xs custom-scrollbar bg-white">
                        <table className="w-full border-collapse table-fixed min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/60 border-b border-slate-200">
                                    <th className="w-12 px-4 py-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200">#</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-550 uppercase tracking-widest border-r border-slate-200 w-1/4">Asset</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-550 uppercase tracking-widest border-r border-slate-200 w-1/4">Location</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-550 uppercase tracking-widest border-r border-slate-200">Start Date</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-550 uppercase tracking-widest border-r border-slate-200">End Date</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-550 uppercase tracking-widest border-r border-slate-200">Timezone</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-550 uppercase tracking-widest border-r border-slate-200">Assigned To</th>
                                    <th className="w-14 py-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {assetRows.map((row, index) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50">
                                        <td className="border-r border-b border-slate-200 text-center text-[13px] font-bold text-slate-400">
                                            {index + 1}
                                        </td>
                                        <td className="border-r border-b border-slate-200 p-0">
                                            <div className="relative h-full flex items-center px-4">
                                                <select 
                                                    value={row.assetId} 
                                                    onChange={(e) => updateRow(row.id, 'assetId', e.target.value)}
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-11"
                                                >
                                                    <option value="">Select Equipment...</option>
                                                    {assets?.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </td>
                                        <td className="border-r border-b border-slate-200 p-0">
                                            <div className="relative h-full flex items-center px-4">
                                                <select
                                                    value={
                                                        row.locationId ||
                                                        (row.assetId ? (assets?.find((a: any) => a.id === row.assetId)?.locationId || '') : '')
                                                    }
                                                    onChange={(e) => updateRow(row.id, 'locationId', e.target.value)}
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-11"
                                                >
                                                    <option value="">Select Location...</option>
                                                    {locations?.map((l: any) => (
                                                        <option key={l.id} value={l.id}>{l.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </td>
                                        <td className="border-r border-b border-slate-200 p-0">
                                            <div className="relative h-full flex items-center px-4">
                                                <input 
                                                    type="date" 
                                                    value={row.startDate} 
                                                    onChange={(e) => updateRow(row.id, 'startDate', e.target.value)} 
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none h-11" 
                                                />
                                            </div>
                                        </td>
                                        <td className="border-r border-b border-slate-200 p-0">
                                            <div className="relative h-full flex items-center px-4">
                                                <input 
                                                    type="date" 
                                                    value={row.endDate} 
                                                    onChange={(e) => updateRow(row.id, 'endDate', e.target.value)} 
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none h-11" 
                                                />
                                            </div>
                                        </td>
                                        <td className="border-r border-b border-slate-200 p-0">
                                            <div className="relative h-full flex items-center px-4">
                                                <select 
                                                    value={row.timezone} 
                                                    onChange={(e) => updateRow(row.id, 'timezone', e.target.value)}
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-11"
                                                >
                                                    <option value="(UTC+05:30) Asia/Calcutta">(UTC+05:30) Asia/Calcutta</option>
                                                    <option value="(UTC+00:00) UTC">(UTC+00:00) UTC</option>
                                                    <option value="(UTC-05:00) Eastern Time">(UTC-05:00) Eastern Time</option>
                                                    <option value="(UTC-08:00) Pacific Time">(UTC-08:00) Pacific Time</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </td>
                                        <td className="border-r border-b border-slate-200 p-0">
                                            <div className="relative h-full flex items-center px-4">
                                                <select 
                                                    value={row.assignedToId} 
                                                    onChange={(e) => updateRow(row.id, 'assignedToId', e.target.value)}
                                                    className="w-full bg-transparent text-[13px] font-medium text-slate-700 outline-none appearance-none pr-6 h-11"
                                                >
                                                    <option value="">Select Technician...</option>
                                                    {users?.map((u: any) => (
                                                        <option key={u.id} value={u.id}>{u.user?.name || u.email}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>
                                        </td>
                                        <td className="border-b border-slate-200 text-center">
                                            <button 
                                                onClick={() => removeRow(row.id)}
                                                className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};
