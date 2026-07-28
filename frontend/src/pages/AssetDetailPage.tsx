import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, 
    Edit2, 
    Activity, 
    FileText, 
    Settings,
    SlidersHorizontal,
    ChevronDown,
    Search,
    AlertCircle,
    MoreVertical,
    CheckCircle2,
    Zap,
    ActivitySquare,
    QrCode,
    History,
    PanelRightClose,
    PanelRightOpen,
    X,
    Trash2
} from 'lucide-react';
import { useAssets, useMeters, useMeterReadings, useAddMeterReading, useParts } from '../hooks/useData';
import { useWorkOrders } from '../hooks/useWorkOrders';
import type { Asset, MeterReading } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { PriorityBadge } from '../components/PriorityBadge';
import { api } from '../lib/api';
import { CreateAssetModal } from '../components/CreateAssetModal';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';

// --- HELPER COMPONENTS ---

interface FilterDropdownProps {
    label: string;
    icon: any;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    badgeValue?: number;
    onApply?: () => void;
    onCancel?: () => void;
}

const FilterDropdown = ({ label, icon: Icon, children, isOpen, onToggle, badgeValue, onApply, onCancel }: FilterDropdownProps) => (
    <div className="relative">
        <button
            onClick={onToggle}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-black transition-all active:scale-95 whitespace-nowrap border h-10",
                isOpen || badgeValue ? "bg-primary/5 text-primary border-primary/20 shadow-sm" : "bg-white text-slate-500 border-transparent hover:bg-slate-50"
            )}
        >
            <Icon className={cn("w-4 h-4", (isOpen || badgeValue) ? "text-primary" : "text-slate-400")} />
            {label}
            {badgeValue ? (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-black rounded-full px-1 shadow-sm">
                    {badgeValue}
                </span>
            ) : <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />}
        </button>

        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={onCancel || onToggle} />
                    <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 z-[120] overflow-hidden"
                    >
                        <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                        {(onApply || onCancel) && (
                            <div className="flex items-center justify-end gap-2 p-2 bg-slate-50 border-t border-slate-100">
                                {onCancel && (
                                    <button onClick={onCancel} className="px-3 py-1.5 text-[11px] font-black uppercase text-slate-500 hover:text-slate-700">
                                        Cancel
                                    </button>
                                )}
                                {onApply && (
                                    <button onClick={onApply} className="px-4 py-1.5 bg-primary text-white text-[11px] font-black uppercase rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                                        Apply
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    </div>
);

import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileAssetDetail } from './MobileAssetDetail';

import { useUserRole } from '../hooks/useUserRole';

export const AssetDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const isMobile = useMediaQuery('(max-width: 767px)');
    
    const { canManageData } = useUserRole();

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'work-orders' | 'details' | 'parts' | 'files' | 'meters' | 'sensors'>('work-orders');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateWorkOrderModalOpen, setIsCreateWorkOrderModalOpen] = useState(false);
    const [isLinkPartModalOpen, setIsLinkPartModalOpen] = useState(false);
    
    // Fetch Data
    const { data: assets, isLoading: isAssetsLoading } = useAssets();
    const asset = useMemo(() => assets?.find((a: Asset) => a.id === id), [assets, id]);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const { workOrders } = useWorkOrders({ assetId: id });
    
    // Meter State
    const { data: meters } = useMeters({ assetId: id });
    const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
    const selectedMeter = useMemo(() => meters?.find(m => m.id === (selectedMeterId || meters?.[0]?.id)), [meters, selectedMeterId]);
    const { data: readings, isLoading: isReadingsLoading } = useMeterReadings(selectedMeter?.id);
    const [isMeterDropdownOpen, setIsMeterDropdownOpen] = useState(false);
    const [isAddingReading, setIsAddingReading] = useState(false);
    const [newReadingValue, setNewReadingValue] = useState<number | ''>('');
    const queryClient = useQueryClient();
    const addReadingMutation = useAddMeterReading();

    const uploadFileMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post(`/assets/${id}/attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('File uploaded successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to upload file');
        }
    });

    const deleteFileMutation = useMutation({
        mutationFn: async (fileId: string) => {
            await api.delete(`/assets/${id}/attachments/${fileId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('File removed successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to delete file');
        }
    });

    const { data: partsData } = useParts();
    const allParts = useMemo(() => {
        return Array.isArray(partsData) ? partsData : (partsData as any)?.items || [];
    }, [partsData]);

    const linkPartMutation = useMutation({
        mutationFn: async (partId: string) => {
            return api.post(`/parts/${partId}/assets`, { assetId: id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Part linked successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to link part');
        }
    });

    const unlinkPartMutation = useMutation({
        mutationFn: async (linkId: string) => {
            await api.delete(`/parts/assets/${linkId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Part unlinked successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to unlink part');
        }
    });

    const handleLogReading = () => {
        if (!selectedMeter) return;
        if (newReadingValue === '') {
            toast.error('Please enter a reading value');
            return;
        }
        addReadingMutation.mutate({
            meterId: selectedMeter.id,
            value: Number(newReadingValue)
        }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['meter-readings', selectedMeter.id] });
                setIsAddingReading(false);
                setNewReadingValue('');
            }
        });
    };

    // Filter States for Work Orders Tab
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [stagedStatus, setStagedStatus] = useState<string[]>([]);

    const tabs = [
        { id: 'work-orders', label: 'Work Orders', icon: ActivitySquare },
        { id: 'details', label: 'Details', icon: FileText },
        { id: 'parts', label: 'Parts', icon: Settings },
        { id: 'files', label: 'Files', icon: History },
        { id: 'meters', label: 'Meters', icon: Zap },
        { id: 'sensors', label: 'Sensors', icon: Activity },
    ];

    const filteredWorkOrders = useMemo(() => {
        if (!workOrders) return [];
        return workOrders.filter((wo) => {
            const matchesSearch = !searchQuery || 
                wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                wo.woNumber.toString().includes(searchQuery);
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(wo.status);
            return matchesSearch && matchesStatus;
        });
    }, [workOrders, searchQuery, selectedStatus]);

    if (isMobile && id) {
        return <MobileAssetDetail id={id} />;
    }

    if (isAssetsLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Loading Asset Data...</span>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
                <AlertCircle className="w-12 h-12 text-slate-300" />
                <span className="text-slate-500 font-bold">Asset Not Found</span>
                <button onClick={() => navigate('/assets')} className="text-primary font-black uppercase text-[12px]">Back to Registry</button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#F9FAFB]">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 pt-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/assets')}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors group"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                        </button>
                        <div className="h-8 w-px bg-slate-100" />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Assets /</span>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">{asset.name}</h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 mr-4">
                            <ActivitySquare className="w-4 h-4 text-slate-400" />
                            <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">Activity</span>
                            <QrCode className="w-4 h-4 text-slate-400 ml-4" />
                            <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">QR Code</span>
                        </div>
                        {canManageData && (
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit
                            </button>
                        )}
                        <button 
                            onClick={() => setIsCreateWorkOrderModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[14px] font-black shadow-lg shadow-primary/20 hover:bg-black transition-all active:scale-95"
                        >
                            Create Work Order
                        </button>
                        <button className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 pb-4 text-sm font-black transition-all relative uppercase tracking-wider",
                                activeTab === tab.id ? "text-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTabAsset"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content & Sidebar Grid */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'work-orders' && (
                            <motion.div
                                key="work-orders"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Filter Bar */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-black text-slate-600 shadow-sm">
                                            <SlidersHorizontal className="w-4 h-4 text-primary" />
                                            Filters (1)
                                        </button>
                                        
                                        <FilterDropdown 
                                            label="Status" 
                                            icon={Activity} 
                                            isOpen={isStatusDropdownOpen}
                                            onToggle={() => { setIsStatusDropdownOpen(!isStatusDropdownOpen); setStagedStatus(selectedStatus); }}
                                            badgeValue={selectedStatus.length}
                                            onApply={() => { setSelectedStatus(stagedStatus); setIsStatusDropdownOpen(false); }}
                                            onCancel={() => setIsStatusDropdownOpen(false)}
                                        >
                                            <div className="p-2">
                                                {['Open', 'In Progress', 'On Hold', 'Completed'].map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setStagedStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                                        className={cn("w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 rounded-xl", stagedStatus.includes(s) ? "text-primary bg-primary/5 font-black" : "text-slate-600 font-bold")}
                                                    >
                                                        {s}
                                                        {stagedStatus.includes(s) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </FilterDropdown>

                                        <button className="text-[12px] font-black text-primary hover:underline">Reset Filters</button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text"
                                                placeholder="Search"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold outline-none w-64 focus:border-primary/30 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left min-w-full">
                                        <thead className="bg-slate-50/50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">WO #</th>
                                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Work Order Title</th>
                                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredWorkOrders.map(wo => (
                                                <tr 
                                                    key={wo.id} 
                                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                                    onClick={() => navigate(`/work-orders?id=${wo.id}`)}
                                                >
                                                    <td className="px-6 py-5 text-[14px] font-black text-primary">00{wo.woNumber}</td>
                                                    <td className="px-6 py-5 text-[14px] font-bold text-slate-900">{wo.title}</td>
                                                    <td className="px-6 py-5 text-[13px] text-slate-500 max-w-xs truncate">{wo.description || '-'}</td>
                                                    <td className="px-6 py-5 text-[13px] text-slate-600 font-medium">
                                                        {wo.dueDate ? format(new Date(wo.dueDate), 'MM/dd/yy - hh:mm a') : '-'}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-4 h-4 rounded-full border-2", wo.status === 'Complete' ? "bg-emerald-500/20 border-emerald-500" : "bg-slate-100 border-slate-300")} />
                                                            <span className="text-[13px] font-bold text-slate-700">{wo.status}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <PriorityBadge priority={wo.priority} />
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredWorkOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                                            <ActivitySquare className="w-12 h-12" />
                                                            <p className="text-sm font-black uppercase tracking-widest">No matching work orders</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'details' && (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
                            >
                                <div className="p-10 space-y-12">
                                    {/* Asset Information */}
                                    <div className="space-y-6">
                                        <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em] px-2">Asset Information</h3>
                                        <div className="border-t border-slate-100">
                                            {[
                                                { label: 'Name', value: asset.name },
                                                { label: 'Description', value: asset.description || 'Split cooling. AHRI certified and certified to UL 1995.' },
                                                { label: 'Model', value: asset.model || '-' },
                                                { label: 'Area', value: asset.area || asset.location?.name || '-' },
                                                { label: 'Barcode', value: asset.barCode || '-' },
                                                { label: 'Schedule', value: '-' },
                                            ].map((item, i) => (
                                                <div key={i} className="grid grid-cols-[240px,1fr] py-5 border-b border-slate-100 items-center px-2 hover:bg-slate-50/50 transition-colors">
                                                    <span className="text-[13px] font-bold text-slate-400 italic">{item.label}</span>
                                                    <span className="text-[14px] font-bold text-slate-700">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Depreciation */}
                                    <div className="space-y-6">
                                        <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em] px-2">Depreciation</h3>
                                        <div className="border-t border-slate-100">
                                            {[
                                                { label: 'Purchase Price', value: asset.purchasePrice ? `$${Number(asset.purchasePrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$10,000.00' },
                                                { label: 'Purchase Date', value: asset.purchaseDate ? format(new Date(asset.purchaseDate), 'MMMM d, yyyy') : 'June 30, 2015' },
                                                { label: 'Residual Value', value: asset.residualValue ? `$${Number(asset.residualValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$1,000.00' },
                                                { label: 'Useful Life', value: asset.usefulLifeYears ? `${asset.usefulLifeYears} Years` : '10 Years' },
                                            ].map((item, i) => (
                                                <div key={i} className="grid grid-cols-[240px,1fr] py-5 border-b border-slate-100 items-center px-2 hover:bg-slate-50/50 transition-colors">
                                                    <span className="text-[13px] font-bold text-slate-400 italic">{item.label}</span>
                                                    <span className="text-[14px] font-bold text-slate-700">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* More Information */}
                                    <div className="space-y-6">
                                        <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em] px-2">More Information</h3>
                                        <div className="border-t border-slate-100">
                                            {[
                                                { label: 'Placed In Service', value: asset.placedInService ? format(new Date(asset.placedInService), 'MMMM d, yyyy') : 'July 24, 2015' },
                                                { label: 'Warranty Expiration', value: asset.warrantyExpiration ? format(new Date(asset.warrantyExpiration), 'MMMM d, yyyy') : 'May 11, 2026' },
                                            ].map((item, i) => (
                                                <div key={i} className="grid grid-cols-[240px,1fr] py-5 border-b border-slate-100 items-center px-2 hover:bg-slate-50/50 transition-colors">
                                                    <span className="text-[13px] font-bold text-slate-400 italic">{item.label}</span>
                                                    <span className="text-[14px] font-bold text-slate-700">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'parts' && (
                            <motion.div
                                key="parts"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">Spare Parts</h3>
                                    <button 
                                        onClick={() => setIsLinkPartModalOpen(true)}
                                        className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                    >
                                        Link Part
                                    </button>
                                </div>

                                {asset.spareParts && asset.spareParts.length > 0 ? (
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left min-w-full">
                                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Part Name</th>
                                                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Part #</th>
                                                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                                                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                                    <th className="px-8 py-5"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {asset.spareParts.map((sparePart) => {
                                                    const part = sparePart.part;
                                                    return (
                                                        <tr key={part.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-8 py-6">
                                                                <span className="text-[14px] font-black text-slate-900 italic">{part.name}</span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="text-[13px] font-bold text-slate-500">{part.partNumber || '-'}</span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={cn("px-3 py-1 rounded-lg text-[12px] font-black", (part.quantity || 0) < 5 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                                                                    {part.quantity || 0} In Stock
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{(part as any).category || 'General'}</span>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <button 
                                                                    onClick={() => {
                                                                        if (confirm(`Are you sure you want to unlink ${part.name}?`)) {
                                                                            unlinkPartMutation.mutate(sparePart.id);
                                                                        }
                                                                    }}
                                                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                                                    title="Unlink Part"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                                            <Settings className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <div>
                                            <h4 className="text-[16px] font-black text-slate-900">No linked parts</h4>
                                            <p className="text-[13px] text-slate-400 font-bold max-w-xs mx-auto">Track inventory and spare parts specifically for this asset.</p>
                                        </div>
                                        <button 
                                            onClick={() => setIsLinkPartModalOpen(true)}
                                            className="btn-primary py-2.5 px-8 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95"
                                        >
                                            Link Part
                                        </button>
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
                                className="space-y-6"
                            >
                                <div 
                                    onClick={() => {
                                        const fileInput = document.getElementById('asset-file-upload');
                                        fileInput?.click();
                                    }}
                                    className="p-12 border-4 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-center group hover:border-primary/20 hover:bg-slate-50/50 transition-all cursor-pointer"
                                >
                                    <input 
                                        type="file" 
                                        id="asset-file-upload" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                uploadFileMutation.mutate(file);
                                            }
                                        }}
                                    />
                                    <FileText className="w-12 h-12 text-slate-200 mb-4 group-hover:text-primary transition-colors" />
                                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Upload Documents</p>
                                    <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase">Manuals, Schematics, or Photos</p>
                                </div>

                                {asset.attachments && asset.attachments.length > 0 && (
                                    <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-4">
                                        <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">Uploaded Files</h4>
                                        <div className="divide-y divide-slate-100">
                                            {asset.attachments.map((file: any) => (
                                                <div key={file.id} className="flex items-center justify-between py-4 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                                            <FileText className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <a 
                                                                href={file.url.startsWith('http') ? file.url : `${api.defaults.baseURL}${file.url}`}
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-sm font-bold text-slate-700 hover:text-primary transition-colors"
                                                            >
                                                                {file.filename}
                                                            </a>
                                                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                                                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''} • {format(new Date(file.createdAt), 'MM/dd/yyyy')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this file?')) {
                                                                deleteFileMutation.mutate(file.id);
                                                            }
                                                        }}
                                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'meters' && (
                            <motion.div
                                key="meters"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Meter Top Bar */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <button 
                                                onClick={() => setIsMeterDropdownOpen(!isMeterDropdownOpen)}
                                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[14px] font-black text-slate-700 shadow-sm active:scale-95 transition-all"
                                            >
                                                Meter: <span className="text-primary italic ml-1">{selectedMeter?.name || 'Select Meter'}</span>
                                                <ChevronDown className={cn("w-4 h-4 transition-transform", isMeterDropdownOpen && "rotate-180")} />
                                            </button>
                                            
                                            <AnimatePresence>
                                                {isMeterDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-[110]" onClick={() => setIsMeterDropdownOpen(false)} />
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 z-[120] overflow-hidden"
                                                        >
                                                            <div className="p-1">
                                                                {meters?.map(m => (
                                                                    <button
                                                                        key={m.id}
                                                                        onClick={() => { setSelectedMeterId(m.id); setIsMeterDropdownOpen(false); }}
                                                                        className={cn("w-full text-left px-4 py-3 rounded-xl text-[13px] font-black transition-all", selectedMeter?.id === m.id ? "bg-primary/5 text-primary italic" : "text-slate-600 hover:bg-slate-50")}
                                                                    >
                                                                        {m.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary/20 transition-all active:scale-95 shadow-sm"
                                            title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
                                        >
                                            {isSidebarVisible ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                                        </button>
                                        <button 
                                            onClick={() => navigate('/meters')}
                                            className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                        >
                                            View Meter Details
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (!selectedMeter) {
                                                    toast.error('No meter selected');
                                                    return;
                                                }
                                                setIsAddingReading(true);
                                            }}
                                            className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                        >
                                            Add Reading
                                        </button>
                                    </div>
                                </div>

                                {/* Readings Table */}
                                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar min-h-[400px]">
                                    {isReadingsLoading ? (
                                        <div className="h-64 flex flex-col items-center justify-center gap-3">
                                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Fetching Readings...</span>
                                        </div>
                                    ) : readings && readings.length > 0 ? (
                                        <table className="w-full text-left min-w-full">
                                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Reading</th>
                                                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Added By</th>
                                                    <th className="px-8 py-5"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {readings.map((reading: MeterReading) => (
                                                    <tr key={reading.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <span className="text-[15px] font-black text-slate-900">{reading.value} <span className="text-[13px] text-slate-400 font-bold ml-1">{selectedMeter?.unit}</span></span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="text-[14px] font-bold text-slate-600">{format(new Date(reading.createdAt), "MMMM d, yyyy 'at' h:mm a")}</span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-sm flex items-center justify-center text-[11px] font-black text-white uppercase">
                                                                    {reading.user?.name?.[0] || 'T'}
                                                                </div>
                                                                <span className="text-[14px] font-bold text-slate-700 italic">{reading.user?.name || 'tester'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                                                <MoreVertical className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="h-80 flex flex-col items-center justify-center text-center p-12 space-y-4">
                                            <Zap className="w-12 h-12 text-slate-100" />
                                            <div className="space-y-1">
                                                <h4 className="text-[15px] font-black text-slate-400 uppercase tracking-widest italic">No Readings Recorded</h4>
                                                <p className="text-[13px] text-slate-400 font-bold">Start tracking performance by adding the first meter reading.</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (!selectedMeter) {
                                                        toast.error('No meter selected');
                                                        return;
                                                    }
                                                    setIsAddingReading(true);
                                                }}
                                                className="btn-primary py-2.5 px-8 rounded-xl text-xs font-black uppercase tracking-widest mt-4"
                                            >
                                                Add Initial Reading
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Add Reading Modal Overlay */}
                        <AnimatePresence>
                            {isAddingReading && (
                                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[2000] flex items-center justify-center p-4">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl w-full max-w-[420px] space-y-5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[15px] font-bold text-slate-900">Log New Reading</h4>
                                            <button onClick={() => setIsAddingReading(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Value ({selectedMeter?.unit})</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        value={newReadingValue}
                                                        onChange={(e) => setNewReadingValue(e.target.value === '' ? '' : Number(e.target.value))}
                                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all pr-12"
                                                        placeholder={`Enter value...`}
                                                        autoFocus
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400 uppercase select-none">{selectedMeter?.unit}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 pt-2">
                                                <button 
                                                    onClick={() => setIsAddingReading(false)}
                                                    className="flex-1 h-11 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleLogReading}
                                                    disabled={addReadingMutation.isPending || newReadingValue === ''}
                                                    className="flex-1 h-11 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                                                >
                                                    {addReadingMutation.isPending ? 'Saving...' : 'Save Reading'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {activeTab === 'sensors' && (
                            <motion.div
                                key="sensors"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center gap-4 text-center"
                            >
                                <ActivitySquare className="w-12 h-12 text-slate-100" />
                                <div className="space-y-1">
                                    <h4 className="text-[15px] font-black text-slate-900 uppercase tracking-widest italic">Live Telemetry</h4>
                                    <p className="text-[13px] text-slate-400 font-bold">Connect IoT sensors for real-time condition monitoring.</p>
                                </div>
                                <button className="text-primary text-[11px] font-black uppercase tracking-widest hover:underline mt-4">Connect Sensor</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Sidebar */}
                <AnimatePresence>
                    {isSidebarVisible && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 340, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="border-l border-slate-200 bg-white overflow-y-auto p-8 space-y-10 custom-scrollbar overflow-hidden whitespace-nowrap"
                        >
                            {/* Hierarchy */}
                            <div className="space-y-4">
                                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">Hierarchy</h3>
                                <div className="space-y-3 pl-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-slate-900" />
                                        <span className="text-[13px] font-bold text-slate-900 italic">This Asset</span>
                                    </div>
                                    <div className="pl-2 border-l border-slate-200 py-1 ml-1 space-y-3">
                                        <div className="flex items-center gap-3 relative">
                                            <div className="absolute left-[-9px] top-1/2 w-2 h-px bg-slate-200" />
                                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                                            <button className="text-[13px] font-bold text-primary hover:underline italic">1 Child Asset</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="space-y-4">
                                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">Location</h3>
                                <button className="text-[14px] font-bold text-primary hover:underline pl-2 italic">
                                    {asset.location?.name || 'Suite B'}
                                </button>
                            </div>

                            {/* Assigned To */}
                            <div className="space-y-4">
                                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">Assigned To</h3>
                                <div className="flex items-center gap-3 pl-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-400 uppercase">
                                        {asset.custodian?.user?.name?.[0] || '?'}
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-slate-700 italic">
                                            {asset.custodian?.user?.name || 'Unassigned'}
                                            {asset.custodian && <span className="text-slate-400 ml-1">(Primary)</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <CreateAssetModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['assets'] });
                }}
                asset={asset}
            />
            <CreateWorkOrderModal
                isOpen={isCreateWorkOrderModalOpen}
                onClose={() => setIsCreateWorkOrderModalOpen(false)}
                defaultAssetId={id}
                defaultLocationId={asset.locationId}
            />

            {/* Link Part Modal Overlay */}
            <AnimatePresence>
                {isLinkPartModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[2000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl w-full max-w-[500px] flex flex-col max-h-[80vh] space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="text-[16px] font-black text-slate-800 uppercase tracking-wider">Link Part to Asset</h4>
                                <button onClick={() => setIsLinkPartModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                                {allParts.filter((part: any) => !asset.spareParts?.some((sp: any) => sp.partId === part.id)).length === 0 ? (
                                    <p className="text-sm text-slate-400 font-bold italic text-center py-8">No more spare parts available to link</p>
                                ) : (
                                    allParts.filter((part: any) => !asset.spareParts?.some((sp: any) => sp.partId === part.id)).map((part: any) => (
                                        <div key={part.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{part.name}</p>
                                                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{part.partNumber || 'No Part Number'}</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    linkPartMutation.mutate(part.id);
                                                    setIsLinkPartModalOpen(false);
                                                }}
                                                className="px-4 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-xs font-black transition-all active:scale-95"
                                            >
                                                Link
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
