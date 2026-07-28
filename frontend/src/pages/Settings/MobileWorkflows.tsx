import { useState } from 'react';
import {
    Zap,
    Plus,
    Play,
    Settings2,
    ArrowRight,
    Trash2,
    AlertCircle,
    Clock,
    Users,
    Activity,
    Box,
    Mail,
    Search,
    Loader2,
    X,
    ChevronRight,
    Shield
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIGGER_OPTIONS = [
    { id: 'wo_created', label: 'Work Order Created', entity: 'WorkOrder', trigger: 'CREATED', icon: Box },
    { id: 'wo_status', label: 'Work Order Status Changed', entity: 'WorkOrder', trigger: 'STATUS_CHANGED', icon: Activity },
    { id: 'asset_created', label: 'Asset Created', entity: 'Asset', trigger: 'CREATED', icon: Shield },
    { id: 'asset_status', label: 'Asset Status Changed', entity: 'Asset', trigger: 'STATUS_CHANGED', icon: Activity },
    { id: 'inventory_low', label: 'Low Stock Alert', entity: 'Part', trigger: 'LOW_STOCK', icon: AlertCircle },
];

const ACTION_TYPES = [
    { id: 'UPDATE_FIELD', label: 'Update Field', icon: Settings2 },
    { id: 'NOTIFY_USER', label: 'Notify User', icon: Mail },
    { id: 'ASSIGN_TEAM', label: 'Assign to Team', icon: Users },
];

// ─── Mobile Create Workflow Modal ──────────────────────────────────────────────

const MobileCreateWorkflowModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        entity: 'WorkOrder',
        trigger: 'CREATED',
        conditions: [] as any[],
        actions: [] as any[],
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => api.post('/workflow-rules', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
            toast.success('Workflow created successfully');
            onClose();
            setStep(1);
            setFormData({ name: '', description: '', entity: 'WorkOrder', trigger: 'CREATED', conditions: [], actions: [] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create workflow');
        }
    });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex flex-col justify-end">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Sheet */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                    className="relative bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden z-10"
                >
                    {/* Dark Header */}
                    <div className="bg-slate-900 px-6 py-6 text-white relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <span className="text-amber-400 font-black text-[10px] uppercase tracking-[0.2em]">Step {step} of 3</span>
                                <h2 className="text-[20px] font-black mt-0.5">Configure Automation</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl">
                                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="font-bold text-[12px]">Automation</span>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform">
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                        {/* Step Pills */}
                        <div className="flex gap-2 mt-4 relative z-10">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={cn(
                                        "h-1 flex-1 rounded-full transition-all",
                                        s <= step ? "bg-indigo-400" : "bg-white/20"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
                        {/* Step 1: Basic Info */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-[18px] font-black text-slate-800">Basic Information</h3>
                                    <p className="text-slate-500 font-medium text-[13px] mt-1">Give your workflow a clear name and description</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Workflow Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., High Priority Assignment"
                                            className="w-full px-4 py-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-[14px]"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Description</label>
                                        <textarea
                                            placeholder="Explain what this automation does..."
                                            rows={3}
                                            className="w-full px-4 py-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-[14px]"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Trigger */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-[18px] font-black text-slate-800">Trigger Event</h3>
                                    <p className="text-slate-500 font-medium text-[13px] mt-1">Select what event starts this workflow</p>
                                </div>
                                <div className="space-y-3">
                                    {TRIGGER_OPTIONS.map((opt) => {
                                        const isSelected = formData.entity === opt.entity && formData.trigger === opt.trigger;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => setFormData({ ...formData, entity: opt.entity, trigger: opt.trigger })}
                                                className={cn(
                                                    "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                                                    isSelected
                                                        ? "border-indigo-600 bg-indigo-50 ring-4 ring-indigo-500/10"
                                                        : "border-slate-100 bg-white"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-2.5 rounded-xl shrink-0",
                                                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    <opt.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className={cn("font-black text-[14px]", isSelected ? "text-indigo-900" : "text-slate-700")}>{opt.label}</p>
                                                    <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">{opt.entity}</p>
                                                </div>
                                                {isSelected && <ChevronRight className="w-4 h-4 text-indigo-400 ml-auto" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Actions */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[18px] font-black text-slate-800">Final Actions</h3>
                                        <p className="text-slate-500 font-medium text-[13px] mt-1">What happens when the trigger fires</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, actions: [...formData.actions, { type: 'NOTIFY_USER', value: '' }] })}
                                        className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl font-black text-[12px] hover:bg-indigo-100 transition-colors active:scale-95"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Action
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.actions.map((action, idx) => (
                                        <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Action #{idx + 1}</span>
                                                <button
                                                    onClick={() => setFormData({ ...formData, actions: formData.actions.filter((_, i) => i !== idx) })}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase">Action Type</label>
                                                <select
                                                    className="w-full bg-white px-3 py-2.5 rounded-xl font-bold border border-slate-200 outline-none text-[13px]"
                                                    value={action.type}
                                                    onChange={(e) => {
                                                        const newActions = [...formData.actions];
                                                        newActions[idx].type = e.target.value;
                                                        setFormData({ ...formData, actions: newActions });
                                                    }}
                                                >
                                                    {ACTION_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase">Value / Target</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter value"
                                                    className="w-full bg-white px-3 py-2.5 rounded-xl font-bold border border-slate-200 outline-none text-[13px]"
                                                    value={action.value}
                                                    onChange={(e) => {
                                                        const newActions = [...formData.actions];
                                                        newActions[idx].value = e.target.value;
                                                        setFormData({ ...formData, actions: newActions });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {formData.actions.length === 0 && (
                                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                                            <p className="text-slate-400 font-bold text-[13px]">No actions defined yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                        <button onClick={onClose} className="text-slate-400 font-black text-[12px] uppercase tracking-widest">Discard</button>
                        <div className="flex items-center gap-3">
                            {step > 1 && (
                                <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-xl font-black text-slate-600 hover:bg-slate-100 text-[13px] transition-all">
                                    Back
                                </button>
                            )}
                            <button
                                onClick={() => { if (step < 3) setStep(step + 1); else mutation.mutate(formData); }}
                                disabled={mutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-2.5 rounded-xl font-black shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 text-[13px]"
                            >
                                {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {step === 3 ? 'Launch Workflow' : 'Continue'}
                                {step < 3 && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// ─── Mobile Workflows Page ─────────────────────────────────────────────────────

export const MobileWorkflows = () => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: rules = [], isLoading } = useQuery({
        queryKey: ['workflow-rules'],
        queryFn: async () => {
            const response = await api.get('/workflow-rules');
            return response.data;
        }
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
            api.patch(`/workflow-rules/${id}`, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
            toast.success('Workflow rule updated');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/workflow-rules/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
            toast.success('Workflow rule deleted');
        }
    });

    const filteredRules = rules.filter((r: any) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.entity.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statsData = [
        { label: 'Active', value: rules.filter((r: any) => r.isActive).length, icon: Play, colorText: 'text-emerald-600', colorBg: 'bg-emerald-50' },
        { label: 'Runs (24h)', value: '1,284', icon: Activity, colorText: 'text-blue-600', colorBg: 'bg-blue-50' },
        { label: 'Time Saved', value: '42h', icon: Clock, colorText: 'text-amber-600', colorBg: 'bg-amber-50' },
    ];

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] font-outfit pb-24">
            {/* Header */}
            <div className="bg-white px-4 py-4 border-b border-slate-100 sticky top-0 z-30 shadow-sm shrink-0">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-[17px] font-black text-slate-900 tracking-tight leading-none">Workflows</h1>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">Automated If-Then Rules</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-2 rounded-xl font-black text-[12px] shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Create
                    </button>
                </div>

                {/* Search */}
                <div className="relative mt-3">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search workflows..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-transparent rounded-xl text-[13px] font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2.5">
                    {statsData.map((stat, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm">
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", stat.colorBg)}>
                                <stat.icon className={cn("w-4 h-4", stat.colorText)} />
                            </div>
                            <p className="text-[18px] font-black text-slate-900 leading-none">{stat.value}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Rules Count */}
                <div className="flex items-center justify-between px-1">
                    <p className="text-[12px] font-bold text-slate-500">{filteredRules.length} Total Rules</p>
                </div>

                {/* Rules List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : filteredRules.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                            <Zap className="w-8 h-8 text-slate-200" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[15px] font-black text-slate-700">No Workflows Found</p>
                            <p className="text-[12px] text-slate-400 font-medium">Automate repetitive tasks by creating your first rule.</p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 text-indigo-600 font-black text-[13px] hover:underline"
                        >
                            <Plus className="w-4 h-4" />
                            Create your first workflow
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRules.map((rule: any) => (
                            <motion.div
                                key={rule.id}
                                layout
                                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3"
                            >
                                {/* Rule Header */}
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "p-2.5 rounded-xl shrink-0",
                                        rule.isActive ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-[14px] font-black text-slate-800 leading-tight">{rule.name}</h3>
                                            {rule.isActive ? (
                                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tight bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                    <Play className="w-2 h-2 fill-emerald-700" />Active
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase tracking-tight bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Paused</span>
                                            )}
                                        </div>
                                        {rule.description && (
                                            <p className="text-slate-400 text-[12px] font-medium mt-0.5 line-clamp-1">{rule.description}</p>
                                        )}
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                                        className={cn(
                                            "w-11 h-6 rounded-full p-1 transition-all duration-300 shrink-0",
                                            rule.isActive ? "bg-indigo-600" : "bg-slate-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                                            rule.isActive ? "translate-x-5" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>

                                {/* IF → THEN Logic Pill */}
                                <div className="flex items-center gap-2 text-[11px] font-bold">
                                    <div className="bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                        <span className="text-slate-400">IF</span>
                                        <span className="text-slate-700">{rule.trigger} on {rule.entity}</span>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                    <div className="bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                        <span className="text-slate-400">THEN</span>
                                        <span className="text-slate-700">{rule.actions.length} Actions</span>
                                    </div>
                                </div>

                                {/* Actions Row */}
                                <div className="flex items-center justify-end gap-1 border-t border-slate-50 pt-2">
                                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-slate-600 transition-all">
                                        <Settings2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Delete this workflow?')) {
                                                deleteMutation.mutate(rule.id);
                                            }
                                        }}
                                        className="p-2 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed right-6 bottom-20 z-40 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 transition-transform active:scale-90"
                title="Create Workflow"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Create Modal */}
            <MobileCreateWorkflowModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
};
