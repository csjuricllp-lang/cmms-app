import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, 
    FileText, 
    Settings,
    AlertCircle,
    MoreHorizontal,
    ActivitySquare,
    History,
    MapPin,
    LayoutGrid,
    Plus,
    Trash2,
    Download,
    ChevronRight,
    BarChart3,
    Upload
} from 'lucide-react';
import { useLocationDetail, useLocationBreadcrumbs } from '../hooks/useData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { PriorityBadge } from '../components/PriorityBadge';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { CreateLocationModal } from '../components/CreateLocationModal';
import { CreateAssetModal } from '../components/CreateAssetModal';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';
import { useUserRole } from '../hooks/useUserRole';
import React from 'react';


export const LocationDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { canManageData } = useUserRole();
    const [activeTab, setActiveTab] = useState<'details' | 'work-orders' | 'assets' | 'files' | 'parts' | 'floorplans'>('details');
    const [isDragging, setIsDragging] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState(false);
    const [isCreateWorkOrderModalOpen, setIsCreateWorkOrderModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const uploadFileMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post(`/locations/${id}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['location', id] });
            toast.success('File uploaded successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to upload file');
        }
    });

    const deleteFileMutation = useMutation({
        mutationFn: async (fileId: string) => {
            await api.delete(`/locations/${id}/files/${fileId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['location', id] });
            toast.success('File removed successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to delete file');
        }
    });

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };
    
    // Fetch Data
    const { data: location, isLoading } = useLocationDetail(id);
    const { data: breadcrumbs } = useLocationBreadcrumbs(id);
    const { data: metrics } = useQuery({
        queryKey: ['location-metrics', id],
        queryFn: async () => {
            const res = await api.get(`/locations/${id}/metrics`);
            return res.data;
        },
        enabled: !!id,
    });

    const tabs = [
        { id: 'details', label: 'Details', icon: FileText },
        { id: 'work-orders', label: 'Work Orders', icon: ActivitySquare },
        { id: 'assets', label: 'Assets', icon: LayoutGrid },
        { id: 'files', label: 'Files', icon: History },
        { id: 'parts', label: 'Parts', icon: Settings },
        { id: 'floorplans', label: 'Floorplans', icon: MapPin },
    ];

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 bg-transparent">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Loading Location Data...</span>
            </div>
        );
    }

    if (!location) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 bg-transparent">
                <AlertCircle className="w-12 h-12 text-slate-300" />
                <span className="text-muted-foreground font-bold">Location Not Found</span>
                <button onClick={() => navigate('/locations')} className="text-primary font-black uppercase text-[12px]">Back to Registry</button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-card">
            {/* Header */}
            <div className="bg-card border-b border-border px-8 pt-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/locations')}
                            className="p-2 hover:bg-muted rounded-md transition-colors group"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                        </button>
                        <div className="h-8 w-px bg-slate-200" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-xl font-semibold text-foreground tracking-tight">{location.name}</h1>
                            </div>
                            {breadcrumbs && breadcrumbs.length > 1 && (
                                <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500">
                                    {breadcrumbs.map((crumb, index) => (
                                        <React.Fragment key={crumb.id}>
                                            <button onClick={() => navigate(`/locations/${crumb.id}`)} className="hover:text-primary transition-colors">
                                                {crumb.name}
                                            </button>
                                            {index < breadcrumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {canManageData && (
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-4 py-1.5 bg-card border border-border rounded-md text-[13px] font-medium text-foreground/90 hover:bg-transparent transition-all shadow-sm active:scale-95"
                            >
                                Edit
                            </button>
                        )}
                        <button 
                            onClick={() => setIsCreateWorkOrderModalOpen(true)}
                            className="px-4 py-1.5 bg-primary text-white rounded-md text-[13px] font-medium hover:bg-primary/95 transition-all shadow-sm active:scale-95"
                        >
                            Create Work Order
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
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
                                "pb-4 text-sm font-medium transition-all relative",
                                activeTab === tab.id ? "text-slate-950 font-semibold" : "text-muted-foreground hover:text-slate-800"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div 
                                    layoutId="activeTabLocation"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-8 bg-card custom-scrollbar">
                <AnimatePresence mode="wait">
                    {activeTab === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Rollup Metrics Card */}
                            {metrics && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total Assets', value: metrics.totalAssets, icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50' },
                                        { label: 'Total Work Orders', value: metrics.totalWorkOrders, icon: ActivitySquare, color: 'text-violet-500', bg: 'bg-violet-50' },
                                        { label: 'Open Work Orders', value: metrics.openWorkOrders, icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-50' },
                                        { label: 'Sub-Locations', value: metrics.descendantLocationCount, icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 shadow-sm">
                                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', stat.bg)}>
                                                <stat.icon className={cn('w-5 h-5', stat.color)} />
                                            </div>
                                            <div>
                                                <p className="text-[22px] font-black text-foreground leading-none">{stat.value ?? '—'}</p>
                                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Details Card */}
                            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                                <div className="p-8 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest italic">Details</h3>
                                    </div>
                                    <div className="border-t border-slate-50 pt-6 space-y-4">
                                        <div className="grid grid-cols-[200px,1fr] items-center group">
                                            <span className="text-[14px] text-muted-foreground">Name</span>
                                            <span className="text-[14px] font-medium text-foreground">{location.name}</span>
                                        </div>
                                        <div className="grid grid-cols-[200px,1fr] items-center group">
                                            <span className="text-[14px] text-muted-foreground">Address</span>
                                            <span className="text-[14px] font-medium text-primary hover:underline cursor-pointer">{location.address || 'Not specified'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* More Information Card */}
                            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                                <div className="p-8 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[15px] font-bold text-foreground">More Information</h3>
                                    </div>
                                    <div className="border-t border-slate-100 pt-6 space-y-4">
                                        {[
                                            { label: 'Workers', value: location.workers?.map(w => w.name).join(', ') || 'None' },
                                            { label: 'Teams', value: location.teams?.map(t => t.name).join(', ') || 'None' },
                                            { label: 'Vendors', value: location.vendors?.map(v => v.name).join(', ') || 'None' },
                                            { label: 'Customers', value: location.customers?.map(c => c.name).join(', ') || 'None' },
                                            { label: 'Hierarchy', value: location.parent?.name || location.name },
                                        ].map((item, i) => (
                                            <div key={i} className="grid grid-cols-[200px,1fr] items-center group py-2 border-b border-slate-50 last:border-0">
                                                <span className="text-[14px] text-muted-foreground">{item.label}</span>
                                                <span className="text-[14px] font-medium text-foreground">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
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
                            className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest italic">Work Orders</h3>
                                {location.workOrders && location.workOrders.length > 0 ? (
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">WO #</th>
                                                    <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Title</th>
                                                    <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                                                    <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Due Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {location.workOrders.map(wo => (
                                                    <tr key={wo.id} className="group hover:bg-transparent transition-colors cursor-pointer" onClick={() => navigate(`/work-orders?id=${wo.id}`)}>
                                                        <td className="py-4 text-[13px] font-black text-primary">#{wo.woNumber}</td>
                                                        <td className="py-4 text-[13px] font-bold text-foreground">{wo.title}</td>
                                                        <td className="py-4">
                                                            <span className={cn("px-2 py-0.5 rounded text-[11px] font-black uppercase", wo.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-primary")}>
                                                                {wo.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4">
                                                            <PriorityBadge priority={wo.priority} />
                                                        </td>
                                                        <td className="py-4 text-[13px] text-muted-foreground text-right">{wo.dueDate ? format(new Date(wo.dueDate), 'MMM d, yyyy') : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                                        <ActivitySquare className="w-16 h-16" />
                                        <p className="text-[14px] font-black uppercase tracking-widest">No Work Orders Found</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'assets' && (
                        <motion.div
                            key="assets"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest italic">Linked Assets</h3>
                                    <button 
                                        onClick={() => setIsCreateAssetModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-[12px] font-black text-slate-600 hover:bg-transparent transition-all active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" /> Add Asset
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                                    {location.assets?.map(asset => (
                                        <div key={asset.id} className="border border-slate-100 rounded-2xl p-5 hover:border-primary/20 hover:bg-primary/[0.02] transition-all group cursor-pointer" onClick={() => navigate(`/assets/${asset.id}`)}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-transparent rounded-xl border border-slate-100 flex items-center justify-center group-hover:bg-card transition-colors overflow-hidden">
                                                    {asset.imageUrl ? <img src={asset.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid className="w-6 h-6 text-slate-200" />}
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-black text-foreground group-hover:text-primary transition-colors">{asset.name}</p>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{asset.status}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!location.assets || location.assets.length === 0) && (
                                        <div className="col-span-full py-20 text-center opacity-20 flex flex-col items-center gap-4">
                                            <LayoutGrid className="w-16 h-16" />
                                            <p className="text-[14px] font-black uppercase tracking-widest">No Assets Found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'files' && (
                        <motion.div
                            key="files"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[15px] font-medium text-foreground">
                                    {(location.files || []).length} File{((location.files || []).length !== 1) ? 's' : ''}
                                </span>
                                <button 
                                    onClick={() => toast.success('Saved files drawer opened!')}
                                    className="px-4 py-1.5 bg-card border border-border rounded-md text-[13px] font-semibold text-foreground/90 hover:bg-transparent transition-all shadow-sm active:scale-95"
                                >
                                    Add from Saved Files
                                </button>
                            </div>

                            <div 
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) uploadFileMutation.mutate(file);
                                }}
                                className={cn(
                                    "border border-dashed rounded-lg p-8 flex items-center justify-center text-center transition-all bg-card",
                                    isDragging ? "border-primary bg-primary/[0.01]" : "border-slate-300 hover:border-slate-400"
                                )}
                            >
                                <input 
                                    type="file" 
                                    id="location-file-input" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadFileMutation.mutate(file);
                                    }}
                                />
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => document.getElementById('location-file-input')?.click()}
                                        disabled={uploadFileMutation.isPending}
                                        className="px-4 py-1.5 bg-card border border-border rounded-md text-[13px] font-semibold text-slate-800 hover:bg-transparent transition-all shadow-sm active:scale-95"
                                    >
                                        {uploadFileMutation.isPending ? 'Uploading...' : 'Upload'}
                                    </button>
                                    <span className="text-[13px] text-muted-foreground font-medium">or Drop Files</span>
                                </div>
                            </div>
                            <p className="text-[12px] text-muted-foreground font-medium mt-1">Max: 200MB · Videos up to 150MB</p>

                            <div className="border-t border-border mt-6 pt-12">
                                {(location.files && location.files.length > 0) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {location.files.map((file: any) => {
                                            const isImage = file.mimeType?.startsWith('image/');
                                            return (
                                                <div key={file.id} className="relative group/file p-4 bg-card border border-border rounded-2xl hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between">
                                                    <div className="aspect-[4/3] rounded-xl bg-transparent border border-slate-100 overflow-hidden mb-4 relative flex items-center justify-center">
                                                        {isImage ? (
                                                            <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FileText className="w-12 h-12 text-slate-300" />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/file:opacity-100 transition-all flex items-center justify-center gap-3">
                                                            <a 
                                                                href={file.url} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                download
                                                                className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-slate-600 hover:text-primary transition-all active:scale-95"
                                                            >
                                                                <Download className="w-5 h-5" />
                                                            </a>
                                                            <button 
                                                                onClick={() => deleteFileMutation.mutate(file.id)}
                                                                disabled={deleteFileMutation.isPending}
                                                                className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white hover:bg-rose-600 transition-all active:scale-95"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[13px] font-semibold text-slate-800 truncate text-left" title={file.filename}>
                                                            {file.filename}
                                                        </p>
                                                        <div className="flex justify-between items-center text-[11px] font-medium text-slate-400">
                                                            <span>{formatBytes(file.size)}</span>
                                                            <span>{format(new Date(file.createdAt), 'MMM d, yyyy')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-20 flex items-center justify-center text-center">
                                        <span className="text-[15px] font-semibold text-[#8C8C8C]">No files added yet</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'parts' && (
                        <motion.div
                            key="parts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest italic">Spare Parts</h3>
                                {(location.parts && location.parts.length > 0) ? (
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100">
                                                    <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Part Name</th>
                                                    <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Part Number</th>
                                                    <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                                                    <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Cost</th>
                                                    <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {location.parts.map((part: any) => (
                                                    <tr key={part.id} className="group hover:bg-transparent transition-colors cursor-pointer" onClick={() => navigate(`/inventory?id=${part.id}`)}>
                                                        <td className="py-4 text-[13px] font-bold text-foreground">{part.name}</td>
                                                        <td className="py-4 text-[13px] font-black text-slate-400">{part.partNumber || '-'}</td>
                                                        <td className="py-4 text-[13px] font-black text-slate-800">{part.quantity}</td>
                                                        <td className="py-4 text-[13px] font-bold text-foreground/90">${Number(part.cost || 0).toFixed(2)}</td>
                                                        <td className="py-4 text-[11px] font-black text-right">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded uppercase",
                                                                part.status === 'In stock' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                                            )}>
                                                                {part.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                                        <Settings className="w-16 h-16 animate-spin-slow" />
                                        <p className="text-[14px] font-black uppercase tracking-widest">No Parts Associated</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'floorplans' && (
                        <motion.div
                            key="floorplans"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest italic">Floorplans & Layouts</h3>
                                <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                                    <MapPin className="w-16 h-16" />
                                    <p className="text-[14px] font-black uppercase tracking-widest">No floorplans uploaded yet</p>
                                    <p className="text-[12px] max-w-sm">Upload layout blueprints in the Files tab to manage site floorplans.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <CreateLocationModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['location', id] });
                }} 
                location={location} 
            />
            <CreateAssetModal 
                isOpen={isCreateAssetModalOpen} 
                onClose={() => {
                    setIsCreateAssetModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['location', id] });
                }} 
                defaultLocationId={id} 
            />
            <CreateWorkOrderModal 
                isOpen={isCreateWorkOrderModalOpen} 
                onClose={() => setIsCreateWorkOrderModalOpen(false)} 
                defaultLocationId={id} 
            />
        </div>
    );
};
