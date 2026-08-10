import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicWorkOrder } from '../hooks/useWorkOrders';
import { 
    CircleCheck, 
    AlertTriangle, 
    MessageSquare, 
    Camera,
    Info,
    MapPin,
    Calendar,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const VendorWorkOrderView = () => {
    const { token } = useParams();
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState('');

    const { data: wo, isLoading, error } = usePublicWorkOrder(token);

    const updateStatus = useMutation({
        mutationFn: async (status: string) => {
            await api.patch(`/work-orders/public/${token}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['public-work-order', token] });
            toast.success('System Synchronized: Status Updated');
        }
    });

    if (isLoading) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-white font-black uppercase tracking-widest italic text-[10px]">Authenticating Token...</span>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center mb-8">
                <AlertTriangle className="w-12 h-12 text-rose-500" />
            </div>
            <h1 className="text-3xl font-black italic text-white uppercase tracking-tight mb-4">Link Expired</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-relaxed max-w-xs mx-auto">
                This secure access bridge has been revoked by the facility manager or the link is invalid.
            </p>
        </div>
    );

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'COMPLETED': return 'bg-emerald-500';
            case 'IN_PROGRESS': return 'bg-amber-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header / Security Banner */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block">External Portal</span>
                        <span className="text-white font-black italic uppercase tracking-tight">Mission Critical Access</span>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto p-6 space-y-6">
                {/* Mission Summary Card */}
                <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-white">
                    <div className="flex items-center gap-3 mb-6">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic text-white ${getStatusColor(wo.status)}`}>
                            {wo.status}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                            WO #{wo.workOrderNo}
                        </span>
                    </div>

                    <h1 className="text-[28px] font-black italic tracking-tight uppercase text-slate-800 leading-tight mb-4">
                        {wo.title}
                    </h1>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Location</span>
                                <span className="text-[13px] font-black italic uppercase text-slate-700">{wo.location?.name || 'Main Facility'}</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Deadline</span>
                                <span className="text-[13px] font-black italic uppercase text-slate-700">
                                    {wo.dueDate ? format(new Date(wo.dueDate), 'MMMM dd, yyyy') : 'As Soon As Possible'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-[40px] p-8 shadow-lg shadow-slate-200/40">
                    <div className="flex items-center gap-3 mb-4">
                        <Info className="w-5 h-5 text-primary" />
                        <h2 className="text-[14px] font-black uppercase tracking-widest italic text-slate-800">Job Description</h2>
                    </div>
                    <p className="text-[14px] font-medium text-slate-600 leading-relaxed italic">
                        {wo.description || 'No detailed instructions provided. Please inspect the site.'}
                    </p>
                </div>

                {/* Execution Controls */}
                <div className="space-y-3">
                    {wo.status === 'OPEN' && (
                        <button 
                            onClick={() => updateStatus.mutate('IN_PROGRESS')}
                            className="w-full py-6 bg-emerald-500 text-white rounded-[32px] text-[15px] font-black uppercase tracking-widest italic shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                            Start Mission <ArrowRight className="w-5 h-5" />
                        </button>
                    )}

                    {wo.status === 'IN_PROGRESS' && (
                        <button 
                            onClick={() => updateStatus.mutate('COMPLETED')}
                            className="w-full py-6 bg-slate-900 text-white rounded-[32px] text-[15px] font-black uppercase tracking-widest italic shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                            Mark Completed <CircleCheck className="w-5 h-5" />
                        </button>
                    )}

                    <button className="w-full py-6 bg-white border-2 border-slate-100 text-slate-400 rounded-[32px] text-[13px] font-black uppercase tracking-widest italic flex items-center justify-center gap-4">
                        <Camera className="w-5 h-5" /> Evidence Capture
                    </button>
                </div>

                {/* Quick Chat / Notes */}
                <div className="bg-slate-100/50 rounded-[40px] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageSquare className="w-5 h-5 text-slate-400" />
                        <h2 className="text-[12px] font-black uppercase tracking-widest italic text-slate-500">Service Notes</h2>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                        {wo.comments?.map((c: any) => (
                            <div key={c.id} className="bg-white p-4 rounded-3xl shadow-sm border border-white">
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary block mb-1">
                                    {c.user?.user?.name || 'System'}
                                </span>
                                <p className="text-[12px] font-medium text-slate-700 italic">{c.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Add a field update..."
                            className="w-full px-6 py-4 bg-white border-2 border-white rounded-[24px] text-[13px] font-bold italic outline-none focus:border-primary/20 transition-all placeholder:text-slate-300"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            
            <div className="p-12 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 italic">
                    Secure End-to-End Encryption Enabled • CMMS Pro Cloud
                </p>
            </div>
        </div>
    );
};
