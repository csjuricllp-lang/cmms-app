import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Box, Barcode, Plus, RefreshCcw, Loader2, AlertCircle,
  SlidersHorizontal, X, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const ALL_COLUMNS = [
  { id: 'Name', label: 'Name', isMandatory: true },
  { id: 'Image', label: 'Image' },
  { id: 'ID', label: 'ID' },
  { id: 'Location', label: 'Location' },
  { id: 'Area', label: 'Area' },
  { id: 'Model', label: 'Model' },
  { id: 'Barcode', label: 'Barcode' },
  { id: 'Serial Number', label: 'Serial Number' },
  { id: 'Description', label: 'Description' },
  { id: 'Category', label: 'Category' },
  { id: 'Status', label: 'Status' },
  { id: 'Worker', label: 'Worker' },
  { id: 'Additional Workers', label: 'Additional Workers' },
  { id: 'Assigned Teams', label: 'Assigned Teams' },
  { id: 'Assigned Vendors', label: 'Assigned Vendors' },
  { id: 'Assigned Customers', label: 'Assigned Customers' },
  { id: 'Manufacturer', label: 'Manufacturer' },
  { id: 'Parent Asset', label: 'Parent Asset' },
  { id: 'Useful Life', label: 'Useful Life' },
  { id: 'Created By', label: 'Created By' },
  { id: 'Date Created', label: 'Date Created' },
  { id: 'Purchase Date', label: 'Purchase Date' },
  { id: 'Service Date', label: 'Service Date' },
  { id: 'Warranty Expiration', label: 'Warranty Expiration' },
  { id: 'Current Value', label: 'Current Value' },
  { id: 'Purchase Price', label: 'Purchase Price' },
  { id: 'Residual Price', label: 'Residual Price' },
  { id: 'Archived', label: 'Archived' }
];

interface MobileAssetsProps {
  assets: any[];
  isLoading: boolean;
  refetchAssets: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilters: any[];
  setActiveFilters: React.Dispatch<React.SetStateAction<any[]>>;
  selectedLocationIds: string[];
  includeSubLocations: boolean;
  visibleColumnIds: string[];
  setVisibleColumnIds: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenCreateModal: () => void;
  onOpenLocationFilter: (rect: DOMRect) => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onResetFilters: () => void;
  onImport: () => void;
  onGenerateQR: () => void;
  onDownloadLabels: () => void;
  onOpenFiltersModal: () => void;
}

export const MobileAssets = ({
  assets,
  isLoading,
  refetchAssets,
  searchTerm,
  setSearchTerm,
  activeFilters,
  setActiveFilters,
  selectedLocationIds,
  includeSubLocations,
  visibleColumnIds,
  setVisibleColumnIds,
  onOpenCreateModal,
  onOpenLocationFilter,
  onExportCsv,
  onExportExcel,
  onResetFilters,
  onImport,
  onGenerateQR,
  onDownloadLabels,
  onOpenFiltersModal
}: MobileAssetsProps) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const [isHeaderActionsDrawerOpen, setIsHeaderActionsDrawerOpen] = useState(false);

  // Get unique categories for quick filtering
  const categories = ['ALL', ...Array.from(new Set(assets.map((a: any) => a.category).filter(Boolean))) as string[]];

  const filteredAssets = assets.filter((asset: any) => {
    const matchesSearch = 
      (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (asset.barCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      activeCategory === 'ALL' || 
      asset.category === activeCategory;

    const matchesLocation = 
      selectedLocationIds.length === 0 || 
      (asset.locationId && selectedLocationIds.includes(asset.locationId)) ||
      (includeSubLocations && asset.location?.parentId && selectedLocationIds.includes(asset.location.parentId));

    const matchesActiveFilters = activeFilters.every((filter: any) => {
      if (filter.type === 'Status' && filter.value === 'Hide Archived') return asset.status !== 'ARCHIVED';
      if (filter.type === 'Name') return asset.name.toLowerCase().includes(filter.value.toLowerCase());
      if (filter.type === 'Category') return (asset.category || '').toLowerCase().includes(filter.value.toLowerCase());
      if (filter.type === 'Serial Number') return (asset.serialNumber || '').toLowerCase().includes(filter.value.toLowerCase());
      return true;
    });

    return matchesSearch && matchesCategory && matchesLocation && matchesActiveFilters;
  });

  const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OPERATIONAL': 
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      case 'DOWN': 
        return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
      case 'MAINTENANCE': 
        return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
      case 'STANDBY': 
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      default: 
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md px-4 py-3 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
            Assets Registry
          </h1>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => refetchAssets()}
              className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground active:scale-95 transition-all"
              title="Refresh Assets"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsHeaderActionsDrawerOpen(true)}
              className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground active:scale-95 transition-all"
              title="More Actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar & Filters Button */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 focus-within:text-indigo-650 transition-colors" />
            <input
              type="text"
              placeholder="Search assets, barcodes, serials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-transparent rounded-xl text-[14px] font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
            />
          </div>
          
          <button
            onClick={() => setIsFiltersDrawerOpen(true)}
            className={cn(
              "w-11 h-11 border rounded-xl flex items-center justify-center transition-all bg-white active:scale-95 shrink-0 shadow-sm",
              (selectedLocationIds.length > 0 || activeFilters.length > 0)
                ? "border-primary text-primary bg-primary/5"
                : "border-slate-200/60 text-slate-500 hover:text-slate-800"
            )}
            title="Advanced Filters & Columns"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {categories.map((category: string) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-[12px] font-black uppercase tracking-tight whitespace-nowrap border transition-all active:scale-95",
                activeCategory === category
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-muted border-border text-muted-foreground hover:bg-muted/75"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Cards list */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Hydrating Assets...</span>
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="space-y-4">
            {filteredAssets.map((asset: any) => {
              const showImage = visibleColumnIds.includes('Image');
              const showId = visibleColumnIds.includes('ID');
              const showStatus = visibleColumnIds.includes('Status');

              return (
                <motion.div
                  key={asset.id}
                  layoutId={asset.id}
                  onClick={() => navigate(`/assets/${asset.id}`)}
                  className="bg-card rounded-2xl border border-border p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all active:scale-[0.98] flex gap-4 cursor-pointer relative"
                >
                  {/* Image or Icon Container */}
                  {showImage && (
                    <div className="w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {asset.imageUrl ? (
                        <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                        <Box className="w-7 h-7 text-muted-foreground/55" />
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-black leading-tight text-foreground truncate">
                          {asset.name}
                        </h3>
                        {showId && (
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5 tracking-tight">
                            ID: {asset.id.split('-').pop().toUpperCase()}
                          </p>
                        )}
                      </div>

                      {showStatus && (
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0",
                          getStatusStyle(asset.status)
                        )}>
                          {asset.status || 'OPERATIONAL'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-2.5">
                      {visibleColumnIds.includes('Location') && asset.location?.name && (
                        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                          <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="text-[11px] font-bold truncate tracking-tight">{asset.location.name}</span>
                        </div>
                      )}
                      
                      {visibleColumnIds.includes('Barcode') && asset.barCode && (
                        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                          <Barcode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="text-[11px] font-bold truncate tracking-tight font-mono">{asset.barCode}</span>
                        </div>
                      )}

                      {visibleColumnIds.includes('Serial Number') && asset.serialNumber && (
                        <div className="text-[11px] font-bold text-slate-500 truncate">
                          <span className="opacity-60">S/N:</span> {asset.serialNumber}
                        </div>
                      )}

                      {visibleColumnIds.includes('Model') && asset.model && (
                        <div className="text-[11px] font-bold text-slate-500 truncate">
                          <span className="opacity-60">Model:</span> {asset.model}
                        </div>
                      )}

                      {visibleColumnIds.includes('Category') && asset.category && (
                        <div className="text-[11px] font-bold text-slate-500 truncate">
                          <span className="opacity-60">Category:</span> {asset.category}
                        </div>
                      )}

                      {visibleColumnIds.includes('Area') && asset.area && (
                        <div className="text-[11px] font-bold text-slate-500 truncate">
                          <span className="opacity-60">Area:</span> {asset.area}
                        </div>
                      )}

                      {visibleColumnIds.includes('Description') && asset.description && (
                        <div className="text-[11px] font-bold text-slate-500 line-clamp-1">
                          <span className="opacity-60">Desc:</span> {asset.description}
                        </div>
                      )}

                      {visibleColumnIds.includes('Worker') && asset.custodian?.user?.name && (
                        <div className="text-[11px] font-bold text-slate-500 truncate">
                          <span className="opacity-60">Custodian:</span> {asset.custodian.user.name}
                        </div>
                      )}

                      {visibleColumnIds.includes('Assigned Teams') && asset.team?.name && (
                        <div className="text-[11px] font-bold text-slate-500 truncate">
                          <span className="opacity-60">Team:</span> {asset.team.name}
                        </div>
                      )}

                      {visibleColumnIds.includes('Assigned Vendors') && asset.vendor?.name && (
                        <div className="text-[11px] font-bold text-slate-500 truncate">
                          <span className="opacity-60">Vendor:</span> {asset.vendor.name}
                        </div>
                      )}

                      {visibleColumnIds.includes('Assigned Customers') && asset.customer?.name && (
                        <div className="text-[11px] font-bold text-slate-550 truncate">
                          <span className="opacity-60">Customer:</span> {asset.customer.name}
                        </div>
                      )}

                      {visibleColumnIds.includes('Date Created') && asset.createdAt && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Created:</span> {format(new Date(asset.createdAt), 'MM/dd/yy')}
                        </div>
                      )}

                      {visibleColumnIds.includes('Purchase Date') && asset.purchaseDate && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Purchased:</span> {format(new Date(asset.purchaseDate), 'MM/dd/yy')}
                        </div>
                      )}

                      {visibleColumnIds.includes('Service Date') && asset.serviceDate && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Serviced:</span> {format(new Date(asset.serviceDate), 'MM/dd/yy')}
                        </div>
                      )}

                      {visibleColumnIds.includes('Warranty Expiration') && asset.warrantyExpiration && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Warranty Exp:</span> {format(new Date(asset.warrantyExpiration), 'MM/dd/yy')}
                        </div>
                      )}

                      {visibleColumnIds.includes('Current Value') && asset.financials?.currentBookValue && (
                        <div className="text-[11px] font-bold text-emerald-650">
                          <span className="opacity-65 text-slate-500">Value:</span> ${Number(asset.financials.currentBookValue).toLocaleString()}
                        </div>
                      )}

                      {visibleColumnIds.includes('Purchase Price') && asset.purchasePrice && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Price:</span> ${Number(asset.purchasePrice).toLocaleString()}
                        </div>
                      )}

                      {visibleColumnIds.includes('Useful Life') && asset.usefulLifeYears && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Useful Life:</span> {asset.usefulLifeYears} Years
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3 border-2 border-dashed border-border rounded-3xl">
            <AlertCircle className="w-8 h-8 text-muted-foreground opacity-30" />
            <span className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">No matching assets</span>
          </div>
        )}
      </div>

      {/* Floating Create Asset button */}
      <button
        onClick={onOpenCreateModal}
        className="fixed bottom-20 right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Filters Drawer */}
      <AnimatePresence>
        {isFiltersDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-h-[85vh] bg-white border-t border-slate-100 rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-slate-150 bg-white flex items-center justify-between shrink-0">
                <h2 className="text-[17px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  Filter Assets & Columns
                </h2>
                <button 
                  onClick={() => setIsFiltersDrawerOpen(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0 custom-scrollbar">
                
                {/* 1. Location Filter Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-450 tracking-wider block">Filter by Location</label>
                  <button
                    type="button"
                    onClick={(e) => {
                      setIsFiltersDrawerOpen(false);
                      onOpenLocationFilter(e.currentTarget.getBoundingClientRect());
                    }}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <span className="truncate flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-450" />
                      {selectedLocationIds.length > 0 
                        ? `${selectedLocationIds.length} Locations Selected`
                        : 'Select Locations...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-405 shrink-0" />
                  </button>
                </div>

                {/* 2. Hide Archived Toggle */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="space-y-0.5">
                    <span className="text-[12px] font-black text-slate-750 uppercase tracking-tight">Hide Archived Assets</span>
                    <p className="text-[10px] text-slate-400 font-medium">Do not show assets marked as ARCHIVED.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const isArchivedHidden = activeFilters.some(f => f.type === 'Status' && f.value === 'Hide Archived');
                      if (isArchivedHidden) {
                        setActiveFilters(activeFilters.filter(f => !(f.type === 'Status' && f.value === 'Hide Archived')));
                      } else {
                        setActiveFilters([...activeFilters, { type: 'Status', value: 'Hide Archived' }]);
                      }
                    }}
                    className={cn(
                      "w-9 h-5.5 rounded-full transition-colors relative flex items-center px-1 shrink-0",
                      activeFilters.some(f => f.type === 'Status' && f.value === 'Hide Archived') ? "bg-primary" : "bg-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                      activeFilters.some(f => f.type === 'Status' && f.value === 'Hide Archived') ? "translate-x-3.5" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Advanced Filters Trigger */}
                <div className="space-y-1.5 border-t border-slate-100 pt-4">
                  <label className="text-[11px] font-black uppercase text-slate-450 tracking-wider block">Advanced Configuration</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFiltersDrawerOpen(false);
                      onOpenFiltersModal();
                    }}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer text-left"
                  >
                    Configure Advanced Filters...
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-150 bg-slate-50/50 flex gap-3 shrink-0">
                <button
                  onClick={() => {
                    onResetFilters();
                    setIsFiltersDrawerOpen(false);
                  }}
                  className="flex-1 py-3 bg-white border border-slate-250 text-slate-600 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-sm text-center"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setIsFiltersDrawerOpen(false)}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 text-center"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Actions Drawer */}
      <AnimatePresence>
        {isHeaderActionsDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full bg-white border-t border-slate-100 rounded-t-[28px] p-5 space-y-4 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Registry Operations</h3>
                <button 
                  onClick={() => setIsHeaderActionsDrawerOpen(false)}
                  className="p-1 hover:bg-slate-50 rounded-full text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Actions List */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsHeaderActionsDrawerOpen(false);
                    onImport();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 text-left hover:bg-slate-100 active:scale-[0.99] transition-all"
                >
                  Import Assets (CSV)
                </button>
                <button
                  onClick={() => {
                    setIsHeaderActionsDrawerOpen(false);
                    onGenerateQR();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 text-left hover:bg-slate-100 active:scale-[0.99] transition-all"
                >
                  Generate QR Codes
                </button>
                <button
                  onClick={() => {
                    setIsHeaderActionsDrawerOpen(false);
                    onDownloadLabels();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 text-left hover:bg-slate-100 active:scale-[0.99] transition-all"
                >
                  Download QR Labels (1" x 2-5/8")
                </button>
                <button
                  onClick={() => {
                    setIsHeaderActionsDrawerOpen(false);
                    onExportCsv();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 text-left hover:bg-slate-100 active:scale-[0.99] transition-all"
                >
                  Quick CSV Export
                </button>
                <button
                  onClick={() => {
                    setIsHeaderActionsDrawerOpen(false);
                    onExportExcel();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 text-left hover:bg-slate-100 active:scale-[0.99] transition-all"
                >
                  Quick Excel Export
                </button>
              </div>
 
               {/* Columns Section */}
               <div className="space-y-2 border-t border-slate-100 pt-4 overflow-y-auto max-h-[260px] custom-scrollbar shrink-0">
                 <label className="text-[11px] font-black uppercase text-slate-450 tracking-wider block">Visible Details / Columns</label>
                 <div className="grid grid-cols-2 gap-2">
                   {ALL_COLUMNS.map((col) => {
                     const isVisible = visibleColumnIds.includes(col.id);
                     return (
                       <button
                         key={col.id}
                         type="button"
                         disabled={col.isMandatory}
                         onClick={() => {
                           if (visibleColumnIds.includes(col.id)) {
                             setVisibleColumnIds(visibleColumnIds.filter(id => id !== col.id));
                           } else {
                             setVisibleColumnIds([...visibleColumnIds, col.id]);
                           }
                         }}
                         className={cn(
                           "py-2 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-between",
                           isVisible
                             ? "bg-indigo-50 border-indigo-200 text-indigo-705"
                             : "bg-white border-slate-200 text-slate-500",
                           col.isMandatory && "opacity-50 cursor-not-allowed"
                         )}
                       >
                         {col.label}
                         {isVisible && <div className="w-1.5 h-1.5 rounded-full bg-indigo-650" />}
                       </button>
                     );
                   })}
                 </div>
               </div>

              {/* Close Button */}
              <button
                onClick={() => setIsHeaderActionsDrawerOpen(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-655 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-inner active:scale-95 text-center"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
