import { useState } from 'react';
import { 
    X, 
    ArrowLeft, 
    Edit2, 
    MessageSquare, 
    ChevronDown, 
    ChevronUp,
    FileText,
    MapPin,
    Globe,
    Phone,
    Mail,
    ShieldCheck,
    Plus,
    Trash2,
    Upload,
    CheckCircle2,
    AlertCircle,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { VendorModal } from '../components/VendorModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import toast from 'react-hot-toast';

export const VendorDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Accordion states
    const [isWorkOrdersOpen, setIsWorkOrdersOpen] = useState(true);
    const [isLocationsOpen, setIsLocationsOpen] = useState(true);
    const [isFilesOpen, setIsFilesOpen] = useState(true);

    // Inline editor states
    const [newLicense, setNewLicense] = useState({ number: '', type: '', expiry: '' });
    const [showAddLicense, setShowAddLicense] = useState(false);

    const [newInsurance, setNewInsurance] = useState({ carrier: '', amount: '', expiry: '' });
    const [showAddInsurance, setShowAddInsurance] = useState(false);

    const [newCert, setNewCert] = useState({ name: '', authority: '', expiry: '' });
    const [showAddCert, setShowAddCert] = useState(false);

    // Chat drawer state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatLogs, setChatLogs] = useState<any[]>([
        { id: 1, sender: 'Westwood HVAC Solutions', message: 'Hello! Let us know if you need any repair schedules.', time: '10:30 AM' }
    ]);

    // Fetch vendor detail
    const { data: vendor, isLoading, error } = useQuery<any>({
        queryKey: ['vendor', id],
        queryFn: async () => {
            const response = await api.get(`/vendors/${id}`);
            return response.data;
        },
        enabled: !!id
    });

    // Update Vendor Mutation
    const updateMutation = useMutation({
        mutationFn: async (payload: any) => api.patch(`/vendors/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor', id] });
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            toast.success('Provider updated successfully');
        },
        onError: () => {
            toast.error('Failed to update provider');
        }
    });

    // Delete Vendor Mutation
    const deleteMutation = useMutation({
        mutationFn: async () => api.delete(`/vendors/${id}`),
        onSuccess: () => {
            toast.success('Provider deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            navigate('/vendors');
        },
        onError: () => {
            toast.error('Failed to delete provider');
        }
    });

    // File Upload Mutation
    const uploadFileMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return api.post(`/vendors/${id}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor', id] });
            toast.success('File uploaded successfully');
        },
        onError: () => {
            toast.error('Failed to upload file');
        }
    });

    // File Delete Mutation
    const deleteFileMutation = useMutation({
        mutationFn: async (fileId: string) => api.delete(`/vendors/files/${fileId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor', id] });
            toast.success('File deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete file');
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadFileMutation.mutate(file);
        }
    };

    // Lists additions
    const handleAddLicense = () => {
        if (!newLicense.number || !newLicense.type) return;
        const currentLicenses = Array.isArray(vendor.licenses) ? vendor.licenses : [];
        const updated = [...currentLicenses, { ...newLicense, id: Math.random().toString(36).substr(2, 9) }];
        updateMutation.mutate({ licenses: updated });
        setNewLicense({ number: '', type: '', expiry: '' });
        setShowAddLicense(false);
    };

    const handleDeleteLicense = (licenseId: string) => {
        const currentLicenses = Array.isArray(vendor.licenses) ? vendor.licenses : [];
        const updated = currentLicenses.filter((l: any) => l.id !== licenseId);
        updateMutation.mutate({ licenses: updated });
    };

    const handleAddInsurance = () => {
        if (!newInsurance.carrier || !newInsurance.amount) return;
        const currentInsurances = Array.isArray(vendor.insurances) ? vendor.insurances : [];
        const updated = [...currentInsurances, { ...newInsurance, id: Math.random().toString(36).substr(2, 9) }];
        updateMutation.mutate({ insurances: updated });
        setNewInsurance({ carrier: '', amount: '', expiry: '' });
        setShowAddInsurance(false);
    };

    const handleDeleteInsurance = (insuranceId: string) => {
        const currentInsurances = Array.isArray(vendor.insurances) ? vendor.insurances : [];
        const updated = currentInsurances.filter((i: any) => i.id !== insuranceId);
        updateMutation.mutate({ insurances: updated });
    };

    const handleAddCert = () => {
        if (!newCert.name || !newCert.authority) return;
        const currentCerts = Array.isArray(vendor.certifications) ? vendor.certifications : [];
        const updated = [...currentCerts, { ...newCert, id: Math.random().toString(36).substr(2, 9) }];
        updateMutation.mutate({ certifications: updated });
        setNewCert({ name: '', authority: '', expiry: '' });
        setShowAddCert(false);
    };

    const handleDeleteCert = (certId: string) => {
        const currentCerts = Array.isArray(vendor.certifications) ? vendor.certifications : [];
        const updated = currentCerts.filter((c: any) => c.id !== certId);
        updateMutation.mutate({ certifications: updated });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;
        setChatLogs(prev => [...prev, { id: Date.now(), sender: 'You', message: chatMessage, time: 'Just Now' }]);
        setChatMessage('');
        
        // Mock reply
        setTimeout(() => {
            setChatLogs(prev => [...prev, { 
                id: Date.now() + 1, 
                sender: vendor?.name || 'Provider Support', 
                message: 'Thank you for your message! Our dispatcher will look into it shortly.', 
                time: 'Just Now' 
            }]);
        }, 1200);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 font-outfit">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[14px] font-bold text-slate-500">Loading Provider Dossier...</p>
                </div>
            </div>
        );
    }

    if (error || !vendor) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-center font-outfit p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-[18px] font-bold text-slate-800">Error Loading Provider</h3>
                <p className="text-[14px] text-slate-400 mt-1 max-w-[400px]">The requested provider record does not exist or you lack sufficient access permissions.</p>
                <button onClick={() => navigate('/vendors')} className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-bold shadow-md shadow-indigo-100">
                    Go Back to Providers List
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50 min-h-screen font-outfit select-none">
            {/* Top Navigation Header */}
            <div className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/vendors')} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-slate-200" />
                    <h2 className="text-[18px] font-black text-slate-800 tracking-tight">{vendor.name}</h2>
                </div>

                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-4.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-[13px] text-slate-600 shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        Edit
                    </button>
                    <button 
                        onClick={() => setIsChatOpen(true)}
                        className="px-4.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-[13px] text-slate-600 shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        Chat
                    </button>
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-colors shadow-sm"
                        title="Delete Dossier"
                    >
                        <Trash2 className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>

            {/* Profile Content Body */}
            <div className="flex-1 p-6 max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 align-start pb-24">
                
                {/* Left Panel: Primary Details & Accordions (2 Columns wide) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* General Information Alert Box */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-5 flex items-start gap-4">
                        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-[13px] font-bold text-slate-800">General Information</h4>
                            <p className="text-[12px] text-slate-400 mt-1">Managed by your team — you can edit this information anytime. Attachments, licenses, and insurances help maintain vendor compliance logs.</p>
                        </div>
                    </div>

                    {/* Accordion 1: Assigned Work Orders */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <button 
                            onClick={() => setIsWorkOrdersOpen(!isWorkOrdersOpen)}
                            className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50/50 transition-colors font-bold text-[14px] text-slate-700"
                        >
                            <span>Assigned Work Orders ({vendor.workOrders?.length || 0})</span>
                            {isWorkOrdersOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        
                        <AnimatePresence initial={false}>
                            {isWorkOrdersOpen && (
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6">
                                        {vendor.workOrders && vendor.workOrders.length > 0 ? (
                                            <div className="divide-y divide-slate-100">
                                                {vendor.workOrders.map((wo: any) => (
                                                    <div key={wo.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-slate-55/20 transition-colors">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[13px] font-bold text-indigo-600">#{wo.woNumber || 'WO-103'}</span>
                                                                <span className="text-[13px] font-bold text-slate-700">{wo.title}</span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 line-clamp-1">{wo.description || 'No additional details provided.'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-md text-[10px] font-bold uppercase tracking-wide">
                                                                {wo.status?.replace('_', ' ') || 'OPEN'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center space-y-2">
                                                <p className="text-[13px] text-slate-400">No assigned work orders</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Accordion 2: Assigned Locations */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <button 
                            onClick={() => setIsLocationsOpen(!isLocationsOpen)}
                            className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50/50 transition-colors font-bold text-[14px] text-slate-700"
                        >
                            <span>Assigned Locations ({vendor.locations?.length || 0})</span>
                            {isLocationsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        
                        <AnimatePresence initial={false}>
                            {isLocationsOpen && (
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6">
                                        {vendor.locations && vendor.locations.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {vendor.locations.map((loc: any) => (
                                                    <div key={loc.id} className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-xl flex items-start gap-3">
                                                        <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                                        <div>
                                                            <h5 className="font-bold text-[13px] text-slate-800">{loc.name}</h5>
                                                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{loc.address || 'Address not listed'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center space-y-2">
                                                <p className="text-[13px] text-slate-400">No assigned locations</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Accordion 3: Files & Compliance */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <button 
                            onClick={() => setIsFilesOpen(!isFilesOpen)}
                            className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50/50 transition-colors font-bold text-[14px] text-slate-700"
                        >
                            <span>Files & Compliance ({vendor.files?.length || 0})</span>
                            {isFilesOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        
                        <AnimatePresence initial={false}>
                            {isFilesOpen && (
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 space-y-6">
                                        
                                        {/* Drag & Drop mockup file selector */}
                                        <div className="border-2 border-dashed border-slate-200/80 rounded-xl p-8 hover:border-indigo-400 transition-colors bg-slate-50/30 flex flex-col items-center justify-center text-center cursor-pointer relative group">
                                            <input 
                                                type="file" 
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <Upload className="w-7 h-7 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                                            <h5 className="font-bold text-[13px] text-slate-700">Drag & drop files here</h5>
                                            <p className="text-[11px] text-slate-400 mt-1">or click to browse local documents</p>
                                        </div>

                                        {/* Uploaded files listing */}
                                        {vendor.files && vendor.files.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {vendor.files.map((file: any) => (
                                                    <div key={file.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <FileText className="w-8 h-8 text-indigo-500 shrink-0" />
                                                            <div className="min-w-0">
                                                                <h5 className="font-bold text-[13px] text-slate-800 truncate">{file.filename}</h5>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">{(file.size ? (file.size / 1024).toFixed(1) : 0)} KB • {new Date(file.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => deleteFileMutation.mutate(file.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-2 text-center">
                                                <p className="text-[13px] text-slate-400">No compliance files uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Contact Information Sheet */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                        <h3 className="text-[14px] font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">Contact Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase">Full Name</label>
                                <div className="text-[13.5px] font-bold text-slate-700 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    {vendor.contactName || 'John Doe'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase">Phone Number</label>
                                <div className="text-[13.5px] font-bold text-slate-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    {vendor.phone || '(562) 692-5211'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase">Email</label>
                                <div className="text-[13.5px] font-bold text-slate-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    {vendor.email || 'la.sales@mcmaster.com'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase">Website</label>
                                <div className="text-[13.5px] font-bold text-indigo-600 flex items-center gap-2 hover:underline cursor-pointer">
                                    <Globe className="w-4 h-4 text-slate-400" />
                                    {vendor.website || 'https://www.mcmaster.com'}
                                </div>
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase">Address</label>
                                <div className="text-[13.5px] font-bold text-slate-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    {vendor.address || '9630 Norwalk Blvd, Santa Fe Springs, CA 90670-2932'}
                                </div>
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase">Description</label>
                                <p className="text-[13.5px] font-medium text-slate-600 leading-relaxed">{vendor.description || 'Wide range of stock parts from screws to filters.'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Business Details Sheet */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                        <h3 className="text-[14px] font-bold text-slate-800 border-b border-slate-100 pb-3">Business Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase">Company Name</label>
                                <div className="text-[13.5px] font-bold text-slate-700">{vendor.name}</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase">Provider Type</label>
                                <div className="text-[13.5px] font-bold text-slate-700">{vendor.type || 'Vendor'}</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase">Verification Status</label>
                                <div className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${vendor.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                        {vendor.verificationStatus || 'Unverified'}
                                    </span>
                                </div>
                            </div>
                            {vendor.hourlyRate && (
                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-slate-400 uppercase">Hourly Rate</label>
                                    <div className="text-[13.5px] font-bold text-slate-700">${vendor.hourlyRate}/hr</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Side Profile Cards (1 Column wide) */}
                <div className="space-y-6">
                    
                    {/* Provider Profile Info header card */}
                    <div className="bg-[#EEF2FF] border border-[#C7D2FE]/50 rounded-2xl p-5 flex items-start gap-4">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-[13px] font-bold text-slate-800">Provider Profile</h4>
                            <p className="text-[12px] text-slate-500 mt-1">Submitted via the Provider Portal — only the vendor can update this information directly.</p>
                        </div>
                    </div>

                    {/* Services Specialties Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                        <h3 className="text-[14px] font-bold text-slate-800 border-b border-slate-100 pb-3">Services</h3>
                        {vendor.services && vendor.services.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {vendor.services.map((item: string, idx: number) => (
                                    <span key={idx} className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[12px] font-semibold">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[12.5px] text-slate-400 italic">No services listed</p>
                        )}
                    </div>

                    {/* Service Coverage map card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                        <h3 className="text-[14px] font-bold text-slate-800 border-b border-slate-100 pb-3">Service Coverage</h3>
                        <p className="text-[12px] text-slate-400">1 coverage areas - Click map to explore</p>
                        
                        {/* Mock map layout */}
                        <div className="relative h-44 rounded-xl overflow-hidden bg-sky-100 border border-slate-200 flex items-center justify-center">
                            {/* Simple abstract map grid mockup using CSS */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-200 via-sky-100 to-sky-50 opacity-80" />
                            <div className="absolute w-24 h-24 rounded-full border-2 border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center animate-pulse">
                                <div className="absolute w-2 h-2 bg-indigo-600 rounded-full" />
                            </div>
                            <span className="absolute bottom-2.5 left-2.5 bg-slate-900/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium select-none">
                                Service Radius: {vendor.serviceRadius || 25} mi
                            </span>
                        </div>
                    </div>

                    {/* Licenses List Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-[14px] font-bold text-slate-800">Licenses</h3>
                            <button 
                                onClick={() => setShowAddLicense(!showAddLicense)}
                                className="p-1 hover:bg-slate-50 rounded-lg text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {showAddLicense && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="License Type (e.g. C-20 HVAC)"
                                    value={newLicense.type}
                                    onChange={(e) => setNewLicense({ ...newLicense, type: e.target.value })}
                                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] outline-none"
                                />
                                <input 
                                    type="text" 
                                    placeholder="License Number (e.g. #90342)"
                                    value={newLicense.number}
                                    onChange={(e) => setNewLicense({ ...newLicense, number: e.target.value })}
                                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] outline-none"
                                />
                                <input 
                                    type="date" 
                                    placeholder="Expiration Date"
                                    value={newLicense.expiry}
                                    onChange={(e) => setNewLicense({ ...newLicense, expiry: e.target.value })}
                                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] outline-none text-slate-500"
                                />
                                <div className="flex items-center justify-end gap-2 pt-1.5">
                                    <button onClick={() => setShowAddLicense(false)} className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                                    <button onClick={handleAddLicense} className="px-3.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Save</button>
                                </div>
                            </div>
                        )}

                        {vendor.licenses && vendor.licenses.length > 0 ? (
                            <div className="space-y-3">
                                {vendor.licenses.map((lic: any) => (
                                    <div key={lic.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between">
                                        <div>
                                            <h5 className="font-bold text-[12.5px] text-slate-800">{lic.type}</h5>
                                            <p className="text-[11px] text-slate-400 mt-0.5">No: {lic.number} {lic.expiry && `• Exp: ${lic.expiry}`}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteLicense(lic.id)}
                                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[12.5px] text-slate-400 italic">No license documents configured</p>
                        )}
                    </div>

                    {/* Insurances List Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-[14px] font-bold text-slate-800">Insurances</h3>
                            <button 
                                onClick={() => setShowAddInsurance(!showAddInsurance)}
                                className="p-1 hover:bg-slate-50 rounded-lg text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {showAddInsurance && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Carrier (e.g. Hartford Group)"
                                    value={newInsurance.carrier}
                                    onChange={(e) => setNewInsurance({ ...newInsurance, carrier: e.target.value })}
                                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] outline-none"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Liability Limit (e.g. $2,000,000)"
                                    value={newInsurance.amount}
                                    onChange={(e) => setNewInsurance({ ...newInsurance, amount: e.target.value })}
                                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] outline-none"
                                />
                                <input 
                                    type="date" 
                                    placeholder="Expiration Date"
                                    value={newInsurance.expiry}
                                    onChange={(e) => setNewInsurance({ ...newInsurance, expiry: e.target.value })}
                                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] outline-none text-slate-500"
                                />
                                <div className="flex items-center justify-end gap-2 pt-1.5">
                                    <button onClick={() => setShowAddInsurance(false)} className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                                    <button onClick={handleAddInsurance} className="px-3.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Save</button>
                                </div>
                            </div>
                        )}

                        {vendor.insurances && vendor.insurances.length > 0 ? (
                            <div className="space-y-3">
                                {vendor.insurances.map((ins: any) => (
                                    <div key={ins.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between">
                                        <div>
                                            <h5 className="font-bold text-[12.5px] text-slate-800">{ins.carrier}</h5>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Limit: {ins.amount} {ins.expiry && `• Exp: ${ins.expiry}`}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteInsurance(ins.id)}
                                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[12.5px] text-slate-400 italic">No insurance documents configured</p>
                        )}
                    </div>

                    {/* Certifications List Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-[14px] font-bold text-slate-800">Certifications</h3>
                            <button 
                                onClick={() => setShowAddCert(!showAddCert)}
                                className="p-1 hover:bg-slate-50 rounded-lg text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {showAddCert && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Certification Name (e.g. LEED)"
                                    value={newCert.name}
                                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] outline-none"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Issuing Authority (e.g. USGBC)"
                                    value={newCert.authority}
                                    onChange={(e) => setNewCert({ ...newCert, authority: e.target.value })}
                                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] outline-none"
                                />
                                <input 
                                    type="date" 
                                    placeholder="Expiration Date"
                                    value={newCert.expiry}
                                    onChange={(e) => setNewCert({ ...newCert, expiry: e.target.value })}
                                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] outline-none text-slate-500"
                                />
                                <div className="flex items-center justify-end gap-2 pt-1.5">
                                    <button onClick={() => setShowAddCert(false)} className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                                    <button onClick={handleAddCert} className="px-3.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Save</button>
                                </div>
                            </div>
                        )}

                        {vendor.certifications && vendor.certifications.length > 0 ? (
                            <div className="space-y-3">
                                {vendor.certifications.map((c: any) => (
                                    <div key={c.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between">
                                        <div>
                                            <h5 className="font-bold text-[12.5px] text-slate-800">{c.name}</h5>
                                            <p className="text-[11px] text-slate-400 mt-0.5">By: {c.authority} {c.expiry && `• Exp: ${c.expiry}`}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteCert(c.id)}
                                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[12.5px] text-slate-400 italic">No certifications configured</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Provider Modal */}
            {isEditModalOpen && (
                <VendorModal vendor={vendor} onClose={() => setIsEditModalOpen(false)} />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <ConfirmationModal 
                    isOpen={showDeleteConfirm}
                    title="Delete Provider Dossier"
                    message="Are you sure you want to permanently delete this provider dossier? All contact details, compliance files, and logs will be removed."
                    onConfirm={() => deleteMutation.mutate()}
                    onClose={() => setShowDeleteConfirm(false)}
                />
            )}

            {/* Messaging Mock Drawer (Chat) */}
            <AnimatePresence>
                {isChatOpen && (
                    <>
                        {/* Overlay backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsChatOpen(false)}
                            className="fixed inset-0 bg-slate-900 z-[1000]"
                        />

                        {/* Drawer body */}
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-[450px] bg-white shadow-2xl border-l border-slate-100 flex flex-col z-[1001]"
                        >
                            {/* Drawer Header */}
                            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-bold text-[15px] text-slate-800">Chat: {vendor.name}</h3>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Chat messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                {chatLogs.map(log => {
                                    const isSelf = log.sender === 'You';
                                    return (
                                        <div key={log.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{log.sender}</span>
                                                <span className="text-[9px] text-slate-400">{log.time}</span>
                                            </div>
                                            <div className={`px-4 py-2.5 rounded-2xl text-[13px] max-w-[80%] leading-relaxed ${isSelf ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                                                {log.message}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Chat input bar */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
                                <input 
                                    type="text" 
                                    placeholder="Type a message..."
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    className="flex-1 h-10 border border-slate-200 rounded-xl px-4 text-[13px] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all bg-slate-50/30"
                                />
                                <button 
                                    type="submit"
                                    className="h-10 px-4 bg-indigo-600 text-white rounded-xl font-bold text-[12px] flex items-center gap-1.5 transition-all hover:bg-indigo-700 active:scale-95 shadow-sm shadow-indigo-100"
                                >
                                    Send
                                </button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
