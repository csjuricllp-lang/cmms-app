import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert, Send, Camera, CircleCheck, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export const PublicRequestPortal: React.FC = () => {
    const { orgId } = useParams();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assetId, setAssetId] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/public-portal/requests', {
                title,
                description,
                assetId: assetId || undefined,
                organizationId: orgId
            });

            setSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Submission failed.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[48px] p-12 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 rounded-[40px] bg-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center justify-center text-white mx-auto mb-10 scale-110">
                        <CircleCheck className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white mb-4">Report Received!</h2>
                    <p className="text-slate-400 font-bold italic mb-10">Our maintenance team has been notified. We will stabilize the asset shortly.</p>
                    <button 
                        onClick={() => { setSubmitted(false); setTitle(''); setDescription(''); setAssetId(''); }}
                        className="w-full py-6 bg-white text-slate-950 rounded-3xl text-[15px] font-black uppercase tracking-widest italic hover:scale-105 transition-all shadow-xl shadow-white/10"
                    >
                        Submit Another Report
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            <div className="max-w-xl w-full">
                {/* Branding / Header */}
                <div className="text-center mb-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-[10px] font-black text-primary uppercase tracking-[0.2em] italic mb-2">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Maintenance Support Portal
                    </div>
                    <h1 className="text-[42px] font-black italic uppercase tracking-tighter text-white leading-none">
                        Report <span className="text-primary italic">Issue</span>
                    </h1>
                    <p className="text-slate-500 font-bold italic uppercase text-[12px] tracking-[0.1em] opacity-60">Help us keep the operation running at peak performance.</p>
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[48px] p-10 space-y-8 shadow-2xl overflow-hidden relative group">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    
                    {error && (
                        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] font-bold flex items-center gap-3 italic animate-in slide-in-from-top-4">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-4">What's the problem? (Subject)</label>
                            <input
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Broken conveyer belt, Leak in pipe B"
                                className="w-full h-16 px-8 bg-white/5 border border-white/5 rounded-3xl text-white font-bold placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/40 focus:bg-white/10 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-4">Description & Location</label>
                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide as much detail as possible to help our technicians..."
                                className="w-full min-h-[140px] p-8 bg-white/5 border border-white/5 rounded-[32px] text-white font-bold placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/40 focus:bg-white/10 transition-all custom-scrollbar overflow-hidden"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-4">Asset Identification (Optional)</label>
                            <input
                                value={assetId}
                                onChange={(e) => setAssetId(e.target.value)}
                                placeholder="Asset Serial or Name (if known)"
                                className="w-full h-16 px-8 bg-white/5 border border-white/5 rounded-3xl text-white font-bold placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/40 focus:bg-white/10 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            className="w-20 h-20 bg-slate-900 rounded-3xl border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all group/btn shadow-xl shadow-black/20"
                        >
                            <Camera className="w-7 h-7 group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button
                            disabled={loading}
                            className="flex-1 h-20 bg-primary hover:bg-primary-hover text-white rounded-3xl text-[16px] font-black uppercase tracking-widest italic flex items-center justify-center gap-4 transition-all shadow-[0_15px_40px_var(--primary-glow)] disabled:opacity-50 disabled:grayscale active:scale-95"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Transmit Report
                                    <Send className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <p className="mt-10 text-center text-slate-700 text-[10px] font-black uppercase tracking-widest opacity-40">
                    Proprietary Maintenance Network &copy; 2026 Juric CMMS SaaS
                </p>
            </div>
        </div>
    );
};
