import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Search, X, ChevronDown, ChevronRight, 
    Filter, Settings2, MoreHorizontal,
    Box, MapPin, Barcode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteAssets, useAssetMutations } from '../hooks/useData';
import { CreateAssetModal } from '../components/CreateAssetModal';
import { LocationFilterModal } from '../components/LocationFilterModal';
import { ImportAssetsModal } from '../components/ImportAssetsModal';
import { AssetHeaderActionsPopover } from '../components/AssetHeaderActionsPopover';
import { TableEmptyState } from '../components/EmptyState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Download, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileAssets } from './MobileAssets';
import { ColumnPickerPopover } from '../components/ColumnPickerPopover';


const ALL_COLUMNS = [
    { id: 'Name', label: 'Name', isMandatory: true },
    { id: 'Image', label: 'Image' },
    { id: 'Location', label: 'Location' },
    { id: 'Barcode', label: 'Barcode' },
    { id: 'Serial Number', label: 'Serial Number' },
    { id: 'Description', label: 'Description' },
    { id: 'Category', label: 'Category' },
    { id: 'Status', label: 'Status' },
];

import { useUserRole } from '../hooks/useUserRole';

export const AssetsPage = () => {
    const isMobile = useMediaQuery('(max-width: 767px)');
    
    const { canManageData: canManageAssets } = useUserRole();

    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isHeaderActionsOpen, setIsHeaderActionsOpen] = useState(false);
    const [headerAnchorRect, setHeaderAnchorRect] = useState<DOMRect | undefined>();
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [locationAnchorRect, setLocationAnchorRect] = useState<DOMRect | undefined>();
    const [isAddFilterMenuOpen, setIsAddFilterMenuOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
    const [columnAnchorRect, setColumnAnchorRect] = useState<DOMRect | undefined>();
    const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(ALL_COLUMNS.map(c => c.id));

    // Filters State
    const [activeFilters, setActiveFilters] = useState<{type: string, value: string}[]>([{ type: 'Status', value: 'Hide Archived' }]);
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [includeSubLocations, setIncludeSubLocations] = useState(true);
    
    // Bulk Selection State
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

    const filtersForApi = {
        search: searchTerm,
        status: activeFilters.find(f => f.type === 'Status')?.value,
        locationId: selectedLocationIds.length > 0 ? selectedLocationIds[0] : undefined, // simplified for now
        categoryId: activeFilters.find(f => f.type === 'Category')?.value
    };

    const { 
        data: assetsData, 
        isLoading, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage,
        refetch: refetchAssets 
    } = useInfiniteAssets(filtersForApi);

    const { bulkDelete } = useAssetMutations();

    const assets = assetsData?.pages.flatMap(page => page.items || page) || [];

    const handleBulkDelete = async () => {
        if (!selectedAssetIds.length) return;
        
        // Show confirmation before deleting
        if (window.confirm(`Are you sure you want to delete ${selectedAssetIds.length} assets? This action cannot be undone.`)) {
            const loadingToast = toast.loading(`Deleting ${selectedAssetIds.length} assets...`);
            try {
                await bulkDelete.mutateAsync(selectedAssetIds);
                toast.success(`Successfully deleted ${selectedAssetIds.length} assets`, { id: loadingToast });
                setSelectedAssetIds([]); // Clear selection
                refetchAssets();
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete assets', { id: loadingToast });
            }
        }
    };

    const handleExportCsv = () => {
        if (!assets || assets.length === 0) {
            toast.error('No assets to export');
            return;
        }

        const headers = ALL_COLUMNS.map(c => c.id).join(',');
        const rows = assets.map((asset: any) => {
            return ALL_COLUMNS.map((col: any) => {
                const colId = col.id;
                let val = '-';
                if (colId === 'Name') val = asset.name;
                else if (colId === 'Location') val = asset.location?.name || '-';
                else if (colId === 'Category') val = asset.category || '-';
                else if (colId === 'Status') val = asset.status || '-';
                else if (colId === 'Barcode') val = asset.barCode || '-';
                else val = asset[colId.charAt(0).toLowerCase() + colId.slice(1).replace(' ', '')] || '-';
                
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',');
        });

        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Asset_Registry_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Asset registry exported successfully');
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setActiveFilters([{ type: 'Status', value: 'Hide Archived' }]);
        setSelectedLocationIds([]);
        refetchAssets();
    };

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'OPERATIONAL': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'DOWN': return 'bg-red-50 text-red-700 border-red-100';
            case 'MAINTENANCE': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'STANDBY': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const renderLocationItem = (loc: any, depth = 0) => {
        const isSelected = selectedLocationIds.includes(loc.id);
        const hasChildren = loc.children && loc.children.length > 0;

        return (
            <div key={loc.id}>
                <div 
                    className={`flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                    style={{ paddingLeft: `${depth * 20 + 12}px` }}
                    onClick={() => {
                        setSelectedLocationIds((prev: string[]) => 
                            prev.includes(loc.id) ? prev.filter((id: string) => id !== loc.id) : [...prev, loc.id]
                        );
                    }}
                >
                    <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} 
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <MapPin className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>{loc.name}</span>
                </div>
                {hasChildren && loc.children.map((child: any) => renderLocationItem(child, depth + 1))}
            </div>
        );
    };

    const exportToExcel = () => {
        if (!assets || assets.length === 0) {
            toast.error('No assets to export');
            return;
        }
        
        const data = assets.map((asset: any) => ({
            ID: asset.id,
            Name: asset.name,
            Category: asset.category,
            Location: asset.locationName || asset.locationId,
            Area: asset.area,
            Model: asset.model,
            Barcode: asset.barcode,
            SerialNumber: asset.serialNumber,
            Status: asset.status,
            DateCreated: asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
        XLSX.writeFile(workbook, `CMMS_Assets_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Assets exported successfully');
    };

    return (
        <>
            {isMobile ? (
                <MobileAssets 
                    assets={assets}
                    isLoading={isLoading}
                    refetchAssets={refetchAssets}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    activeFilters={activeFilters}
                    setActiveFilters={setActiveFilters}
                    selectedLocationIds={selectedLocationIds}
                    includeSubLocations={includeSubLocations}
                    visibleColumnIds={visibleColumnIds}
                    setVisibleColumnIds={setVisibleColumnIds}
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                    onOpenLocationFilter={(rect) => {
                        setLocationAnchorRect(rect);
                        setIsLocationModalOpen(true);
                    }}
                    onExportCsv={handleExportCsv}
                    onExportExcel={exportToExcel}
                    onResetFilters={handleResetFilters}
                    onImport={() => setIsImportModalOpen(true)}
                    onGenerateQR={() => toast.success('Generating QR codes for unnamed assets...')}
                    onDownloadLabels={() => toast.success('Downloading QR labels (1" x 2-5/8")...')}
                    onOpenFiltersModal={() => setIsFiltersModalOpen(true)}
                />
            ) : (
                <div className="flex flex-col h-full bg-white relative">
            {/* Header Area */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white z-20 overflow-x-auto no-scrollbar py-2">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        {assets?.length || 0} Results Returned
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                    <button 
                        onClick={(e) => {
                            setColumnAnchorRect(e.currentTarget.getBoundingClientRect());
                            setIsColumnsMenuOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <Settings2 className="w-4 h-4" />
                        Columns
                    </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search assets..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-muted border border-transparent focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-md text-sm w-64 text-foreground placeholder:text-muted-foreground transition-all outline-none"
                        />
                    </div>
                    {canManageAssets && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-all shadow-sm active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Create Asset
                            </button>
                            <button 
                                onClick={(e) => {
                                    setHeaderAnchorRect(e.currentTarget.getBoundingClientRect());
                                    setIsHeaderActionsOpen(true);
                                }}
                                className="bg-white border border-gray-200 p-2 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <MoreHorizontal className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 px-8 py-3 bg-white border-b border-gray-200 z-10 overflow-x-auto no-scrollbar py-2">
                <button 
                    onClick={() => setIsFiltersModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-[#EEF2FF] border border-[#E0E7FF] text-[#4338CA] rounded-md text-[14px] font-semibold hover:bg-[#E0E7FF] transition-colors shrink-0"
                >
                    <Filter className="w-4 h-4" />
                    Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
                </button>

                <div className="relative">
                    <button 
                        onClick={(e) => {
                            setLocationAnchorRect(e.currentTarget.getBoundingClientRect());
                            setIsLocationModalOpen(true);
                        }}
                        className={`flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-md text-[14px] font-semibold transition-colors hover:bg-gray-50 ${selectedLocationIds.length > 0 ? 'border-blue-600 text-blue-700 bg-blue-50' : 'text-gray-700'}`}
                    >
                        Location
                        <ChevronDown className="w-4 h-4 opacity-70" />
                    </button>
                    {selectedAssetIds.length > 0 && (
                        <div className="flex items-center gap-2 ml-4 px-2 py-1 bg-blue-50/50 rounded-lg border border-blue-100">
                            <span className="text-[13px] font-bold text-blue-800 px-2">{selectedAssetIds.length} Selected</span>
                            <div className="w-[1px] h-4 bg-blue-200 mx-1" />
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-red-50 text-red-600 rounded-md text-[13px] font-bold transition-all border border-transparent hover:border-red-200 shadow-sm"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        </div>
                    )}

                    <LocationFilterModal 
                        isOpen={isLocationModalOpen}
                        onClose={() => setIsLocationModalOpen(false)}
                        onSave={(ids, includeSubs) => {
                            setSelectedLocationIds(ids);
                            setIncludeSubLocations(includeSubs);
                            setIsLocationModalOpen(false);
                        }}
                        initialSelectedIds={selectedLocationIds}
                        initialIncludeSublocations={includeSubLocations}
                        anchorRect={locationAnchorRect}
                    />
                </div>

                <div className="flex items-center gap-2 flex-1">
                    {activeFilters.map((filter, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[13px] text-blue-700 font-medium">
                            <span className="opacity-70">{filter.type}:</span>
                            {filter.value}
                            {filter.type !== 'Status' && (
                                <button onClick={() => setActiveFilters((prev: any[]) => prev.filter((_: any, i: number) => i !== idx))}><X className="w-3 h-3 hover:text-blue-900" /></button>
                            )}
                        </div>
                    ))}
                    {selectedLocationIds.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[13px] text-blue-700 font-medium">
                            <MapPin className="w-3 h-3 opacity-70" />
                            {selectedLocationIds.length} Locations
                            <button onClick={() => setSelectedLocationIds([])}><X className="w-3 h-3 hover:text-blue-900" /></button>
                        </div>
                    )}
                    <button 
                        onClick={handleResetFilters}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors ml-2"
                    >
                        Reset Filters
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">Save View</button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-[#FAFAFA] p-6 pt-2">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-w-[1400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-white">
                                <th className="px-5 py-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={selectedAssetIds.length === assets.length && assets.length > 0}
                                        onChange={() => {
                                            if (selectedAssetIds.length === assets.length && assets.length > 0) {
                                                setSelectedAssetIds([]);
                                            } else {
                                                setSelectedAssetIds(assets.map((a: any) => a.id));
                                            }
                                        }}
                                    />
                                </th>
                                {ALL_COLUMNS.filter((col: any) => visibleColumnIds.includes(col.id)).map((col: any) => (
                                    <th key={col.id} className="px-5 py-4 text-[13px] font-bold text-gray-900 uppercase tracking-tight whitespace-nowrap">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                Array(8).fill(0).map((_, i: number) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-5"><div className="h-4 w-4 bg-gray-100 rounded" /></td>
                                        <td className="p-5" colSpan={visibleColumnIds.length}><div className="h-4 bg-gray-50 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : assets.length === 0 ? (
                                <TableEmptyState
                                    variant="asset"
                                    colSpan={visibleColumnIds.length + 1}
                                    title="No assets found"
                                    description="Try adjusting your filters or search term."
                                />
                            ) : assets.map((asset: any) => {
                            const isSelected = selectedAssetIds.includes(asset.id);
                            return (
                                <tr 
                                    key={asset.id} 
                                    className={`transition-colors group cursor-pointer ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-[#F9FAFB]'}`}
                                    onClick={() => navigate(`/assets/${asset.id}`)}
                                >
                                    <td className="px-5 py-4 text-center sticky left-0 z-10 border-r border-gray-100 bg-white group-hover:bg-gray-50/50 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                setSelectedAssetIds(prev => 
                                                    prev.includes(asset.id) 
                                                        ? prev.filter(id => id !== asset.id)
                                                        : [...prev, asset.id]
                                                );
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                        />
                                    </td>
                                    {ALL_COLUMNS.filter((col: any) => visibleColumnIds.includes(col.id)).map((col: any) => (
                                        <td key={col.id} className="px-5 py-4">
                                            {col.id === 'Name' && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                                                        <Box className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{asset.name}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {col.id === 'Image' && (
                                                asset.imageUrl ? (
                                                    <img src={asset.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                        <Box className="w-4 h-4 text-gray-300" />
                                                    </div>
                                                )
                                            )}
                                            {col.id === 'Location' && (
                                                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                    <MapPin className="w-3.5 h-3.5 opacity-50" />
                                                    {asset.location?.name || '-'}
                                                </div>
                                            )}
                                            {col.id === 'Barcode' && (
                                                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                    <Barcode className="w-3.5 h-3.5 opacity-50" />
                                                    {asset.barCode || '-'}
                                                </div>
                                            )}
                                            {col.id === 'Status' && (
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border ${getStatusStyle(asset.status)}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${asset.status === 'OPERATIONAL' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`} />
                                                    {asset.status || 'ACTIVE'}
                                                </span>
                                            )}
                                            {['Serial Number', 'Description', 'Category'].includes(col.id) && (
                                                <span className="text-sm font-medium text-gray-600 truncate max-w-[200px] block">
                                                    {asset[col.id.charAt(0).toLowerCase() + col.id.slice(1).replace(' ', '')] || '-'}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                {/* Load More Button */}
                {hasNextPage && (
                    <div className="py-8 flex justify-center">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-black text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
                        >
                            {isFetchingNextPage ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading more...
                                </>
                            ) : (
                                'Load More Assets'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )}



            {/* Filters Modal */}
            <AnimatePresence>
                {isFiltersModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm shadow-[0_0_100px_rgba(0,0,0,0.2)]" onClick={() => setIsFiltersModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-[600px] bg-white rounded-xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] flex flex-col overflow-visible" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                <h2 className="text-[22px] font-black text-[#1F2937] tracking-tight">Filters</h2>
                                <button onClick={() => setIsFiltersModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="flex-1 p-6 min-h-[160px] flex flex-col">
                                {activeFilters.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-gray-500">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <Filter className="w-8 h-8 text-gray-200" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 mb-1">No active filters.</h3>
                                        <p className="text-[15px] font-medium opacity-60">Add a filter to refine your view.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {activeFilters.map((filter: any, index: number) => (
                                            <div key={index} className="space-y-2 group animate-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest">{filter.type}</label>
                                                    <button 
                                                        onClick={() => setActiveFilters((prev: any[]) => prev.filter((_: any, i: number) => i !== index))}
                                                        className="text-[11px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        Remove
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <div className="w-full h-11 bg-gray-50 border border-gray-200 rounded-lg flex items-center px-4">
                                                        {filter.type === 'Status' ? (
                                                            <div className="flex items-center gap-2 bg-white px-3 py-1 border border-blue-200 rounded-md text-blue-700 text-sm font-bold shadow-sm">
                                                                {filter.value}
                                                                <X className="w-3.5 h-3.5 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setActiveFilters((prev: any[]) => prev.map((f: any, i: number) => i === index ? { ...f, value: 'All' } : f))} />
                                                            </div>
                                                        ) : (
                                                            <input 
                                                                type="text" 
                                                                value={filter.value} 
                                                                onChange={(e) => {
                                                                    const newFilters = [...activeFilters];
                                                                    newFilters[index].value = e.target.value;
                                                                    setActiveFilters(newFilters);
                                                                }}
                                                                placeholder={`Enter ${filter.type.toLowerCase()}...`}
                                                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 placeholder-gray-300"
                                                            />
                                                        )}
                                                        <ChevronDown className="w-4 h-4 text-gray-300 ml-auto" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between px-6 py-5 border-t border-gray-100 bg-[#F9FAFB] rounded-b-xl">
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsAddFilterMenuOpen(!isAddFilterMenuOpen)}
                                        className="h-10 px-4 flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-400 rounded-lg text-sm font-bold text-blue-600 transition-all shadow-sm active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Filter
                                        <ChevronDown className={cn("w-4 h-4 opacity-50 ml-1 transition-transform duration-200", isAddFilterMenuOpen && "rotate-180")} />
                                    </button>
                                    <AnimatePresence>
                                        {isAddFilterMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-[90]" onClick={() => setIsAddFilterMenuOpen(false)} />
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                    className="absolute left-0 bottom-full mb-2 w-[240px] bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] py-2 overflow-y-auto max-h-[350px] custom-scrollbar"
                                                >
                                                    {[
                                                        'Name', 'Location', 'Area', 'Model', 'Barcode', 
                                                        'Serial Number', 'Category', 'Status', 'Worker', 
                                                        'Additional Workers', 'Assigned Teams', 'Assigned Vendors', 
                                                        'Assigned Customers', 'Manufacturer', 'Created By', 
                                                        'Date Created', 'Purchase Date', 'Service Date', 'Warranty Expiration'
                                                    ].map((opt: string) => (
                                                        <button 
                                                            key={opt} 
                                                            onClick={() => {
                                                                if (!activeFilters.find((f: any) => f.type === opt)) {
                                                                    setActiveFilters([...activeFilters, { type: opt, value: '' }]);
                                                                }
                                                                setIsAddFilterMenuOpen(false);
                                                            }}
                                                            className="w-full text-left px-5 py-3 hover:bg-gray-50 text-[14px] font-bold text-gray-700 transition-all flex items-center justify-between group"
                                                        >
                                                            {opt}
                                                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsFiltersModalOpen(false)} className="h-10 px-6 bg-white border border-gray-300 rounded-lg text-sm font-black text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-widest">Cancel</button>
                                    <button onClick={() => setIsFiltersModalOpen(false)} className="h-10 px-8 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg text-sm font-black transition-all shadow-xl shadow-blue-500/20 active:scale-95 uppercase tracking-[2px]">Apply</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* Outside Modals */}
            <CreateAssetModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
            <AssetHeaderActionsPopover 
                isOpen={isHeaderActionsOpen}
                onClose={() => setIsHeaderActionsOpen(false)}
                anchorRect={headerAnchorRect}
                onImport={() => setIsImportModalOpen(true)}
                onExport={handleExportCsv}
                onGenerateQR={() => toast.success('Generating QR codes for unnamed assets...')}
                onDownloadLabels={() => toast.success('Downloading QR labels (1" x 2-5/8")...')}
            />
            <ImportAssetsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={refetchAssets}
            />
            <ColumnPickerPopover 
                isOpen={isColumnsMenuOpen}
                onClose={() => setIsColumnsMenuOpen(false)}
                columns={ALL_COLUMNS}
                visibleColumnIds={visibleColumnIds}
                onToggle={(id: string) => {
                    setVisibleColumnIds((prev: string[]) => 
                        prev.includes(id) ? prev.filter((c: string) => c !== id) : [...prev, id]
                    );
                }}
                anchorRect={columnAnchorRect}
            />
        </>
    );
};
