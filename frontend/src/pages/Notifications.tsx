import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Clock, ShieldAlert, Workflow, Package, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../types/notification';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
    const { socket } = useNotifications();

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleNew = (n: AppNotification) => setNotifications(prev => [n, ...prev]);
        socket.on('notification_created', handleNew);
        return () => { socket.off('notification_created', handleNew); };
    }, [socket]);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) { console.error(err); }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'WORK_ORDER_ASSIGNED': return <Workflow className="w-5 h-5 text-blue-500" />;
            case 'WORK_ORDER_COMPLETED':
            case 'WORK_ORDER_APPROVED': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'WORK_ORDER_REJECTED': return <Clock className="w-5 h-5 text-rose-500" />;
            case 'LOW_STOCK': return <Package className="w-5 h-5 text-amber-500" />;
            case 'OVERDUE_ALERT': return <Clock className="w-5 h-5 text-rose-500" />;
            case 'APPROVAL_REQUEST': return <ShieldAlert className="w-5 h-5 text-emerald-500" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    const filtered = filter === 'ALL' ? notifications : notifications.filter(n => !n.isRead);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header Area */}
            <div className="flex items-end justify-between mb-12">
                <div>
                    <h1 className="text-[40px] font-black italic text-white uppercase tracking-tighter leading-none mb-3">
                        Intelligence Hub
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-primary/20 border border-primary/40 rounded-full">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                {notifications.filter(n => !n.isRead).length} Active Alerts
                            </span>
                        </div>
                        <p className="text-white/30 text-[11px] font-bold uppercase tracking-[0.2em] italic">
                            Operational Command & Control
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button 
                            onClick={() => setFilter('ALL')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                                filter === 'ALL' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                            )}
                        >
                            All Logs
                        </button>
                        <button 
                            onClick={() => setFilter('UNREAD')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                                filter === 'UNREAD' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                            )}
                        >
                            Unread
                        </button>
                    </div>
                    
                    <button 
                        onClick={markAllRead}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl border border-white/10 transition-all group"
                        title="Mark all as read"
                    >
                        <CheckCircle2 className="w-5 h-5 group-active:scale-90 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-4">
                {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-24 bg-white/5 rounded-[32px] animate-pulse border border-white/5" />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="py-32 text-center bg-white/[0.02] rounded-[48px] border border-dashed border-white/10">
                        <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-white/5">
                            <Bell className="w-12 h-12 text-white/10" />
                        </div>
                        <h3 className="text-white text-2xl font-black italic uppercase tracking-tight">Zero Anomalies</h3>
                        <p className="text-white/30 text-[11px] uppercase tracking-[0.3em] font-black mt-4 max-w-sm mx-auto leading-relaxed">
                            Your operational stream is clear. All systems are functioning at peak efficiency.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filtered.map((n) => (
                            <motion.div
                                key={n.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={cn(
                                    "group relative bg-[#0d0d10] border rounded-[32px] p-6 flex gap-6 transition-all hover:border-white/20",
                                    n.isRead ? "border-white/5 opacity-60" : "border-primary/20 shadow-[0_0_40px_rgba(37,99,235,0.05)]"
                                )}
                            >
                                <Link
                                    to={n.metaData?.actionUrl || (n.metaData?.requestId ? `/requests?id=${n.metaData.requestId}` : ((n.type === 'WORK_ORDER_ASSIGNED' || n.type === 'WORK_ORDER_COMPLETED' || n.metaData?.workOrderId) ? `/work-orders?id=${n.metaData?.workOrderId || n.metaData?.entityId}` : '#'))}
                                    onClick={() => !n.isRead && markAsRead(n.id)}
                                    className="flex-1 flex gap-6 min-w-0"
                                >
                                    <div className={cn(
                                        "w-16 h-16 rounded-[24px] border flex items-center justify-center shrink-0 shadow-inner",
                                        !n.isRead ? "bg-primary/10 border-primary/20" : "bg-white/5 border-white/10"
                                    )}>
                                        {getIcon(n.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    !n.isRead ? "text-primary" : "text-white/20"
                                                )}>
                                                    {n.type.replace(/_/g, ' ')}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">
                                                    {format(new Date(n.createdAt), 'MMM dd, yyyy • HH:mm')}
                                                </span>
                                            </div>
                                            
                                            {!n.isRead && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        markAsRead(n.id);
                                                    }}
                                                    className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                        </div>
                                        
                                        <h4 className="text-[18px] font-black italic text-white uppercase tracking-tight mb-2 leading-tight">
                                            {n.title}
                                        </h4>
                                        <p className="text-[14px] text-white/50 font-medium leading-relaxed max-w-2xl">
                                            {n.content}
                                        </p>
                                    </div>
                                </Link>

                                {/* Unread Indicator */}
                                {!n.isRead && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-full" />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Footer Stats */}
            {!isLoading && notifications.length > 0 && (
                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">
                        Secured by Antigravity AI Engine v4.2
                    </p>
                    <div className="flex gap-8">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Total Logs</p>
                            <p className="text-[16px] font-black text-white italic leading-none">{notifications.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Response Rate</p>
                            <p className="text-[16px] font-black text-primary italic leading-none">98.4%</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
