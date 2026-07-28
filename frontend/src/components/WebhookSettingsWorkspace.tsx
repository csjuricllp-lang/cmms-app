import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { 
    Plus, Webhook as WebhookIcon, 
    MoreHorizontal, Edit2, Trash2, X, 
    ShieldCheck, Link as LinkIcon 
} from 'lucide-react';
import { useWebhooks } from '../hooks/useData';
import { toast } from 'react-hot-toast';

export const WebhookSettingsWorkspace: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [editingWebhook, setEditingWebhook] = React.useState<any>(null);
    const allEventsList = [
        { id: 'workorder.created', label: 'Work Order Created' },
        { id: 'workorder.updated', label: 'Work Order Updated' },
        { id: 'workorder.status_updated', label: 'Work Order Status Updated' },
        { id: 'workorder.deleted', label: 'Work Order Deleted' },
        { id: 'workorder.comment_added', label: 'Work Order Comment Added' },
        { id: 'pm.created', label: 'Preventive Maintenance Work Order Created' },
        { id: 'pm.updated', label: 'Preventive Maintenance Work Order Updated' },
        { id: 'pm.deleted', label: 'Preventive Maintenance Work Order Deleted' },
        { id: 'schedule.created', label: 'Work Order Schedule Created' },
        { id: 'schedule.updated', label: 'Work Order Schedule Updated' },
        { id: 'schedule.status_updated', label: 'Work Order Schedule Status Updated' },
        { id: 'schedule.deleted', label: 'Work Order Schedule Deleted' },
        { id: 'purchaseorder.updated', label: 'Purchase Order Updated' },
        { id: 'purchaseorder.created', label: 'Purchase Order Created' },
        { id: 'purchaseorder.deleted', label: 'Purchase Order Deleted' },
        { id: 'purchaseorder.approved', label: 'Purchase Order Approved' },
        { id: 'purchaseorder.declined', label: 'Purchase Order Declined' },
        { id: 'request.created', label: 'Request Created' },
        { id: 'request.updated', label: 'Request Updated' },
        { id: 'request.approved', label: 'Request Approved' },
        { id: 'request.rejected', label: 'Request Rejected' },
        { id: 'part.created', label: 'Part Created' },
        { id: 'part.updated', label: 'Part Updated' },
        { id: 'part.deleted', label: 'Part Deleted' }
    ];

    const [webhookData, setWebhookData] = React.useState({ 
        title: '', 
        url: '', 
        eventMode: 'individual' as 'all' | 'individual',
        selectedEvents: [] as string[],
        isActive: true 
    });

    const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

    const { data: webhooks, deleteWebhook, createMultipleWebhooks } = useWebhooks();

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <h1 className="text-[36px] font-black text-slate-800 tracking-tight">Webhooks</h1>
                    <div className="flex items-center gap-2 text-[16px] text-slate-400 font-medium">
                        Webhooks allows you to do two way data sync with your platform.
                        <button className="text-indigo-600 hover:underline">Learn more about webhooks</button>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setEditingWebhook(null);
                        setWebhookData({ title: '', url: '', eventMode: 'individual', selectedEvents: [], isActive: true });
                        setIsAddModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-[#4F7CFF] text-white text-[14px] font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Add Webhook
                </button>
            </div>

            {/* List Section */}
            <div className="space-y-6">
                {webhooks && webhooks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {webhooks.map((webhook: any) => (
                            <div key={webhook.id} className="bg-white border border-gray-100 rounded-[32px] p-8 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-indigo-100 transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                        <WebhookIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-[17px] font-black text-slate-800">{webhook.url}</h3>
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                webhook.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {webhook.isActive ? 'Active' : 'Paused'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-[13px] font-medium text-slate-400">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">
                                                {webhook.event}
                                            </div>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <div className="flex items-center gap-1.5 text-slate-300">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                Signature Verified
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <button 
                                            onClick={() => setActiveMenu(activeMenu === webhook.id ? null : webhook.id)}
                                            className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                                        >
                                            <MoreHorizontal className="w-6 h-6" />
                                        </button>

                                        <AnimatePresence>
                                            {activeMenu === webhook.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        className="absolute right-0 top-14 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 overflow-hidden"
                                                    >
                                                        <button 
                                                            onClick={() => {
                                                                setEditingWebhook(webhook);
                                                                setWebhookData({ 
                                                                    title: webhook.name || '',
                                                                    url: webhook.url, 
                                                                    eventMode: 'individual',
                                                                    selectedEvents: [webhook.event],
                                                                    isActive: webhook.isActive 
                                                                });
                                                                setIsAddModalOpen(true);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full px-5 py-4 text-left text-[14px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-all border-b border-slate-50"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                            Edit Webhook
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteWebhook.mutate(webhook.id, {
                                                                onSuccess: () => {
                                                                    toast.success('Webhook deleted');
                                                                    setActiveMenu(null);
                                                                }
                                                            })}
                                                            className="w-full px-5 py-4 text-left text-[14px] font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete Webhook
                                                        </button>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center space-y-6 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center">
                            <LinkIcon className="w-10 h-10 text-slate-200" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-[20px] font-black text-slate-800">No Webhooks Enabled</h3>
                            <p className="text-[14px] text-slate-400 font-medium max-w-xs leading-relaxed">
                                Connect external systems with real-time event triggers to synchronize your platform.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[20px] font-bold text-slate-800">{editingWebhook ? 'Edit Webhook' : 'Add Webhook'}</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-gray-700">Title <span className="text-rose-500">*</span></label>
                                        <input 
                                            placeholder="Enter webhook title"
                                            value={webhookData.title}
                                            onChange={(e) => setWebhookData({ ...webhookData, title: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-[15px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-gray-700">Endpoint <span className="text-rose-500">*</span></label>
                                        <input 
                                            placeholder="https://your-api.com/webhooks"
                                            value={webhookData.url}
                                            onChange={(e) => setWebhookData({ ...webhookData, url: e.target.value })}
                                            className={cn(
                                                "w-full px-4 py-2.5 bg-white border rounded-lg text-[15px] outline-none transition-all",
                                                webhookData.url && !webhookData.url.startsWith('http') ? "border-rose-500 ring-1 ring-rose-500" : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            )}
                                        />
                                        {webhookData.url && !webhookData.url.startsWith('http') && (
                                            <p className="text-[13px] text-rose-500">Endpoint must be a valid URL</p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[14px] text-gray-700">Which events would you like to trigger this webhook?</p>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input 
                                                    type="radio" 
                                                    checked={webhookData.eventMode === 'all'}
                                                    onChange={() => setWebhookData({ ...webhookData, eventMode: 'all', selectedEvents: allEventsList.map(e => e.id) })}
                                                    className="w-5 h-5 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-[15px] text-gray-700">All events</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input 
                                                    type="radio" 
                                                    checked={webhookData.eventMode === 'individual'}
                                                    onChange={() => setWebhookData({ ...webhookData, eventMode: 'individual', selectedEvents: [] })}
                                                    className="w-5 h-5 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-[15px] text-gray-700">Let me choose individually</span>
                                            </label>
                                        </div>
                                    </div>

                                    {webhookData.eventMode === 'individual' && (
                                        <div className="space-y-3">
                                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar border border-gray-100 rounded-xl p-2 bg-slate-50/30">
                                                {allEventsList.map((ev) => (
                                                    <label 
                                                        key={ev.id}
                                                        className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 transition-all cursor-pointer group"
                                                    >
                                                        <input 
                                                            type="checkbox"
                                                            checked={webhookData.selectedEvents.includes(ev.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setWebhookData({ ...webhookData, selectedEvents: [...webhookData.selectedEvents, ev.id] });
                                                                } else {
                                                                    setWebhookData({ ...webhookData, selectedEvents: webhookData.selectedEvents.filter(id => id !== ev.id) });
                                                                }
                                                            }}
                                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-[15px] text-gray-700 font-medium group-hover:text-indigo-600 transition-colors">{ev.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {webhookData.selectedEvents.length === 0 && (
                                                <p className="text-[13px] text-rose-500 px-1">You must select at least 1 event</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <button 
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 text-[14px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => {
                                            createMultipleWebhooks.mutate({
                                                title: webhookData.title,
                                                url: webhookData.url,
                                                selectedEvents: webhookData.selectedEvents,
                                                isActive: webhookData.isActive
                                            }, {
                                                onSuccess: () => {
                                                    setIsAddModalOpen(false);
                                                    setWebhookData({ title: '', url: '', eventMode: 'individual', selectedEvents: [], isActive: true });
                                                    toast.success('Webhooks added successfully');
                                                }
                                            });
                                        }}
                                        disabled={!webhookData.title || !webhookData.url || (webhookData.eventMode === 'individual' && webhookData.selectedEvents.length === 0)}
                                        className="px-6 py-2.5 bg-gray-100 text-gray-400 text-[14px] font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        {editingWebhook ? 'Update Webhook' : 'Add Webhook'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
