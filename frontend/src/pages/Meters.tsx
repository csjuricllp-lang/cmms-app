import { useState } from 'react';
import { 
    Activity, Search, 
    Gauge, Zap, 
    Settings2,
    BarChart3, Thermometer, Timer, GripVertical, Check, X, Plus as PlusIcon, ChevronDown, ChevronRight, MoreHorizontal, Upload, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocations, useAssets, useUsers, useCategories, useMeters } from '../hooks/useData';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { MeterInspector } from '../components/MeterInspector';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileMeters } from './MobileMeters';

export const MetersPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddFilterMenuOpen, setIsAddFilterMenuOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{type: string, value: string}[]>([]);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [selectedMeter, setSelectedMeter] = useState<any>(null);
    const [showArchived, setShowArchived] = useState(false);
    
    // Quick Filters
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [locationSearchTerm, setLocationSearchTerm] = useState('');
    const [includeSubLocations, setIncludeSubLocations] = useState(true);
    const [filterAsset, setFilterAsset] = useState('Asset'); // This will store Asset ID or 'Asset'
    
    // NEW METER FORM STATE
    const [newMeter, setNewMeter] = useState({
        name: '',
        unit: '',
        frequency: 1,
        assignedToId: '',
        locationId: '',
        assetId: '',
        categoryId: '',
        imageUrl: ''
    });

    const { data: locations } = useLocations();
    const { data: assets } = useAssets();
    const { data: users } = useUsers();
    const { data: categories } = useCategories();
    
    const [visibleColumns, setVisibleColumns] = useState({
        nextReading: true,
        unit: true,
        lastReading: true,
        frequency: true,
        category: true,
        location: true,
        asset: true,
        automated: true,
        dateCreated: true
    });

    const toggleColumn = (key: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const { data: metersData, isLoading, refetch: refetchMeters } = useMeters({
        sortBy,
        sortOrder,
        search: searchTerm,
        archived: showArchived
    });
    const meters = Array.isArray(metersData) ? metersData : (metersData as any)?.items || [];

    const filteredMeters = meters?.filter((m: any) => {
        const matchesSearch = (m?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesActiveFilters = activeFilters.every(filter => {
            if (filter.type === 'Meter Name') return (m?.name || '').toLowerCase().includes(filter.value.toLowerCase());
            if (filter.type === 'Location') {
                const locName = m?.location?.name || m?.asset?.location?.name || '';
                return locName.toLowerCase().includes(filter.value.toLowerCase());
            }
            if (filter.type === 'Asset') return (m?.asset?.name || '').toLowerCase().includes(filter.value.toLowerCase());
            if (filter.type === 'Date Created') {
                const dateStr = m?.createdAt ? new Date(m.createdAt).toLocaleDateString() : '';
                return dateStr.includes(filter.value);
            }
            return true;
        });

        const matchesQuickLocation = selectedLocationIds.length === 0 || 
            (m?.asset?.locationId && selectedLocationIds.includes(m.asset.locationId)) || 
            (m?.locationId && selectedLocationIds.includes(m.locationId)) ||
            (includeSubLocations && m?.asset?.location?.parentId && selectedLocationIds.includes(m.asset.location.parentId));
            
        const matchesQuickAsset = filterAsset === 'Asset' || m?.assetId === filterAsset;

        return matchesSearch && matchesActiveFilters && matchesQuickLocation && matchesQuickAsset;
    });

    const handleResetFilters = () => {
        setSearchTerm('');
        setActiveFilters([]);
        setSelectedLocationIds([]);
        setFilterAsset('Asset');
        refetchMeters();
    };

    const getMeterIcon = (unit?: string) => {
        if (!unit) return <Activity className="w-5 h-5" />;
        switch (unit.toLowerCase()) {
            case 'c': case 'f': case 'temp': return <Thermometer className="w-5 h-5" />;
            case 'psi': case 'bar': return <Gauge className="w-5 h-5" />;
            case 'v': case 'a': case 'e': return <Zap className="w-5 h-5" />;
            case 'h': case 'hours': return <Timer className="w-5 h-5" />;
            default: return <Activity className="w-5 h-5" />;
        }
    };

    const handleCreateMeter = async () => {
        if (!newMeter.name || !newMeter.unit || !newMeter.assetId) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const payload = { ...newMeter };
            if (!payload.assignedToId) delete payload.assignedToId;
            if (!payload.locationId) delete payload.locationId;
            if (!payload.categoryId) delete payload.categoryId;
            if (!payload.imageUrl) delete payload.imageUrl;
            
            await api.post('/meters', payload);
            toast.success('Meter created successfully');
            setIsCreateModalOpen(false);
            setNewMeter({
                name: '',
                unit: '',
                frequency: 1,
                assignedToId: '',
                locationId: '',
                assetId: '',
                categoryId: '',
                imageUrl: ''
            });
            refetchMeters();
        } catch (error) {
            toast.error('Failed to create meter');
            console.error(error);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const treeifyLocations = (locs: any[]) => {
        const tree: any[] = [];
        const map = new Map();
        locs.forEach(loc => map.set(loc.id, { ...loc, children: [] }));
        locs.forEach(loc => {
            if (loc.parentId && map.has(loc.parentId)) {
                map.get(loc.parentId).children.push(map.get(loc.id));
            } else {
                tree.push(map.get(loc.id));
            }
        });
        return tree;
    };


    const renderLocationItem = (loc: any, depth = 0) => {
        const hasChildren = loc.children && loc.children.length > 0;
        const isSelected = selectedLocationIds.includes(loc.id);
        const matchesSearch = loc.name.toLowerCase().includes(locationSearchTerm.toLowerCase());

        if (locationSearchTerm && !matchesSearch && !loc.children.some((c: any) => c.name.toLowerCase().includes(locationSearchTerm.toLowerCase()))) {
            return null;
        }

        return (
            <div key={loc.id}>
                <div 
                    className="flex items-center gap-2 py-2 px-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                    style={{ paddingLeft: `${depth * 24 + 16}px` }}
                    onClick={() => {
                        if (isSelected) {
                            setSelectedLocationIds(prev => prev.filter(id => id !== loc.id));
                        } else {
                            setSelectedLocationIds(prev => [...prev, loc.id]);
                        }
                    }}
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        {hasChildren && <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />}
                    </div>
                    <div className="relative flex items-center select-none">
                        <input 
                            type="checkbox" 
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                    </div>
                    <span className="text-[15px] text-gray-700 font-medium flex-1">{loc.name}</span>
                    {loc._count?.children > 0 && (
                        <span className="text-[13px] text-gray-400">{loc._count.children} sub-location{loc._count.children > 1 ? 's' : ''}</span>
                    )}
                </div>
                {hasChildren && loc.children.map((child: any) => renderLocationItem(child, depth + 1))}
            </div>
        );
    };

    const renderCreateMeterModal = () => (
        <AnimatePresence>
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                                <h2 className="text-xl font-bold text-gray-900">Create Meter</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleCreateMeter}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-[15px] font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Create Meter
                                </button>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="flex-1 overflow-auto p-8">
                            <div className="max-w-[500px] mx-auto space-y-8">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Details</h3>
                                    
                                    <div className="space-y-5">
                                        {/* Name */}
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                placeholder="Summarize the problem or issue"
                                                value={newMeter.name}
                                                onChange={e => setNewMeter({...newMeter, name: e.target.value})}
                                                className="w-full h-11 px-4 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            />
                                        </div>

                                        {/* Unit */}
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-gray-700">Unit of Measurement <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                value={newMeter.unit}
                                                onChange={e => setNewMeter({...newMeter, unit: e.target.value})}
                                                className="w-full h-11 px-4 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            />
                                        </div>

                                        {/* Frequency */}
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-gray-700">Frequency <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={newMeter.frequency}
                                                    onChange={e => setNewMeter({...newMeter, frequency: parseInt(e.target.value) || 0})}
                                                    className="w-full h-11 px-4 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                                />
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setNewMeter(prev => ({...prev, frequency: prev.frequency + 1}))}
                                                        className="p-0.5 hover:bg-gray-100 rounded text-gray-400"
                                                    >
                                                        <ChevronDown className="w-3 h-3 rotate-180" />
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setNewMeter(prev => ({...prev, frequency: Math.max(0, prev.frequency - 1)}))}
                                                        className="p-0.5 hover:bg-gray-100 rounded text-gray-400"
                                                    >
                                                        <ChevronDown className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Image Upload */}
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-gray-700">Image</label>
                                            <input 
                                                type="file" 
                                                id="meter-image-upload" 
                                                className="hidden" 
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) toast.success(`Selected: ${file.name}`);
                                                }}
                                            />
                                            <label 
                                                htmlFor="meter-image-upload"
                                                className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
                                            >
                                                <div className="h-10 px-4 bg-white border border-gray-300 rounded-md flex items-center justify-center text-sm font-medium text-gray-700 group-hover:border-blue-300 transition-colors shadow-sm">
                                                    Upload
                                                </div>
                                                <span className="text-[14px] text-gray-400">or Drop Image</span>
                                            </label>
                                        </div>

                                        {/* Worker */}
                                        <div className="space-y-1.5 pt-4">
                                            <label className="text-[14px] font-medium text-gray-700">Worker</label>
                                            <div className="relative">
                                                <select 
                                                    value={newMeter.assignedToId}
                                                    onChange={e => setNewMeter({...newMeter, assignedToId: e.target.value})}
                                                    className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                                >
                                                    <option value="">Select Worker</option>
                                                    {users?.map(u => (
                                                        <option key={(u as any).userOrgId || u.id} value={(u as any).userOrgId || u.id}>{u.name || 'Unknown'}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-gray-700">Location</label>
                                            <div className="relative">
                                                <select 
                                                    value={newMeter.locationId}
                                                    onChange={e => setNewMeter({...newMeter, locationId: e.target.value})}
                                                    className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                                >
                                                    <option value="">Select Location</option>
                                                    {locations?.map(l => (
                                                        <option key={l.id} value={l.id}>{l?.name || 'Unnamed'}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Asset */}
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-gray-700">Asset <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select 
                                                    value={newMeter.assetId}
                                                    onChange={e => setNewMeter({...newMeter, assetId: e.target.value})}
                                                    className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                                >
                                                    <option value="">Select Asset</option>
                                                    {assets?.map(a => (
                                                        <option key={a.id} value={a.id}>{a?.name || 'Unnamed'}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div className="space-y-1.5">
                                            <label className="text-[14px] font-medium text-gray-700">Category</label>
                                            <div className="relative">
                                                <select 
                                                    value={newMeter.categoryId}
                                                    onChange={e => setNewMeter({...newMeter, categoryId: e.target.value})}
                                                    className="w-full h-11 pl-4 pr-10 bg-white border border-gray-300 rounded-md text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories?.map(c => (
                                                        <option key={c.id} value={c.id}>{c?.name || 'Uncategorized'}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    const isMobile = useMediaQuery('(max-width: 768px)');

    if (isMobile) {
        return (
            <>
                <MobileMeters 
                    meters={meters}
                    isLoading={isLoading}
                    onSelectMeter={setSelectedMeter}
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                />
                
                <AnimatePresence>
                    {selectedMeter && (
                        <MeterInspector 
                            meter={selectedMeter}
                            onClose={() => setSelectedMeter(null)}
                        />
                    )}
                </AnimatePresence>

                {renderCreateMeterModal()}
            </>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] animate-in fade-in duration-700 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0 relative z-40 py-2">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-md">
                        <Gauge className="w-5 h-5 text-gray-500" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Meters</h1>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-9 px-4 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Create Meter
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                            className="h-9 w-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                            {isMoreMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsMoreMenuOpen(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 flex flex-col gap-1 origin-top-right text-left"
                                    >
                                        <button className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors group">
                                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                            <span className="text-[17px] font-medium text-gray-700">Import/Export</span>
                                        </button>
                                        <button className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors group leading-tight">
                                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors ml-0.5" />
                                            <span className="text-[17px] font-medium text-gray-700">Import/Export<br />Meter Triggers</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Secondary Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 shrink-0 relative z-30 py-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                            showArchived 
                                ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold shadow-xs' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <Archive className="w-4 h-4" />
                        {showArchived ? 'Viewing Archived' : 'Show Archived'}
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button 
                            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                            className="flex items-center gap-2 text-sm text-gray-700 font-medium hover:text-gray-900 transition-colors"
                        >
                            <GripVertical className="w-4 h-4 transform rotate-90" />
                            Sort: {sortBy === 'name' ? 'Meter Name' : 'Date Created'}
                        </button>

                        <AnimatePresence>
                            {isSortMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsSortMenuOpen(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden origin-top-right"
                                    >
                                        <div className="p-4 border-b border-gray-50 bg-[#FAFAFA]/50">
                                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Sort By</h3>
                                        </div>
                                        <div className="p-1.5">
                                            <button 
                                                onClick={() => { setSortBy('name'); setIsSortMenuOpen(false); }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
                                            >
                                                <span className={`text-[15px] ${sortBy === 'name' ? 'text-indigo-600 font-semibold' : 'text-gray-700 font-medium'}`}>Meter Name</span>
                                                {sortBy === 'name' && <Check className="w-4 h-4 text-indigo-600" />}
                                            </button>
                                            <button 
                                                onClick={() => { setSortBy('createdAt'); setIsSortMenuOpen(false); }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
                                            >
                                                <span className={`text-[15px] ${sortBy === 'createdAt' ? 'text-indigo-600 font-semibold' : 'text-gray-700 font-medium'}`}>Date Created</span>
                                                {sortBy === 'createdAt' && <Check className="w-4 h-4 text-indigo-600" />}
                                            </button>
                                        </div>

                                        <div className="p-4 border-t border-b border-gray-50 bg-[#FAFAFA]/50">
                                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Order</h3>
                                        </div>
                                        <div className="p-1.5">
                                            <button 
                                                onClick={() => { setSortOrder('desc'); setIsSortMenuOpen(false); }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
                                            >
                                                <span className={`text-[15px] ${sortOrder === 'desc' ? 'text-indigo-600 font-semibold' : 'text-gray-700 font-medium'}`}>Descending</span>
                                                {sortOrder === 'desc' && <Check className="w-4 h-4 text-indigo-600" />}
                                            </button>
                                            <button 
                                                onClick={() => { setSortOrder('asc'); setIsSortMenuOpen(false); }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
                                            >
                                                <span className={`text-[15px] ${sortOrder === 'asc' ? 'text-indigo-600 font-semibold' : 'text-gray-700 font-medium'}`}>Ascending</span>
                                                {sortOrder === 'asc' && <Check className="w-4 h-4 text-indigo-600" />}
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="h-4 w-px bg-gray-300" />
                    <div className="relative">
                        <button 
                            onClick={() => setIsColumnsMenuOpen(!isColumnsMenuOpen)}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${isColumnsMenuOpen ? 'text-indigo-600' : 'text-gray-700 hover:text-gray-900'}`}
                        >
                            <BarChart3 className="w-4 h-4 transform rotate-90" />
                            Columns
                        </button>

                        <AnimatePresence>
                            {isColumnsMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsColumnsMenuOpen(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-3 flex flex-col gap-1 origin-top-right"
                                    >
                                        <label className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-not-allowed opacity-50">
                                            <GripVertical className="w-4 h-4 text-gray-400" />
                                            <input type="checkbox" checked disabled className="w-4 h-4 rounded text-indigo-600 border-gray-300 pointer-events-none" />
                                            <span className="text-sm font-medium text-gray-400">Meter Name</span>
                                        </label>
                                        
                                        {[
                                            { key: 'nextReading', label: 'Next Reading' },
                                            { key: 'unit', label: 'Unit of Measurement' },
                                            { key: 'lastReading', label: 'Last Reading' },
                                            { key: 'frequency', label: 'Frequency' },
                                            { key: 'category', label: 'Category' },
                                            { key: 'location', label: 'Location' },
                                            { key: 'asset', label: 'Asset' },
                                            { key: 'automated', label: 'Automated' },
                                            { key: 'dateCreated', label: 'Date Created' }
                                        ].map(({ key, label }) => (
                                            <label key={key} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
                                                <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={visibleColumns[key as keyof typeof visibleColumns]}
                                                        onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                                                        className="peer sr-only" 
                                                    />
                                                    <div className="w-4 h-4 border-2 border-gray-300 rounded peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                                        <Check className={`w-3 h-3 text-white transition-transform duration-200 ${visibleColumns[key as keyof typeof visibleColumns] ? 'scale-100' : 'scale-0'}`} />
                                                    </div>
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium select-none">{label}</span>
                                            </label>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="relative w-64 ml-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-8 pl-9 pr-3 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200 shrink-0 relative overflow-x-auto no-scrollbar py-2">
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => setIsFiltersModalOpen(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium transition-colors ${activeFilters.length > 0 ? 'text-indigo-600 border-indigo-200 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Settings2 className="w-4 h-4" />
                        Filters
                        {activeFilters.length > 0 && (
                            <span className="flex items-center justify-center w-5 h-5 ml-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                                {activeFilters.length}
                            </span>
                        )}
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300" />
                    
                    <div className="relative">
                        <button 
                            onClick={() => setIsLocationModalOpen(true)}
                            className={`flex items-center gap-2 h-[34px] px-3 bg-white border border-gray-300 rounded-md text-sm font-medium transition-colors ${selectedLocationIds.length > 0 ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                            Location
                            {selectedLocationIds.length > 0 && <span className="ml-1 bg-indigo-100 text-indigo-700 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{selectedLocationIds.length}</span>}
                            <ChevronDown className="w-4 h-4 text-gray-500 ml-1" />
                        </button>
                    </div>

                    <div className="relative">
                        <select 
                            value={filterAsset}
                            onChange={(e) => setFilterAsset(e.target.value)}
                            className={`appearance-none h-[34px] pl-8 pr-8 bg-white border border-gray-300 rounded-md text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${filterAsset !== 'Asset' ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-gray-700'}`}
                        >
                            <option value="Asset">Asset</option>
                            {assets?.map((asset: any) => (
                                <option key={asset.id} value={asset.id}>{asset.name}</option>
                            ))}
                        </select>
                        <Settings2 className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${filterAsset !== 'Asset' ? 'text-indigo-500' : 'text-gray-500'}`} />
                        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${filterAsset !== 'Asset' ? 'text-indigo-500' : 'text-gray-500'}`} />
                    </div>

                    {/* Active Filters Display */}
                    {activeFilters.map((filter, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-md text-sm text-indigo-700 font-medium">
                            <span className="opacity-70">{filter.type}:</span>
                            <span>{filter.value}</span>
                            <button 
                                onClick={() => setActiveFilters(prev => prev.filter((_, i) => i !== idx))}
                                className="ml-1 p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    <button 
                        onClick={handleResetFilters}
                        className="text-[15px] font-medium text-[#4F46E5] hover:text-indigo-800 transition-colors px-4 py-1.5"
                    >
                        Reset Filters
                    </button>
                </div>
                <button className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    Save View
                </button>
            </div>

            {/* Filters Modal */}
            <AnimatePresence>
                {isFiltersModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsFiltersModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-[600px] bg-white rounded-xl shadow-2xl flex flex-col overflow-visible" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                                <h2 className="text-[22px] font-semibold text-gray-900">Filters</h2>
                                <button onClick={() => setIsFiltersModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="flex-1 p-6 min-h-[160px] flex flex-col">
                                {activeFilters.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center flex-1 py-8 text-center text-gray-500">
                                        <h3 className="text-base font-semibold text-gray-900 mb-1">No filters added yet.</h3>
                                        <p className="text-[15px]">When you add filters, they'll appear here.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {activeFilters.map((filter, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="flex-1 flex gap-2">
                                                    <div className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-md flex items-center text-sm font-medium text-gray-700 min-w-[140px]">{filter.type}</div>
                                                    <input type="text" value={filter.value} onChange={(e) => {
                                                        const newFilters = [...activeFilters];
                                                        newFilters[index].value = e.target.value;
                                                        setActiveFilters(newFilters);
                                                    }} placeholder="Enter filter value..." className="flex-1 h-10 px-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                                                </div>
                                                <button onClick={() => setActiveFilters(prev => prev.filter((_, i) => i !== index))} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-b-xl">
                                <div className="relative">
                                    <button onClick={() => setIsAddFilterMenuOpen(!isAddFilterMenuOpen)} className="h-[40px] px-4 flex items-center gap-2 bg-[#F3F4F6] hover:bg-gray-200 rounded-md text-[15px] font-medium transition-colors">
                                        <PlusIcon className="w-[18px] h-[18px] text-[#4F46E5]" />
                                        <span className="text-[#4F46E5]">Add Filter</span>
                                        <ChevronDown className="w-4 h-4 text-[#4F46E5] ml-1 opacity-80" />
                                    </button>
                                    <AnimatePresence>
                                        {isAddFilterMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsAddFilterMenuOpen(false)} />
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute left-0 top-full mt-2 w-[220px] bg-white rounded-lg shadow-xl shadow-black/10 border border-gray-100 z-50 py-1.5 overflow-hidden font-sans">
                                                    {['Meter Name', 'Location', 'Asset', 'Date Created'].map(opt => (
                                                        <button key={opt} onClick={() => { setActiveFilters([...activeFilters, { type: opt, value: '' }]); setIsAddFilterMenuOpen(false); }} className="w-full text-left px-5 py-2.5 hover:bg-gray-50 text-[15px] text-gray-700 transition-colors">{opt}</button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsFiltersModalOpen(false)} className="h-[40px] px-5 bg-white border border-gray-300 rounded-md text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button onClick={() => setIsFiltersModalOpen(false)} className="h-[40px] px-6 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-md text-[15px] font-medium transition-colors">Apply</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Location Modal */}
            <AnimatePresence>
                {isLocationModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsLocationModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-[500px] bg-white rounded-xl shadow-2xl flex flex-col">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Location</h2>
                                <button onClick={() => setIsLocationModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" placeholder="Search" value={locationSearchTerm} onChange={(e) => setLocationSearchTerm(e.target.value)} className="w-full h-11 pl-10 pr-4 bg-white border border-[#3B82F6] rounded-md text-[15px] focus:outline-none ring-4 ring-blue-500/10" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[15px] font-medium text-gray-700">Include sub-locations in selection</span>
                                    <button onClick={() => setIncludeSubLocations(!includeSubLocations)} className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${includeSubLocations ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${includeSubLocations ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto max-h-[400px] border-t border-gray-100">
                                {locations && treeifyLocations(locations).map(loc => renderLocationItem(loc))}
                            </div>
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                                <span className="text-[15px] text-gray-500 font-medium">{selectedLocationIds.length} selected</span>
                                <div className="flex gap-3">
                                    <button onClick={() => { setSelectedLocationIds([]); setIsLocationModalOpen(false); }} className="h-10 px-5 bg-white border border-gray-300 rounded-md text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button onClick={() => setIsLocationModalOpen(false)} className="h-10 px-6 bg-blue-600 text-white rounded-md text-[15px] font-medium hover:bg-blue-700 transition-colors">Save</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Meter Modal */}
            {renderCreateMeterModal()}

            <div className="flex-1 overflow-auto bg-[#FAFAFA] p-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-w-[1200px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-white">
                                <th className="px-4 py-3 w-12 text-center">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                </th>
                                <th className="px-4 py-3 text-[13px] font-semibold text-gray-900 w-[20%]">Meter Name</th>
                                {visibleColumns.nextReading && <th className="px-4 py-3 text-[13px] font-semibold text-gray-900 whitespace-nowrap">Next Reading</th>}
                                {visibleColumns.unit && <th className="px-4 py-3 text-[13px] font-semibold text-gray-900 whitespace-nowrap">Unit of Me...</th>}
                                {visibleColumns.lastReading && <th className="px-4 py-3 text-[13px] font-semibold text-gray-900">Last Reading</th>}
                                {visibleColumns.frequency && <th className="px-4 py-3 text-[13px] font-semibold text-gray-900">Frequency</th>}
                                {visibleColumns.category && <th className="px-4 py-3 text-[13px] font-semibold text-gray-900">Category</th>}
                                {visibleColumns.location && <th className="px-4 py-3 text-[13px] font-semibold text-gray-900">Location</th>}
                                {visibleColumns.asset && <th className="px-4 py-3 text-[13px] font-semibold text-gray-900">Asset</th>}
                                {visibleColumns.automated && <th className="px-4 py-3 text-[13px] font-semibold text-gray-900">Automated</th>}
                                {visibleColumns.dateCreated && <th className="px-4 py-3 text-[13px] font-semibold text-gray-900">Date Created</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-gray-500">Loading meters...</td>
                                </tr>
                            ) : filteredMeters?.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-gray-500 bg-gray-50/50">No metrics found matching your criteria.</td>
                                </tr>
                            ) : (
                                filteredMeters?.map((meter: any) => (
                                    <tr 
                                        key={meter.id} 
                                        onClick={() => setSelectedMeter(meter)}
                                        className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-4 py-3 w-12 text-center" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
                                                    {getMeterIcon(meter.unit)}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{meter.name}</span>
                                            </div>
                                        </td>
                                        {visibleColumns.nextReading && (
                                            <td className="px-4 py-3">
                                                {meter.currentValue > (meter.threshold || 100) ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700">Past Due</span>
                                                ) : (
                                                    <span className="text-sm text-gray-600">-</span>
                                                )}
                                            </td>
                                        )}
                                        {visibleColumns.unit && (
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600 truncate max-w-[120px] block" title={meter.unit}>{meter.unit}</span>
                                            </td>
                                        )}
                                        {visibleColumns.lastReading && (
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600">{meter.currentValue} {meter.unit}</span>
                                            </td>
                                        )}
                                        {visibleColumns.frequency && (
                                            <td className="px-4 py-3"><span className="text-sm text-gray-600">{meter.frequency || '-'}</span></td>
                                        )}
                                        {visibleColumns.category && (
                                            <td className="px-4 py-3"><span className="text-sm text-gray-600">{meter.category?.name || 'Uncategorized'}</span></td>
                                        )}
                                        {visibleColumns.location && (
                                            <td className="px-4 py-3"><span className="text-sm text-gray-600 truncate max-w-[150px] block">{meter.location?.name || meter.asset?.location?.name || '-'}</span></td>
                                        )}
                                        {visibleColumns.asset && (
                                            <td className="px-4 py-3"><span className="text-sm text-gray-600 truncate max-w-[150px] block">{meter.asset?.name || '-'}</span></td>
                                        )}
                                        {visibleColumns.automated && (
                                            <td className="px-4 py-3"><span className="text-sm text-gray-600">No</span></td>
                                        )}
                                        {visibleColumns.dateCreated && (
                                            <td className="px-4 py-3"><span className="text-sm text-gray-600">{formatDate(meter.createdAt)}</span></td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedMeter && (
                    <MeterInspector 
                        meter={selectedMeter}
                        onClose={() => setSelectedMeter(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
