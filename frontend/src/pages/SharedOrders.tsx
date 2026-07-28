import { useSharedWorkOrders } from '../hooks/useWorkOrders';
import { 
    Link2, 
    Share2, 
    Unlink, 
    Clock,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const SharedOrders = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: sharedOrders, isLoading } = useSharedWorkOrders();

    const unshareWO = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/work-orders/${id}/share`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shared-work-orders'] });
            toast.success('Access Revoked: External Link Disabled');
        }
    });

    const copyLink = (token: string) => {
        const url = `${window.location.origin}/vendor-portal/${token}`;
        navigator.clipboard.writeText(url);
        toast.success('Vendor Access Link Copied!');
    };

    if (isLoading) return (
        <div className="flex items-center justify-center h-full">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <button 
                onClick={() => navigate('/work-orders')}
                className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-slate-100 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-primary active:scale-95"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Work Orders
            </button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[32px] font-black italic tracking-tight uppercase text-slate-800">
                        Shared Portfolio
                    </h1>
                    <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 italic mt-1">
                        Active External Collaborations & Vendor Links
                    </p>
                </div>
                <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
                        {sharedOrders?.length || 0} External Missions Active
                    </span>
                </div>
            </div>

            {sharedOrders?.length === 0 ? (
                <div className="h-[400px] rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                        <Share2 className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-[20px] font-black italic tracking-tight uppercase text-slate-800">No Shared Missions</h3>
                    <p className="max-w-xs text-[11px] font-black uppercase tracking-widest italic text-slate-400 mt-2 leading-relaxed">
                        Go to any Work Order and click 'Share with Vendor' to generate a secure external access bridge.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sharedOrders?.map((wo: any) => (
                        <div key={wo.id} className="group glass-panel rounded-[40px] border border-slate-100 bg-white p-8 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <Share2 className="w-24 h-24" />
                            </div>

                            <div className="relative space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest italic">
                                        WO #{wo.workOrderNo}
                                    </span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => copyLink(wo.shareToken)}
                                            className="w-10 h-10 rounded-2xl bg-primary/5 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all"
                                            title="Copy Vendor Link"
                                        >
                                            <Link2 className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => unshareWO.mutate(wo.id)}
                                            className="w-10 h-10 rounded-2xl bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-all"
                                            title="Revoke Access"
                                        >
                                            <Unlink className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[20px] font-black italic tracking-tight uppercase text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                                        {wo.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                            {wo.location?.name || 'Main Facility'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Status</span>
                                        <span className="text-[11px] font-black italic uppercase tracking-tight text-slate-700">
                                            {wo.status}
                                        </span>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Due Date</span>
                                        <span className="text-[11px] font-black italic uppercase tracking-tight text-slate-700">
                                            {wo.dueDate ? format(new Date(wo.dueDate), 'MMM dd') : 'No Deadline'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                            Shared {format(new Date(), 'MMM dd')}
                                        </span>
                                    </div>
                                    <a 
                                        href={`/vendor-portal/${wo.shareToken}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-1 transition-transform"
                                    >
                                        Inspect Portal <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
