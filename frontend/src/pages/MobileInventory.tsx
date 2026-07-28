import { useState, useEffect } from 'react';
import { 
  Search, MapPin, Box, QrCode, AlertTriangle, CheckCircle, Package, Plus, Loader2,
  X, ChevronDown, SlidersHorizontal, Download, Check, MoreHorizontal, GripVertical,
  Tags, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useLocations } from '../hooks/useData';

interface MobileInventoryProps {
  parts: any[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'Inventory' | 'Parts' | 'Sets' | 'Cycle Counts';
  setActiveTab: (tab: 'Inventory' | 'Parts' | 'Sets' | 'Cycle Counts') => void;
  selectedStatuses: string[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  selectedLocations: string[];
  setSelectedLocations: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  visibleColumns: string[];
  setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  excludeIncoming: boolean;
  setExcludeIncoming: (val: boolean) => void;
  onSelectPart: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenScanner: () => void;
  onExportExcel: () => void;
  onResetFilters: () => void;
  onOpenFiltersModal: () => void;
}

const ALL_COLUMNS = [
  'Name', 'Image', 'Status', 'Available Qty', 'Allocated Qty',
  'On Hand Qty', 'Incoming Qty', 'Location', 'Barcode', 'Tags',
  'Area', 'Cost', 'Category', 'Description', 'Workers', 'Vendors',
  'Date Created', 'ID', 'Part Number', 'Customers', 'Additional Details',
  'Team', 'Minimum Qty', 'Maximum Qty', 'Critical'
];

export const MobileInventory = ({
  parts,
  isLoading,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  selectedStatuses,
  setSelectedStatuses,
  selectedLocations,
  setSelectedLocations,
  selectedTags,
  setSelectedTags,
  visibleColumns,
  setVisibleColumns,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  excludeIncoming,
  setExcludeIncoming,
  onSelectPart,
  onOpenCreateModal,
  onOpenScanner,
  onExportExcel,
  onResetFilters,
  onOpenFiltersModal
}: MobileInventoryProps) => {
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const [isHeaderActionsDrawerOpen, setIsHeaderActionsDrawerOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const { data: locations = [] } = useLocations();

  // Sync search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearchQuery, setSearchQuery]);

  const activeFiltersCount = selectedStatuses.length + selectedLocations.length + selectedTags.length + (excludeIncoming ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-outfit select-none relative pb-20">
      {/* Sticky Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm shrink-0">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Parts & Inventory</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenScanner}
              className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-colors shadow-sm active:scale-95 shrink-0"
              title="Scan Barcode"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 px-4 overflow-x-auto scrollbar-none border-b border-slate-100">
          {(['Inventory', 'Parts', 'Sets', 'Cycle Counts'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-3 text-[13px] font-bold transition-all relative whitespace-nowrap border-b-2 shrink-0",
                  isSelected 
                    ? "border-primary text-primary" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Sub-Header Actions */}
        <div className="px-4 py-3 bg-[#f8fafc] flex gap-2 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-900 outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
            />
          </div>
          
          <button
            onClick={() => setIsFiltersDrawerOpen(true)}
            className={cn(
              "p-2.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center shrink-0 bg-white relative",
              activeFiltersCount > 0
                ? "border-indigo-200 bg-indigo-50/50 text-indigo-600"
                : "border-slate-200 text-slate-500"
            )}
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setIsHeaderActionsDrawerOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all active:scale-95 shrink-0 flex items-center justify-center"
          >
            <MoreHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Main List Body */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : parts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-6 space-y-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-black text-slate-700">No Inventory Found</p>
              <p className="text-[11px] text-slate-400 font-medium">Try broadening your search or clear active filters.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {parts.map((part) => {
              const onHand = Number(part.onHandQuantity ?? part.quantity ?? 0);
              const minQty = Number(part.minQuantity ?? 5);
              const isLow = onHand <= minQty;

              const isImageVisible = visibleColumns.includes('Image');
              const isStatusVisible = visibleColumns.includes('Status');

              return (
                <motion.div
                  key={part.id}
                  layout
                  onClick={() => onSelectPart(part.id)}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 flex gap-4 items-start shadow-sm active:bg-slate-50/50 active:scale-[0.99] transition-all cursor-pointer"
                >
                  {/* Dynamic Thumbnail */}
                  {isImageVisible && (
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center shrink-0 text-slate-400 overflow-hidden shadow-inner">
                      {part.imageUrl ? (
                        <img src={part.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Box className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-[14px] font-black text-slate-900 leading-snug truncate">
                          {part.name}
                        </h3>
                        {visibleColumns.includes('ID') && (
                          <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5">#{part.id.substring(0, 8)}</span>
                        )}
                      </div>
                      
                      {isStatusVisible && (
                        isLow ? (
                          <span className="flex items-center gap-1 bg-amber-50 text-[10px] font-bold text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full shrink-0">
                            <AlertTriangle className="w-3 h-3 shrink-0" /> Low
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                            <CheckCircle className="w-3 h-3 shrink-0" /> OK
                          </span>
                        )
                      )}
                    </div>

                    {/* Metadata items list based on visible columns */}
                    <div className="space-y-1">
                      {visibleColumns.includes('Part Number') && part.partNumber && (
                        <div className="text-[11px] font-bold text-slate-400">
                          <span className="opacity-60">Part #:</span> {part.partNumber}
                        </div>
                      )}
                      {visibleColumns.includes('Category') && part.category && (
                        <div className="text-[11px] font-bold text-slate-400">
                          <span className="opacity-60">Category:</span> {part.category}
                        </div>
                      )}
                      {visibleColumns.includes('Area') && part.area && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Area:</span> {part.area}
                        </div>
                      )}
                      {visibleColumns.includes('Location') && part.location?.name && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg w-fit">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{part.location.name}</span>
                        </div>
                      )}
                      {visibleColumns.includes('Barcode') && part.barcode && (
                        <div className="text-[11px] font-mono font-bold text-slate-500">
                          <span className="opacity-60 font-sans">Barcode:</span> {part.barcode}
                        </div>
                      )}
                      {visibleColumns.includes('Cost') && part.cost !== undefined && (
                        <div className="text-[11px] font-bold text-emerald-600">
                          <span className="opacity-60">Cost:</span> ${(part.cost || 0).toFixed(2)}
                        </div>
                      )}
                      {visibleColumns.includes('Available Qty') && part.quantity !== undefined && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Available:</span> {part.quantity.toFixed(2)}
                        </div>
                      )}
                      {visibleColumns.includes('Allocated Qty') && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Allocated:</span> 0.00
                        </div>
                      )}
                      {visibleColumns.includes('Incoming Qty') && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Incoming:</span> 0.00
                        </div>
                      )}
                      {visibleColumns.includes('Minimum Qty') && part.minQuantity !== undefined && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Min Qty:</span> {part.minQuantity}
                        </div>
                      )}
                      {visibleColumns.includes('Maximum Qty') && part.maxQuantity !== undefined && (
                        <div className="text-[11px] font-bold text-slate-500">
                          <span className="opacity-60">Max Qty:</span> {part.maxQuantity}
                        </div>
                      )}
                      {visibleColumns.includes('Critical') && part.critical !== undefined && (
                        <div className="text-[11px] font-bold text-red-600">
                          <span className="opacity-60 font-sans">Critical:</span> {part.critical ? 'Yes' : 'No'}
                        </div>
                      )}
                      {visibleColumns.includes('Description') && part.description && (
                        <p className="text-[11px] text-slate-450 leading-snug line-clamp-1 italic">
                          "{part.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity Indicator */}
                  {visibleColumns.includes('On Hand Qty') && (
                    <div className="flex flex-col items-end justify-center shrink-0 self-center">
                      <span className={cn(
                        "text-lg font-black tracking-tight leading-none",
                        isLow ? "text-red-500" : "text-slate-800"
                      )}>
                        {onHand}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-1">On Hand</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <button
        onClick={onOpenCreateModal}
        className="fixed right-6 bottom-20 z-40 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 transition-transform active:scale-90"
        title="Add Part"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 1. Filters Drawer */}
      <AnimatePresence>
        {isFiltersDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            {/* Background dismiss click handler */}
            <div className="absolute inset-0" onClick={() => setIsFiltersDrawerOpen(false)} />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[85vh] bg-white border-t border-slate-100 rounded-t-[28px] shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Drag bar indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Filter Inventory</h3>
                </div>
                <button 
                  onClick={() => setIsFiltersDrawerOpen(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0 custom-scrollbar">
                
                {/* Status Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-slate-450 tracking-wider block">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {['In stock', 'Low stock', 'Out of stock', 'Non-stock'].map((status) => {
                      const isSelected = selectedStatuses.includes(status);
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setSelectedStatuses(prev => 
                              prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                            );
                          }}
                          className={cn(
                            "py-2 px-4 rounded-xl text-xs font-bold border transition-all active:scale-95",
                            isSelected
                              ? "bg-indigo-50 border-indigo-200 text-indigo-705"
                              : "bg-white border-slate-200 text-slate-500"
                          )}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exclude Incoming Toggle */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                  <div className="space-y-0.5">
                    <span className="text-[12px] font-black text-slate-750 uppercase tracking-tight">Exclude Incoming</span>
                    <p className="text-[10px] text-slate-400 font-medium">Remove incoming quantities from display.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setExcludeIncoming(!excludeIncoming)}
                    className={cn(
                      "w-9 h-5.5 rounded-full transition-colors relative flex items-center px-1 shrink-0",
                      excludeIncoming ? "bg-indigo-600" : "bg-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                      excludeIncoming ? "translate-x-3.5" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Locations Selection List */}
                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <label className="text-[11px] font-black uppercase text-slate-450 tracking-wider block">Locations</label>
                  <div className="max-h-[140px] overflow-y-auto border border-slate-100 rounded-2xl p-2 space-y-1 custom-scrollbar">
                    {locations.map((loc: any) => {
                      const isSelected = selectedLocations.includes(loc.id);
                      return (
                        <div
                          key={loc.id}
                          onClick={() => {
                            setSelectedLocations(prev =>
                              prev.includes(loc.id) ? prev.filter(id => id !== loc.id) : [...prev, loc.id]
                            );
                          }}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all",
                            isSelected ? "bg-indigo-50/55" : "hover:bg-slate-50"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border-2 transition-all flex items-center justify-center shrink-0",
                            isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-200"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-xs font-bold text-slate-700 truncate">{loc.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tags Selection List */}
                <div className="space-y-2 border-t border-slate-50 pt-4 font-outfit">
                  <div className="flex items-center gap-2">
                    <Tags className="w-4 h-4 text-slate-500" />
                    <label className="text-[11px] font-black uppercase text-slate-450 tracking-wider block">Tags</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Mechanical', color: 'bg-blue-500' },
                      { name: 'Electrical', color: 'bg-yellow-500' },
                      { name: 'Critical', color: 'bg-red-500' },
                      { name: 'Consumable', color: 'bg-green-500' },
                      { name: 'Spare', color: 'bg-emerald-500' },
                      { name: 'Hydraulic', color: 'bg-cyan-500' },
                      { name: 'Pneumatic', color: 'bg-violet-500' }
                    ].map((tag) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.name}
                          type="button"
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag.name) ? prev.filter(t => t !== tag.name) : [...prev, tag.name]
                            );
                          }}
                          className={cn(
                            "py-2 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5",
                            isSelected
                              ? "bg-indigo-50 border-indigo-200 text-indigo-705"
                              : "bg-white border-slate-200 text-slate-500"
                          )}
                        >
                          <div className={cn("w-1.5 h-1.5 rounded-full", tag.color)} />
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort Fields & Order */}
                <div className="space-y-3 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-slate-500" />
                    <label className="text-[11px] font-black uppercase text-slate-450 tracking-wider block">Sorting</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 appearance-none outline-none focus:border-indigo-500/30"
                      >
                        {['Name', 'Allocated Qty', 'Incoming Qty', 'Barcode', 'Area', 'Category', 'Date Created', 'Critical'].map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                        className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 appearance-none outline-none focus:border-indigo-500/30"
                      >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Advanced Filters Button */}
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

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-150 bg-slate-50/50 flex gap-3 shrink-0">
                <button
                  onClick={() => {
                    onResetFilters();
                    setLocalSearchQuery('');
                    setIsFiltersDrawerOpen(false);
                  }}
                  className="flex-1 py-3 bg-white border border-slate-250 text-slate-600 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-sm text-center"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsFiltersDrawerOpen(false)}
                  className="flex-1 py-3 bg-[#3b82f6] hover:bg-[#3b82f6]/95 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 text-center"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Registry Operations Drawer */}
      <AnimatePresence>
        {isHeaderActionsDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            {/* Background dismiss click handler */}
            <div className="absolute inset-0" onClick={() => setIsHeaderActionsDrawerOpen(false)} />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full bg-white border-t border-slate-100 rounded-t-[28px] p-5 space-y-4 shadow-2xl flex flex-col z-10"
            >
              {/* Drawer Drag bar indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-1 shrink-0" />

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
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => {
                    setIsHeaderActionsDrawerOpen(false);
                    onOpenScanner();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 text-left hover:bg-slate-100 active:scale-[0.99] transition-all"
                >
                  Scan Part / Barcode
                </button>
                <button
                  onClick={() => {
                    setIsHeaderActionsDrawerOpen(false);
                    onExportExcel();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 text-left hover:bg-slate-100 active:scale-[0.99] transition-all flex items-center justify-between"
                >
                  <span>Export Spreadsheet (Excel)</span>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Columns Customization Section */}
              <div className="space-y-2 border-t border-slate-100 pt-4 overflow-y-auto max-h-[260px] custom-scrollbar shrink-0">
                <label className="text-[11px] font-black uppercase text-slate-450 tracking-wider block">Visible Details / Columns</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_COLUMNS.map((col) => {
                    const isVisible = visibleColumns.includes(col);
                    return (
                      <button
                        key={col}
                        type="button"
                        disabled={col === 'Name'}
                        onClick={() => {
                          if (visibleColumns.includes(col)) {
                            setVisibleColumns(visibleColumns.filter(c => c !== col));
                          } else {
                            setVisibleColumns([...visibleColumns, col]);
                          }
                        }}
                        className={cn(
                          "py-2 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-between gap-1.5",
                          isVisible
                            ? "bg-indigo-50 border-indigo-200 text-indigo-705"
                            : "bg-white border-slate-200 text-slate-500",
                          col === 'Name' && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <GripVertical className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                          <span className="truncate">{col}</span>
                        </div>
                        {isVisible && <div className="w-1.5 h-1.5 rounded-full bg-indigo-650 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsHeaderActionsDrawerOpen(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-inner active:scale-95 text-center shrink-0"
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
