import { useState, useRef } from 'react';
import {
    X,
    Package,
    MapPin,
    Box,
    Info,
    Search,
    Wrench,
    FileText,
    Files,
    Trash2,
    MoreHorizontal,
    ChevronDown,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Plus
} from 'lucide-react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { AddSavedFileModal } from './AddSavedFileModal';
import { EditPartModal } from './EditPartModal';
import { useDeletePart } from '../hooks/useParts';
import toast from 'react-hot-toast';
import { useAssetSettings } from '../hooks/useAssetSettings';

interface PartInspectorProps {
    part: any;
    onClose: () => void;
    onIssuePO?: (part: any) => void;
}

type TabType = 'inventory' | 'details' | 'purchase-history' | 'work-orders' | 'assets' | 'files' | 'adjustments';

export const PartInspector = ({ part, onClose }: PartInspectorProps) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabType>('inventory');
    
    const { settings } = useAssetSettings('PART');
    const isPurchaseHistoryEnabled = (settings.data || []).find((s: any) => s.key === 'parts.purchaseHistory')?.value === 'true';

    const { data: purchaseHistoryData } = useQuery({
        queryKey: ['parts', part.id, 'purchase-history'],
        queryFn: async () => {
            const response = await api.get(`/parts/${part.id}/purchase-history`);
            return response.data;
        },
        enabled: isPurchaseHistoryEnabled
    });
    const [isWoLineSelectorOpen, setIsWoLineSelectorOpen] = useState(false);
    const [woLineSearchQuery, setWoLineSearchQuery] = useState('');
    const [selectedWoLineId, setSelectedWoLineId] = useState<string | null>(null);
    const [showSavedFilesModal, setShowSavedFilesModal] = useState(false);
    const [isQrMenuOpen, setIsQrMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustFormData, setAdjustFormData] = useState({
        quantity: 1,
        type: 'RESTOCK',
        direction: 'add',
        notes: ''
    });

    const deletePartMutation = useDeletePart();

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

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
            deletePartMutation.mutate(displayPart.id, {
                onSuccess: () => {
                    toast.success('Part deleted successfully');
                    onClose();
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.message || 'Failed to delete part');
                }
            });
        }
    };

    // Deep Fetch for Detail Integrity
    const { data: freshPart, isLoading: isFreshLoading } = useQuery({
        queryKey: ['parts', part.id],
        queryFn: async () => {
            const response = await api.get(`/parts/${part.id}`);
            return response.data;
        }
    });

    // Use fresh data if available
    const displayPart = freshPart || part;

    const [showAddLine, setShowAddLine] = useState(false);
    const [lineFormData, setLineFormData] = useState({
        locationId: '',
        area: '',
        availableQty: 0,
        minQty: '' as string | number,
        maxQty: '' as string | number,
        barcode: '',
        cost: 0
    });


    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const response = await api.get('/locations');
            return response.data;
        }
    });

    const { data: transactions, isLoading: isTxLoading } = useQuery({
        queryKey: ['parts', displayPart.id, 'transactions'],
        queryFn: async () => {
            const response = await api.get(`/parts/${displayPart.id}/transactions`);
            return response.data;
        },
        enabled: activeTab === 'adjustments'
    });

    const adjustStockMutation = useMutation({
        mutationFn: async (data: any) => {
            const finalQuantity = data.direction === 'remove' ? -Math.abs(data.quantity) : Math.abs(data.quantity);
            return api.post(`/parts/${displayPart.id}/adjust`, {
                quantity: finalQuantity,
                type: data.type,
                notes: data.notes
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parts', displayPart.id] });
            queryClient.invalidateQueries({ queryKey: ['parts', displayPart.id, 'transactions'] });
            toast.success('Stock adjusted successfully');
            setShowAdjustModal(false);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to adjust stock');
        }
    });

    const addLineMutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                locationId: data.locationId,
                area: data.area || undefined,
                availableQty: Number(data.availableQty) || 0,
                minQty: data.minQty !== '' ? Number(data.minQty) : undefined,
                maxQty: data.maxQty !== '' ? Number(data.maxQty) : undefined,
                barcode: data.barcode || undefined,
                cost: Number(data.cost) || 0
            };
            return api.post(`/parts/${displayPart.id}/inventory-lines`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parts', displayPart.id] });
            setShowAddLine(false);
            setLineFormData({
                locationId: '',
                area: '',
                availableQty: 0,
                minQty: '',
                maxQty: '',
                barcode: '',
                cost: 0
            });
        }
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFileMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return api.post(`/parts/${displayPart.id}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parts', displayPart.id] });
        }
    });

    const removeFileMutation = useMutation({
        mutationFn: async (fileId: string) => {
            return api.delete(`/parts/files/${fileId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parts', displayPart.id] });
        }
    });

    const tabs = [
        { id: 'inventory' as const, label: 'Inventory', icon: Box },
        { id: 'details' as const, label: 'Details', icon: Info },
        ...(isPurchaseHistoryEnabled ? [{ id: 'purchase-history' as const, label: 'Purchase History', icon: History }] : []),
        { id: 'work-orders' as const, label: 'Work Orders', icon: Wrench },
        { id: 'assets' as const, label: 'Assets', icon: Package },
        { id: 'files' as const, label: 'Files', icon: Files },
        { id: 'adjustments' as const, label: 'Adjustments', icon: MapPin },
    ];

    const inventoryLines = displayPart.inventoryLines?.length > 0 
        ? displayPart.inventoryLines 
        : [{
            id: 'legacy',
            location: displayPart.location,
            area: displayPart.binLocation,
            availableQty: displayPart.quantity,
            allocatedQty: 0,
            onhandQty: displayPart.quantity,
            minQty: displayPart.minQuantity,
            maxQty: displayPart.maxQuantity,
            barcode: displayPart.barcode,
            cost: displayPart.cost
        }];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-8"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-[1240px] h-full max-h-[900px] bg-[#F8F9FA] rounded-[2.5rem] shadow-[0_32px_120px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border border-white/20"
            >
                {/* Immersive Header Hub */}
                <div className="bg-white px-8 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {/* Sidebar Split-Pane toggle button icon */}
                            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
                            </button>
                            {/* Back arrow */}
                            <button 
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                            </button>
                        </div>
                        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">{displayPart.name}</h2>
                    </div>

                    <div className="flex items-center gap-2 relative">
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="px-5 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-bold text-[13px] text-slate-700 shadow-sm"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 5, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-100"
                                >
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            handleDelete();
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Part
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Main Column */}
                    <div className="flex-1 flex flex-col border-r border-slate-100 overflow-hidden bg-[#F8F9FA]">
                        {/* Tactical Navigation Sub-Header */}
                        <div className="bg-white px-8 flex items-center justify-between shrink-0 border-b border-slate-100">
                            <div className="flex items-center gap-6 h-full">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "py-4 text-[13px] font-bold transition-all relative flex items-center",
                                            activeTab === tab.id 
                                                ? "text-blue-500" 
                                                : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <motion.div 
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <button 
                                    onClick={() => setIsQrMenuOpen(!isQrMenuOpen)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group",
                                        isQrMenuOpen ? "bg-[#E2E8F0] text-slate-900" : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                                    )}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn(
                                        isQrMenuOpen ? "text-slate-900" : "text-slate-400 group-hover:text-slate-700"
                                    )}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                    <span className="text-[13px] font-black">QR Code</span>
                                </button>

                                <AnimatePresence>
                                    {isQrMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 5, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-[0_12px_44px_-10px_rgba(0,0,0,0.15)] border border-slate-100 p-8 z-50 flex flex-col items-center w-[260px]"
                                        >
                                            <div className="mb-6 bg-white p-1">
                                                 <QRCodeSVG value={displayPart.barcode || displayPart.id || 'N/A'} size={140} level="H" />
                                            </div>
                                            <p className="text-[14px] font-medium text-slate-500 text-center leading-relaxed">
                                                Scan this QR code with the {companyName} app.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* View Engine Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <AnimatePresence mode="wait">
                                {activeTab === 'inventory' && (
                                    <motion.div 
                                        key="inventory"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-8 p-4"
                                    >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[14px] font-bold text-slate-900">{inventoryLines.length} Inventory Lines</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        <span className="text-[14px] font-medium text-slate-500">
                                            Total Available <span className="font-black text-slate-900 ml-1">
                                                {inventoryLines.reduce((acc: number, line: any) => acc + Number(line.availableQty || 0), 0).toFixed(2)}
                                            </span>
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => setShowAddLine(true)}
                                        className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm uppercase tracking-widest"
                                    >
                                        Add Inventory Line
                                    </button>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-separate min-w-[1300px]" style={{ borderSpacing: 0 }}>
                                            <thead>
                                                <tr className="bg-slate-50/40 border-b border-slate-100">
                                                    <th className="py-5 px-8 text-[14px] font-extrabold text-slate-700 sticky left-0 bg-[#F8F9FA] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-b border-slate-100">Location</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 border-b border-slate-100">Area</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 border-b border-slate-100">Status</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 text-center border-b border-slate-100">Available Qty</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 text-center border-b border-slate-100">Allocated Qty</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 text-center border-b border-slate-100">On Hand Qty</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 text-center border-b border-slate-100">Minimum Qty</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 text-center border-b border-slate-100">Maximum Qty</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 border-b border-slate-100">Barcode</th>
                                                    <th className="py-5 px-8 text-[14px] font-extrabold text-slate-700 text-center border-b border-slate-100">Cost</th>
                                                    <th className="py-5 px-6 text-[14px] font-extrabold text-slate-700 sticky right-0 bg-[#F8F9FA] z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] border-b border-slate-100 w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {inventoryLines.map((line: any) => {
                                                    const available = Number(line.availableQty || 0);
                                                    const allocated = Number(displayPart.allocatedQuantity || 0);
                                                    const onHand = available + allocated;
                                                    const minQty = line.minQty !== undefined && line.minQty !== null ? line.minQty : (displayPart.minQuantity !== undefined ? displayPart.minQuantity : 5);
                                                    const maxQty = line.maxQty !== undefined && line.maxQty !== null ? line.maxQty : (displayPart.maxQuantity || '-');
                                                    const cost = Number(line.cost || displayPart.cost || 0);
                                                    const barcode = line.barcode || displayPart.barcode || '-';
                                                    const statusText = displayPart.status || (available > (displayPart.minQuantity || 5) ? 'Non-stock' : 'Low stock');

                                                    return (
                                                        <tr key={line.id} className="hover:bg-slate-50/20 transition-colors group">
                                                            <td className="py-6 px-8 font-bold text-[14px] text-slate-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-b border-slate-100">
                                                                {line.location?.name || '---'}
                                                            </td>
                                                            <td className="py-6 px-4 text-[14px] text-slate-500 font-semibold border-b border-slate-100">
                                                                {line.area || '---'}
                                                            </td>
                                                            <td className="py-6 px-4 border-b border-slate-100">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-bold bg-slate-100/70 text-slate-600">
                                                                    {statusText}
                                                                </span>
                                                            </td>
                                                            <td className="py-6 px-4 text-center font-bold text-slate-800 text-[14px] border-b border-slate-100">
                                                                {available.toFixed(2)}
                                                            </td>
                                                            <td className="py-6 px-4 text-center text-slate-500 font-semibold text-[14px] border-b border-slate-100">
                                                                {allocated.toFixed(2)}
                                                            </td>
                                                            <td className="py-6 px-4 text-center font-bold text-slate-800 text-[14px] border-b border-slate-100">
                                                                {onHand.toFixed(2)}
                                                            </td>
                                                            <td className="py-6 px-4 text-center text-slate-500 font-semibold text-[14px] border-b border-slate-100">
                                                                {minQty}
                                                            </td>
                                                            <td className="py-6 px-4 text-center text-slate-500 font-semibold text-[14px] border-b border-slate-100">
                                                                {maxQty}
                                                            </td>
                                                            <td className="py-6 px-4 font-mono text-[13px] text-slate-600 border-b border-slate-100">
                                                                <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors">
                                                                    <span>{barcode}</span>
                                                                    {barcode !== '-' && (
                                                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-6 px-8 text-center font-bold text-slate-800 text-[14px] border-b border-slate-100">
                                                                ${cost.toFixed(2)}
                                                            </td>
                                                            <td className="py-6 px-6 sticky right-0 bg-white z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] text-center border-b border-slate-100">
                                                                <button className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600">
                                                                    <MoreHorizontal className="w-5 h-5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'details' && (
                            <motion.div 
                                key="details"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6 pt-2"
                            >
                                {/* Group 1: Details */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                                    <h3 className="text-[15px] font-black text-slate-900 mb-6">Details</h3>
                                    <div className="space-y-0">
                                        {[
                                            { label: 'Name', value: displayPart.name },
                                            { label: 'Part Number', value: displayPart.partNumber || 'Default-p2' },
                                            { label: 'Description', value: displayPart.description || 'None' },
                                            { label: 'Category', value: displayPart.categoryRef?.name || displayPart.category || 'None' },
                                            { label: 'Cost', value: displayPart.cost ? `$${Number(displayPart.cost).toFixed(2)}` : 'None' },
                                            ...(isPurchaseHistoryEnabled && purchaseHistoryData?.averageCost ? [
                                                { label: 'Average Purchase Cost', value: `$${Number(purchaseHistoryData.averageCost).toFixed(2)}` }
                                            ] : []),
                                            { label: 'Barcode', value: displayPart.barcode || 'None' },
                                        ].map((item, i) => (
                                            <div key={i} className="py-4 border-t border-slate-100 flex items-center">
                                                <span className="w-48 text-[13px] font-medium text-slate-400 shrink-0">{item.label}</span>
                                                <span className="text-[13px] font-medium text-slate-700 leading-relaxed">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Group 2: More Information */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                                    <h3 className="text-[15px] font-black text-slate-900 mb-6">More Information</h3>
                                    <div className="space-y-0">
                                        {[
                                            { label: 'Vendors', value: displayPart.vendor?.name || 'None' },
                                            { label: 'Customers', value: displayPart.customer?.name || 'None' },
                                            { label: 'Additional Info', value: displayPart.additionalInfo || 'None' },
                                        ].map((item, i) => (
                                            <div key={i} className="py-4 border-t border-slate-100 flex items-center">
                                                <span className="w-48 text-[13px] font-medium text-slate-400 shrink-0">{item.label}</span>
                                                <span className="text-[13px] font-medium text-slate-700 leading-relaxed">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'purchase-history' && (
                            <motion.div 
                                key="purchase-history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6 pt-2"
                            >
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                        <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Average Purchase Cost</span>
                                        <span className="text-[28px] font-black text-slate-800 mt-2">
                                            {purchaseHistoryData?.averageCost 
                                                ? `$${Number(purchaseHistoryData.averageCost).toFixed(2)}` 
                                                : 'N/A'}
                                        </span>
                                        <p className="text-[12px] text-slate-400 mt-2 leading-relaxed">
                                            Calculated dynamically based on historical received purchase orders.
                                        </p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                        <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Total Purchases</span>
                                        <span className="text-[28px] font-black text-slate-800 mt-2">
                                            {purchaseHistoryData?.history?.length || 0} Orders
                                        </span>
                                        <p className="text-[12px] text-slate-400 mt-2 leading-relaxed">
                                            Total volume of orders processed.
                                        </p>
                                    </div>
                                </div>

                                {/* Purchase History Table */}
                                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-separate" style={{ borderSpacing: 0 }}>
                                            <thead>
                                                <tr className="bg-slate-50/40 border-b border-slate-100">
                                                    <th className="py-5 px-8 text-[14px] font-extrabold text-slate-700 border-b border-slate-100">PO Number</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 border-b border-slate-100">Date Received</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 border-b border-slate-100">Vendor</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 text-center border-b border-slate-100">Quantity</th>
                                                    <th className="py-5 px-4 text-[14px] font-extrabold text-slate-700 text-right border-b border-slate-100">Unit Cost</th>
                                                    <th className="py-5 px-8 text-[14px] font-extrabold text-slate-700 text-right border-b border-slate-100">Total Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {purchaseHistoryData?.history && purchaseHistoryData.history.length > 0 ? (
                                                    purchaseHistoryData.history.map((record: any) => (
                                                        <tr key={record.id} className="hover:bg-slate-50/40 transition-colors">
                                                            <td className="py-4 px-8 text-[13px] font-bold text-slate-900 border-b border-slate-100">
                                                                #{record.poNumber}
                                                            </td>
                                                            <td className="py-4 px-4 text-[13px] font-medium text-slate-500 border-b border-slate-100">
                                                                {format(new Date(record.date), 'MMM dd, yyyy')}
                                                            </td>
                                                            <td className="py-4 px-4 text-[13px] font-bold text-slate-700 border-b border-slate-100">
                                                                {record.vendorName}
                                                            </td>
                                                            <td className="py-4 px-4 text-[13px] font-black text-slate-800 text-center border-b border-slate-100">
                                                                {record.quantity}
                                                            </td>
                                                            <td className="py-4 px-4 text-[13px] font-bold text-slate-700 text-right border-b border-slate-100">
                                                                ${Number(record.unitCost).toFixed(2)}
                                                            </td>
                                                            <td className="py-4 px-8 text-[13px] font-black text-slate-800 text-right border-b border-slate-100">
                                                                ${Number(record.total).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="py-12 text-center text-[14px] font-medium text-slate-400">
                                                            No purchase history records found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'work-orders' && (
                            <motion.div 
                                key="work-orders"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full flex flex-col relative"
                            >
                                <div className="p-2">
                                    <div className="relative inline-block">
                                        <button 
                                            onClick={() => setIsWoLineSelectorOpen(!isWoLineSelectorOpen)}
                                            className="h-9 px-4 flex items-center gap-4 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:border-slate-300 transition-all shadow-sm"
                                        >
                                            <span className="text-slate-900 font-bold">Inventory Line:</span> 
                                            <span className="font-medium text-slate-500 w-20 text-left truncate">{inventoryLines.find((l:any) => l.id === selectedWoLineId)?.location?.name || 'Suite B'}</span>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 ml-2"><path d="m6 9 6 6 6-6"/></svg>
                                        </button>
                                        
                                        <AnimatePresence>
                                            {isWoLineSelectorOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 5, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute top-full left-0 w-[240px] bg-white rounded-xl shadow-[0_12px_44px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-50 p-2 mt-1"
                                                >
                                                    <div className="relative mb-2">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input 
                                                            type="text"
                                                            placeholder="Search"
                                                            value={woLineSearchQuery}
                                                            onChange={(e) => setWoLineSearchQuery(e.target.value)}
                                                            className="w-full h-9 pl-9 pr-3 bg-blue-50/30 border border-blue-200 rounded-lg text-[13px] font-medium text-slate-900 focus:outline-none focus:border-blue-400 transition-all placeholder:text-slate-400"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        {[{id: null, name: 'Suite B'}, ...inventoryLines.map((l:any) => ({id: l.id, name: l.location?.name || l.area}))].map(opt => (
                                                            <button
                                                                key={opt.id || 'default'}
                                                                onClick={() => {
                                                                    setSelectedWoLineId(opt.id);
                                                                    setIsWoLineSelectorOpen(false);
                                                                }}
                                                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-lg text-left group"
                                                            >
                                                                <span className="text-[13px] font-bold text-slate-700">{opt.name}</span>
                                                                {(selectedWoLineId === opt.id || (!selectedWoLineId && !opt.id)) && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M20 6 9 17l-5-5"/></svg>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center -mt-20">
                                    <p className="text-[13px] font-bold text-slate-700">No work orders with this part yet</p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'assets' && (
                            <motion.div 
                                key="assets"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full flex flex-col pt-2"
                            >
                                {displayPart.assetParts?.length > 0 ? (
                                    <div className="space-y-4 px-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[14px] font-black text-slate-900">Linked Assets</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {displayPart.assetParts.map((ap: any) => (
                                                <div key={ap.id || ap.asset.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex items-start gap-4 hover:border-slate-300 transition-colors shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)]">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                                                        <Package className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="text-[14px] font-black text-slate-900 line-clamp-1">{ap.asset.name}</h4>
                                                        {ap.asset.location && (
                                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                <span className="text-[12px] font-bold truncate">{ap.asset.location.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors mt-0.5">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                            <Package className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-[15px] font-black text-slate-900 mb-2">No Assets Linked</h3>
                                        <p className="text-[13px] font-medium text-slate-500 max-w-[250px]">
                                            This part is not linked to any asset yet. Edit the part to map it to equipment.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'files' && (
                            <motion.div 
                                key="files"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full flex flex-col space-y-6 pt-2"
                            >
                                <div className="flex items-center justify-between pb-6 border-b border-slate-100 px-2">
                                    <span className="text-[13px] font-bold text-slate-700">{displayPart.attachments?.length || 0} Files</span>
                                    <button 
                                        onClick={() => setShowSavedFilesModal(true)}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Add from Saved Files
                                    </button>
                                </div>

                                <div className="mx-2">
                                    <div className="border border-dashed border-slate-300 rounded-[12px] bg-white py-5 flex items-center justify-center transition-colors">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-6 py-2 bg-white shadow-sm border border-slate-200 text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition-colors rounded-lg"
                                            >
                                                Upload
                                            </button>
                                            <span className="text-[13px] text-slate-400 font-medium">or Drop Files</span>
                                        </div>
                                    </div>
                                    <p className="text-[12px] text-slate-400 mt-2 font-bold">Max: 200MB · Videos up to 150MB</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) uploadFileMutation.mutate(e.target.files[0]);
                                    }} 
                                    className="hidden" 
                                />

                                {displayPart.attachments?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                                        {displayPart.attachments.map((file: any) => (
                                            <div key={file.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-bold text-slate-900 truncate">{file.name || 'Document'}</span>
                                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{file.size ? (file.size / 1024 / 1024).toFixed(2) : '0.00'} MB</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => removeFileMutation.mutate(file.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-20 -mt-8">
                                        <p className="text-[13px] font-bold text-slate-700">No files added yet</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                        {activeTab === 'adjustments' && (
                            <motion.div 
                                key="adjustments"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full flex flex-col relative pt-2"
                            >
                                <div className="p-2 flex items-center justify-between pb-6 border-b border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <History className="w-5 h-5 text-slate-400" />
                                        <span className="text-[14px] font-bold text-slate-900">
                                            {transactions?.length || 0} Adjustments Logged
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setAdjustFormData({
                                                quantity: 1,
                                                type: 'RESTOCK',
                                                direction: 'add',
                                                notes: ''
                                            });
                                            setShowAdjustModal(true);
                                        }}
                                        className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[12px] font-bold transition-all shadow-md shadow-blue-500/10 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Adjust Stock
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
                                    {isTxLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading Adjustments...</p>
                                        </div>
                                    ) : !transactions || transactions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 text-slate-400">
                                                <History className="w-6 h-6" />
                                            </div>
                                            <p className="text-[14px] font-black text-slate-950 mb-1">No manual adjustments yet</p>
                                            <p className="text-[12px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                                                Perform a stock adjustment to track increases, consumption, audits, or shrinkage.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto custom-scrollbar">
                                                <table className="w-full text-left border-separate" style={{ borderSpacing: 0 }}>
                                                    <thead>
                                                        <tr className="bg-slate-50/40 border-b border-slate-100">
                                                            <th className="py-4 px-6 text-[13px] font-extrabold text-slate-700 border-b border-slate-100">Date</th>
                                                            <th className="py-4 px-6 text-[13px] font-extrabold text-slate-700 border-b border-slate-100">Type</th>
                                                            <th className="py-4 px-6 text-[13px] font-extrabold text-slate-700 text-center border-b border-slate-100">Adjustment</th>
                                                            <th className="py-4 px-6 text-[13px] font-extrabold text-slate-700 border-b border-slate-100">Adjusted By</th>
                                                            <th className="py-4 px-6 text-[13px] font-extrabold text-slate-700 border-b border-slate-100">Notes</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 bg-white">
                                                        {transactions.map((tx: any) => {
                                                            const isPositive = tx.quantity > 0;
                                                            const qtyFormatted = `${isPositive ? '+' : ''}${tx.quantity}`;
                                                            const typeStyles: Record<string, string> = {
                                                                RESTOCK: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                                                                CONSUME: 'bg-amber-50 text-amber-700 border border-amber-100',
                                                                RETURN: 'bg-blue-50 text-blue-700 border border-blue-100',
                                                                AUDIT: 'bg-slate-50 text-slate-700 border border-slate-100',
                                                                SHRINKAGE: 'bg-rose-50 text-rose-700 border border-rose-100',
                                                            };
                                                            const userDisplayName = tx.user?.user 
                                                                ? `${tx.user.user.firstName || ''} ${tx.user.user.lastName || ''}`.trim() || tx.user.user.name || tx.user.user.email
                                                                : 'System';

                                                            return (
                                                                <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                                                    <td className="py-4 px-6 text-[13px] text-slate-500 font-semibold">
                                                                        {format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}
                                                                    </td>
                                                                    <td className="py-4 px-6">
                                                                        <span className={cn(
                                                                            "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider",
                                                                            typeStyles[tx.type] || 'bg-slate-100 text-slate-700 border border-slate-200'
                                                                        )}>
                                                                            {tx.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className={cn(
                                                                        "py-4 px-6 text-center text-[13px] font-black",
                                                                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                                                                    )}>
                                                                        {qtyFormatted}
                                                                    </td>
                                                                    <td className="py-4 px-6 text-[13px] text-slate-700 font-bold">
                                                                        {userDisplayName}
                                                                    </td>
                                                                    <td className="py-4 px-6 text-[13px] text-slate-500 font-medium max-w-[240px] truncate" title={tx.notes || ''}>
                                                                        {tx.notes || '—'}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Standby View for other tabs */}
                        {!['inventory', 'details', 'work-orders', 'assets', 'files', 'adjustments'].includes(activeTab) && (
                            <motion.div 
                                key="standby"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center p-20 text-center opacity-30"
                            >
                                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                                    <Box className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-2">{activeTab.toUpperCase()} HUB</h3>
                                <p className="text-xs font-bold text-slate-400">Tactical data stream is currently in standby mode.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right Side Column */}
            {!['adjustments'].includes(activeTab) && (
                <div className="w-[300px] bg-white flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
                    <div className="p-8">
                        <h3 className="text-[14px] font-black text-slate-900 mb-6">Assigned To</h3>
                        {displayPart.assignedTo && displayPart.assignedTo.user ? (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[12px] font-bold">
                                    {(displayPart.assignedTo?.user?.firstName || displayPart.assignedTo?.user?.name || 'T')[0].toUpperCase()}
                                </div>
                                <span className="text-[13px] font-semibold text-slate-700">
                                    {displayPart.assignedTo?.user?.firstName} {displayPart.assignedTo?.user?.lastName}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#c0b080] text-white flex items-center justify-center text-[12px] font-bold shadow-sm">
                                    T
                                </div>
                                <span className="text-[13px] font-semibold text-slate-700">telecast r r</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Loading Overlay */}
                {isFreshLoading && !freshPart && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[10001] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Tactical Data...</p>
                        </div>
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {isEditModalOpen && (
                    <EditPartModal 
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        part={displayPart}
                    />
                )}
                <AddSavedFileModal 
                    isOpen={showSavedFilesModal} 
                    onClose={() => setShowSavedFilesModal(false)}
                    workOrderId={displayPart.id}
                />
                {showAdjustModal && (
                    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-[18px] font-black text-slate-900">Adjust Stock</h3>
                                <button onClick={() => setShowAdjustModal(false)} className="p-2 hover:bg-slate-50 rounded-xl">
                                    <X className="w-6 h-6 text-slate-300" />
                                </button>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-4">
                                    {/* Direction Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adjustment Direction</label>
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setAdjustFormData({ ...adjustFormData, direction: 'add' })}
                                                className={cn(
                                                    "flex-1 py-3 border rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all",
                                                    adjustFormData.direction === 'add'
                                                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-700"
                                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                                Add to Stock
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAdjustFormData({ ...adjustFormData, direction: 'remove' })}
                                                className={cn(
                                                    "flex-1 py-3 border rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all",
                                                    adjustFormData.direction === 'remove'
                                                        ? "border-rose-500 bg-rose-50/50 text-rose-700"
                                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                                                Remove from Stock
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quantity */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity</label>
                                        <input 
                                            type="number"
                                            min="1"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-[14px] font-bold outline-none focus:border-slate-200 focus:bg-white transition-all"
                                            value={adjustFormData.quantity}
                                            onChange={(e) => setAdjustFormData({ ...adjustFormData, quantity: Math.max(1, Number(e.target.value)) })}
                                        />
                                    </div>

                                    {/* Adjustment Type */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adjustment Type</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-[14px] font-bold outline-none focus:border-slate-200 focus:bg-white transition-all"
                                            value={adjustFormData.type}
                                            onChange={(e) => setAdjustFormData({ ...adjustFormData, type: e.target.value })}
                                        >
                                            <option value="RESTOCK">Restock (Replenishment)</option>
                                            <option value="CONSUME">Consume (Used in WO/Job)</option>
                                            <option value="RETURN">Return (Unused parts)</option>
                                            <option value="AUDIT">Audit (Inventory count correction)</option>
                                            <option value="SHRINKAGE">Shrinkage (Loss or damage)</option>
                                        </select>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes / Comments</label>
                                        <textarea
                                            placeholder="Reason for adjustment, purchase order reference, or work order ID..."
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-[13px] font-medium outline-none focus:border-slate-200 focus:bg-white transition-all h-24 resize-none"
                                            value={adjustFormData.notes}
                                            onChange={(e) => setAdjustFormData({ ...adjustFormData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setShowAdjustModal(false)}
                                        className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button"
                                        disabled={adjustStockMutation.isPending}
                                        onClick={() => adjustStockMutation.mutate(adjustFormData)}
                                        className={cn(
                                            "flex-1 py-4 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl",
                                            adjustStockMutation.isPending 
                                                ? "bg-slate-400 shadow-none cursor-not-allowed" 
                                                : adjustFormData.direction === 'add'
                                                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                                                    : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                                        )}
                                    >
                                        {adjustStockMutation.isPending ? 'Adjusting...' : 'Adjust Stock'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {showAddLine && (
                    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden text-slate-800 font-sans"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800">Add Inventory Line</h3>
                                <button onClick={() => setShowAddLine(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-5">
                                {/* Section 1: Location & Area */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-slate-600">Location</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer pr-10"
                                                value={lineFormData.locationId}
                                                onChange={(e) => setLineFormData({...lineFormData, locationId: e.target.value})}
                                            >
                                                <option value=""></option>
                                                {locations?.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-slate-600">Area</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={lineFormData.area}
                                            onChange={(e) => setLineFormData({...lineFormData, area: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Section 2: Quantities */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-slate-600">Available Qty</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={lineFormData.availableQty}
                                            onChange={(e) => setLineFormData({...lineFormData, availableQty: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-slate-600">Minimum Qty</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={lineFormData.minQty}
                                            onChange={(e) => setLineFormData({...lineFormData, minQty: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-semibold text-slate-600">Maximum Qty</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            value={lineFormData.maxQty}
                                            onChange={(e) => setLineFormData({...lineFormData, maxQty: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Section 3: Barcode */}
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-slate-600">Barcode</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={lineFormData.barcode}
                                        onChange={(e) => setLineFormData({...lineFormData, barcode: e.target.value})}
                                    />
                                </div>

                                <hr className="border-slate-100" />

                                {/* Section 4: Cost */}
                                <div className="space-y-2">
                                    <label className="text-[13px] font-semibold text-slate-600">Cost</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                                        <input 
                                            type="number"
                                            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right"
                                            value={lineFormData.cost}
                                            onChange={(e) => setLineFormData({...lineFormData, cost: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Footer buttons */}
                                <div className="flex justify-end gap-3 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setShowAddLine(false)}
                                        className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors bg-white"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => addLineMutation.mutate(lineFormData)}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                    >
                                        Add Inventory Line
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
