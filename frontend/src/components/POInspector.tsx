import { useState, useEffect } from 'react';
import {
    X,
    FileText,
    Truck,
    ArrowLeft,
    Loader2,
    Clock,
    XCircle,
    Columns,
    MoreHorizontal,
    Upload,
    AlertCircle,
    MapPin,
    Printer,
    Edit2,
    Globe,
    Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { POModal } from './POModal';

const FulfillModal = ({ isOpen, onClose, order, onFulfill, isPending }: any) => {
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        if (isOpen && order?.items) {
            const initial: Record<string, number> = {};
            order.items.forEach((item: any) => {
                const remaining = item.quantity - (item.fulfilledQuantity || 0);
                initial[item.id] = remaining > 0 ? remaining : 0;
            });
            setQuantities(initial);
        }
    }, [isOpen, order]);

    if (!isOpen) return null;

    const handleQtyChange = (itemId: string, val: string) => {
        const num = val === '' ? '' : parseInt(val, 10);
        setQuantities(prev => ({
            ...prev,
            [itemId]: num === '' ? 0 : isNaN(num) ? 0 : Math.max(0, num)
        }));
    };

    const hasItemsToReceive = Object.values(quantities).some(q => q > 0);

    const handleSubmit = () => {
        const items = Object.entries(quantities)
            .map(([itemId, qty]) => ({
                itemId,
                quantityReceived: qty
            }))
            .filter(i => i.quantityReceived > 0);
        onFulfill(items);
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[650px] bg-white rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.2)] p-8 overflow-hidden select-none"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-[24px] font-black text-slate-800 tracking-tight leading-tight">Fulfill Purchase Order</h3>
                        <p className="text-[15px] font-bold text-slate-400 mt-2">Each item's quantity will be increased by the amount received</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors -mt-2 -mr-2">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Table */}
                <div className="my-8 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="py-3 text-[13px] font-black text-slate-800 tracking-tight uppercase w-20">Number</th>
                                <th className="py-3 text-[13px] font-black text-slate-800 tracking-tight uppercase">Item</th>
                                <th className="py-3 text-[13px] font-black text-slate-800 tracking-tight uppercase text-center w-24">Ordered</th>
                                <th className="py-3 text-[13px] font-black text-slate-800 tracking-tight uppercase w-36">Received</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[14px]">
                            {order.items?.map((item: any, idx: number) => {
                                return (
                                    <tr key={item.id} className="align-middle">
                                        <td className="py-4 text-[15px] font-bold text-slate-400">{idx + 1}</td>
                                        <td className="py-4 pr-4">
                                            <span className="text-[15px] font-bold text-slate-700 block leading-tight">{item.part?.name || 'Unknown Item'}</span>
                                            {item.part?.partNumber && (
                                                <span className="text-[11px] font-black text-slate-400 block uppercase tracking-wider mt-0.5">{item.part.partNumber}</span>
                                            )}
                                        </td>
                                        <td className="py-4 text-[15px] font-bold text-slate-600 text-center">
                                            {(item.fulfilledQuantity || 0)}/{item.quantity}
                                        </td>
                                        <td className="py-4">
                                            <input 
                                                type="number"
                                                min="0"
                                                className="w-full border-2 border-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 rounded-lg px-4 py-2.5 outline-none transition-all font-bold text-[15px] text-slate-700"
                                                value={quantities[item.id] !== undefined ? quantities[item.id] : ''}
                                                onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 border-2 border-slate-200 rounded-xl text-[15px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={!hasItemsToReceive || isPending}
                        onClick={handleSubmit}
                        className={cn(
                            "px-8 py-2.5 rounded-xl text-[15px] font-bold transition-all",
                            hasItemsToReceive && !isPending 
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer" 
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {isPending ? 'Fulfilling...' : 'Fulfill'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

interface POInspectorProps {
    order: any;
    onClose: () => void;
}

export const POInspector = ({ order: initialOrder, onClose }: POInspectorProps) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'files'>('details');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const getTenantCompany = () => {
        try {
            const orgStr = localStorage.getItem('organization');
            if (orgStr) {
                const org = JSON.parse(orgStr);
                if (org && org.name) return org.name;
            }
            if (user && user.organizations && user.organizations.length > 0) {
                return user.organizations[0].name;
            }
        } catch (e) {
            console.error("Error reading tenant organization", e);
        }
        return 'Juric';
    };
    const companyName = getTenantCompany();
    const requisitionerName = user?.name || 'Authorized Buyer';

    const { data: order } = useQuery({
        queryKey: ['purchase-order', initialOrder.id],
        queryFn: async () => {
            const response = await api.get(`/purchase-orders/${initialOrder.id}`);
            return response.data;
        },
        initialData: initialOrder
    });

    const receiveMutation = useMutation({
        mutationFn: async (items: { itemId: string, quantityReceived: number }[]) => {
            return api.post(`/purchase-orders/${order.id}/receive`, { items });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-order', order.id] });
            queryClient.invalidateQueries({ queryKey: ['parts'] });
            toast.success('Items successfully received');
        },
        onError: () => {
            toast.error('Failed to receive items');
        }
    });


    const deleteMutation = useMutation({
        mutationFn: async () => api.delete(`/purchase-orders/${order.id}`),
        onSuccess: () => {
            toast.success('Purchase Order Cancelled');
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            onClose();
        },
        onError: () => {
            toast.error('Failed to cancel purchase order');
        }
    });

    const approveMutation = useMutation({
        mutationFn: async () => api.post(`/purchase-orders/${order.id}/approve`),
        onSuccess: () => {
            toast.success('Purchase Order Approved');
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-order', order.id] });
        },
        onError: () => {
            toast.error('Failed to approve purchase order');
        }
    });

    const denyMutation = useMutation({
        mutationFn: async () => api.post(`/purchase-orders/${order.id}/deny`),
        onSuccess: () => {
            toast.success('Purchase Order Declined');
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-order', order.id] });
        },
        onError: () => {
            toast.error('Failed to decline purchase order');
        }
    });

    const syncQuickBooksMutation = useMutation({
        mutationFn: async () => api.post(`/purchase-orders/${order.id}/sync-quickbooks`),
        onSuccess: (res: any) => {
            toast.success(res.data?.message || 'Purchase Order synced to QuickBooks');
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-order', order.id] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to sync to QuickBooks');
        }
    });

    const sendToVendorMutation = useMutation({
        mutationFn: async () => api.post(`/purchase-orders/${order.id}/send`),
        onSuccess: (res: any) => {
            toast.success(res.data?.message || 'Successfully sent Purchase Order to vendor');
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-order', order.id] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to send Purchase Order to vendor');
        }
    });

    const formatDate = (dateStr: any) => {
        if (!dateStr) return 'None';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        const val = Number(amount || 0);
        const symbol = order.currency === 'USD' ? '$' : order.currency === 'EUR' ? '€' : '₹';
        if (order.currency === 'USD' || order.currency === 'EUR') {
            return `${symbol}${val.toFixed(2)}`;
        }
        return `${symbol}${val.toLocaleString()}`;
    };

    // Calculate subtotal, taxes, shipping, total
    const subtotal = order.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unitCost), 0) || 0;
    const taxAmount = Number(order.taxAmount || 0);
    const shippingCost = Number(order.shippingCost || 0);
    const otherCosts = 0; // Default mockup layout specifies Other Costs $0.00
    const totalCost = subtotal + taxAmount + shippingCost + otherCosts;

    // Helper to get Billing Details
    const billingDetails = {
        companyName: order.billingCompanyName || order.company || companyName,
        phone: order.billingPhone || user?.phone || 'N/A',
        fax: order.billingFax || 'None',
        address: (() => {
            if (order.billingAddressType === 'DIFFERENT' || order.billingAddressType === 'NEW') {
                const parts = [
                    order.billingAddress,
                    order.billingCity,
                    order.billingState,
                    order.billingZip
                ].filter(Boolean);
                if (parts.length > 0) {
                    return parts.join(', ');
                }
            }
            return order.billingAddress || 'Primary Enterprise Facility';
        })()
    };

    // Helper to get Shipping Details
    const shippingDetails = {
        companyName: (() => {
            if (order.shippingAddressType === 'SAME_AS_BILLING') {
                return billingDetails.companyName;
            }
            return order.shippingCompanyName || order.company || companyName;
        })(),
        phone: (() => {
            if (order.shippingAddressType === 'SAME_AS_BILLING') {
                return billingDetails.phone;
            }
            return order.shippingPhone || user?.phone || 'N/A';
        })(),
        fax: (() => {
            if (order.shippingAddressType === 'SAME_AS_BILLING') {
                return billingDetails.fax;
            }
            return order.shippingFax || 'None';
        })(),
        address: (() => {
            if (order.shippingAddressType === 'SAME_AS_BILLING') {
                return billingDetails.address;
            }
            if (order.shippingAddressType === 'DIFFERENT' && order.writeShippingDetailsManually) {
                const parts = [
                    order.shippingAddress,
                    order.shippingCity,
                    order.shippingState,
                    order.shippingZip
                ].filter(Boolean);
                if (parts.length > 0) {
                    return parts.join(', ');
                }
            }
            return order.shippingAddress || 'Primary Enterprise Facility';
        })()
    };

    // Status Styling Badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RECEIVED':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200/50">
                        Fulfilled
                    </span>
                );
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                        Approved
                    </span>
                );
            case 'ORDERED':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                        Ordered
                    </span>
                );
            case 'DENIED':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200/50">
                        Declined
                    </span>
                );
            case 'PENDING_APPROVAL':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#FFF4E5] text-[#B76E00] border border-[#FFE2C2]">
                        Awaiting Approval
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200/50">
                        {status.replace('_', ' ')}
                    </span>
                );
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 md:p-8"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="w-full max-w-[1400px] h-[90vh] bg-background rounded-[1.5rem] shadow-[0_24px_70px_-15px_rgba(0,0,0,0.2)] border border-border overflow-hidden flex flex-col"
            >
                {/* Top Header */}
                <div className="bg-card px-8 py-5 border-b border-border flex items-center justify-between shrink-0 select-none">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                                <Columns className="w-5 h-5 rotate-90" />
                            </button>
                            <button onClick={onClose} className="p-1.5 text-foreground/70 hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </div>
                        <h2 className="text-[20px] font-bold text-foreground">
                            #{order.number || order.id.slice(0, 6).toUpperCase()} / {order.title || `Restock: ${order.vendor?.name || 'Inventory'}`}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {localStorage.getItem('cmms_quickbooks_enabled') === 'true' && (
                            <button 
                                onClick={() => syncQuickBooksMutation.mutate()}
                                disabled={syncQuickBooksMutation.isPending || order.tags?.includes('QuickBooks Synced')}
                                className={cn(
                                    "px-5 py-2 rounded-xl transition-all font-bold text-[13px] shadow-sm flex items-center gap-1.5",
                                    order.tags?.includes('QuickBooks Synced')
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed"
                                        : "bg-card border border-border hover:bg-muted text-foreground/80"
                                )}
                            >
                                {syncQuickBooksMutation.isPending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                                )}
                                {order.tags?.includes('QuickBooks Synced') ? 'Synced to QuickBooks' : 'Sync to QuickBooks'}
                            </button>
                        )}
                        <button 
                            onClick={() => sendToVendorMutation.mutate()}
                            disabled={sendToVendorMutation.isPending}
                            className="px-5 py-2 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all font-bold text-[13px] text-indigo-700 shadow-sm flex items-center gap-1.5"
                        >
                            {sendToVendorMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
                            )}
                            Send to Vendor
                        </button>
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="px-5 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-all font-bold text-[13px] text-foreground/80 shadow-sm flex items-center gap-1.5"
                        >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            Edit
                        </button>
                        {/* Decline + Approve: visible only when PO is in DRAFT or PENDING_APPROVAL status */}
                        {(order.status === 'DRAFT' || order.status === 'PENDING_APPROVAL') && (
                            <>
                                <button 
                                    onClick={() => denyMutation.mutate()}
                                    disabled={denyMutation.isPending || approveMutation.isPending}
                                    className="px-5 py-2 bg-[#C4314B] text-white rounded-xl hover:bg-[#a8293f] active:scale-[0.97] transition-all font-bold text-[13px] shadow-sm shadow-rose-500/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {denyMutation.isPending 
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> 
                                        : null
                                    }
                                    Decline
                                </button>
                                <button 
                                    onClick={() => approveMutation.mutate()}
                                    disabled={approveMutation.isPending || denyMutation.isPending}
                                    className="px-5 py-2 bg-[#4F6FF5] text-white rounded-xl hover:bg-[#3a5ae0] active:scale-[0.97] transition-all font-bold text-[13px] shadow-sm shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {approveMutation.isPending 
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> 
                                        : null
                                    }
                                    Approve
                                </button>
                            </>
                        )}
                        {/* Fulfill PO Action: visible when APPROVED or ORDERED and has unfulfilled items */}
                        {(order.status === 'APPROVED' || order.status === 'ORDERED') && order.items?.some((i: any) => (i.fulfilledQuantity || 0) < i.quantity) && (
                            <button 
                                onClick={() => setIsFulfillModalOpen(true)}
                                className="px-5 py-2 bg-[#4F7CFF] text-white rounded-xl hover:bg-indigo-700 active:scale-[0.97] transition-all font-bold text-[13px] shadow-sm shadow-indigo-500/20 flex items-center gap-2"
                            >
                                <Truck className="w-4 h-4" />
                                Fulfill
                            </button>
                        )}
                        <div className="relative">
                            <button 
                                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                                className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                            <AnimatePresence>
                                {showOptionsDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowOptionsDropdown(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-52 bg-card rounded-xl shadow-lg border border-border py-2 z-50 overflow-hidden"
                                        >
                                            <button 
                                                onClick={() => {
                                                    setShowOptionsDropdown(false);
                                                    window.print();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground/80 hover:bg-muted transition-colors"
                                            >
                                                <Printer className="w-4 h-4 text-slate-400" />
                                                Print details
                                            </button>
                                            {(order.status === 'DRAFT' || order.status === 'PENDING_APPROVAL') && (
                                                <button 
                                                    onClick={() => {
                                                        setShowOptionsDropdown(false);
                                                        if (window.confirm('Are you sure you want to cancel this PO?')) {
                                                            deleteMutation.mutate();
                                                        }
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-border"
                                                >
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                    Cancel Purchase Order
                                                </button>
                                            )}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Subheader Navigation Tabs */}
                <div className="bg-card px-8 border-b border-border flex items-center shrink-0">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 px-2 text-[14px] font-bold border-b-[3px] transition-all relative ${activeTab === 'details' ? 'border-primary text-primary font-extrabold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`py-4 px-2 ml-8 text-[14px] font-bold border-b-[3px] transition-all relative ${activeTab === 'activity' ? 'border-primary text-primary font-extrabold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Activity
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`py-4 px-2 ml-8 text-[14px] font-bold border-b-[3px] transition-all relative ${activeTab === 'files' ? 'border-primary text-primary font-extrabold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        Files
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'details' ? (
                            <motion.div 
                                key="details"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex overflow-hidden"
                            >
                                {/* Left Main Column (65% width) */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                    {/* Items Table Card */}
                                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-muted/50 border-b border-border">
                                                        <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Item</th>
                                                        <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Part Number</th>
                                                        <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Cost</th>
                                                        <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                                                        <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Received</th>
                                                        <th className="px-6 py-4 text-[12px] font-bold text-muted-foreground uppercase tracking-wider text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/60 text-[14px]">
                                                    {order.items && order.items.length > 0 ? (
                                                        order.items.map((item: any) => (
                                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="font-bold text-indigo-600 hover:underline cursor-pointer">
                                                                        {item.part?.name || 'Unknown Item'}
                                                                    </div>
                                                                    <div className="text-[12px] text-slate-400 mt-0.5">
                                                                        {item.part?.description || 'No description provided.'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-foreground/70 font-medium">{item.part?.partNumber || 'Default-p1'}</td>
                                                                <td className="px-6 py-4 text-foreground font-medium">{formatCurrency(item.unitCost)}</td>
                                                                <td className="px-6 py-4 text-foreground/70 font-medium">{item.quantity}</td>
                                                                <td className="px-6 py-4 text-foreground/70 font-medium">{item.fulfilledQuantity || 0}</td>
                                                                <td className="px-6 py-4 text-foreground font-bold text-right">{formatCurrency(item.quantity * item.unitCost)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic font-medium">
                                                                No line items added to this purchase order.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Financial Breakdown Section */}
                                        <div className="p-6 border-t border-border bg-muted/20 flex justify-end">
                                            <div className="w-[320px] space-y-3.5 text-[14px]">
                                                <div className="flex justify-between items-center text-muted-foreground">
                                                    <span className="font-medium">Subtotal</span>
                                                    <span className="font-bold text-foreground/80">{formatCurrency(subtotal)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-muted-foreground">
                                                    <span className="font-medium">Taxes</span>
                                                    <span className="font-bold text-foreground/80">{formatCurrency(taxAmount)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-muted-foreground">
                                                    <span className="font-medium">Shipping</span>
                                                    <span className="font-bold text-foreground/80">{formatCurrency(shippingCost)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-muted-foreground">
                                                    <span className="font-medium">Other Costs</span>
                                                    <span className="font-bold text-foreground/80">{formatCurrency(otherCosts)}</span>
                                                </div>
                                                <div className="h-px bg-border my-2" />
                                                <div className="flex justify-between items-center text-foreground font-extrabold text-[15px]">
                                                    <span>Total</span>
                                                    <span className="text-foreground">{formatCurrency(totalCost)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Information Card */}
                                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-6 space-y-5">
                                        <h3 className="text-[15px] font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            Shipping Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6 text-[14px]">
                                            <div className="space-y-1">
                                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block">Company Name</span>
                                                <span className="font-bold text-foreground">{shippingDetails.companyName}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block">Phone Number</span>
                                                <span className="font-medium text-foreground/70">{shippingDetails.phone}</span>
                                            </div>
                                            <div className="space-y-1 col-span-2">
                                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block">Address</span>
                                                <span className="font-medium text-foreground/70 leading-relaxed">
                                                    {shippingDetails.address}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block">Fax</span>
                                                <span className="font-medium text-muted-foreground">{shippingDetails.fax}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Details Card */}
                                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-6 space-y-5">
                                        <h3 className="text-[15px] font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                            Additional Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6 text-[14px]">
                                            <div className="space-y-1">
                                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block">Purchase Date</span>
                                                <span className="font-bold text-foreground">{formatDate(order.purchaseDate || order.createdAt)}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block">Shipping Method</span>
                                                <span className="font-medium text-foreground/70">{order.shippingMethod || '3 day ground'}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block">Terms</span>
                                                <span className="font-medium text-foreground/70">{order.terms || 'Prepay'}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block">F.O.B. Shipping Point</span>
                                                <span className="font-medium text-foreground/70">{order.fob || 'None'}</span>
                                            </div>
                                            <div className="space-y-1 col-span-2">
                                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block">Notes</span>
                                                <span className="font-medium text-foreground/70 leading-relaxed">
                                                    {order.notes || 'Use corporate account'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Persistent Sidebar (35% width) */}
                                <div className="w-[380px] bg-card border-l border-border overflow-y-auto p-8 shrink-0 space-y-8 select-none custom-scrollbar">
                                    {/* Sidebar Card 1: Details */}
                                    <div className="space-y-5">
                                        <h3 className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border pb-2.5">
                                            Details
                                        </h3>
                                        <div className="space-y-5 text-[14px]">
                                            <div className="space-y-1.5">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Status</span>
                                                <span className="block">{getStatusBadge(order.status)}</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Vendor</span>
                                                <span className="font-bold text-primary hover:underline cursor-pointer block">
                                                    {order.vendor?.name || 'McMaster-Carr'}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Due Date</span>
                                                <span className="font-bold text-foreground block">
                                                    {formatDate(order.expectedDeliveryDate)}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Added By</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground font-bold text-[10px] flex items-center justify-center border border-border">
                                                        {order.user?.name?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="font-bold text-foreground">{order.user?.name || 'User'}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Date Added</span>
                                                <span className="font-medium text-foreground/70 block">
                                                    {formatDate(order.createdAt)}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Cost</span>
                                                <span className="font-extrabold text-foreground block">
                                                    {formatCurrency(totalCost)}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Category</span>
                                                <span className="font-medium text-foreground/70 block">
                                                    {order.type || 'None'}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Additional Details</span>
                                                <span className="font-medium text-foreground/70 block leading-relaxed">
                                                    {order.additionalDetails || 'No additional details provided.'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar Card 2: Requester Information */}
                                    <div className="space-y-5 border-t border-border pt-6">
                                        <h3 className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border pb-2.5">
                                            Requester Information
                                        </h3>
                                        <div className="space-y-5 text-[14px]">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Requisitioner</span>
                                                <span className="font-bold text-foreground block">{order.shippingUserName || requisitionerName}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Company Name</span>
                                                <span className="font-medium text-foreground/70 block">{billingDetails.companyName}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Address</span>
                                                <span className="font-medium text-muted-foreground block leading-relaxed">
                                                    {billingDetails.address}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Phone Number</span>
                                                <span className="font-medium text-foreground/70 block">{billingDetails.phone}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Fax</span>
                                                <span className="font-medium text-muted-foreground block">{billingDetails.fax}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : activeTab === 'activity' ? (
                            /* Timeline view under Activity tab */
                            <motion.div 
                                key="activity"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex-1 overflow-y-auto p-12 bg-background custom-scrollbar space-y-6"
                            >
                                <div className="max-w-[700px] space-y-6">
                                    <h3 className="text-[16px] font-bold text-foreground flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-muted-foreground" />
                                        Procurement Lifecycle Activities
                                    </h3>
                                    
                                    <div className="space-y-8 pl-6 border-l-2 border-border relative mt-6">
                                        {/* Activity: Created */}
                                        <div className="relative">
                                            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-background flex items-center justify-center shadow-sm" />
                                            <div className="space-y-1">
                                                <p className="text-[14px] font-bold text-foreground">ORDER CREATED</p>
                                                <p className="text-[12px] text-muted-foreground">Order successfully initiated by {order.user?.name || 'User'}.</p>
                                                <p className="text-[11px] text-muted-foreground font-medium">{formatDate(order.createdAt)}</p>
                                            </div>
                                        </div>

                                        {/* Activity: Approved */}
                                        {(order.status === 'APPROVED' || order.status === 'ORDERED' || order.status === 'RECEIVED') && (
                                            <div className="relative">
                                                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-background flex items-center justify-center shadow-sm" />
                                                <div className="space-y-1">
                                                    <p className="text-[14px] font-bold text-foreground">ORDER APPROVED</p>
                                                    <p className="text-[12px] text-muted-foreground">Authorization verified by administration.</p>
                                                    <p className="text-[11px] text-muted-foreground font-medium">{formatDate(order.updatedAt)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Activity: Dispatched */}
                                        {(order.status === 'ORDERED' || order.status === 'RECEIVED') && (
                                            <div className="relative">
                                                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-background flex items-center justify-center shadow-sm" />
                                                <div className="space-y-1">
                                                    <p className="text-[14px] font-bold text-foreground">DISPATCHED TO VENDOR</p>
                                                    <p className="text-[12px] text-muted-foreground">Logistics dispatch sent to {order.vendor?.name || 'Vendor'}.</p>
                                                    <p className="text-[11px] text-muted-foreground font-medium">{formatDate(order.updatedAt)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Activity: Received */}
                                        {order.status === 'RECEIVED' && (
                                            <div className="relative">
                                                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-background flex items-center justify-center shadow-sm" />
                                                <div className="space-y-1">
                                                    <p className="text-[14px] font-bold text-foreground">WAREHOUSE STAGING COMPLETE</p>
                                                    <p className="text-[12px] text-muted-foreground">All purchased items marked received and inventory catalog quantities updated successfully.</p>
                                                    <p className="text-[11px] text-muted-foreground font-medium">{formatDate(order.updatedAt)}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Activity: Declined */}
                                        {order.status === 'DENIED' && (
                                            <div className="relative">
                                                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-destructive border-4 border-background flex items-center justify-center shadow-sm" />
                                                <div className="space-y-1">
                                                    <p className="text-[14px] font-bold text-foreground">ORDER DECLINED</p>
                                                    <p className="text-[12px] text-muted-foreground">Authorization declined during procurement validation.</p>
                                                    <p className="text-[11px] text-muted-foreground font-medium">{formatDate(order.updatedAt)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* File upload and lists under Files tab */
                            <motion.div 
                                key="files"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex-1 overflow-y-auto p-12 bg-background custom-scrollbar space-y-8"
                            >
                                <div className="max-w-[700px] space-y-6">
                                    <h3 className="text-[16px] font-bold text-foreground flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                        Attached Documentation
                                    </h3>

                                    <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[14px] font-bold text-foreground/80">Upload or drag and drop order files</p>
                                            <p className="text-[11px] text-muted-foreground mt-1">PDF, Excel, Images accepted • Max 50MB</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">File Attachments</h4>
                                        <div className="p-4 rounded-xl border border-border flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-foreground">purchase-order-details.pdf</p>
                                                    <p className="text-[11px] text-slate-400">1.4 MB • Generated on creation</p>
                                                </div>
                                            </div>
                                            <button className="text-[12px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Edit PO Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <POModal 
                        initialData={order} 
                        onClose={() => setIsEditModalOpen(false)} 
                    />
                )}
            </AnimatePresence>

            {/* Fulfill PO Modal */}
            <AnimatePresence>
                {isFulfillModalOpen && (
                    <FulfillModal
                        isOpen={isFulfillModalOpen}
                        onClose={() => setIsFulfillModalOpen(false)}
                        order={order}
                        onFulfill={(items: any) => {
                            receiveMutation.mutate(items);
                            setIsFulfillModalOpen(false);
                        }}
                        isPending={receiveMutation.isPending}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
