import { useState, useEffect } from 'react';
import { Plus, X, GitCommit, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useApprovalChains } from '../hooks/useData';
import { toast } from 'react-hot-toast';

interface ApprovalStep {
    id: string;
    role: string;
    order: number;
}

interface ApprovalChain {
    id: string;
    name: string;
    triggerAmount?: number;
    module: 'WORK_ORDER' | 'PURCHASE_ORDER';
    steps: ApprovalStep[];
}

const ROLES = ['TECHNICIAN', 'SUPERVISOR', 'MANAGER', 'ADMINISTRATOR', 'OWNER'];

export const ApprovalChainsWorkspace = () => {
    const { chains: backendChains, isLoading, createApprovalChain, updateApprovalChain, deleteApprovalChain } = useApprovalChains();
    const [chains, setChains] = useState<ApprovalChain[]>([]);
    const [selectedChainId, setSelectedChainId] = useState<string | null>(null);

    useEffect(() => {
        if (backendChains) {
            setChains(backendChains);
        }
    }, [backendChains]);

    const activeChain = chains.find(c => c.id === selectedChainId) || null;

    const handleAddStep = () => {
        if (!activeChain) return;
        const newStep: ApprovalStep = {
            id: `new-${Date.now()}`,
            role: 'MANAGER',
            order: activeChain.steps.length + 1
        };
        setChains(chains.map(c => c.id === activeChain.id ? { ...c, steps: [...c.steps, newStep] } : c));
    };

    const handleRemoveStep = (stepId: string) => {
        if (!activeChain) return;
        setChains(chains.map(c => {
            if (c.id === activeChain.id) {
                const newSteps = c.steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 }));
                return { ...c, steps: newSteps };
            }
            return c;
        }));
    };

    const handleUpdateStepRole = (stepId: string, role: string) => {
        if (!activeChain) return;
        setChains(chains.map(c => {
            if (c.id === activeChain.id) {
                return { ...c, steps: c.steps.map(s => s.id === stepId ? { ...s, role } : s) };
            }
            return c;
        }));
    };

    const handleCreateChain = () => {
        const newChain: ApprovalChain = {
            id: `temp-${Date.now()}`,
            name: 'New Approval Chain',
            module: 'WORK_ORDER',
            steps: []
        };
        setChains([...chains, newChain]);
        setSelectedChainId(newChain.id);
    };

    const handleSaveChain = async (chain: ApprovalChain) => {
        if (!chain.name.trim()) {
            toast.error('Chain name is required');
            return;
        }

        try {
            const stepsPayload = chain.steps.map(s => ({
                role: s.role,
                order: s.order
            }));

            if (chain.id.startsWith('temp-')) {
                const newChain = await createApprovalChain.mutateAsync({
                    name: chain.name,
                    module: chain.module,
                    triggerAmount: chain.triggerAmount || 0,
                    steps: stepsPayload
                });
                setSelectedChainId(newChain.id);
                toast.success('Approval chain created successfully');
            } else {
                await updateApprovalChain.mutateAsync({
                    id: chain.id,
                    name: chain.name,
                    module: chain.module,
                    triggerAmount: chain.triggerAmount || 0,
                    steps: stepsPayload
                });
                toast.success('Approval chain saved successfully');
            }
        } catch (error) {
            toast.error('Failed to save approval chain');
        }
    };

    const handleDeleteChain = async (id: string) => {
        if (id.startsWith('temp-')) {
            setChains(chains.filter(c => c.id !== id));
            setSelectedChainId(null);
            toast.success('Draft chain removed');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this approval chain?')) return;
        try {
            await deleteApprovalChain.mutateAsync(id);
            setSelectedChainId(null);
            toast.success('Approval chain deleted successfully');
        } catch (error) {
            toast.error('Failed to delete approval chain');
        }
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Approval Chains</h2>
                <p className="text-slate-500 font-medium mt-1 text-[15px]">Design multi-step, role-based approval workflows for critical platform actions.</p>
            </div>

            {isLoading ? (
                <div className="h-[600px] flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-12 gap-8 h-[600px]">
                    {/* Left: Chain List */}
                    <div className="col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest">Configured Chains</h3>
                            <button 
                                onClick={handleCreateChain}
                                className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {chains.map(chain => (
                                <div 
                                    key={chain.id}
                                    onClick={() => setSelectedChainId(chain.id)}
                                    className={cn(
                                        "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                                        selectedChainId === chain.id 
                                            ? "bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-200" 
                                            : "bg-white border-slate-200 hover:border-indigo-300"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <h4 className={cn("text-[14px] font-black leading-tight", selectedChainId === chain.id ? "text-white" : "text-slate-800")}>{chain.name}</h4>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                                            selectedChainId === chain.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {chain.module.replace('_', ' ')}
                                        </span>
                                        <span className={cn(
                                            "text-[11px] font-bold",
                                            selectedChainId === chain.id ? "text-indigo-100" : "text-slate-400"
                                        )}>
                                            {chain.steps.length} Steps
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Builder Canvas */}
                    <div className="col-span-8 bg-slate-50/50 rounded-2xl border border-slate-200 shadow-inner flex flex-col relative overflow-hidden">
                        {activeChain ? (
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                                <div className="p-6 border-b border-slate-200 bg-white">
                                    <div className="flex justify-between items-center mb-4">
                                        <input 
                                            type="text" 
                                            value={activeChain.name}
                                            onChange={(e) => setChains(chains.map(c => c.id === activeChain.id ? { ...c, name: e.target.value } : c))}
                                            className="text-2xl font-black text-slate-900 bg-transparent border-none outline-none w-full focus:ring-0 p-0 placeholder-slate-300"
                                            placeholder="Chain Name"
                                        />
                                        <div className="flex gap-2 shrink-0">
                                            <button 
                                                onClick={() => handleDeleteChain(activeChain.id)}
                                                className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-[13px] font-bold transition-all active:scale-95 flex items-center gap-1.5"
                                            >
                                                Delete Chain
                                            </button>
                                            <button 
                                                onClick={() => handleSaveChain(activeChain)}
                                                disabled={createApprovalChain.isPending || updateApprovalChain.isPending}
                                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-black transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                            >
                                                {(createApprovalChain.isPending || updateApprovalChain.isPending) ? 'Saving...' : 'Save Chain'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trigger Module</label>
                                            <select 
                                                value={activeChain.module}
                                                onChange={(e) => setChains(chains.map(c => c.id === activeChain.id ? { ...c, module: e.target.value as any } : c))}
                                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none"
                                            >
                                                <option value="WORK_ORDER">Work Orders</option>
                                                <option value="PURCHASE_ORDER">Purchase Orders</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trigger Condition (Optional)</label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-bold text-slate-500">Amount &gt; $</span>
                                                <input 
                                                    type="number" 
                                                    value={activeChain.triggerAmount || ''}
                                                    onChange={(e) => setChains(chains.map(c => c.id === activeChain.id ? { ...c, triggerAmount: Number(e.target.value) } : c))}
                                                    className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none"
                                                    placeholder="None"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-8 relative">
                                    <div className="max-w-md mx-auto relative pb-20">
                                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-indigo-100" />
                                        
                                        <AnimatePresence>
                                            {activeChain.steps.map((step) => (
                                                <motion.div 
                                                    key={step.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="relative mb-8 pl-20"
                                                >
                                                    {/* Node */}
                                                    <div className="absolute left-[26px] top-4 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-50 shadow-sm z-10" />
                                                    
                                                    {/* Card */}
                                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 group hover:border-indigo-300 transition-all">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">Step {step.order}</span>
                                                            <button 
                                                                onClick={() => handleRemoveStep(step.id)}
                                                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[12px] font-bold text-slate-600">Approver Role</label>
                                                            <div className="relative">
                                                                <select 
                                                                    value={step.role}
                                                                    onChange={(e) => handleUpdateStepRole(step.id, e.target.value)}
                                                                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[14px] font-black text-slate-800 appearance-none outline-none focus:border-indigo-500"
                                                                >
                                                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                                </select>
                                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {/* Add Button */}
                                        <div className="relative pl-20 mt-4">
                                            <div className="absolute left-[26px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 ring-4 ring-slate-50 z-10" />
                                            <button 
                                                onClick={handleAddStep}
                                                className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl text-[13px] font-black text-indigo-600 transition-all shadow-sm group"
                                            >
                                                <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Plus className="w-3.5 h-3.5" />
                                                </div>
                                                Add Approval Step
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                                    <GitCommit className="w-8 h-8 text-indigo-300" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800">Select a Chain</h3>
                                <p className="text-[14px] text-slate-500 max-w-[250px] mt-2">Choose an existing approval chain to edit, or create a new one to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
