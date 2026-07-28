import { 
    User, 
    AlertCircle, 
    ChevronRight, 
    Search, 
    Clock,
    Activity,
    Settings,
    ShieldCheck,
    Briefcase,
    ClipboardCheck,
    Zap,
    Package,
    RefreshCcw
} from 'lucide-react';
import { useAuditLogs } from '../hooks/useData';
import type { AuditLog } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export const AuditLogPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const { data: logs, isLoading } = useAuditLogs();

    const getActionStyles = (action: string) => {
        if (action.includes('WORK_ORDER')) return { 
            bg: "bg-blue-500/10", border: "border-blue-500/20", color: "text-blue-400", icon: Briefcase 
        };
        if (action.includes('CHECKLIST')) return { 
            bg: "bg-emerald-500/10", border: "border-emerald-500/20", color: "text-emerald-400", icon: ClipboardCheck 
        };
        if (action.includes('ASSET')) return { 
            bg: "bg-purple-500/10", border: "border-purple-500/20", color: "text-purple-400", icon: Zap 
        };
        if (action.includes('INVENTORY')) return { 
            bg: "bg-amber-500/10", border: "border-amber-500/20", color: "text-amber-400", icon: Package 
        };
        if (action.includes('PM_')) return { 
            bg: "bg-rose-500/10", border: "border-rose-500/20", color: "text-rose-400", icon: RefreshCcw 
        };
        return { 
            bg: "bg-slate-500/10", border: "border-slate-500/20", color: "text-slate-400", icon: Activity 
        };
    };

    const formatActionName = (action: string) => {
        return action.split('_').join(' ').toLowerCase();
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Header Section */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/40 bg-clip-text text-transparent italic uppercase">
                        AUDIT ACTIVITY
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium italic flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        Live enterprise accountability stream
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            placeholder="Search logs..." 
                            className="bg-muted/20 border border-white/10 rounded-2xl pl-12 pr-6 py-4 w-72 text-sm outline-none focus:border-primary/40 focus:bg-muted/30 transition-all font-bold placeholder:italic"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* Stats Grid - FULLY DYNAMIC */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { 
                        label: "Today's Events", 
                        value: logs?.length || 0, 
                        icon: Clock, 
                        color: "text-blue-400" 
                    },
                    { 
                        label: "Critical Changes", 
                        value: logs?.filter((l: AuditLog) => l.action.includes('CREATED') || l.action.includes('DELETED')).length || 0, 
                        icon: AlertCircle, 
                        color: "text-amber-400" 
                    },
                    { 
                        label: "Compliance Status", 
                        value: logs?.some((l: AuditLog) => l.action.includes('COMPLETED')) ? "Verified" : "Pending", 
                        icon: ShieldCheck, 
                        color: logs?.some((l: AuditLog) => l.action.includes('COMPLETED')) ? "text-emerald-400" : "text-slate-500" 
                    },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-8 group cursor-default">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 italic">{stat.label}</p>
                                <p className="text-4xl font-black italic">{stat.value}</p>
                            </div>
                            <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Audit Feed */}
            <div className="relative max-w-5xl">
                {/* Visual Timeline Thread */}
                <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/20 via-muted/10 to-transparent" />

                <div className="space-y-6">
                    {isLoading ? (
                        [1,2,3].map(i => (
                            <div key={i} className="h-32 w-full glass-card animate-pulse" />
                        ))
                    ) : (
                        logs?.map((log: AuditLog, idx: number) => {
                            const style = getActionStyles(log.action);
                            return (
                                <div key={log.id} className="relative pl-24 group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                    {/* Timeline Marker */}
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl ${style.bg} ${style.border} border flex items-center justify-center z-10 group-hover:scale-125 transition-transform duration-500`}>
                                        <style.icon className={`w-4 h-4 ${style.color}`} />
                                    </div>

                                    {/* Log Card */}
                                    <div className="glass-card p-10 group-hover:bg-white/[0.04] transition-all">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                            <div className="flex items-start gap-8">
                                                <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center shrink-0 border border-white/10 shadow-inner group-hover:bg-primary/20 transition-colors overflow-hidden">
                                                    {log.user?.avatarUrl ? (
                                                        <img src={log.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black uppercase italic tracking-tighter">
                                                            {log.user?.name || 'Automated Protocol'}
                                                        </span>
                                                        <span className="px-3 py-1 rounded-full bg-primary/10 text-[10px] font-black text-primary uppercase tracking-[0.2em]">{log.model}</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                                                        Executed <span className={style.color}>{formatActionName(log.action)}</span>
                                                    </h3>
                                                    <div className="flex items-center gap-6 pt-2">
                                                        <div className="flex items-center gap-2 text-muted-foreground/60 text-[12px] font-medium font-bold italic">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground/60 text-[12px] font-medium font-bold italic">
                                                            <Activity className="w-3.5 h-3.5" />
                                                            Ref: #{log.entityId.slice(-6)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => setSelectedLog(log)}
                                                className="flex items-center gap-4 px-8 py-5 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/btn self-start lg:self-center">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 opacity-40">Security Context</p>
                                                    <p className="text-[12px] font-black uppercase italic tracking-wider">Review Change</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover/btn:translate-x-2 transition-transform" />
                                            </button>
                                        </div>

                                        {/* Payload Visualizer - Theme Optimized */}
                                        {(log.oldData || log.newData) && (
                                            <div className="mt-10 p-8 rounded-[32px] bg-black/20 border border-white/5">
                                                <div className="flex items-center justify-between mb-6">
                                                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest italic opacity-30">Change Vector Protocol</p>
                                                </div>
                                                <pre className="text-[13px] font-mono text-primary/80 transition-colors overflow-hidden truncate">
                                                    {JSON.stringify(log.newData || log.oldData, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            <div className="flex justify-center pt-10">
                <button className="px-10 py-5 rounded-3xl border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all font-black text-xs uppercase tracking-[0.2em] italic">
                    Load Historical Records
                </button>
            </div>

            {/* Change Inspection Modal (Premium Overlay) */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setSelectedLog(null)} />
                    
                    <div className="relative w-full max-w-4xl glass-card border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-12 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <span className="px-4 py-1 rounded-full bg-primary/10 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                            Inspection: {selectedLog.model}
                                        </span>
                                        <span className="text-xs text-muted-foreground italic">ID: {selectedLog.id}</span>
                                    </div>
                                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">
                                        Protocol <span className="text-primary">{formatActionName(selectedLog.action)}</span>
                                    </h2>
                                </div>
                                <button 
                                    onClick={() => setSelectedLog(null)}
                                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group"
                                >
                                    <Settings className="w-6 h-6 rotate-45 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <p className="text-xs font-black uppercase text-muted-foreground italic tracking-widest">Base State (Old Data)</p>
                                    <div className="bg-black/40 rounded-[32px] p-8 border border-white/5 max-h-[400px] overflow-auto custom-scrollbar">
                                        <pre className="text-[13px] font-mono text-muted-foreground/60 leading-relaxed">
                                            {JSON.stringify(selectedLog.oldData, null, 2) || "// No previous state found"}
                                        </pre>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xs font-black uppercase text-primary italic tracking-widest">Modified State (New Data)</p>
                                    <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10 max-h-[400px] overflow-auto custom-scrollbar">
                                        <pre className="text-[13px] font-mono text-primary/80 leading-relaxed">
                                            {JSON.stringify(selectedLog.newData, null, 2) || "// No modification data found"}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                                <div className="flex gap-10">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-muted-foreground/40 mb-1">Execution Date</p>
                                        <p className="text-sm font-bold italic">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-muted-foreground/40 mb-1">IP Address</p>
                                        <p className="text-sm font-bold italic">{selectedLog.ipAddress || "Internal System"}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedLog(null)}
                                    className="px-10 py-5 rounded-3xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]"
                                >
                                    Dismiss Record
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
