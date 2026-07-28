import { useState } from 'react';
import { 
  Search, MapPin, Building2, Users, Network, Plus, Loader2, 
  Map as MapIcon, SlidersHorizontal, Download, X, ChevronDown, List, Shield, UserCheck, Briefcase,
  MoreHorizontal, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useUsers, useTeams, useCustomers, useVendors } from '../hooks/useData';
import { LocationsMapView } from '../components/LocationsMapView';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const ALL_COLUMNS = [
  { id: 'Name', label: 'Name', isMandatory: true },
  { id: 'Hierarchy', label: 'Hierarchy' },
  { id: 'Address', label: 'Address' },
  { id: 'No. of Children', label: 'No. of Children' },
  { id: 'Workers', label: 'Workers' },
  { id: 'Teams', label: 'Teams' },
  { id: 'Customers', label: 'Customers' },
  { id: 'Vendors', label: 'Vendors' },
  { id: 'Date Created', label: 'Date Created' }
];

interface MobileLocationsProps {
  locations: any[];
  isLoading: boolean;
  onSelectLocation: (id: string) => void;
  onOpenCreateModal: () => void;
  onExport: () => void;
  activeFilters: any;
  setActiveFilters: React.Dispatch<React.SetStateAction<any>>;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  activeTab: 'List' | 'Map';
  setActiveTab: (tab: 'List' | 'Map') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  savedViews: any[];
  visibleColumnIds: string[];
  setVisibleColumnIds: React.Dispatch<React.SetStateAction<string[]>>;
  onEditLocation: (loc: any) => void;
  onDeleteLocation: (id: string) => void;
  onAddSubLocation: (id: string) => void;
  onSaveView: () => void;
}

export const MobileLocations = ({
  locations,
  isLoading,
  onSelectLocation,
  onOpenCreateModal,
  onExport,
  activeFilters,
  setActiveFilters,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  savedViews,
  visibleColumnIds,
  setVisibleColumnIds,
  onEditLocation,
  onDeleteLocation,
  onAddSubLocation,
  onSaveView
}: MobileLocationsProps) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PARENTS' | 'SUBS'>('ALL');
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);
  const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);
  const [isActionsDrawerOpen, setIsActionsDrawerOpen] = useState(false);
  const [selectedLocationForActions, setSelectedLocationForActions] = useState<any>(null);

  // Selector inline dropdown toggle states
  const [isWorkerDropdownOpen, setIsWorkerDropdownOpen] = useState(false);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);

  // Fetch reference lists for filters
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useTeams();
  const { data: customers = [] } = useCustomers();
  const { data: vendors = [] } = useVendors();

  // Local hierarchy list filtering
  const filteredLocations = locations.filter((loc) => {
    const isSub = !!loc.parentId || !!loc.parent;
    if (activeFilter === 'PARENTS') return !isSub;
    if (activeFilter === 'SUBS') return isSub;
    return true;
  });

  const hasActiveFilters = 
    (activeFilters.selectedAssignees?.length > 0) || 
    (activeFilters.selectedTeams?.length > 0) || 
    (activeFilters.customerId) || 
    (activeFilters.vendorIds?.length > 0);

  const handleResetFilters = () => {
    setActiveFilters({
      name: '',
      selectedAssignees: [],
      selectedTeams: [],
      customerId: '',
      vendorIds: [],
    });
    setSearchQuery('');
    setIsFiltersDrawerOpen(false);
    toast.success('Filters reset');
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50 font-outfit select-none relative pb-20">
      {/* Header Bar */}
      <div className="bg-white px-4 py-4 border-b border-slate-100 sticky top-0 z-30 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 relative">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setIsSavedViewsOpen(!isSavedViewsOpen)}>
              <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Locations</h1>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform pt-0.5", isSavedViewsOpen && "rotate-180")} />
            </div>

            {isSavedViewsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSavedViewsOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Saved Views</div>
                  <button
                    onClick={() => {
                      setIsSavedViewsOpen(false);
                      handleResetFilters();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50/15 hover:bg-indigo-50/20 transition-all flex items-center justify-between"
                  >
                    Default View
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  </button>
                  {savedViews.map((view) => (
                    <button
                      key={view.id}
                      onClick={() => {
                        const config = view.config;
                        if (config.filters) setActiveFilters(config.filters);
                        if (config.search !== undefined) setSearchQuery(config.search);
                        if (config.sortBy) setSortBy(config.sortBy);
                        if (config.sortOrder) setSortOrder(config.sortOrder);
                        setIsSavedViewsOpen(false);
                        toast.success(`Loaded view: ${view.name}`);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all mt-0.5"
                    >
                      {view.name}
                    </button>
                  ))}
                  {savedViews.length === 0 && (
                    <div className="px-3 py-2 text-[10px] text-slate-400 font-bold italic">No custom views.</div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* CSV Export Button */}
            <button
              onClick={() => {
                onExport();
                toast.success('CSV Export started');
              }}
              className="p-2 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-slate-500 hover:text-slate-700 transition-colors active:scale-95 shadow-sm"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Map/List Toggle */}
            <button
              onClick={() => setActiveTab(activeTab === 'List' ? 'Map' : 'List')}
              className="p-2 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-slate-500 hover:text-slate-700 transition-colors active:scale-95 shadow-sm flex items-center gap-1.5 text-xs font-bold"
              title={activeTab === 'List' ? 'Map View' : 'List View'}
            >
              {activeTab === 'List' ? <MapIcon className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Search & Filter Trigger Row */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Search location name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-transparent rounded-xl text-[14px] font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
            />
          </div>
          
          <button
            onClick={() => setIsFiltersDrawerOpen(true)}
            className={cn(
              "w-11 h-11 border rounded-xl flex items-center justify-center transition-all bg-white active:scale-95 shrink-0 shadow-sm",
              hasActiveFilters
                ? "border-indigo-600 text-indigo-650 bg-indigo-50/10"
                : "border-slate-200/60 text-slate-500 hover:text-slate-800"
            )}
            title="Advanced Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'List' ? (
        <>
          {/* Filter Tabs */}
          <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none bg-slate-50 border-b border-slate-100/50 shrink-0">
            {[
              { id: 'ALL', label: 'All Locations' },
              { id: 'PARENTS', label: 'Parent Facilities' },
              { id: 'SUBS', label: 'Sub-areas' }
            ].map((tab) => {
              const isSelected = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={cn(
                    "h-8 px-4 rounded-full text-[12px] font-bold transition-all whitespace-nowrap active:scale-95 shadow-sm",
                    isSelected
                      ? "bg-indigo-600 text-white shadow-indigo-100"
                      : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* List Content Area */}
          <div className="flex-1 px-4 py-3 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-6 space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-[14px] font-black text-slate-700">No Locations Found</p>
                  <p className="text-[11px] text-slate-400 font-medium">Try broadening your search or clear active filters.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLocations.map((loc) => {
                  const totalWorkers = loc._count?.workers || 0;
                  const totalSub = loc._count?.children || 0;
                  const totalTeams = loc._count?.teams || 0;
                  const totalCustomers = loc._count?.customers || 0;
                  const totalVendors = loc._count?.vendors || 0;
                  const parentName = loc.parent?.name || 'Top-level Facility';

                  return (
                    <motion.div
                      key={loc.id}
                      layout
                      onClick={() => onSelectLocation(loc.id)}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 flex gap-4 items-start shadow-sm active:bg-slate-50/50 active:scale-[0.99] transition-all cursor-pointer font-sans relative"
                    >
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 shrink-0 shadow-inner">
                        {loc.parentId ? <MapPin className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <h3 className="text-[14px] font-black text-slate-900 leading-snug truncate">
                              {loc.name}
                            </h3>
                            {visibleColumnIds.includes('Hierarchy') && (
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                {parentName}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLocationForActions(loc);
                              setIsActionsDrawerOpen(true);
                            }}
                            className="p-1 hover:bg-slate-105 border border-slate-200/40 rounded-xl text-slate-400 hover:text-slate-700 transition-colors shrink-0 -mt-1 -mr-1 shadow-sm flex items-center justify-center"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {loc.address && visibleColumnIds.includes('Address') && (
                          <p className="text-[12px] font-semibold text-slate-500 truncate">
                            {loc.address}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {totalSub > 0 && visibleColumnIds.includes('No. of Children') && (
                            <span className="flex items-center gap-1 bg-slate-50 text-[10px] font-bold text-slate-500 border border-slate-150 px-2 py-0.5 rounded-lg">
                              <Network className="w-3.5 h-3.5 text-slate-400" /> {totalSub} sub-areas
                            </span>
                          )}
                          {totalWorkers > 0 && visibleColumnIds.includes('Workers') && (
                            <span className="flex items-center gap-1 bg-indigo-50/50 text-[10px] font-bold text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-lg">
                              <Users className="w-3.5 h-3.5 text-indigo-400" /> {totalWorkers} workers
                            </span>
                          )}
                          {totalTeams > 0 && visibleColumnIds.includes('Teams') && (
                            <span className="flex items-center gap-1 bg-emerald-50/50 text-[10px] font-bold text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-lg">
                              <Shield className="w-3.5 h-3.5 text-emerald-400" /> {totalTeams} {totalTeams === 1 ? 'team' : 'teams'}
                            </span>
                          )}
                          {totalCustomers > 0 && visibleColumnIds.includes('Customers') && (
                            <span className="flex items-center gap-1 bg-amber-50/50 text-[10px] font-bold text-amber-600 border border-amber-100 px-2 py-0.5 rounded-lg">
                              <UserCheck className="w-3.5 h-3.5 text-amber-400" /> {totalCustomers} {totalCustomers === 1 ? 'customer' : 'customers'}
                            </span>
                          )}
                          {totalVendors > 0 && visibleColumnIds.includes('Vendors') && (
                            <span className="flex items-center gap-1 bg-rose-50/50 text-[10px] font-bold text-rose-600 border border-rose-100 px-2 py-0.5 rounded-lg">
                              <Briefcase className="w-3.5 h-3.5 text-rose-450" /> {totalVendors} {totalVendors === 1 ? 'vendor' : 'vendors'}
                            </span>
                          )}
                          {visibleColumnIds.includes('Date Created') && loc.createdAt && (
                            <span className="flex items-center gap-1 bg-slate-50 text-[10px] font-bold text-slate-500 border border-slate-150 px-2 py-0.5 rounded-lg">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Created: {format(new Date(loc.createdAt), 'MM/dd/yy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Map View Container */
        <div className="flex-1 min-h-[calc(100vh-140px)] flex flex-col z-0 relative">
          <LocationsMapView locations={filteredLocations} isLoading={isLoading} />
        </div>
      )}

      {/* Filters Drawer */}
      <AnimatePresence>
        {isFiltersDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-h-[85vh] bg-background border-t border-border rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="px-4 py-4 border-b border-border bg-card flex items-center justify-between shrink-0">
                <h2 className="text-[17px] font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-650" />
                  Filter Locations
                </h2>
                <button 
                  onClick={() => setIsFiltersDrawerOpen(false)}
                  className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Filters Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0 custom-scrollbar">
                
                {/* 1. Worker Filter */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider block">Assigned Worker</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkerDropdownOpen(!isWorkerDropdownOpen);
                      setIsTeamDropdownOpen(false);
                      setIsCustomerDropdownOpen(false);
                      setIsVendorDropdownOpen(false);
                    }}
                    className="w-full h-11 bg-card border border-border rounded-xl px-4 flex items-center justify-between text-sm font-semibold hover:border-indigo-655 transition-all cursor-pointer text-foreground"
                  >
                    <span className="truncate">
                      {activeFilters.selectedAssignees?.length > 0 
                        ? users.filter(u => activeFilters.selectedAssignees.includes(u.id)).map(u => u.name).join(', ')
                        : 'Select Worker...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                  {isWorkerDropdownOpen && (
                    <div className="mt-1 border border-border rounded-2xl bg-card overflow-hidden max-h-48 overflow-y-auto custom-scrollbar shadow-lg animate-in fade-in slide-in-from-top-1 z-30">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilters((prev: any) => ({ ...prev, selectedAssignees: [] }));
                          setIsWorkerDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                          activeFilters.selectedAssignees?.length === 0 ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10"
                        )}
                      >
                        All Workers
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const isSelected = activeFilters.selectedAssignees?.includes('unassigned');
                          setActiveFilters((prev: any) => ({
                            ...prev,
                            selectedAssignees: isSelected
                              ? prev.selectedAssignees.filter((id: string) => id !== 'unassigned')
                              : [...(prev.selectedAssignees || []), 'unassigned']
                          }));
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                          activeFilters.selectedAssignees?.includes('unassigned') ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                        )}
                      >
                        Unassigned
                      </button>
                      {users.map(u => {
                        const isSelected = activeFilters.selectedAssignees?.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setActiveFilters((prev: any) => ({
                                ...prev,
                                selectedAssignees: isSelected
                                  ? prev.selectedAssignees.filter((id: string) => id !== u.id)
                                  : [...(prev.selectedAssignees || []), u.id]
                              }));
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                              isSelected ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                            )}
                          >
                            {u.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Team Filter */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider block">Assigned Team</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeamDropdownOpen(!isTeamDropdownOpen);
                      setIsWorkerDropdownOpen(false);
                      setIsCustomerDropdownOpen(false);
                      setIsVendorDropdownOpen(false);
                    }}
                    className="w-full h-11 bg-card border border-border rounded-xl px-4 flex items-center justify-between text-sm font-semibold hover:border-indigo-655 transition-all cursor-pointer text-foreground"
                  >
                    <span className="truncate">
                      {activeFilters.selectedTeams?.length > 0 
                        ? teams.filter(t => activeFilters.selectedTeams.includes(t.id)).map(t => t.name).join(', ')
                        : 'Select Team...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                  {isTeamDropdownOpen && (
                    <div className="mt-1 border border-border rounded-2xl bg-card overflow-hidden max-h-48 overflow-y-auto custom-scrollbar shadow-lg animate-in fade-in slide-in-from-top-1 z-30">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilters((prev: any) => ({ ...prev, selectedTeams: [] }));
                          setIsTeamDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                          activeFilters.selectedTeams?.length === 0 ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10"
                        )}
                      >
                        All Teams
                      </button>
                      {teams.map(t => {
                        const isSelected = activeFilters.selectedTeams?.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setActiveFilters((prev: any) => ({
                                ...prev,
                                selectedTeams: isSelected
                                  ? prev.selectedTeams.filter((id: string) => id !== t.id)
                                  : [...(prev.selectedTeams || []), t.id]
                              }));
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                              isSelected ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                            )}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Customer Filter */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider block">Customer</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerDropdownOpen(!isCustomerDropdownOpen);
                      setIsWorkerDropdownOpen(false);
                      setIsTeamDropdownOpen(false);
                      setIsVendorDropdownOpen(false);
                    }}
                    className="w-full h-11 bg-card border border-border rounded-xl px-4 flex items-center justify-between text-sm font-semibold hover:border-indigo-655 transition-all cursor-pointer text-foreground"
                  >
                    <span className="truncate">
                      {activeFilters.customerId 
                        ? customers.find(c => c.id === activeFilters.customerId)?.name || 'Select Customer...'
                        : 'Select Customer...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                  {isCustomerDropdownOpen && (
                    <div className="mt-1 border border-border rounded-2xl bg-card overflow-hidden max-h-48 overflow-y-auto custom-scrollbar shadow-lg animate-in fade-in slide-in-from-top-1 z-30">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilters((prev: any) => ({ ...prev, customerId: '' }));
                          setIsCustomerDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                          !activeFilters.customerId ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10"
                        )}
                      >
                        All Customers
                      </button>
                      {customers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setActiveFilters((prev: any) => ({ ...prev, customerId: c.id }));
                            setIsCustomerDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                            activeFilters.customerId === c.id ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                          )}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Vendor Filter */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider block">Vendor</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVendorDropdownOpen(!isVendorDropdownOpen);
                      setIsWorkerDropdownOpen(false);
                      setIsTeamDropdownOpen(false);
                      setIsCustomerDropdownOpen(false);
                    }}
                    className="w-full h-11 bg-card border border-border rounded-xl px-4 flex items-center justify-between text-sm font-semibold hover:border-indigo-655 transition-all cursor-pointer text-foreground"
                  >
                    <span className="truncate">
                      {activeFilters.vendorIds?.length > 0 
                        ? vendors.filter(v => activeFilters.vendorIds.includes(v.id)).map(v => v.name).join(', ')
                        : 'Select Vendor...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                  {isVendorDropdownOpen && (
                    <div className="mt-1 border border-border rounded-2xl bg-card overflow-hidden max-h-48 overflow-y-auto custom-scrollbar shadow-lg animate-in fade-in slide-in-from-top-1 z-30">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilters((prev: any) => ({ ...prev, vendorIds: [] }));
                          setIsVendorDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                          activeFilters.vendorIds?.length === 0 ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10"
                        )}
                      >
                        All Vendors
                      </button>
                      {vendors.map(v => {
                        const isSelected = activeFilters.vendorIds?.includes(v.id);
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setActiveFilters((prev: any) => ({
                                ...prev,
                                vendorIds: isSelected
                                  ? prev.vendorIds.filter((id: string) => id !== v.id)
                                  : [...(prev.vendorIds || []), v.id]
                              }));
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 text-xs font-bold transition-colors border-b border-border/30 last:border-0",
                              isSelected ? "bg-indigo-50/20 text-indigo-600 font-black" : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                            )}
                          >
                            {v.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Visible Columns Selector */}
                <div className="space-y-1.5 border-t border-border/40 pt-4">
                  <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider block">Visible Columns</label>
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
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
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

                {/* 6. Sort By & Sort Order */}
                <div className="space-y-3 border-t border-border/40 pt-4">
                  <label className="text-[11px] font-black uppercase text-muted-foreground tracking-wider block">Sort Results</label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'Name', label: 'Name' },
                        { id: 'Date Created', label: 'Date Created' },
                        { id: 'Address', label: 'Address' },
                        { id: 'No. of Children', label: 'No. of Children' }
                      ].map((field) => (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => setSortBy(field.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                            sortBy === field.id
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {field.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSortOrder('asc')}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-center gap-1.5",
                          sortOrder === 'asc'
                            ? "bg-indigo-50 border-indigo-205 text-indigo-700"
                            : "bg-white border-slate-200 text-slate-500"
                        )}
                      >
                        Ascending
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortOrder('desc')}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-center gap-1.5",
                          sortOrder === 'desc'
                            ? "bg-indigo-50 border-indigo-205 text-indigo-700"
                            : "bg-white border-slate-200 text-slate-500"
                        )}
                      >
                        Descending
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Filters Footer */}
              <div className="p-4 border-t border-border bg-card flex flex-col gap-3 shrink-0">
                <div className="flex gap-3">
                  <button 
                    onClick={handleResetFilters}
                    className="flex-1 py-3 bg-muted border border-border text-foreground hover:bg-card text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                  >
                    Reset Filters
                  </button>
                  <button 
                    onClick={() => setIsFiltersDrawerOpen(false)}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Apply
                  </button>
                </div>
                <button
                  onClick={() => {
                    setIsFiltersDrawerOpen(false);
                    onSaveView();
                  }}
                  className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 text-center flex items-center justify-center gap-1.5"
                >
                  Save Current View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        onClick={onOpenCreateModal}
        className="fixed right-6 bottom-20 z-40 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 transition-transform active:scale-90"
        title="Add Location"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Actions Drawer */}
      <AnimatePresence>
        {isActionsDrawerOpen && selectedLocationForActions && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            {/* Backdrop Click */}
            <div className="fixed inset-0 z-40" onClick={() => setIsActionsDrawerOpen(false)} />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full bg-white border-t border-slate-100 rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl z-50 p-6 space-y-4"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-black text-slate-900 truncate">
                    {selectedLocationForActions.name}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Location Actions
                  </p>
                </div>
                <button 
                  onClick={() => setIsActionsDrawerOpen(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Options */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsActionsDrawerOpen(false);
                    onEditLocation(selectedLocationForActions);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-650">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-750">Edit Location</span>
                </button>

                <button
                  onClick={() => {
                    setIsActionsDrawerOpen(false);
                    onAddSubLocation(selectedLocationForActions.id);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Plus className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-750">Add Sub Location</span>
                </button>

                <button
                  onClick={() => {
                    setIsActionsDrawerOpen(false);
                    onDeleteLocation(selectedLocationForActions.id);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50/50 rounded-xl transition-colors text-left border-t border-slate-100 mt-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                    <X className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[13px] font-bold text-rose-650">Delete Location</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
