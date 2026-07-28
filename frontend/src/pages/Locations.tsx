import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Plus, MoreHorizontal, ChevronRight, 
    Filter, Users, ChevronDown, List, Map as MapIcon,
    Columns, ArrowUpDown, Settings2
} from 'lucide-react';
import { useLocations, useDeleteLocation, useSavedViews } from '../hooks/useData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateLocationModal } from '../components/CreateLocationModal';
import { AdvancedFiltersModal } from '../components/AdvancedFiltersModal';
import { AssignedToFilterModal } from '../components/AssignedToFilterModal';
import { SortPopover } from '../components/SortPopover';
import { ColumnPickerPopover } from '../components/ColumnPickerPopover';
import { RowActionsPopover } from '../components/RowActionsPopover';
import { SaveViewModal } from '../components/SaveViewModal';
import { HeaderActionsPopover } from '../components/HeaderActionsPopover';
import { LocationsMapView } from '../components/LocationsMapView';
import { format } from 'date-fns';
import { TableEmptyState } from '../components/EmptyState';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileLocations } from './MobileLocations';

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

import { useUserRole } from '../hooks/useUserRole';

export const LocationsPage = () => {
    const navigate = useNavigate();
    const { canManageData } = useUserRole();
    const [searchQuery, setSearchQuery] = useState('');
    
    const [activeFilters, setActiveFilters] = useState({
        name: '',
        selectedAssignees: [] as string[],
        selectedTeams: [] as string[],
        customerId: '',
        vendorIds: [] as string[],
    });

    const [sortBy, setSortBy] = useState('Date Created');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [sortAnchorRect, setSortAnchorRect] = useState<DOMRect | undefined>();

    const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
    const [columnAnchorRect, setColumnAnchorRect] = useState<DOMRect | undefined>();
    const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(ALL_COLUMNS.map(c => c.id));

    const [isRowActionsOpen, setIsRowActionsOpen] = useState(false);
    const [rowAnchorRect, setRowAnchorRect] = useState<DOMRect | undefined>();
    const [currentRowId, setCurrentRowId] = useState<string | null>(null);
    const [createInitialParentId, setCreateInitialParentId] = useState<string | undefined>();
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const deleteLocation = useDeleteLocation();
    const { createView } = useSavedViews('location');

    const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
    const { views: savedViews } = useSavedViews('location');
    const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);

    const [isHeaderActionsOpen, setIsHeaderActionsOpen] = useState(false);
    const [headerActionsAnchorRect, setHeaderActionsAnchorRect] = useState<DOMRect | undefined>();

    const { data: locations, isLoading } = useLocations({ 
        search: searchQuery || activeFilters.name, 
        sortBy,
        sortOrder,
        workerIds: activeFilters.selectedAssignees,
        teamIds: activeFilters.selectedTeams,
        customerId: activeFilters.customerId,
        vendorIds: activeFilters.vendorIds,
    });

    const handleExport = () => {
        if (!locations?.length) return;
        
        const headers = ['Name', 'Address', 'Parent', 'Workers', 'Teams', 'Created At'];
        const csvContent = [
            headers.join(','),
            ...locations.map(l => [
                `"${l.name}"`,
                `"${l.address || ''}"`,
                `"${l.parent?.name || ''}"`,
                l._count?.workers || 0,
                l._count?.teams || 0,
                format(new Date(l.createdAt), 'yyyy-MM-dd')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `locations_export_${format(new Date(), 'yyyyMMdd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [activeTab, setActiveTab] = useState<'List' | 'Map'>('List');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
    const [isAssignedToModalOpen, setIsAssignedToModalOpen] = useState(false);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    const filteredLocations = locations;

    const toggleRow = (id: string) => {
        setSelectedRows(prev => 
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedRows.length === (filteredLocations?.length || 0)) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredLocations?.map(l => l.id) || []);
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setActiveFilters({
            name: '',
            selectedAssignees: [],
            selectedTeams: [],
            customerId: '',
            vendorIds: [],
        });
    };

    const isMobile = useMediaQuery('(max-width: 768px)');

    return (
        <>
            {isMobile ? (
                <MobileLocations 
                    locations={locations || []}
                    isLoading={isLoading}
                    onSelectLocation={(id) => navigate(`/locations/${id}`)}
                    onOpenCreateModal={() => {
                        setEditingLocation(null);
                        setCreateInitialParentId(undefined);
                        setIsCreateModalOpen(true);
                    }}
                    onExport={handleExport}
                    activeFilters={activeFilters}
                    setActiveFilters={setActiveFilters}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    savedViews={savedViews || []}
                    visibleColumnIds={visibleColumnIds}
                    setVisibleColumnIds={setVisibleColumnIds}
                    onEditLocation={(loc) => {
                        setEditingLocation(loc);
                        setIsCreateModalOpen(true);
                    }}
                    onDeleteLocation={(id) => {
                        if (confirm('Are you sure you want to delete this location?')) {
                            deleteLocation.mutate(id);
                        }
                    }}
                    onAddSubLocation={(id) => {
                        setCreateInitialParentId(id);
                        setIsCreateModalOpen(true);
                    }}
                    onSaveView={() => setIsSaveViewModalOpen(true)}
                />
            ) : (
                <div className="flex flex-col h-full bg-white overflow-hidden font-sans">
            {/* Main Header */}
            <header className="h-[72px] border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4 h-full">
                    <h1 className="text-[22px] font-semibold text-slate-900">Locations</h1>
                    <div className="relative">
                        <button 
                            onClick={() => {
                                setIsSavedViewsOpen(!isSavedViewsOpen);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <Settings2 className="w-4 h-4 text-slate-400" />
                            Default View
                            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isSavedViewsOpen && "rotate-180")} />
                        </button>
                        
                        <AnimatePresence>
                            {isSavedViewsOpen && (
                                <>
                                    <div className="fixed inset-0 z-[110]" onClick={() => setIsSavedViewsOpen(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl ring-1 ring-black/5 z-[120] overflow-hidden"
                                    >
                                        <div className="p-1">
                                            <div className="px-3 py-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">Your Saved Views</div>
                                            <button 
                                                onClick={() => { setIsSavedViewsOpen(false); handleResetFilters(); }}
                                                className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-between"
                                            >
                                                Default View
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            </button>
                                            {savedViews?.map((view: any) => (
                                                <button 
                                                    key={view.id}
                                                    onClick={() => {
                                                        const config = view.config;
                                                        if (config.filters) setActiveFilters(config.filters);
                                                        if (config.search !== undefined) setSearchQuery(config.search);
                                                        if (config.visibleColumns) setVisibleColumnIds(config.visibleColumns);
                                                        if (config.sortBy) setSortBy(config.sortBy);
                                                        if (config.sortOrder) setSortOrder(config.sortOrder);
                                                        setIsSavedViewsOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    {view.name}
                                                </button>
                                            ))}
                                            {savedViews?.length === 0 && (
                                                <div className="px-3 py-4 text-center">
                                                    <p className="text-[11px] text-slate-400 font-bold italic">No custom views saved yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    <nav className="flex items-center h-full gap-8">
                        {['List', 'Map'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn(
                                    "relative h-full px-1 text-[14px] font-medium transition-colors flex items-center",
                                    activeTab === tab ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                {tab === 'List' ? <List className="w-4 h-4 mr-2" /> : <MapIcon className="w-4 h-4 mr-2" />}
                                {tab}
                                {activeTab === tab && (
                                    <motion.div 
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600"
                                    />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {canManageData && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => {
                                    setEditingLocation(null);
                                    setIsCreateModalOpen(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 h-10 rounded-lg flex items-center gap-2 text-[14px] font-semibold transition-all shadow-sm active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Create Location
                            </button>
                            <button 
                                onClick={(e) => {
                                    setHeaderAnchorRect(e.currentTarget.getBoundingClientRect());
                                    setIsHeaderActionsOpen(true);
                                }}
                                className="bg-white border border-slate-200 h-10 w-10 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <MoreHorizontal className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Sub-Header / Action Bar */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white">
                <div className="text-[13px] font-medium text-slate-500">
                    <span className="text-slate-900 font-bold">{filteredLocations?.length || 0}</span> Results Returned
                </div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={(e) => {
                            setSortAnchorRect(e.currentTarget.getBoundingClientRect());
                            setIsSortOpen(true);
                        }}
                        className="flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowUpDown className="w-4 h-4 text-slate-400" />
                        Sort: {sortBy}
                    </button>
                    <button 
                        onClick={(e) => {
                            setColumnAnchorRect(e.currentTarget.getBoundingClientRect());
                            setIsColumnPickerOpen(true);
                        }}
                        className="flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <Columns className="w-4 h-4 text-slate-400" />
                        Columns
                    </button>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-64 bg-slate-100 border border-transparent rounded-lg pl-10 pr-4 text-[13px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFiltersModalOpen(true)}
                        className="h-9 px-4 border border-slate-200 rounded-lg flex items-center gap-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Filter className="w-4 h-4 text-slate-400" />
                        Filters
                    </button>
                    <button 
                        onClick={() => setIsAssignedToModalOpen(true)}
                        className="h-9 px-4 border border-slate-200 rounded-lg flex items-center gap-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Users className="w-4 h-4 text-slate-400" />
                        Assigned To
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button 
                        onClick={handleResetFilters}
                        className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 ml-2"
                    >
                        Reset Filters
                    </button>
                </div>

                <button 
                    onClick={() => setIsSaveViewModalOpen(true)}
                    className="text-[13px] font-semibold text-slate-400 hover:text-slate-600"
                >
                    Save View
                </button>
            </div>

            {/* Content Area */}
            <main className="flex-1 overflow-auto bg-slate-50/30">
                {activeTab === 'List' ? (
                    <div className="min-w-full">
                        <table className="w-full border-collapse text-left">
                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                <tr>
                                    <th className="w-12 px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            checked={locations?.length ? selectedRows.length === locations.length : false}
                                            onChange={toggleAll}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                                        />
                                    </th>
                                    {visibleColumnIds.includes('Name') && <th className="px-4 py-4 text-[12px] font-bold text-slate-800 uppercase tracking-wider">Name</th>}
                                    {visibleColumnIds.includes('Hierarchy') && <th className="px-4 py-4 text-[12px] font-bold text-slate-800 uppercase tracking-wider">Hierarchy</th>}
                                    {visibleColumnIds.includes('Address') && <th className="px-4 py-4 text-[12px] font-bold text-slate-800 uppercase tracking-wider">Address</th>}
                                    {visibleColumnIds.includes('No. of Children') && <th className="px-4 py-4 text-[12px] font-bold text-slate-800 uppercase tracking-wider">No. of Children</th>}
                                    {visibleColumnIds.includes('Workers') && <th className="px-4 py-4 text-[12px] font-bold text-slate-800 uppercase tracking-wider">Workers</th>}
                                    {visibleColumnIds.includes('Teams') && <th className="px-4 py-4 text-[12px] font-bold text-slate-800 uppercase tracking-wider">Teams</th>}
                                    {visibleColumnIds.includes('Customers') && <th className="px-4 py-4 text-[12px] font-bold text-slate-800 uppercase tracking-wider">Customers</th>}
                                    {visibleColumnIds.includes('Vendors') && <th className="px-4 py-4 text-[12px] font-bold text-slate-800 uppercase tracking-wider">Vendors</th>}
                                    {visibleColumnIds.includes('Date Created') && <th className="px-4 py-4 text-[12px] font-bold text-slate-800 uppercase tracking-wider">Date Created</th>}
                                    <th className="w-12 px-4 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                <AnimatePresence mode="popLayout">
                                    {isLoading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={10} className="px-6 py-4">
                                                    <div className="h-6 bg-slate-100 rounded w-full" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredLocations?.length === 0 ? (
                                        <TableEmptyState
                                            variant="location"
                                            colSpan={10}
                                            title="No locations found"
                                            description="Try adjusting your search or filters."
                                        />
                                    ) : (
                                        filteredLocations?.map((location) => (
                                            <motion.tr 
                                                key={location.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className={cn(
                                                    "group hover:bg-slate-50/80 transition-colors cursor-pointer",
                                                    selectedRows.includes(location.id) && "bg-blue-50/50"
                                                )}
                                                onClick={() => navigate(`/locations/${location.id}`)}
                                            >
                                                <td className="px-6 py-3.5 flex items-center gap-3">
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedRows.includes(location.id)}
                                                        onChange={() => toggleRow(location.id)}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                {visibleColumnIds.includes('Name') && (
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[14px] font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                                                            {location.name}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumnIds.includes('Hierarchy') && (
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[14px] text-slate-600">
                                                            {location.parent?.name || '—'}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumnIds.includes('Address') && (
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[14px] text-slate-600 truncate max-w-[300px] block">
                                                            {location.address || '—'}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumnIds.includes('No. of Children') && (
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[14px] font-medium text-blue-600 hover:underline">
                                                            {location._count?.children || 0}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumnIds.includes('Workers') && (
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[14px] text-slate-600">
                                                            {location._count?.workers || 0}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumnIds.includes('Teams') && (
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[14px] text-slate-600">
                                                            {location._count?.teams || 0}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumnIds.includes('Customers') && (
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[14px] text-slate-600">
                                                            {location._count?.customers || 0}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumnIds.includes('Vendors') && (
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[14px] text-slate-600">
                                                            {location._count?.vendors || 0}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumnIds.includes('Date Created') && (
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[14px] text-slate-600">
                                                                {format(new Date(location.createdAt), 'MM/dd/yy')}
                                                            </span>
                                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-4 py-3.5 text-right">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRowAnchorRect(e.currentTarget.getBoundingClientRect());
                                                            setCurrentRowId(location.id);
                                                            setIsRowActionsOpen(true);
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100"
                                                    >
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <LocationsMapView locations={locations || []} isLoading={isLoading} />
                )}
            </main>
        </div>
    )}

            <CreateLocationModal 
                isOpen={isCreateModalOpen} 
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setCreateInitialParentId(undefined);
                    setEditingLocation(null);
                }} 
                initialParentId={createInitialParentId}
                location={editingLocation}
            />

            <AdvancedFiltersModal 
                isOpen={isFiltersModalOpen}
                onClose={() => setIsFiltersModalOpen(false)}
                onApply={(filters) => {
                    setActiveFilters(filters);
                    console.log('Applying filters:', filters);
                }}
                activeFilters={activeFilters}
            />

            <AssignedToFilterModal 
                isOpen={isAssignedToModalOpen}
                onClose={() => setIsAssignedToModalOpen(false)}
                onSave={(ids) => {
                    setActiveFilters(prev => ({ ...prev, selectedAssignees: ids }));
                    console.log('Assigned to ids:', ids);
                }}
                initialSelectedIds={activeFilters.selectedAssignees}
            />

            <SortPopover 
                isOpen={isSortOpen}
                onClose={() => setIsSortOpen(false)}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={setSortBy}
                onOrderChange={setSortOrder}
                anchorRect={sortAnchorRect}
            />

            <ColumnPickerPopover 
                isOpen={isColumnPickerOpen}
                onClose={() => setIsColumnPickerOpen(false)}
                columns={ALL_COLUMNS}
                visibleColumnIds={visibleColumnIds}
                onToggle={(id) => {
                    setVisibleColumnIds(prev => 
                        prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
                    );
                }}
                anchorRect={columnAnchorRect}
            />

            <RowActionsPopover 
                isOpen={isRowActionsOpen}
                onClose={() => setIsRowActionsOpen(false)}
                onAddSubLocation={() => {
                    setCreateInitialParentId(currentRowId || undefined);
                    setIsCreateModalOpen(true);
                }}
                onEdit={() => {
                    const loc = filteredLocations?.find(l => l.id === currentRowId);
                    if (loc) {
                        setEditingLocation(loc);
                        setIsCreateModalOpen(true);
                    }
                }}
                onDelete={() => {
                    if (currentRowId && confirm('Are you sure you want to delete this location?')) {
                        deleteLocation.mutate(currentRowId);
                    }
                }}
                anchorRect={rowAnchorRect}
            />

            <SaveViewModal 
                isOpen={isSaveViewModalOpen}
                onClose={() => setIsSaveViewModalOpen(false)}
                onSave={(name) => {
                    createView.mutate({
                        name,
                        entityType: 'location',
                        config: {
                            filters: activeFilters,
                            search: searchQuery,
                            visibleColumns: visibleColumnIds,
                            sortBy,
                            sortOrder
                        }
                    });
                    setIsSaveViewModalOpen(false);
                }}
            />

            <HeaderActionsPopover 
                isOpen={isHeaderActionsOpen}
                onClose={() => setIsHeaderActionsOpen(false)}
                onImport={() => console.log('Import triggered')}
                onExport={handleExport}
                anchorRect={headerActionsAnchorRect}
            />
        </>
    );
};
