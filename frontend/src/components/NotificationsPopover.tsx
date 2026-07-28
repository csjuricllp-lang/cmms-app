import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bell, Clock, ShieldAlert, Workflow, Package, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { api } from '../lib/api';
import type { AppNotification } from '../types/notification';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationsPopover = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const { socket } = useNotifications();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: AppNotification) => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification: AppNotification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        };

        socket.on('notification_created', handleNewNotification);

        return () => {
            socket.off('notification_created', handleNewNotification);
        };
    }, [socket]);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'WORK_ORDER_ASSIGNED': return <Workflow className="w-4 h-4 text-blue-500" />;
            case 'WORK_ORDER_COMPLETED':
            case 'WORK_ORDER_APPROVED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'WORK_ORDER_REJECTED': return <Clock className="w-4 h-4 text-rose-500" />;
            case 'LOW_STOCK': return <Package className="w-4 h-4 text-amber-500" />;
            case 'OVERDUE_ALERT': return <Clock className="w-4 h-4 text-rose-500" />;
            case 'APPROVAL_REQUEST': return <ShieldAlert className="w-4 h-4 text-emerald-500" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-xl relative hover:bg-foreground/5 text-muted-foreground transition-all group"
            >
                <Bell className={cn("w-5 h-5 transition-all", isOpen && "text-primary scale-110")} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-primary text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-background animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {mounted && isOpen && createPortal(
                <div className="fixed inset-0 z-[9999]">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />

                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="fixed top-24 right-8 w-[400px] bg-background/98 border border-border backdrop-blur-3xl rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col text-foreground"
                            style={{ maxHeight: 'calc(100vh - 120px)' }}
                        >
                            <div className="p-8 border-b border-border flex items-center justify-between bg-foreground/[0.02] shrink-0">
                                <div>
                                    <h3 className="text-[20px] font-black italic text-foreground uppercase tracking-tight">Intelligence Hub</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1">Operational Readiness</p>
                                </div>
                                <button
                                    onClick={markAllRead}
                                    className="px-4 py-2 hover:bg-foreground/5 rounded-xl text-[10px] font-black text-muted-foreground hover:text-primary uppercase tracking-widest transition-all border border-border hover:border-primary/20"
                                >
                                    Clear All
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-24 text-center px-12">
                                        <div className="w-20 h-20 bg-foreground/5 rounded-[24px] flex items-center justify-center mx-auto mb-8 border border-border relative group">
                                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <Bell className="w-10 h-10 text-muted-foreground/35 relative z-10" />
                                        </div>
                                        <h4 className="text-foreground text-[18px] font-black italic uppercase tracking-tight">Silence is Golden</h4>
                                        <p className="text-muted-foreground/50 text-[10px] uppercase tracking-[0.2em] font-black mt-3 leading-relaxed">
                                            No active alerts detected. All systems are operating within nominal parameters.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {notifications.map((n) => (
                                            <Link
                                                key={n.id}
                                                to={n.metaData?.actionUrl || (n.metaData?.requestId ? `/requests?id=${n.metaData.requestId}` : ((n.type === 'WORK_ORDER_ASSIGNED' || n.type === 'WORK_ORDER_COMPLETED' || n.metaData?.workOrderId) ? `/work-orders?id=${n.metaData?.workOrderId || n.metaData?.entityId}` : '#'))}
                                                onClick={() => {
                                                    markAsRead(n.id);
                                                    setIsOpen(false);
                                                }}
                                                className={cn(
                                                    "p-5 flex gap-4 hover:bg-foreground/[0.03] transition-all cursor-pointer relative group",
                                                    !n.isRead && "bg-primary/[0.03]"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                                    !n.isRead ? "bg-primary/10 border-primary/20" : "bg-foreground/5 border-border"
                                                )}>
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[13px] font-black italic text-foreground tracking-tight uppercase truncate">
                                                            {n.title}
                                                        </span>
                                                        <span className="text-[9px] font-black text-muted-foreground/45 uppercase italic whitespace-nowrap">
                                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
                                                        {n.content}
                                                    </p>
                                                </div>
                                                {!n.isRead && (
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]" />
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-4 border-t border-border bg-foreground/[0.01] shrink-0">
                                    <Link
                                        to="/notifications"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black text-muted-foreground/75 hover:text-foreground uppercase tracking-[0.3em] italic transition-all flex items-center justify-center gap-2"
                                    >
                                        View Full Audit Trail
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </div>
    );
};
