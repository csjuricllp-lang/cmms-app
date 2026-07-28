import { useState } from 'react';
import {
    Plus,
    Filter,
    Search,
    ChevronDown,
    MoreHorizontal,
    LayoutGrid,
    ArrowUpDown,
    Check,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePurchaseOrders } from '../hooks/useData';
import { cn } from '../lib/utils';
import { POInspector } from '@/components/POInspector';
import { POModal } from '@/components/POModal';
import { TableEmptyState } from '../components/EmptyState';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobilePurchaseOrders } from './MobilePurchaseOrders';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const SaveViewModal = ({ onSave, onClose, isPending }: any) => {
    const [name, setName] = useState('');

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[500px] bg-white rounded-xl shadow-[0_20px_70px_rgba(0,0,0,0.2)] p-8"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[20px] font-bold text-slate-800">Save View</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-2 mb-10">
                    <label className="text-[14px] font-bold text-slate-600">Name</label>
                    <input 
                        type="text" 
                        autoFocus
                        className="w-full border-2 border-indigo-200 rounded-lg px-4 py-3 text-[15px] focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 border border-slate-200 rounded-lg text-[15px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={!name || isPending}
                        onClick={() => onSave(name)}
                        className={cn(
                            "px-8 py-2.5 bg-slate-100 text-slate-400 rounded-lg text-[15px] font-bold transition-all",
                            name && !isPending && "bg-indigo-600 text-white shadow-lg shadow-indigo-100 active:scale-95"
                        )}
                    >
                        {isPending ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const TagsFilter = ({ isOpen, onClose, selectedTags, onSave, availableTags }: any) => {
    const [search, setSearch] = useState('');
    const [localTags, setLocalTags] = useState<string[]>(selectedTags || []);

    if (!isOpen) return null;

    const filteredTags = availableTags.filter((tag: string) => 
        tag.toLowerCase().includes(search.toLowerCase())
    );

    const toggleTag = (tag: string) => {
        setLocalTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    return (
        <div className="absolute top-full left-0 mt-2 z-50">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="w-[340px] bg-white rounded-xl shadow-[0_20px_70px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/30">
                    <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">Tags</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search Tags..."
                            className="w-full border-2 border-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-[14px] font-medium focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Body: Tag List */}
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar px-2 pb-4">
                    {filteredTags.length > 0 ? (
                        <div className="space-y-1">
                            {filteredTags.map((tag: string) => (
                                <div 
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={cn(
                                        "flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all group mx-2",
                                        localTags.includes(tag) ? "bg-indigo-50/50" : "hover:bg-slate-50"
                                    )}
                                >
                                    <span className={cn(
                                        "text-[14px] font-medium",
                                        localTags.includes(tag) ? "text-indigo-600" : "text-slate-600 group-hover:text-slate-900"
                                    )}>{tag}</span>
                                    {localTags.includes(tag) && <Check className="w-4 h-4 text-indigo-500 stroke-[3]" />}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                            <p className="text-[14px] font-bold text-slate-600">No Results Found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button 
                        onClick={() => setLocalTags([])}
                        className="text-[14px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-tight"
                    >
                        Clear All
                    </button>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="px-5 py-2 hover:bg-slate-200/50 rounded-lg text-[14px] font-bold text-slate-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => { onSave(localTags); onClose(); }}
                            className="px-7 py-2 bg-indigo-600 text-white rounded-lg text-[14px] font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const StatusFilter = ({ isOpen, onClose, selectedStatuses, onSave }: any) => {
    const [localStatuses, setLocalStatuses] = useState<string[]>(selectedStatuses || []);

    if (!isOpen) return null;

    const statuses = [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Awaiting Approval', value: 'PENDING_APPROVAL' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Ordered', value: 'ORDERED' },
        { label: 'Received', value: 'RECEIVED' },
        { label: 'Declined', value: 'DENIED' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Cancelled', value: 'CANCELLED' }
    ];

    const toggleStatus = (val: string) => {
        setLocalStatuses(prev => 
            prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]
        );
    };

    return (
        <div className="absolute top-full left-0 mt-2 z-50">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="w-[280px] bg-white rounded-xl shadow-[0_15px_60px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                    <h3 className="text-[16px] font-bold text-slate-800">Status</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body: Status List */}
                <div className="p-4 space-y-1">
                    {statuses.map((s) => (
                        <div 
                            key={s.value}
                            onClick={() => toggleStatus(s.value)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 group"
                        >
                            <div className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                localStatuses.includes(s.value) ? "bg-indigo-600 border-indigo-600 shadow-sm" : "border-slate-200 group-hover:border-slate-300"
                            )}>
                                {localStatuses.includes(s.value) && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                            </div>
                            <span className={cn(
                                "text-[14px] font-medium transition-colors",
                                localStatuses.includes(s.value) ? "text-slate-900" : "text-slate-600"
                            )}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <button 
                        onClick={() => setLocalStatuses([])}
                        className="text-[14px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Clear
                    </button>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => { onSave(localStatuses); onClose(); }}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-[14px] font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const statusStyles: any = {
    'DRAFT': 'bg-slate-100 text-slate-500 border-slate-200',
    'PENDING_APPROVAL': 'bg-[#FFF4E5] text-[#B76E00] border-[#FFE2C2]', // Awaiting Approval style
    'APPROVED': 'bg-blue-50 text-blue-600 border-blue-100',
    'ORDERED': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'RECEIVED': 'bg-green-50 text-green-600 border-green-100',
    'DENIED': 'bg-red-50 text-red-600 border-red-100',
};

const filterFields = [
    { label: 'Title', type: 'text' },
    { label: 'PO Number', type: 'text' },
    { label: 'Parts', type: 'text' },
    { label: 'Total Cost', type: 'number' },
    { label: 'Created By', type: 'text' },
    { label: 'Vendor', type: 'text' },
    { label: 'Tags', type: 'text' },
    { label: 'Date Created', type: 'date' },
    { label: 'Due Date', type: 'date' },
    { label: 'Category', type: 'text' },
    { label: 'Company Name', type: 'text' }
];

export const PurchaseOrdersPage = () => {
    const queryClient = useQueryClient();

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const getTenantCompany = () => {
        try {
            const orgStr = localStorage.getItem('organization');
            if (orgStr) {
                const org = JSON.parse(orgStr);
                if (org && org.name) return org.name;
            }
            if (user && user.organizations && user.organizations.length > 0) {
                return user.organizations[0].name;
            }
        } catch (e) {
            console.error("Error reading tenant organization", e);
        }
        return 'Juric';
    };
    const companyName = getTenantCompany();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showSaveViewModal, setShowSaveViewModal] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [showTagsFilter, setShowTagsFilter] = useState(false);
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [activeTags, setActiveTags] = useState<string[]>([]);
    const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
    const [customFilters, setCustomFilters] = useState<{ type: string; operator: string; value: string }[]>([]);
    const [activeCustomFilters, setActiveCustomFilters] = useState<{ type: string; operator: string; value: string }[]>([]);
    const [isAddFilterMenuOpen, setIsAddFilterMenuOpen] = useState(false);

    const [sortBy, setSortBy] = useState('Date Created');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [visibleColumns, setVisibleColumns] = useState<string[]>([
        'Title', 'PO Number', '# of Items', 'Total Quantity', 'Total Cost', 
        'Created By', 'Vendor', 'Tags', 'Date Created', 'Due Date', 
        'Status', 'Category', 'Approved By', 'Company Name'
    ]);

    const [columnsList, setColumnsList] = useState<string[]>([
        'Title', 'PO Number', '# of Items', 'Total Quantity', 'Total Cost', 
        'Created By', 'Vendor', 'Tags', 'Date Created', 'Due Date', 
        'Status', 'Category', 'Approved By', 'Company Name'
    ]);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Create an empty transparent pixel drag image to prevent ugly ghosting
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        const newList = [...columnsList];
        const item = newList[draggedIndex];
        newList.splice(draggedIndex, 1);
        newList.splice(index, 0, item);
        
        setDraggedIndex(index);
        setColumnsList(newList);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const saveViewMutation = useMutation({
        mutationFn: async (name: string) => {
            return api.post('/saved-views', {
                name,
                entityType: 'PURCHASE_ORDER',
                config: {
                    visibleColumns,
                    columnsList, // also save the column order!
                    sortBy,
                    sortOrder,
                    searchQuery
                }
            });
        },
        onSuccess: () => {
            setShowSaveViewModal(false);
            queryClient.invalidateQueries({ queryKey: ['saved-views', 'PURCHASE_ORDER'] });
        }
    });

    const sortOptions = ['Title', 'PO Number', 'Total Cost', 'Date Created', 'Due Date', 'Status', 'Category'];

    const toggleColumn = (col: string) => {
        if (col === 'Title') return;
        setVisibleColumns(prev => 
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    const { data: ordersData, isLoading } = usePurchaseOrders({
        search: searchQuery,
        tags: activeTags.length > 0 ? activeTags.join(',') : undefined,
        status: activeStatuses.length > 0 ? activeStatuses.join(',') : undefined
    });

    const orders = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.items || [];
    const selectedOrder = orders?.find((o: any) => o.id === selectedPoId);

    // Apply custom filters & sort
    const filteredOrders = [...orders].filter((order: any) => {
        for (const filter of activeCustomFilters) {
            const { type, operator, value } = filter;
            if (!value) continue; // Skip empty filters

            const lowerVal = value.toLowerCase().trim();

            switch (type) {
                case 'Title': {
                    const title = (order.title || `Restock: ${order.vendor?.name || 'Inventory'}`).toLowerCase();
                    if (operator === 'equals') {
                        if (title !== lowerVal) return false;
                    } else if (operator === 'starts_with') {
                        if (!title.startsWith(lowerVal)) return false;
                    } else { // contains
                        if (!title.includes(lowerVal)) return false;
                    }
                    break;
                }
                case 'PO Number': {
                    const num = (order.number || '').toLowerCase();
                    if (operator === 'equals') {
                        if (num !== lowerVal) return false;
                    } else if (operator === 'starts_with') {
                        if (!num.startsWith(lowerVal)) return false;
                    } else { // contains
                        if (!num.includes(lowerVal)) return false;
                    }
                    break;
                }
                case 'Parts': {
                    const items = order.items || [];
                    const matchesPart = items.some((item: any) => {
                        const partName = (item.part?.name || '').toLowerCase();
                        const partNum = (item.part?.partNumber || '').toLowerCase();
                        if (operator === 'equals') {
                            return partName === lowerVal || partNum === lowerVal;
                        } else if (operator === 'starts_with') {
                            return partName.startsWith(lowerVal) || partNum.startsWith(lowerVal);
                        } else { // contains
                            return partName.includes(lowerVal) || partNum.includes(lowerVal);
                        }
                    });
                    if (!matchesPart) return false;
                    break;
                }
                case 'Total Cost': {
                    const cost = Number(order.totalCost || 0);
                    const numVal = Number(value);
                    if (isNaN(numVal)) break;
                    if (operator === 'greater_than') {
                        if (cost <= numVal) return false;
                    } else if (operator === 'less_than') {
                        if (cost >= numVal) return false;
                    } else { // equals
                        if (cost !== numVal) return false;
                    }
                    break;
                }
                case 'Created By': {
                    const user = (order.user?.name || 'Jason Daniel').toLowerCase();
                    if (operator === 'equals') {
                        if (user !== lowerVal) return false;
                    } else if (operator === 'starts_with') {
                        if (!user.startsWith(lowerVal)) return false;
                    } else { // contains
                        if (!user.includes(lowerVal)) return false;
                    }
                    break;
                }
                case 'Vendor': {
                    const vendor = (order.vendor?.name || '').toLowerCase();
                    if (operator === 'equals') {
                        if (vendor !== lowerVal) return false;
                    } else if (operator === 'starts_with') {
                        if (!vendor.startsWith(lowerVal)) return false;
                    } else { // contains
                        if (!vendor.includes(lowerVal)) return false;
                    }
                    break;
                }
                case 'Tags': {
                    const tags = order.tags || [];
                    const matchesTag = tags.some((t: string) => {
                        const tagLower = t.toLowerCase();
                        if (operator === 'equals') {
                            return tagLower === lowerVal;
                        } else if (operator === 'starts_with') {
                            return tagLower.startsWith(lowerVal);
                        } else { // contains
                            return tagLower.includes(lowerVal);
                        }
                    });
                    if (!matchesTag) return false;
                    break;
                }
                case 'Date Created': {
                    const oDate = new Date(order.createdAt).setHours(0,0,0,0);
                    const fDate = new Date(value).setHours(0,0,0,0);
                    if (isNaN(fDate)) break;

                    if (operator === 'on_or_after') {
                        if (oDate < fDate) return false;
                    } else if (operator === 'on_or_before') {
                        if (oDate > fDate) return false;
                    } else { // exactly
                        if (oDate !== fDate) return false;
                    }
                    break;
                }
                case 'Due Date': {
                    if (!order.expectedDeliveryDate) return false;
                    const oDate = new Date(order.expectedDeliveryDate).setHours(0,0,0,0);
                    const fDate = new Date(value).setHours(0,0,0,0);
                    if (isNaN(fDate)) break;

                    if (operator === 'on_or_after') {
                        if (oDate < fDate) return false;
                    } else if (operator === 'on_or_before') {
                        if (oDate > fDate) return false;
                    } else { // exactly
                        if (oDate !== fDate) return false;
                    }
                    break;
                }
                case 'Category': {
                    const category = (order.category || '').toLowerCase();
                    if (operator === 'equals') {
                        if (category !== lowerVal) return false;
                    } else if (operator === 'starts_with') {
                        if (!category.startsWith(lowerVal)) return false;
                    } else { // contains
                        if (!category.includes(lowerVal)) return false;
                    }
                    break;
                }
                case 'Company Name': {
                    const comp = (order.company || companyName).toLowerCase();
                    if (operator === 'equals') {
                        if (comp !== lowerVal) return false;
                    } else if (operator === 'starts_with') {
                        if (!comp.startsWith(lowerVal)) return false;
                    } else { // contains
                        if (!comp.includes(lowerVal)) return false;
                    }
                    break;
                }
            }
        }
        return true;
    }).sort((a, b) => {
        let valA, valB;
        switch(sortBy) {
            case 'Title': valA = a.title || ''; valB = b.title || ''; break;
            case 'PO Number': valA = a.number || ''; valB = b.number || ''; break;
            case 'Total Cost': valA = a.totalCost || 0; valB = b.totalCost || 0; break;
            case 'Date Created': valA = new Date(a.createdAt).getTime(); valB = new Date(b.createdAt).getTime(); break;
            case 'Due Date': valA = a.expectedDeliveryDate ? new Date(a.expectedDeliveryDate).getTime() : 0; valB = b.expectedDeliveryDate ? new Date(b.expectedDeliveryDate).getTime() : 0; break;
            case 'Status': valA = a.status || ''; valB = b.status || ''; break;
            default: valA = 0; valB = 0;
        }
        
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const toggleRow = (id: string) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedRows.length === filteredOrders.length) setSelectedRows([]);
        else setSelectedRows(filteredOrders.map((o: any) => o.id));
    };

    const exportToExcel = () => {
        if (!filteredOrders || filteredOrders.length === 0) {
            toast.error('No purchase orders to export');
            return;
        }

        const data = filteredOrders.map((order: any, i: number) => {
            const row: any = {};
            columnsList.forEach(col => {
                if (!visibleColumns.includes(col)) return;

                switch (col) {
                    case 'Title':
                        row['Title'] = order.title || `Restock: ${order.vendor?.name || 'Inventory'}`;
                        break;
                    case 'PO Number':
                        row['PO Number'] = order.number || `PO-${2000 + i}`;
                        break;
                    case '# of Items':
                        row['# of Items'] = order._count?.items || 0;
                        break;
                    case 'Total Quantity':
                        row['Total Quantity'] = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 10;
                        break;
                    case 'Total Cost':
                        row['Total Cost'] = order.totalCost || 0;
                        break;
                    case 'Created By':
                        row['Created By'] = order.user?.name || 'Jason Daniel';
                        break;
                    case 'Vendor':
                        row['Vendor'] = order.vendor?.name || 'McMaster-Carr';
                        break;
                    case 'Tags':
                        row['Tags'] = order.tags?.join(', ') || '';
                        break;
                    case 'Date Created':
                        row['Date Created'] = new Date(order.createdAt).toLocaleDateString();
                        break;
                    case 'Due Date':
                        row['Due Date'] = order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '-';
                        break;
                    case 'Status':
                        row['Status'] = order.status === 'PENDING_APPROVAL' ? 'Awaiting Approval' : order.status.replace('_', ' ');
                        break;
                    case 'Category':
                        row['Category'] = order.category || '-';
                        break;
                    case 'Approved By':
                        row['Approved By'] = order.approvedBy || '-';
                        break;
                    case 'Company Name':
                        row['Company Name'] = order.company || companyName;
                        break;
                    default:
                        break;
                }
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Orders');
        XLSX.writeFile(workbook, `CMMS_Purchase_Orders_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Purchase orders exported successfully');
    };

    const isMobile = useMediaQuery('(max-width: 768px)');

    if (isMobile) {
        return (
            <>
                <MobilePurchaseOrders 
                    orders={orders}
                    isLoading={isLoading}
                    onSelectOrder={(order) => setSelectedPoId(order.id)}
                    onOpenCreateModal={() => setShowCreateModal(true)}
                />
                
                {selectedOrder && (
                    <POInspector
                        order={selectedOrder}
                        onClose={() => setSelectedPoId(null)}
                    />
                )}

                {showCreateModal && <POModal onClose={() => setShowCreateModal(false)} />}
            </>
        );
    }

    return (
        <div className="h-full bg-white flex flex-col overflow-hidden">
            {/* Top Header Bar */}
            <div className="relative z-30 flex items-center justify-between px-6 py-3 border-b border-slate-100 shrink-0 bg-white">
                <div className="flex items-center gap-4">
                    <LayoutGrid className="w-5 h-5 text-slate-300" />
                    <h1 className="text-[18px] font-bold text-[#1E293B]">Purchase Orders</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSaveViewModal(true)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md text-[13px] font-bold hover:bg-slate-50 transition-colors"
                    >
                        Save View
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2 bg-[#4F7CFF] hover:bg-indigo-700 text-white rounded-md text-[13px] font-bold shadow-sm transition-all active:scale-95"
                    >
                        Create Purchase Order
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setShowExportDropdown(!showExportDropdown)}
                            className={cn(
                                "p-2 hover:bg-slate-50 rounded-md transition-colors",
                                showExportDropdown && "bg-slate-100"
                            )}
                        >
                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </button>

                        <AnimatePresence>
                            {showExportDropdown && (
                                <>
                                    <div className="fixed inset-0 z-[100]" onClick={() => setShowExportDropdown(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.18)] border border-slate-100 py-2 z-[110]"
                                    >
                                        <button 
                                            onClick={() => {
                                                exportToExcel();
                                                setShowExportDropdown(false);
                                            }}
                                            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors text-left group"
                                        >
                                            <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors border border-slate-100">
                                                <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                            </div>
                                            <span className="text-[14px] font-bold text-slate-700 leading-tight">Export Filtered View</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="relative z-20 px-6 py-2.5 flex items-center justify-between border-b border-slate-100 shrink-0 gap-4 bg-white">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">{filteredOrders.length} Result Returned</span>
                    
                    <button 
                        onClick={() => setShowFiltersModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-[13px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Filters
                    </button>

                    {activeCustomFilters.map((filter, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/75 text-indigo-600 border border-indigo-100/60 rounded-md text-[12px] font-bold animate-fadeIn">
                            <span className="capitalize">{filter.type}: {filter.operator.replace('_', ' ')} "{filter.value}"</span>
                            <button 
                                onClick={() => {
                                    const nextActive = activeCustomFilters.filter((_, i) => i !== idx);
                                    setActiveCustomFilters(nextActive);
                                    setCustomFilters(nextActive);
                                }}
                                className="hover:bg-indigo-100 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowTagsFilter(!showTagsFilter)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-[13px] font-medium transition-colors hover:bg-slate-50",
                                showTagsFilter ? "bg-slate-50 border-indigo-200 text-indigo-600" : "text-slate-600"
                            )}
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="21" y1="4" x2="14" y2="4" />
                                <line x1="10" y1="4" x2="3" y2="4" />
                                <line x1="21" y1="12" x2="12" y2="12" />
                                <line x1="8" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="20" x2="16" y2="20" />
                                <line x1="12" y1="20" x2="3" y2="20" />
                                <line x1="14" y1="2" x2="14" y2="6" />
                                <line x1="8" y1="10" x2="8" y2="14" />
                                <line x1="16" y1="18" x2="16" y2="22" />
                            </svg>
                            Tags
                            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", showTagsFilter && "rotate-180")} />
                        </button>
                        <AnimatePresence>
                            {showTagsFilter && (
                                <TagsFilter 
                                    isOpen={showTagsFilter} 
                                    onClose={() => setShowTagsFilter(false)} 
                                    selectedTags={activeTags}
                                    onSave={setActiveTags}
                                    availableTags={Array.from(new Set(orders.flatMap((o: any) => o.tags || [])))}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <button 
                            onClick={() => setShowStatusFilter(!showStatusFilter)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-[13px] font-medium transition-colors hover:bg-slate-50",
                                showStatusFilter ? "bg-slate-50 border-indigo-200 text-indigo-600" : "text-slate-600"
                            )}
                        >
                            Status
                            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", showStatusFilter && "rotate-180")} />
                        </button>
                        <AnimatePresence>
                            {showStatusFilter && (
                                <StatusFilter 
                                    isOpen={showStatusFilter} 
                                    onClose={() => setShowStatusFilter(false)} 
                                    selectedStatuses={activeStatuses}
                                    onSave={setActiveStatuses}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    <button 
                        onClick={() => {
                            setSearchQuery('');
                            setActiveTags([]);
                            setActiveStatuses([]);
                            setCustomFilters([]);
                            setActiveCustomFilters([]);
                        }}
                        className="text-[13px] font-bold text-indigo-500 hover:text-indigo-700 ml-2 transition-colors active:scale-95"
                    >
                        Reset Filters
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div 
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className={cn(
                                "flex items-center gap-2 text-[13px] font-medium transition-colors cursor-pointer hover:text-indigo-600",
                                showSortDropdown ? "text-indigo-600" : "text-slate-600"
                            )}
                        >
                            <ArrowUpDown className={cn("w-4 h-4 transition-transform", sortOrder === 'asc' ? "" : "rotate-180")} />
                            Sort: {sortBy}
                        </div>

                        <AnimatePresence>
                            {showSortDropdown && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setShowSortDropdown(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-100 py-4 z-[70]"
                                    >
                                        <div className="px-4 mb-2">
                                            <span className="text-[14px] font-black text-slate-800">Sort By</span>
                                        </div>
                                        <div className="max-h-[220px] overflow-y-auto custom-scrollbar mb-3 px-1">
                                            {sortOptions.map((opt) => (
                                                <div 
                                                    key={opt}
                                                    onClick={() => setSortBy(opt)}
                                                    className={cn(
                                                        "px-3 py-2 text-[14px] font-medium transition-colors cursor-pointer rounded-lg hover:bg-slate-50 mx-1",
                                                        sortBy === opt ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"
                                                    )}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-slate-50 my-2 shadow-[0_-1px_0_rgba(241,245,249,0.5)]" />
                                        <div className="px-4 mb-2 mt-3">
                                            <span className="text-[14px] font-black text-slate-800">Order</span>
                                        </div>
                                        <div className="space-y-0.5 px-1">
                                            {[
                                                { label: 'Descending', value: 'desc' as const },
                                                { label: 'Ascending', value: 'asc' as const }
                                            ].map((opt) => (
                                                <div 
                                                    key={opt.label}
                                                    onClick={() => setSortOrder(opt.value)}
                                                    className={cn(
                                                        "flex items-center justify-between px-3 py-2 text-[14px] font-medium transition-colors cursor-pointer rounded-lg hover:bg-slate-50 mx-1",
                                                        sortOrder === opt.value ? "text-slate-800" : "text-slate-500 hover:text-slate-700"
                                                    )}
                                                >
                                                    {opt.label}
                                                    {sortOrder === opt.value && <Check className="w-4 h-4 text-indigo-500 stroke-[3]" />}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <div 
                            onClick={() => setShowColumnsDropdown(!showColumnsDropdown)}
                            className={cn(
                                "flex items-center gap-2 text-[13px] font-medium transition-colors cursor-pointer hover:text-indigo-600",
                                showColumnsDropdown ? "text-indigo-600" : "text-slate-600"
                            )}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M1 2a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H2a1 1 0 01-1-1V2zm2 1v10h2V3H3zm3 0v10h1V3H6zm2 0v10h5V3H8z" />
                            </svg>
                            Columns
                        </div>

                        <AnimatePresence>
                            {showColumnsDropdown && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setShowColumnsDropdown(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-[280px] bg-white rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.12)] border border-[#E2E8F0]/80 py-3 z-[70] flex flex-col"
                                    >
                                        <div className="max-h-[420px] overflow-y-auto custom-scrollbar px-1 flex flex-col">
                                            {columnsList.map((col, idx) => (
                                                <div 
                                                    key={col}
                                                    draggable={true}
                                                    onDragStart={(e) => handleDragStart(e, idx)}
                                                    onDragOver={(e) => handleDragOver(e, idx)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={() => toggleColumn(col)}
                                                    className={cn(
                                                        "group flex items-center gap-3.5 px-4 py-2.5 rounded-lg cursor-pointer transition-all mx-1.5 select-none",
                                                        draggedIndex === idx ? "opacity-30 bg-slate-50" : "hover:bg-slate-50",
                                                        col === 'Title' && "cursor-default"
                                                    )}
                                                >
                                                    {/* Custom Grab Handle (6 Dots Icon) */}
                                                    <div className="shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 p-0.5 -ml-0.5">
                                                        <svg className="w-3.5 h-4 text-[#94A3B8]/60" viewBox="0 0 12 16" fill="currentColor">
                                                            <rect x="2" y="3" width="2" height="2" rx="0.3" />
                                                            <rect x="2" y="7" width="2" height="2" rx="0.3" />
                                                            <rect x="2" y="11" width="2" height="2" rx="0.3" />
                                                            <rect x="6.5" y="3" width="2" height="2" rx="0.3" />
                                                            <rect x="6.5" y="7" width="2" height="2" rx="0.3" />
                                                            <rect x="6.5" y="11" width="2" height="2" rx="0.3" />
                                                        </svg>
                                                    </div>

                                                    {/* Custom Checkbox matching user request mockup */}
                                                    {col === 'Title' ? (
                                                        <div className="w-5 h-5 rounded-md bg-[#E2E8F0] border border-[#E2E8F0] flex items-center justify-center cursor-not-allowed">
                                                            <svg className="w-3.5 h-3.5 text-white stroke-[3.5]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="2.5 6 5 8.5 9.5 3.5" />
                                                            </svg>
                                                        </div>
                                                    ) : visibleColumns.includes(col) ? (
                                                        <div className="w-5 h-5 rounded-md bg-[#3B82F6] border border-[#3B82F6] flex items-center justify-center shadow-sm">
                                                            <svg className="w-3.5 h-3.5 text-white stroke-[3.5]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="2.5 6 5 8.5 9.5 3.5" />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-md bg-white border border-[#CBD5E1] flex items-center justify-center shadow-sm group-hover:border-slate-400" />
                                                    )}

                                                    <span className={cn(
                                                        "text-[14.5px] font-medium leading-none select-none tracking-tight transition-colors",
                                                        col === 'Title' ? "text-[#94A3B8]" : visibleColumns.includes(col) ? "text-slate-700" : "text-slate-400"
                                                    )}>
                                                        {col}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="flex-1 overflow-auto bg-slate-50/30">
                <table className="w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-white">
                        <tr className="text-left">
                            <th className="px-4 py-4 border-b border-slate-200 w-12">
                                <div 
                                    onClick={toggleAll}
                                    className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                                        selectedRows.length === filteredOrders.length && filteredOrders.length > 0 ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                                    )}
                                >
                                    {selectedRows.length === filteredOrders.length && filteredOrders.length > 0 && <Check className="w-3 h-3 text-white" />}
                                </div>
                            </th>
                            {columnsList.map((col) => visibleColumns.includes(col) && (
                                <th key={col} className="px-4 py-4 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {isLoading ? (
                            Array(10).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse border-b border-slate-100">
                                    <td className="px-4 py-6 w-12"><div className="w-4 h-4 bg-slate-50 rounded"></div></td>
                                    {columnsList.map(c => visibleColumns.includes(c) && <td key={c} className="px-4 py-6"><div className="h-4 bg-slate-50 rounded w-full"></div></td>)}
                                </tr>
                            ))
                        ) : filteredOrders.length === 0 ? (
                            <TableEmptyState
                                variant="file"
                                colSpan={20}
                                title="No purchase orders found"
                                description="Adjust your search or filters to find POs."
                            />
                        ) : filteredOrders.map((order: any, i: number) => (
                            <tr 
                                key={order.id} 
                                onClick={() => setSelectedPoId(order.id)}
                                className={cn(
                                    "hover:bg-slate-50/50 cursor-pointer group transition-colors border-b border-slate-100",
                                    selectedPoId === order.id && "bg-indigo-50/30"
                                )}
                            >
                                <td className="px-4 py-4 border-b border-slate-100" onClick={(e) => e.stopPropagation()}>
                                    <div 
                                        onClick={() => toggleRow(order.id)}
                                        className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                                            selectedRows.includes(order.id) ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300 hover:border-indigo-400"
                                        )}
                                    >
                                        {selectedRows.includes(order.id) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                </td>
                                
                                {columnsList.map((col) => {
                                    if (!visibleColumns.includes(col)) return null;
                                    
                                    switch (col) {
                                        case 'Title':
                                            return <td key="Title" className="px-4 py-4 border-b border-slate-100 text-[13px] font-medium text-slate-700 whitespace-nowrap">{order.title || `Restock: ${order.vendor?.name || 'Inventory'}`}</td>;
                                        case 'PO Number':
                                            return <td key="PO Number" className="px-4 py-4 border-b border-slate-100 text-[13px] font-bold text-indigo-600">{order.number || i + 1}</td>;
                                        case '# of Items':
                                            return <td key="# of Items" className="px-4 py-4 border-b border-slate-100 text-[13px] text-slate-600">{order._count?.items || 0}</td>;
                                        case 'Total Quantity':
                                            return <td key="Total Quantity" className="px-4 py-4 border-b border-slate-100 text-[13px] text-slate-600">10</td>;
                                        case 'Total Cost':
                                            return <td key="Total Cost" className="px-4 py-4 border-b border-slate-100 text-[13px] font-bold text-slate-700">₹{order.totalCost?.toLocaleString()}</td>;
                                        case 'Created By':
                                            return (
                                                <td key="Created By" className="px-4 py-4 border-b border-slate-100" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                            {order.user?.name?.[0] || 'U'}
                                                        </div>
                                                        <span className="text-[13px] text-slate-600">{order.user?.name || 'Jason Daniel'}</span>
                                                    </div>
                                                </td>
                                            );
                                        case 'Vendor':
                                            return <td key="Vendor" className="px-4 py-4 border-b border-slate-100 text-[13px] text-slate-600">{order.vendor?.name || 'McMaster-Carr'}</td>;
                                        case 'Tags':
                                            return (
                                                <td key="Tags" className="px-4 py-4 border-b border-slate-100">
                                                    <div className="flex gap-1">
                                                        {order.tags?.map((t: string) => (
                                                            <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">{t}</span>
                                                        )) || '-'}
                                                    </div>
                                                </td>
                                            );
                                        case 'Date Created':
                                            return <td key="Date Created" className="px-4 py-4 border-b border-slate-100 text-[13px] text-slate-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>;
                                        case 'Due Date':
                                            return <td key="Due Date" className="px-4 py-4 border-b border-slate-100 text-[13px] text-slate-400 font-medium">{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '-'}</td>;
                                        case 'Status':
                                            return (
                                                <td key="Status" className="px-4 py-4 border-b border-slate-100">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap",
                                                        statusStyles[order.status] || 'bg-slate-50 text-slate-500 border-slate-200'
                                                    )}>
                                                        {order.status === 'PENDING_APPROVAL' ? 'Awaiting Approval' : order.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            );
                                        case 'Category':
                                            return <td key="Category" className="px-4 py-4 border-b border-slate-100 text-[13px] text-slate-600">-</td>;
                                        case 'Approved By':
                                            return <td key="Approved By" className="px-4 py-4 border-b border-slate-100 text-[13px] text-slate-600">{order.approvedBy || '-'}</td>;
                                        case 'Company Name':
                                            return <td key="Company Name" className="px-4 py-4 border-b border-slate-100 text-[13px] text-slate-600 font-bold uppercase tracking-tight">{order.company || companyName}</td>;
                                        default:
                                            return null;
                                    }
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PO Inspector */}
            {selectedOrder && (
                <POInspector
                    order={selectedOrder}
                    onClose={() => setSelectedPoId(null)}
                />
            )}

            {showCreateModal && <POModal onClose={() => setShowCreateModal(false)} />}
            
            <AnimatePresence>
                {showSaveViewModal && (
                    <SaveViewModal 
                        onClose={() => setShowSaveViewModal(false)} 
                        onSave={(name: string) => saveViewMutation.mutate(name)}
                        isPending={saveViewMutation.isPending}
                    />
                )}
            </AnimatePresence>

            {/* Filters Modal */}
            <AnimatePresence>
                {showFiltersModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowFiltersModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-[600px] bg-white rounded-xl shadow-[0_20px_70px_rgba(0,0,0,0.2)] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100">
                                <h3 className="text-[20px] font-bold text-slate-800">Filters</h3>
                                <button onClick={() => setShowFiltersModal(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Body: Custom Filters Configuration List */}
                            <div className="px-8 py-6 max-h-[400px] overflow-y-auto custom-scrollbar space-y-4">
                                <style>{`
                                    .custom-filter-scrollbar::-webkit-scrollbar {
                                        width: 6px;
                                    }
                                    .custom-filter-scrollbar::-webkit-scrollbar-track {
                                        background: transparent;
                                    }
                                    .custom-filter-scrollbar::-webkit-scrollbar-thumb {
                                        background-color: #CBD5E1;
                                        border-radius: 10px;
                                    }
                                    .custom-filter-scrollbar::-webkit-scrollbar-thumb:hover {
                                        background-color: #94A3B8;
                                    }
                                `}</style>

                                {customFilters.length === 0 ? (
                                    <div className="py-16 flex flex-col items-center justify-center text-center">
                                        <p className="text-[15px] font-bold text-slate-700">No filters added yet.</p>
                                        <p className="text-[14px] text-slate-400 mt-2">When you add filters, they'll appear here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {customFilters.map((filter, index) => {
                                            const fieldDef = filterFields.find(f => f.label === filter.type) || { type: 'text' };
                                            return (
                                                <div key={index} className="flex items-center gap-3.5 bg-slate-50/50 border border-slate-100 rounded-xl p-4 animate-fadeIn">
                                                    {/* Field Label */}
                                                    <span className="w-32 text-[14px] font-bold text-slate-700 tracking-tight">{filter.type}</span>
                                                    
                                                    {/* Operator Select */}
                                                    <select
                                                        value={filter.operator}
                                                        onChange={(e) => {
                                                            const newFilters = [...customFilters];
                                                            newFilters[index].operator = e.target.value;
                                                            setCustomFilters(newFilters);
                                                        }}
                                                        className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-[14px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                                    >
                                                        {fieldDef.type === 'text' && (
                                                            <>
                                                                <option value="contains">Contains</option>
                                                                <option value="equals">Equals</option>
                                                                <option value="starts_with">Starts With</option>
                                                            </>
                                                        )}
                                                        {fieldDef.type === 'number' && (
                                                            <>
                                                                <option value="greater_than">Greater Than</option>
                                                                <option value="less_than">Less Than</option>
                                                                <option value="equals">Equals</option>
                                                            </>
                                                        )}
                                                        {fieldDef.type === 'date' && (
                                                            <>
                                                                <option value="on_or_after">On or After</option>
                                                                <option value="on_or_before">On or Before</option>
                                                                <option value="exactly">Exactly</option>
                                                            </>
                                                        )}
                                                    </select>

                                                    {/* Value Input */}
                                                    <input
                                                        type={fieldDef.type}
                                                        value={filter.value}
                                                        onChange={(e) => {
                                                            const newFilters = [...customFilters];
                                                            newFilters[index].value = e.target.value;
                                                            setCustomFilters(newFilters);
                                                        }}
                                                        placeholder="Enter value..."
                                                        className="flex-1 border border-slate-200 bg-white rounded-lg px-4 py-2 text-[14px] font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                                                    />

                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={() => {
                                                            setCustomFilters(prev => prev.filter((_, i) => i !== index));
                                                        }}
                                                        className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-colors"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsAddFilterMenuOpen(!isAddFilterMenuOpen)}
                                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-[15px] font-bold group"
                                    >
                                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        Add Filter
                                        <ChevronDown className={cn("w-4 h-4 transition-transform", isAddFilterMenuOpen && "rotate-180")} />
                                    </button>
                                    
                                    <AnimatePresence>
                                        {isAddFilterMenuOpen && (
                                            <>
                                                <div className="fixed inset-0 z-[120]" onClick={() => setIsAddFilterMenuOpen(false)} />
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute bottom-full left-0 mb-3 w-[260px] bg-white rounded-xl shadow-[0_15px_60px_rgba(0,0,0,0.2)] border border-slate-100 py-2.5 z-[130] flex flex-col max-h-[300px] overflow-y-auto custom-filter-scrollbar"
                                                >
                                                    {filterFields.map((field) => (
                                                        <button
                                                            key={field.label}
                                                            onClick={() => {
                                                                const defaultOp = field.type === 'number' ? 'greater_than' : field.type === 'date' ? 'on_or_after' : 'contains';
                                                                setCustomFilters(prev => [...prev, { type: field.label, operator: defaultOp, value: '' }]);
                                                                setIsAddFilterMenuOpen(false);
                                                            }}
                                                            className="w-full text-left px-5 py-2.5 hover:bg-slate-50 text-[14.5px] text-slate-700 font-medium transition-colors select-none"
                                                        >
                                                            {field.label}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => {
                                            setCustomFilters(activeCustomFilters);
                                            setShowFiltersModal(false);
                                        }}
                                        className="px-6 py-2.5 border border-slate-300 rounded-lg text-[15px] font-bold text-slate-600 hover:bg-slate-50 transition-all font-inter"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setActiveCustomFilters(customFilters);
                                            setShowFiltersModal(false);
                                        }}
                                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[15px] font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
