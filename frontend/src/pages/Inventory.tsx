import { useState } from 'react';
import {
    X, ChevronDown, Search, Plus, Filter,
    Columns, MoreHorizontal, Table as TableIcon,
    ArrowUpDown, Image as ImageIcon, Check, GripVertical,
    Scan, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParts, useLocations } from '../hooks/useData';
import { cn } from '../lib/utils';
import { PartInspector } from '../components/PartInspector';
import { CreatePurchaseOrderModal } from '../components/CreatePurchaseOrderModal';
import { InventoryPlanningHub } from '../components/InventoryPlanningHub';
import { CreatePartModal } from '../components/CreatePartModal';
import { InventoryFiltersModal } from '../components/InventoryFiltersModal';
import { TableEmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { QRScannerModal } from '../components/QRScannerModal';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileInventory } from './MobileInventory';
import { useUserRole } from '../hooks/useUserRole';

export const InventoryPage = () => {
    const { canManageData } = useUserRole();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
    const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);
    const [isPlanningHubOpen, setIsPlanningHubOpen] = useState(false);
    const [isCreatePartModalOpen, setIsCreatePartModalOpen] = useState(false);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
    const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
    const [isIncomingQtyPopoverOpen, setIsIncomingQtyPopoverOpen] = useState(false);
    const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
    const [isTagsPopoverOpen, setIsTagsPopoverOpen] = useState(false);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        'Name', 'Image', 'Status', 'Available Qty', 'Allocated Qty',
        'On Hand Qty', 'Incoming Qty', 'Location', 'Barcode', 'Tags'
    ]);
    const [sortBy, setSortBy] = useState('Date Created');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const [tagsSearchQuery, setTagsSearchQuery] = useState('');
    const [includeSubLocations, setIncludeSubLocations] = useState(true);
    const [excludeIncoming, setExcludeIncoming] = useState(false);
    const [initialPartForPO, setInitialPartForPO] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'Inventory' | 'Parts' | 'Sets' | 'Cycle Counts'>('Inventory');
    const [viewMode, setViewMode] = useState<'Table' | 'Gallery'>('Table');
    const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const { data: locations } = useLocations();

    const handleScan = (scannedText: string) => {
        const code = scannedText.trim();
        if (!code) return;

        // Try to match in current parts
        const matchedPart = parts.find((p: any) => 
            p.barcode?.toLowerCase() === code.toLowerCase() ||
            p.partNumber?.toLowerCase() === code.toLowerCase() ||
            p.id === code
        );

        if (matchedPart) {
            setSelectedPartId(matchedPart.id);
            toast.success(`Found part: ${matchedPart.name}`);
        } else {
            setSearchQuery(code);
            toast.error(`Part with code "${code}" not found. Filtered search.`);
        }
    };

    const { data: partsData, isLoading } = useParts({
        search: searchQuery,
        status: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
        locationId: selectedLocations.length > 0 ? selectedLocations.join(',') : undefined,
        sortBy: sortBy.toLowerCase().replace(' ', '_'),
        sortOrder: sortOrder
    });
    const parts = Array.isArray(partsData) ? partsData : (partsData as any)?.items || [];
    const selectedPart = parts?.find((p: any) => p.id === selectedPartId);

    const filteredParts = parts?.filter((p: any) => {
        const matchesSearch = !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.partNumber?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = selectedStatuses.length === 0 ||
            selectedStatuses.includes(p.status > (p.minQuantity || 5) ? 'Non-stock' : 'Low stock');

        const matchesLocation = selectedLocations.length === 0 ||
            (p.locationId && selectedLocations.includes(p.locationId));

        return matchesSearch && matchesStatus && matchesLocation;
    });

    const toggleRow = (id: string) => {
        setSelectedRows((prev: string[]) => prev.includes(id) ? prev.filter((r: string) => r !== id) : [...prev, id]);
    };

    const toggleAllRows = () => {
        if (selectedRows.length === (filteredParts?.length || 0)) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredParts?.map((p: any) => p.id) || []);
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedStatuses([]);
        setSelectedLocations([]);
        setSelectedTags([]);
        setExcludeIncoming(false);
    };

    const exportToExcel = () => {
        if (!filteredParts || filteredParts.length === 0) {
            toast.error('No parts to export');
            return;
        }
        
        const data = filteredParts.map((part: any) => ({
            ID: part.id,
            Name: part.name,
            Description: part.description,
            Category: part.category,
            Status: part.status,
            AvailableQty: part.availableQty,
            AllocatedQty: part.allocatedQty,
            OnHandQty: part.onHandQty,
            IncomingQty: part.incomingQty,
            MinimumQty: part.minimumQty,
            MaximumQty: part.maximumQty,
            UnitCost: part.unitCost,
            Location: part.locationName || part.locationId,
            Area: part.area,
            Barcode: part.barcode,
            PartNumber: part.partNumber,
            DateCreated: new Date(part.createdAt).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
        XLSX.writeFile(workbook, `CMMS_Inventory_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Inventory exported successfully');
    };

    const isMobile = useMediaQuery('(max-width: 768px)');

    if (isMobile) {
        return (
            <>
                <MobileInventory 
                    parts={parts}
                    isLoading={isLoading}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    selectedStatuses={selectedStatuses}
                    setSelectedStatuses={setSelectedStatuses}
                    selectedLocations={selectedLocations}
                    setSelectedLocations={setSelectedLocations}
                    selectedTags={selectedTags}
                    setSelectedTags={setSelectedTags}
                    visibleColumns={visibleColumns}
                    setVisibleColumns={setVisibleColumns}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    excludeIncoming={excludeIncoming}
                    setExcludeIncoming={setExcludeIncoming}
                    onSelectPart={setSelectedPartId}
                    onOpenCreateModal={() => setIsCreatePartModalOpen(true)}
                    onOpenScanner={() => setIsScannerOpen(true)}
                    onExportExcel={exportToExcel}
                    onResetFilters={resetFilters}
                    onOpenFiltersModal={() => setIsFiltersModalOpen(true)}
                />
                
                {selectedPart && (
                    <PartInspector 
                        part={selectedPart} 
                        onClose={() => setSelectedPartId(null)} 
                        onIssuePO={(part) => {
                            setInitialPartForPO(part);
                            setIsCreatePOModalOpen(true);
                        }}
                    />
                )}

                <CreatePurchaseOrderModal
                    isOpen={isCreatePOModalOpen}
                    onClose={() => {
                        setIsCreatePOModalOpen(false);
                        setInitialPartForPO(null);
                    }}
                    initialPartId={initialPartForPO?.id}
                />

                <CreatePartModal 
                    isOpen={isCreatePartModalOpen} 
                    onClose={() => setIsCreatePartModalOpen(false)} 
                />

                <QRScannerModal 
                    isOpen={isScannerOpen} 
                    onClose={() => setIsScannerOpen(false)} 
                    onScan={handleScan} 
                />
            </>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Top Command Bar */}
            <header className="h-[72px] flex items-center justify-between px-8 border-b border-slate-100 shrink-0 overflow-x-auto no-scrollbar py-2">
                <div className="flex items-center gap-8 h-full">
                    <h1 className="text-[20px] font-black text-slate-900 tracking-tight">Inventory</h1>

                    <nav className="flex items-center gap-6 h-full ml-4">
                        {['Inventory', 'Parts', 'Sets', 'Cycle Counts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={cn(
                                    "px-1 h-full flex items-center text-[13px] font-bold transition-all relative border-b-2",
                                    activeTab === tab ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div
                            onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-100 transition-all"
                        >
                            <TableIcon className="w-4 h-4 text-slate-500" />
                            <span className="text-[12px] font-bold text-slate-600">{viewMode}</span>
                            <ChevronDown className="w-4 h-4 text-slate-300" />
                        </div>

                        <AnimatePresence>
                            {isViewDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 5 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full right-0 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2"
                                >
                                    {[
                                        { id: 'Table', icon: TableIcon },
                                        { id: 'Gallery', icon: TableIcon }
                                    ].map(mode => (
                                        <div
                                            key={mode.id}
                                            onClick={() => { setViewMode(mode.id as any); setIsViewDropdownOpen(false); }}
                                            className="px-4 py-2 flex items-center gap-2 hover:bg-slate-50 cursor-pointer text-[13px] font-medium text-slate-600"
                                        >
                                            <mode.icon className="w-4 h-4" />
                                            {mode.id}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={exportToExcel}
                        className="bg-white border border-slate-200 text-slate-700 h-11 px-4 rounded-xl flex items-center gap-2 text-[13px] font-bold hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>

                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="bg-slate-900 text-white h-11 px-4 rounded-xl flex items-center gap-2 text-[13px] font-bold hover:bg-black active:scale-95 transition-all shadow-sm"
                    >
                        <Scan className="w-4 h-4" />
                        Scan Part
                    </button>

                    {canManageData && (
                        <>
                            <button
                                onClick={() => setIsCreatePartModalOpen(true)}
                                className="bg-[#3B82F6] text-white h-11 px-6 rounded-xl flex items-center gap-2 text-[13px] font-bold hover:bg-blue-600 active:scale-95 transition-all shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                                Create Part
                            </button>

                            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Sub-Header: Controls & Metrics */}
            <div className="px-8 py-4 flex items-center justify-between shrink-0 bg-white overflow-x-auto no-scrollbar py-2">
                <div className="text-[13px] font-bold text-slate-900">{filteredParts.length} Results Returned</div>

                <div className="flex items-center gap-6">
                    {/* Sort Menu Hub */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                            className="flex items-center gap-2 text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors group"
                        >
                            <ArrowUpDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            Sort: <span className="text-slate-900">{sortBy}</span>
                        </button>

                        <AnimatePresence>
                            {isSortMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 5, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 w-[240px] bg-white rounded-xl shadow-2xl border border-slate-100 z-[1001] py-2 overflow-hidden mt-1"
                                >
                                    <div className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Sort By</div>
                                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                                        {['Name', 'Allocated Qty', 'Incoming Qty', 'Barcode', 'Area', 'Category', 'Date Created', 'Critical'].map(field => (
                                            <button
                                                key={field}
                                                onClick={() => { setSortBy(field); setIsSortMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                                            >
                                                {field}
                                                {sortBy === field && <Check className="w-4 h-4 text-blue-500" />}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-50">
                                        <div className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Order</div>
                                        {[
                                            { label: 'Descending', value: 'desc' },
                                            { label: 'Ascending', value: 'asc' }
                                        ].map(order => (
                                            <button
                                                key={order.value}
                                                onClick={() => { setSortOrder(order.value as 'asc' | 'desc'); setIsSortMenuOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                                            >
                                                {order.label}
                                                {sortOrder === order.value && <Check className="w-4 h-4 text-blue-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsColumnsMenuOpen(!isColumnsMenuOpen)}
                            className="flex items-center gap-2 text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors group"
                        >
                            <Columns className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                            Columns
                        </button>

                        <AnimatePresence>
                            {isColumnsMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 5, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 w-[260px] bg-white rounded-xl shadow-2xl border border-slate-100 z-[1001] py-2 mt-1"
                                >
                                    <div className="max-h-[460px] overflow-y-auto custom-scrollbar px-1">
                                        {[
                                            'Name', 'Image', 'Status', 'Available Qty', 'Allocated Qty',
                                            'On Hand Qty', 'Incoming Qty', 'Location', 'Barcode', 'Tags',
                                            'Area', 'Cost', 'Category', 'Description', 'Workers', 'Vendors',
                                            'Date Created', 'ID', 'Part Number', 'Customers', 'Additional Details',
                                            'Team', 'Minimum Qty', 'Maximum Qty', 'Critical'
                                        ].map(col => (
                                            <div
                                                key={col}
                                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors group cursor-pointer"
                                                onClick={() => {
                                                    if (col === 'Name') return;
                                                    setVisibleColumns(prev =>
                                                        prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
                                                    );
                                                }}
                                            >
                                                <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                                                <div className={cn(
                                                    "w-4.5 h-4.5 border-2 rounded transition-all flex items-center justify-center",
                                                    visibleColumns.includes(col) ? "bg-blue-500 border-blue-500" : "border-slate-200",
                                                    col === 'Name' && "bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed"
                                                )}>
                                                    {visibleColumns.includes(col) && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                                                </div>
                                                <span className={cn(
                                                    "text-[14px] font-medium transition-colors",
                                                    visibleColumns.includes(col) ? "text-slate-900" : "text-slate-400",
                                                    col === 'Name' && "text-slate-300 font-bold"
                                                )}>{col}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative w-[300px] group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-muted border border-border rounded-xl text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="px-8 py-3 flex items-center justify-between bg-white border-b border-slate-100 shrink-0 overflow-x-auto no-scrollbar py-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFiltersModalOpen(true)}
                        className="h-10 px-4 flex items-center gap-2 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Filter className="px-1 w-4 h-4 text-slate-400" />
                        Filters
                    </button>
                    <div className="relative">
                        <div
                            onClick={() => setIsStatusPopoverOpen(!isStatusPopoverOpen)}
                            className={cn(
                                "h-10 px-4 flex items-center gap-2 border rounded-xl text-[13px] font-bold cursor-pointer transition-all",
                                isStatusPopoverOpen ? "border-blue-400 bg-blue-50/10 text-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300"
                            )}
                        >
                            Status <ChevronDown className="w-4 h-4 text-slate-300" />
                        </div>

                        <AnimatePresence>
                            {isStatusPopoverOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 mt-2 w-[280px] bg-white rounded-xl shadow-2xl border border-slate-100 z-[1001] overflow-hidden"
                                >
                                    <div className="p-5 flex items-center justify-between border-b border-slate-50">
                                        <span className="font-black text-slate-900 text-[15px]">Status</span>
                                        <X
                                            className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600"
                                            onClick={() => setIsStatusPopoverOpen(false)}
                                        />
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {['In stock', 'Low stock', 'Out of stock', 'Non-stock'].map(status => (
                                            <div
                                                key={status}
                                                onClick={() => {
                                                    setSelectedStatuses(prev =>
                                                        prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                                                    );
                                                }}
                                                className="flex items-center gap-3 cursor-pointer group"
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 border-2 rounded-lg transition-all",
                                                    selectedStatuses.includes(status) ? "bg-blue-500 border-blue-500 shadow-sm" : "border-slate-200 group-hover:border-slate-300"
                                                )} />
                                                <span className="text-[14px] font-medium text-slate-700">{status}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                                        <button
                                            onClick={() => setSelectedStatuses([])}
                                            className="text-[14px] font-bold text-slate-400 hover:text-slate-600 px-2"
                                        >
                                            Clear
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsStatusPopoverOpen(false)}
                                                className="px-4 py-2 text-[14px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => setIsStatusPopoverOpen(false)}
                                                className="px-5 py-2 text-[14px] font-bold text-white bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <div
                            onClick={() => setIsIncomingQtyPopoverOpen(!isIncomingQtyPopoverOpen)}
                            className={cn(
                                "h-10 px-4 flex items-center gap-2 border rounded-xl text-[13px] font-bold cursor-pointer transition-all",
                                isIncomingQtyPopoverOpen ? "border-blue-400 bg-blue-50/10 text-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300"
                            )}
                        >
                            <Filter className="w-4 h-4 text-slate-400" />
                            Incoming Qty <ChevronDown className="w-4 h-4 text-slate-300" />
                        </div>

                        <AnimatePresence>
                            {isIncomingQtyPopoverOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 mt-2 w-[320px] bg-white rounded-xl shadow-2xl border border-slate-100 z-[1001] overflow-hidden"
                                >
                                    <div className="p-5 flex items-center justify-between border-b border-slate-50">
                                        <span className="font-black text-slate-900 text-[15px]">Incoming Qty</span>
                                        <X
                                            className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600"
                                            onClick={() => setIsIncomingQtyPopoverOpen(false)}
                                        />
                                    </div>
                                    <div className="p-6">
                                        <div
                                            onClick={() => setExcludeIncoming(!excludeIncoming)}
                                            className="flex items-center gap-3 cursor-pointer group"
                                        >
                                            <div className={cn(
                                                "w-5 h-5 border-2 rounded-lg transition-all",
                                                excludeIncoming ? "bg-blue-500 border-blue-500 shadow-sm" : "border-slate-200 group-hover:border-slate-300"
                                            )} />
                                            <span className="text-[14px] font-medium text-slate-700 leading-none">Exclude Incoming Inventory</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                                        <button
                                            onClick={() => setExcludeIncoming(false)}
                                            className="text-[14px] font-bold text-slate-400 hover:text-slate-600 px-2"
                                        >
                                            Clear
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsIncomingQtyPopoverOpen(false)}
                                                className="px-4 py-2 text-[14px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => setIsIncomingQtyPopoverOpen(false)}
                                                className="px-5 py-2 text-[14px] font-bold text-white bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <div
                            onClick={() => setIsLocationPopoverOpen(!isLocationPopoverOpen)}
                            className={cn(
                                "h-10 px-4 flex items-center gap-2 border rounded-xl text-[13px] font-bold cursor-pointer transition-all",
                                isLocationPopoverOpen ? "border-blue-400 bg-blue-50/10 text-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300"
                            )}
                        >
                            Location <ChevronDown className="w-4 h-4 text-slate-300" />
                        </div>

                        <AnimatePresence>
                            {isLocationPopoverOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 mt-2 w-[340px] bg-white rounded-xl shadow-2xl border border-slate-100 z-[1001] overflow-hidden"
                                >
                                    <div className="p-5 flex items-center justify-between border-b border-slate-50">
                                        <span className="font-black text-slate-900 text-[15px]">Location</span>
                                        <X
                                            className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600"
                                            onClick={() => setIsLocationPopoverOpen(false)}
                                        />
                                    </div>

                                    <div className="p-4 space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="text"
                                                placeholder="Search"
                                                value={locationSearchQuery}
                                                onChange={(e) => setLocationSearchQuery(e.target.value)}
                                                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-medium focus:outline-none focus:border-blue-400 transition-all"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-[13px] font-bold text-slate-900">Include sub-locations in selection</span>
                                            <div
                                                onClick={() => setIncludeSubLocations(!includeSubLocations)}
                                                className={cn(
                                                    "w-10 h-5 rounded-full transition-all relative cursor-pointer",
                                                    includeSubLocations ? "bg-blue-500" : "bg-slate-200"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                                    includeSubLocations ? "left-6" : "left-1"
                                                )} />
                                            </div>
                                        </div>

                                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-1">
                                            {(locations || [])
                                                .filter((loc: any) => loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase()))
                                                .map((loc: any) => (
                                                    <div
                                                        key={loc.id}
                                                        onClick={() => {
                                                            setSelectedLocations(prev =>
                                                                prev.includes(loc.id) ? prev.filter(id => id !== loc.id) : [...prev, loc.id]
                                                            );
                                                        }}
                                                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-4 h-4 rounded border-2 transition-all flex items-center justify-center",
                                                                selectedLocations.includes(loc.id) ? "bg-blue-500 border-blue-500" : "border-slate-200"
                                                            )}>
                                                                {selectedLocations.includes(loc.id) && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <span className="text-[13px] font-bold text-slate-700">{loc.name}</span>
                                                        </div>
                                                        {loc.children?.length > 0 && (
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{loc.children.length} Sub</span>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[13px] font-medium text-slate-400">{selectedLocations.length} selected</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsLocationPopoverOpen(false)}
                                                className="px-4 py-2 text-[14px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => setIsLocationPopoverOpen(false)}
                                                className="px-5 py-2 text-[14px] font-bold text-white bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <div
                            onClick={() => setIsTagsPopoverOpen(!isTagsPopoverOpen)}
                            className={cn(
                                "h-10 px-4 flex items-center gap-2 border rounded-xl text-[13px] font-bold cursor-pointer transition-all",
                                isTagsPopoverOpen ? "border-blue-400 bg-blue-50/10 text-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300"
                            )}
                        >
                            Tags <ChevronDown className="w-4 h-4 text-slate-300" />
                        </div>

                        <AnimatePresence>
                            {isTagsPopoverOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 mt-2 w-[300px] bg-white rounded-xl shadow-2xl border border-slate-100 z-[1001] overflow-hidden"
                                >
                                    <div className="p-5 flex items-center justify-between border-b border-slate-50">
                                        <span className="font-black text-slate-900 text-[15px]">Tags</span>
                                        <X
                                            className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600"
                                            onClick={() => setIsTagsPopoverOpen(false)}
                                        />
                                    </div>

                                    <div className="p-4 space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                type="text"
                                                placeholder="Search"
                                                value={tagsSearchQuery}
                                                onChange={(e) => setTagsSearchQuery(e.target.value)}
                                                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-lg text-[13px] font-medium focus:outline-none focus:border-blue-400 transition-all"
                                            />
                                        </div>

                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                                            {[
                                                { name: 'Mechanical', color: 'bg-blue-500' },
                                                { name: 'Electrical', color: 'bg-yellow-500' },
                                                { name: 'Critical', color: 'bg-red-500' },
                                                { name: 'Consumable', color: 'bg-green-500' },
                                                { name: 'Spare', color: 'bg-emerald-500' },
                                                { name: 'Hydraulic', color: 'bg-cyan-500' },
                                                { name: 'Pneumatic', color: 'bg-violet-500' },
                                            ].filter(tag => tag.name.toLowerCase().includes(tagsSearchQuery.toLowerCase())).map((tag, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setSelectedTags(prev =>
                                                            prev.includes(tag.name) ? prev.filter(t => t !== tag.name) : [...prev, tag.name]
                                                        );
                                                    }}
                                                    className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-4 h-4 rounded border-2 transition-all flex items-center justify-center",
                                                            selectedTags.includes(tag.name) ? "bg-blue-500 border-blue-500" : "border-slate-200"
                                                        )}>
                                                            {selectedTags.includes(tag.name) && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-2 h-2 rounded-full", tag.color)} />
                                                            <span className="text-[13px] font-bold text-slate-700">{tag.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <button className="w-full mt-4 flex items-center gap-2 px-2 py-3 text-[13px] font-black text-blue-500 hover:text-blue-600 transition-colors">
                                                <Plus className="w-4 h-4" />
                                                Add New Tag
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                                        <button
                                            onClick={() => setSelectedTags([])}
                                            className="text-[14px] font-bold text-slate-400 hover:text-slate-600 px-2"
                                        >
                                            Clear
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsTagsPopoverOpen(false)}
                                                className="px-4 py-2 text-[14px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => setIsTagsPopoverOpen(false)}
                                                className="px-5 py-2 text-[14px] font-bold text-white bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        onClick={resetFilters}
                        className="text-[12px] font-bold text-blue-500 hover:text-blue-600 px-2 transition-colors active:scale-95"
                    >
                        Reset Filters
                    </button>
                </div>
                <button className="text-[12px] font-bold text-slate-900">Save View</button>
            </div>

            {/* Tactical Data Hub */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
                {viewMode === 'Table' ? (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-white border-b border-slate-100">
                                    <th className="w-16 px-8 py-4">
                                        <div
                                            onClick={toggleAllRows}
                                            className={cn(
                                                "w-5 h-5 border-2 rounded-lg transition-all cursor-pointer",
                                                selectedRows.length === (filteredParts?.length || 0) && filteredParts?.length > 0
                                                    ? "bg-blue-500 border-blue-500 shadow-sm" : "border-slate-200 hover:border-slate-300"
                                            )}
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-[12px] font-black uppercase tracking-widest text-slate-400">Name</th>
                                    <th className="px-6 py-4 text-center text-[12px] font-black uppercase tracking-widest text-slate-400">Image</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-black uppercase tracking-widest text-slate-400">Available Qty</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-black uppercase tracking-widest text-slate-400">Allocated Qty</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-black uppercase tracking-widest text-slate-400">On Hand Qty</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-black uppercase tracking-widest text-slate-400">Incoming Qty</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-black uppercase tracking-widest text-slate-400">Location</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-black uppercase tracking-widest text-slate-400">Barcode</th>
                                    <th className="px-6 py-4 text-left text-[12px] font-black uppercase tracking-widest text-slate-400">Tags</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse border-b border-slate-50">
                                            <td colSpan={11} className="h-16 px-8 bg-slate-50/20" />
                                        </tr>
                                    ))
                                ) : filteredParts.length === 0 ? (
                                    <TableEmptyState
                                        variant="part"
                                        colSpan={11}
                                        title="No inventory entries detected"
                                        description="Try adjusting your filters or search term."
                                    />
                                ) : (
                                    filteredParts.map((part: any) => (
                                        <tr
                                            key={part.id}
                                            onClick={() => setSelectedPartId(part.id)}
                                            className={cn(
                                                "group hover:bg-slate-50 cursor-pointer transition-all border-b border-slate-50",
                                                selectedPartId === part.id && "bg-blue-50/30"
                                            )}
                                        >
                                            <td className="px-8 py-4">
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); toggleRow(part.id); }}
                                                    className={cn(
                                                        "w-5 h-5 border-2 rounded-lg transition-all",
                                                        selectedRows.includes(part.id) ? "bg-blue-500 border-blue-500 shadow-sm" : "border-slate-200 group-hover:border-slate-300"
                                                    )}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[13px] font-bold text-blue-500 hover:underline">{part.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center mx-auto">
                                                    {part.imageUrl ? (
                                                        <img src={part.imageUrl} className="w-full h-full object-cover rounded-xl" />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-slate-200" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={cn(
                                                    "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold",
                                                    part.status === 'In stock' ? "bg-emerald-50 text-emerald-700" :
                                                        part.status === 'Low stock' ? "bg-orange-50 text-orange-700" :
                                                            "bg-slate-100 text-slate-600"
                                                )}>
                                                    {part.status || (part.quantity > (part.minQuantity || 5) ? 'Non-stock' : 'Low stock')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[13px] font-black",
                                                        part.quantity <= (part.minQuantity || 0) ? "text-red-600" : "text-slate-900"
                                                    )}>
                                                        {part.quantity.toFixed(2)}
                                                    </span>
                                                    {part.quantity <= (part.minQuantity || 0) && (
                                                        <div className="flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 animate-pulse">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            <span className="text-[9px] font-black uppercase tracking-tighter">Low</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-medium text-slate-400">0.00</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[13px] font-black",
                                                        part.quantity <= (part.minQuantity || 0) ? "text-red-600" : "text-slate-900"
                                                    )}>
                                                        {part.quantity.toFixed(2)}
                                                    </span>
                                                    {part.quantity <= (part.minQuantity || 0) && (
                                                        <div className="flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 animate-pulse">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            <span className="text-[9px] font-black uppercase tracking-tighter">Low</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-medium text-slate-400">0.00</td>
                                            <td className="px-6 py-4 text-[13px] font-bold text-slate-700">{part.location?.name || 'Suite B'}</td>
                                            <td className="px-6 py-4 text-[13px] font-medium text-slate-400 tabular-nums">{(part.barcode || part.id).substring(0, 10)}...</td>
                                            <td className="px-6 py-4">
                                                <span className="text-[13px] font-medium text-slate-300 italic">-</span>
                                            </td>
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredParts.map((part: any) => (
                                <div
                                    key={part.id}
                                    onClick={() => setSelectedPartId(part.id)}
                                    className="bg-white border border-slate-100 rounded-[1.25rem] overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all group cursor-pointer"
                                >
                                    <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center p-8 border-b border-slate-50">
                                        {part.imageUrl ? (
                                            <img src={part.imageUrl} className="w-full h-full object-contain mix-blend-multiply" />
                                        ) : (
                                            <ImageIcon className="w-16 h-16 text-slate-200" />
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-[15px] font-black text-slate-900 mb-6 group-hover:text-blue-500 transition-colors">
                                            {part.name}
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-medium text-slate-400">Quantity</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[13px] font-bold",
                                                        part.quantity <= (part.minQuantity || 0) ? "text-red-600" : "text-slate-900"
                                                    )}>
                                                        {part.quantity.toFixed(2)}
                                                    </span>
                                                    {part.quantity <= (part.minQuantity || 0) && <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-medium text-slate-400">Barcode</span>
                                                <span className="text-[13px] font-bold text-slate-900">{part.barcode || '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-medium text-slate-400">Cost</span>
                                                <span className="text-[13px] font-bold text-slate-900">${(part.cost || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Tactical Modals & Intelligence */}
            <AnimatePresence>
                {selectedPart && (
                    <PartInspector
                        part={selectedPart}
                        onClose={() => setSelectedPartId(null)}
                        onIssuePO={(part) => {
                            setInitialPartForPO(part);
                            setIsCreatePOModalOpen(true);
                        }}
                    />
                )}
            </AnimatePresence>

            <CreatePurchaseOrderModal
                isOpen={isCreatePOModalOpen}
                onClose={() => {
                    setIsCreatePOModalOpen(false);
                    setInitialPartForPO(null);
                }}
                initialPartId={initialPartForPO?.id}
            />

            <InventoryPlanningHub
                isOpen={isPlanningHubOpen}
                onClose={() => setIsPlanningHubOpen(false)}
                parts={parts || []}
            />

            <CreatePartModal
                isOpen={isCreatePartModalOpen}
                onClose={() => setIsCreatePartModalOpen(false)}
            />

            <InventoryFiltersModal
                isOpen={isFiltersModalOpen}
                onClose={() => setIsFiltersModalOpen(false)}
            />

            <QRScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScan}
            />
        </div>
    );
};

