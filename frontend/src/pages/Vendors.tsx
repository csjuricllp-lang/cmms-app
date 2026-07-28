import { useState } from 'react';
import { 
    MapPin, 
    Mail, 
    Star, 
    Trash2, 
    ChevronDown, 
    Plus, 
    Building2, 
    MoreHorizontal,
    SlidersHorizontal,
    ArrowUpDown,
    Check,
    X,
    Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { VendorModal } from '../components/VendorModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import toast from 'react-hot-toast';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileVendors } from './MobileVendors';

export const VendorsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Search and filter states
    const [needsInput, setNeedsInput] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [distanceInput, setDistanceInput] = useState('Any'); // 5, 10, 25, 50, Any
    
    // Active filters used for search matching
    const [activeFilters, setActiveFilters] = useState({
        needs: '',
        location: '',
        distance: 'Any'
    });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [sortBy, setSortBy] = useState('Date created (newest)');
    
    // Contact modal state
    const [contactVendor, setContactVendor] = useState<any>(null);
    const [contactMessage, setContactMessage] = useState('');
    const [contactSubject, setContactSubject] = useState('Procurement Inquiry');

    // Delete confirmation state
    const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);

    // Fetch Providers
    const { data: vendors = [], isLoading } = useQuery<any[]>({
        queryKey: ['vendors'],
        queryFn: async () => {
            const response = await api.get('/vendors');
            return Array.isArray(response.data) ? response.data : response.data.items || [];
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/vendors/${id}`),
        onSuccess: () => {
            toast.success('Provider deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            setDeleteVendorId(null);
        },
        onError: () => {
            toast.error('Failed to delete provider');
        }
    });

    // Favorite Mutation
    const favoriteMutation = useMutation({
        mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
            return api.patch(`/vendors/${id}`, { isFavorite });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
        onError: () => {
            toast.error('Failed to update favorite status');
        }
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveFilters({
            needs: needsInput,
            location: locationInput,
            distance: distanceInput
        });
    };

    // Filter and Sort Providers on Client
    const filteredVendors = vendors.filter((vendor: any) => {
        const matchesNeeds = !activeFilters.needs || 
            vendor.name?.toLowerCase().includes(activeFilters.needs.toLowerCase()) ||
            vendor.specialties?.some((s: string) => s.toLowerCase().includes(activeFilters.needs.toLowerCase())) ||
            vendor.type?.toLowerCase().includes(activeFilters.needs.toLowerCase());

        const matchesLocation = !activeFilters.location || 
            vendor.address?.toLowerCase().includes(activeFilters.location.toLowerCase());

        // Mock distance matching based on radius
        let matchesDistance = true;
        if (activeFilters.distance !== 'Any') {
            const radius = parseInt(activeFilters.distance, 10);
            if (vendor.serviceRadius && vendor.serviceRadius > radius) {
                matchesDistance = false;
            }
        }

        return matchesNeeds && matchesLocation && matchesDistance;
    }).sort((a: any, b: any) => {
        if (sortBy === 'Date created (newest)') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'Date created (oldest)') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'Name (A-Z)') {
            return a.name.localeCompare(b.name);
        }
        if (sortBy === 'Name (Z-A)') {
            return b.name.localeCompare(a.name);
        }
        if (sortBy === 'Hourly Rate (High-Low)') {
            return (Number(b.hourlyRate) || 0) - (Number(a.hourlyRate) || 0);
        }
        if (sortBy === 'Hourly Rate (Low-High)') {
            return (Number(a.hourlyRate) || 0) - (Number(b.hourlyRate) || 0);
        }
        return 0;
    });

    const getInitials = (name: string) => {
        if (!name) return 'WS';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    // Colors list for initials avatars
    const avatarColors = [
        'bg-indigo-50 text-indigo-700 border-indigo-100',
        'bg-emerald-50 text-emerald-700 border-emerald-100',
        'bg-blue-50 text-blue-700 border-blue-100',
        'bg-amber-50 text-amber-700 border-amber-100',
        'bg-rose-50 text-rose-700 border-rose-100',
        'bg-purple-50 text-purple-700 border-purple-100'
    ];

    const getAvatarColor = (id: string) => {
        const charCodeSum = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return avatarColors[charCodeSum % avatarColors.length];
    };

    const handleSendEmail = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Message sent to ${contactVendor.name} at ${contactVendor.email || 'la.sales@mcmaster.com'}`);
        setContactVendor(null);
        setContactMessage('');
    };

    const isMobile = useMediaQuery('(max-width: 768px)');

    if (isMobile) {
        return (
            <>
                <MobileVendors 
                    vendors={vendors}
                    isLoading={isLoading}
                    onSelectVendor={(vendor) => navigate(`/vendors/${vendor.id}`)}
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                    onFavoriteToggle={(id, isFavorite) => favoriteMutation.mutate({ id, isFavorite })}
                    onContactVendor={(vendor) => {
                        setContactVendor(vendor);
                        setContactSubject(`Inquiry regarding ${vendor.type || 'Services'}`);
                    }}
                />

                {isCreateModalOpen && (
                    <VendorModal onClose={() => setIsCreateModalOpen(false)} />
                )}

                <AnimatePresence>
                    {contactVendor && (
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                onClick={() => setContactVendor(null)}
                                className="absolute inset-0"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10"
                            >
                                {/* Modal Header */}
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-bold text-[16px] text-slate-800">Contact {contactVendor.name}</h3>
                                    <button onClick={() => setContactVendor(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Form */}
                                <form onSubmit={handleSendEmail} className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-500 uppercase">To</label>
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={`${contactVendor.contactName || 'Primary Agent'} (${contactVendor.email || 'la.sales@mcmaster.com'})`}
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] bg-slate-50 text-slate-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-500 uppercase">Subject</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={contactSubject}
                                            onChange={(e) => setContactSubject(e.target.value)}
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] bg-white text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-slate-500 uppercase">Message</label>
                                        <textarea 
                                            required
                                            rows={5}
                                            placeholder="Type your procurement request or service inquiry here..."
                                            value={contactMessage}
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] bg-white text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setContactVendor(null)}
                                            className="px-5 py-2.5 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            Send Message
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/40 min-h-screen font-outfit select-none">
            {/* Header Title */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white sticky top-0 z-30 shrink-0">
                <div className="flex items-center gap-6">
                    <h1 className="text-[20px] font-bold text-slate-800">Providers</h1>
                    <div className="flex border-b border-indigo-600 font-bold text-[14px] text-indigo-600 px-1 py-1.5 cursor-pointer">
                        Search
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-9 px-4 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg font-bold text-[13px] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Create Provider
                    </button>
                    <button className="h-9 w-9 flex items-center justify-center border border-slate-200 bg-white text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search Criteria Block (Matching Image 1) */}
            <div className="px-8 py-6 bg-white border-b border-slate-100 sticky top-[69px] z-20 shadow-sm shrink-0">
                <form onSubmit={handleSearchSubmit} className="max-w-[1200px] flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[250px] relative">
                        <input
                            type="text"
                            placeholder="What do you need?"
                            value={needsInput}
                            onChange={(e) => setNeedsInput(e.target.value)}
                            className="w-full h-12 pl-4 pr-4 border border-slate-200 rounded-l-xl rounded-r-none focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 text-[14px] text-slate-700 bg-white"
                        />
                    </div>
                    
                    <div className="flex-1 min-w-[250px] relative -ml-4 border-l border-slate-200">
                        <input
                            type="text"
                            placeholder="Where do you need it?"
                            value={locationInput}
                            onChange={(e) => setLocationInput(e.target.value)}
                            className="w-full h-12 pl-4 pr-4 border border-slate-200 border-l-0 rounded-none focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 text-[14px] text-slate-700 bg-white"
                        />
                    </div>

                    <div className="w-[180px] relative -ml-4 border-l border-slate-200">
                        <select
                            value={distanceInput}
                            onChange={(e) => setDistanceInput(e.target.value)}
                            className="w-full h-12 pl-4 pr-10 border border-slate-200 border-l-0 rounded-none focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 text-[14px] text-slate-500 bg-white appearance-none cursor-pointer font-medium"
                        >
                            <option value="Any">How far?</option>
                            <option value="5">Within 5 miles</option>
                            <option value="10">Within 10 miles</option>
                            <option value="25">Within 25 miles</option>
                            <option value="50">Within 50 miles</option>
                            <option value="100">Within 100 miles</option>
                            <option value="250">Within 250 miles</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <button 
                        type="submit"
                        className="h-12 px-6 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-r-xl rounded-l-none font-bold text-[14px] shadow-md shadow-indigo-100 transition-all active:scale-95"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Content Body */}
            <div className="flex-1 px-8 py-6 max-w-[1400px] w-full mx-auto space-y-6">
                
                {/* Secondary filters toolbar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button className="text-[14px] font-bold text-primary border-b-2 border-primary pb-2">
                            My Providers <span className="ml-1 text-[11px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{filteredVendors.length}</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Sort selector */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                className="h-9 px-4 bg-white border border-slate-200 rounded-lg font-bold text-[13px] text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                                <span>Sort: {sortBy}</span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>

                            <AnimatePresence>
                                {isSortMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsSortMenuOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden p-1.5"
                                        >
                                            {[
                                                'Date created (newest)',
                                                'Date created (oldest)',
                                                'Name (A-Z)',
                                                'Name (Z-A)',
                                                'Hourly Rate (High-Low)',
                                                'Hourly Rate (Low-High)'
                                            ].map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => {
                                                        setSortBy(opt);
                                                        setIsSortMenuOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-lg transition-colors font-medium ${sortBy === opt ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}
                                                >
                                                    {opt}
                                                    {sortBy === opt && <Check className="w-4 h-4 text-indigo-600" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <button className="h-9 px-4 bg-white border border-slate-200 rounded-lg font-bold text-[13px] text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm">
                            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Grid Layout of Cards */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-64 bg-white rounded-2xl border border-slate-150 animate-pulse" />
                        ))}
                    </div>
                ) : filteredVendors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVendors.map((vendor: any) => {
                            const avatarColor = getAvatarColor(vendor.id);
                            return (
                                <motion.div 
                                    key={vendor.id}
                                    layout
                                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all hover:border-slate-300"
                                >
                                    {/* Card Header */}
                                    <div className="p-6 pb-4 flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[16px] border ${avatarColor} shrink-0`}>
                                                {getInitials(vendor.name)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[16px] text-slate-800 line-clamp-1 leading-tight hover:underline cursor-pointer" onClick={() => navigate(`/vendors/${vendor.id}`)}>
                                                    {vendor.name}
                                                </h3>
                                                {vendor.contactName && (
                                                    <p className="text-[13px] font-bold text-slate-400 mt-1">{vendor.contactName}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
                                                {vendor.type || 'Vendor'}
                                            </span>
                                            <button 
                                                onClick={() => favoriteMutation.mutate({ id: vendor.id, isFavorite: !vendor.isFavorite })}
                                                className={`p-1.5 rounded-lg hover:bg-slate-50 transition-colors ${vendor.isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'}`}
                                            >
                                                <Star className={`w-4 h-4 ${vendor.isFavorite ? 'fill-current' : ''}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="px-6 flex-1 space-y-3 text-[13px] font-medium text-slate-500">
                                        <div className="flex items-start gap-2.5">
                                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                            <span className="line-clamp-2 leading-relaxed">{vendor.address || '9630 Norwalk Boulevard, Santa Fe Springs, CA 90670'}</span>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="truncate hover:text-indigo-600 transition-colors">{vendor.email || 'la.sales@mcmaster.com'}</span>
                                        </div>

                                        {vendor.phone && (
                                            <div className="flex items-center gap-2.5">
                                                <MapPin className="w-4 h-4 text-transparent shrink-0" /> {/* Spacer */}
                                                <span>Phone: {vendor.phone}</span>
                                            </div>
                                        )}

                                        {/* Specialties List */}
                                        <div className="pt-2 border-t border-slate-100">
                                            {vendor.specialties && vendor.specialties.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {vendor.specialties.slice(0, 3).map((spec: string, idx: number) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200/50 rounded-md text-[11px] font-bold">
                                                            {spec}
                                                        </span>
                                                    ))}
                                                    {vendor.specialties.length > 3 && (
                                                        <span className="text-[11px] font-bold text-indigo-600 self-center">
                                                            +{vendor.specialties.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-[12px] italic text-slate-400">No specialties listed</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between shrink-0">
                                        <button 
                                            onClick={() => setDeleteVendorId(vendor.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Provider"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    setContactVendor(vendor);
                                                    setContactSubject(`Inquiry regarding ${vendor.type || 'Services'}`);
                                                }}
                                                className="px-3.5 py-1.5 border border-slate-200 hover:border-indigo-200 bg-white text-slate-600 hover:text-indigo-600 rounded-lg text-[12px] font-bold shadow-sm transition-colors"
                                            >
                                                Contact
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/vendors/${vendor.id}`)}
                                                className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-lg text-[12px] font-bold shadow-sm transition-colors"
                                            >
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-[18px] font-bold text-slate-800">No Providers Found</h3>
                        <p className="text-[14px] text-slate-400 mt-1 max-w-[400px]">We couldn't find any provider matching your search criteria. Try modifying your queries.</p>
                        <button 
                            onClick={() => {
                                setNeedsInput('');
                                setLocationInput('');
                                setDistanceInput('Any');
                                setActiveFilters({ needs: '', location: '', distance: 'Any' });
                            }}
                            className="mt-6 px-5 py-2 border border-slate-200 rounded-xl font-bold text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Reset Search Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Modals & AnimatePresence overlays */}
            {isCreateModalOpen && (
                <VendorModal onClose={() => setIsCreateModalOpen(false)} />
            )}

            <AnimatePresence>
                {contactVendor && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setContactVendor(null)}
                            className="absolute inset-0"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-[16px] text-slate-800">Contact {contactVendor.name}</h3>
                                <button onClick={() => setContactVendor(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">To</label>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={`${contactVendor.contactName || 'Primary Agent'} (${contactVendor.email || 'la.sales@mcmaster.com'})`}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] bg-slate-50 text-slate-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">Subject</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={contactSubject}
                                        onChange={(e) => setContactSubject(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] bg-white text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-500 uppercase">Message</label>
                                    <textarea 
                                        required
                                        rows={5}
                                        placeholder="Type your procurement request or service inquiry here..."
                                        value={contactMessage}
                                        onChange={(e) => setContactMessage(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] bg-white text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setContactVendor(null)}
                                        className="px-5 py-2.5 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all active:scale-95"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        Send Message
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Modal */}
            {deleteVendorId && (
                <ConfirmationModal 
                    isOpen={!!deleteVendorId}
                    title="Delete Provider Dossier"
                    message="Are you sure you want to permanently delete this provider? This action is irreversible."
                    onConfirm={() => deleteMutation.mutate(deleteVendorId)}
                    onClose={() => setDeleteVendorId(null)}
                />
            )}
        </div>
    );
};
