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
    Shield,
    Activity,
    Box,
    Mail,
    Search,
    Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MobileWorkflows } from './MobileWorkflows';

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

export const Workflows = () => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: rules = [] } = useQuery({
        queryKey: ['workflow-rules'],
        queryFn: async () => {
            const response = await api.get('/workflow-rules');
            return response.data;
        }
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
            return api.patch(`/workflow-rules/${id}`, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
            toast.success('Workflow rule updated');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/workflow-rules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
            toast.success('Workflow rule deleted');
        }
    });

    const filteredRules = rules.filter((r: any) => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.entity.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isMobile = useMediaQuery('(max-width: 768px)');
    if (isMobile) return <MobileWorkflows />;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
                        Automated Workflows
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Create "If-Then" rules to automate your industrial operations</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Create Workflow
                </button>
            </div>

            {/* Stats/Quick Info */}
            <div className="grid grid-cols-3 gap-6">
                {[
                    { label: 'Active Automations', value: rules.filter((r:any) => r.isActive).length, icon: Play, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Executed (24h)', value: '1,284', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Time Saved', value: '42 hrs', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", stat.bg)}>
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[13px] font-bold uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* List Header */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search workflows..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[14px] focus:border-indigo-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 text-[13px] font-bold text-slate-500">
                        <span>{filteredRules.length} Total Rules</span>
                        <div className="w-px h-4 bg-slate-200" />
                        <button className="hover:text-indigo-600 transition-colors">Sort by Name</button>
                    </div>
                </div>

                {/* Rules List */}
                <div className="divide-y divide-slate-50">
                    {filteredRules.length > 0 ? (
                        filteredRules.map((rule: any) => (
                            <div key={rule.id} className="p-6 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-3 rounded-xl mt-1",
                                            rule.isActive ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                                        )}>
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-[17px] font-bold text-slate-800">{rule.name}</h3>
                                                {rule.isActive ? (
                                                    <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                        <Play className="w-2.5 h-2.5 fill-emerald-700" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                                        Paused
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-500 text-[14px] mt-1">{rule.description || 'No description provided'}</p>
                                            
                                            {/* Logic Visualizer */}
                                            <div className="mt-4 flex items-center gap-3 text-[13px] font-medium">
                                                <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                    <span className="text-slate-400 font-bold">IF</span>
                                                    <span className="text-slate-700">{rule.trigger} on {rule.entity}</span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-300" />
                                                <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                    <span className="text-slate-400 font-bold">THEN</span>
                                                    <span className="text-slate-700">{rule.actions.length} Actions</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Toggle Switch */}
                                        <button 
                                            onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                                            className={cn(
                                                "w-12 h-6 rounded-full p-1 transition-all duration-300",
                                                rule.isActive ? "bg-indigo-600" : "bg-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                                                rule.isActive ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                                                <Settings2 className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this workflow?')) {
                                                        deleteMutation.mutate(rule.id);
                                                    }
                                                }}
                                                className="p-2 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Zap className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">No workflows found</h3>
                            <p className="text-slate-500 max-w-[400px] mx-auto mt-2">
                                Automate repetitive tasks by creating your first workflow rule.
                            </p>
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-6 text-indigo-600 font-bold hover:underline inline-flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Create your first workflow
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* TODO: Add Builder Modal */}
            <CreateWorkflowModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />
        </div>
    );
};

const CreateWorkflowModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
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
        mutationFn: async (data: any) => {
            return api.post('/workflow-rules', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
            toast.success('Workflow created successfully');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create workflow');
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative bg-white w-full max-w-[800px] rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Modal Header */}
                <div className="bg-slate-900 px-8 py-10 text-white relative">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <span className="text-amber-400 font-black text-[11px] uppercase tracking-[0.2em]">Step {step} of 3</span>
                            <h2 className="text-3xl font-black mt-1">Configure Automation</h2>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                            <span className="font-bold text-sm">Industrial Engine</span>
                        </div>
                    </div>
                    {/* Background abstract decoration */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
                </div>

                <div className="p-10">
                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div>
                                <h3 className="text-[22px] font-black text-slate-800">Basic Information</h3>
                                <p className="text-slate-500 font-medium">Give your workflow a clear name and description</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-black text-slate-500 uppercase">Workflow Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., High Priority Assignment"
                                        className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-black text-slate-500 uppercase">Description</label>
                                    <textarea 
                                        placeholder="Explain what this automation does..."
                                        rows={3}
                                        className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div>
                                <h3 className="text-[22px] font-black text-slate-800">Trigger Event</h3>
                                <p className="text-slate-500 font-medium">Select what event should start this workflow</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {TRIGGER_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setFormData({ ...formData, entity: opt.entity, trigger: opt.trigger })}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
                                            formData.entity === opt.entity && formData.trigger === opt.trigger
                                                ? "border-indigo-600 bg-indigo-50 ring-4 ring-indigo-500/10"
                                                : "border-slate-100 hover:border-slate-200 bg-white"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-3 rounded-xl",
                                            formData.entity === opt.entity && formData.trigger === opt.trigger
                                                ? "bg-indigo-600 text-white"
                                                : "bg-slate-100 text-slate-500"
                                        )}>
                                            <opt.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "font-black text-[15px]",
                                                formData.entity === opt.entity && formData.trigger === opt.trigger ? "text-indigo-900" : "text-slate-700"
                                            )}>{opt.label}</p>
                                            <p className="text-[12px] text-slate-500 font-bold uppercase">{opt.entity}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-[22px] font-black text-slate-800">Final Actions</h3>
                                    <p className="text-slate-500 font-medium">Define what happens when the trigger fires</p>
                                </div>
                                <button 
                                    onClick={() => setFormData({ ...formData, actions: [...formData.actions, { type: 'NOTIFY_USER', value: '' }] })}
                                    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-sm hover:bg-indigo-100 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Action
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.actions.map((action, idx) => (
                                    <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase">Action Type</label>
                                                <select 
                                                    className="w-full bg-white px-4 py-2 rounded-lg font-bold border border-slate-200 outline-none"
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
                                                    className="w-full bg-white px-4 py-2 rounded-lg font-bold border border-slate-200 outline-none"
                                                    value={action.value}
                                                    onChange={(e) => {
                                                        const newActions = [...formData.actions];
                                                        newActions[idx].value = e.target.value;
                                                        setFormData({ ...formData, actions: newActions });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setFormData({ ...formData, actions: formData.actions.filter((_, i) => i !== idx) })}
                                            className="mt-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {formData.actions.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                                        <p className="text-slate-400 font-bold">No actions defined yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button 
                        onClick={onClose}
                        className="text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                        Discard
                    </button>
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button 
                                onClick={() => setStep(step - 1)}
                                className="px-8 py-3 rounded-2xl font-black text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                Back
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                if (step < 3) setStep(step + 1);
                                else mutation.mutate(formData);
                            }}
                            disabled={mutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {step === 3 ? 'Launch Workflow' : 'Continue'}
                            {step < 3 && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
