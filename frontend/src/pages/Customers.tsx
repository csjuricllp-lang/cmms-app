import { useState } from 'react';
import { 
    Search, 
    Columns, 
    MoreHorizontal, UserSquare, ArrowUpDown, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomers } from '../hooks/useData';
import { CustomerModal } from '../components/CustomerModal';
import { CustomerInspector } from '../components/CustomerInspector';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MobileCustomers } from './MobileCustomers';

export const CustomersPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [sortBy, setSortBy] = useState('Date Created');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    
    const [visibleColumns, setVisibleColumns] = useState({
        address: true,
        phone: true,
        email: true,
        customerType: true,
        website: true,
        createdAt: true,
        hourlyRate: true
    });

    const sortOptions = [
        'Name', 'Address', 'Phone Number', 'Email', 
        'Customer Type', 'Website', 'Date Created', 'Hourly Rate'
    ];

    const toggleColumn = (key: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const { data: customersData, isLoading } = useCustomers();
    const customers = Array.isArray(customersData) ? customersData : (customersData as any)?.items || [];

    const filteredCustomers = customers?.filter((c: any) => {
        return (c?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
               (c?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a: any, b: any) => {
        const fieldMap: Record<string, string> = {
            'Name': 'name',
            'Address': 'address',
            'Phone Number': 'phone',
            'Email': 'email',
            'Customer Type': 'type',
            'Website': 'website',
            'Date Created': 'createdAt',
            'Hourly Rate': 'hourlyRate'
        };
        const field = fieldMap[sortBy] || 'createdAt';
        const valA = a[field] || '';
        const valB = b[field] || '';
        
        if (sortOrder === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });

    const isMobile = useMediaQuery('(max-width: 768px)');

    if (isMobile) {
        return (
            <>
                <MobileCustomers 
                    customers={customers}
                    isLoading={isLoading}
                    onSelectCustomer={(customer) => setSelectedCustomer(customer)}
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                />

                {isCreateModalOpen && <CustomerModal onClose={() => setIsCreateModalOpen(false)} />}
                
                <AnimatePresence>
                    {selectedCustomer && (
                        <CustomerInspector 
                            customer={selectedCustomer} 
                            onClose={() => setSelectedCustomer(null)} 
                        />
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white min-h-screen font-outfit">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white sticky top-0 z-30 shrink-0 overflow-x-auto no-scrollbar py-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-9 px-4 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Create Customer
                    </button>
                    <button className="h-9 w-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Secondary Toolbar */}
            <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-50 shrink-0 overflow-x-auto no-scrollbar py-2">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-gray-900 leading-none">{filteredCustomers.length} Result{filteredCustomers.length !== 1 ? 's' : ''} Returned</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button 
                                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors group"
                            >
                                <ArrowUpDown className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                                <span className="text-sm">Sort: <span className="font-semibold text-gray-900">{sortBy}</span></span>
                            </button>

                            <AnimatePresence>
                                {isSortMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsSortMenuOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden"
                                        >
                                            <div className="p-2 space-y-0.5">
                                                <div className="px-3 py-2 text-[11px] font-bold text-gray-900 uppercase tracking-widest">Sort By</div>
                                                {sortOptions.map(option => (
                                                    <button
                                                        key={option}
                                                        onClick={() => {
                                                            setSortBy(option);
                                                            setIsSortMenuOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-[14px] rounded-lg transition-colors ${sortBy === option ? "bg-indigo-50/50 text-indigo-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                                                    >
                                                        {option}
                                                        {sortBy === option && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            <div className="h-px bg-gray-100 w-full" />
                                            
                                            <div className="p-2 space-y-0.5">
                                                <div className="px-3 py-2 text-[11px] font-bold text-gray-900 uppercase tracking-widest">Order</div>
                                                <button
                                                    onClick={() => {
                                                        setSortOrder('desc');
                                                        setIsSortMenuOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-[14px] rounded-lg transition-colors ${sortOrder === 'desc' ? "bg-indigo-50/50 text-indigo-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                                                >
                                                    Descending
                                                    {sortOrder === 'desc' && <motion.div layoutId="sortCheckmark"><Check className="w-4 h-4 text-indigo-600" /></motion.div>}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSortOrder('asc');
                                                        setIsSortMenuOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-[14px] rounded-lg transition-colors ${sortOrder === 'asc' ? "bg-indigo-50/50 text-indigo-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                                                >
                                                    Ascending
                                                    {sortOrder === 'asc' && <motion.div layoutId="sortCheckmark"><Check className="w-4 h-4 text-indigo-600" /></motion.div>}
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <div className="relative">
                            <button 
                                onClick={() => setIsColumnsMenuOpen(!isColumnsMenuOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <Columns className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">Columns</span>
                            </button>
                            
                            <AnimatePresence>
                                {isColumnsMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsColumnsMenuOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2"
                                        >
                                            {[
                                                { key: 'address', label: 'Address' },
                                                { key: 'phone', label: 'Phone Number' },
                                                { key: 'email', label: 'Email' },
                                                { key: 'customerType', label: 'Customer Type' },
                                                { key: 'website', label: 'Website' },
                                                { key: 'createdAt', label: 'Date Created' },
                                                { key: 'hourlyRate', label: 'Hourly Rate' }
                                            ].map(({ key, label }) => (
                                                <button
                                                    key={key}
                                                    onClick={() => toggleColumn(key as any)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-[14px] text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleColumns[key as keyof typeof visibleColumns] ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                        {visibleColumns[key as keyof typeof visibleColumns] && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    {label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 w-64 pl-10 pr-4 bg-gray-100/50 border border-transparent rounded-md text-[13px] text-gray-900 focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area - Industrial Grid Style */}
            <div className="flex-1 bg-slate-50/50 p-8 max-w-full overflow-hidden">
                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                    <table className="w-full border-collapse min-w-max">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="w-14 px-4 py-4 bg-white border-r border-slate-100 flex items-center justify-center">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                </th>
                                <th className="text-left px-5 py-4 bg-white border-r border-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-widest min-w-[200px]">Name</th>
                                {visibleColumns.address && <th className="text-left px-5 py-4 bg-white border-r border-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-widest min-w-[200px]">Address</th>}
                                {visibleColumns.phone && <th className="text-left px-5 py-4 bg-white border-r border-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-widest min-w-[150px]">Phone Number</th>}
                                {visibleColumns.email && <th className="text-left px-5 py-4 bg-white border-r border-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-widest min-w-[200px]">Email</th>}
                                {visibleColumns.customerType && <th className="text-left px-5 py-4 bg-white border-r border-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-widest min-w-[150px]">Customer Type</th>}
                                {visibleColumns.website && <th className="text-left px-5 py-4 bg-white border-r border-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-widest min-w-[200px]">Website</th>}
                                {visibleColumns.createdAt && (
                                    <th className="text-left px-5 py-4 bg-white border-r border-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-widest min-w-[180px]">
                                        <div className="flex items-center gap-2">
                                            Date Created
                                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.hourlyRate && <th className="text-left px-5 py-4 bg-white border-r border-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-widest min-w-[120px]">Hourly Rate</th>}
                                <th className="w-10 px-4 py-4 bg-white text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[13px]">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-5 border-r border-slate-50"><div className="h-4 w-4 bg-slate-100 rounded mx-auto" /></td>
                                        <td className="px-5 py-5 border-r border-slate-50"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                                        {Object.values(visibleColumns).filter(v => v).map((_, idx) => (
                                            <td key={idx} className="px-5 py-5 border-r border-slate-50"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                                        ))}
                                        <td className="px-4 py-5"></td>
                                    </tr>
                                ))
                            ) : filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer: any) => (
                                <tr 
                                        key={customer.id} 
                                        onClick={() => setSelectedCustomer(customer)}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer border-b border-slate-100 last:border-0 font-outfit"
                                    >
                                        <td className="px-4 py-4 border-r border-slate-100 flex items-center justify-center h-[53px]" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-slate-900 border-r border-slate-100 max-w-[180px] break-words">{customer.name}</td>
                                        {visibleColumns.address && (
                                            <td className="px-5 py-4 text-slate-500 border-r border-slate-100 max-w-xs truncate">
                                                {customer.address || '-'}
                                            </td>
                                        )}
                                        {visibleColumns.phone && (
                                            <td className="px-5 py-4 text-slate-500 border-r border-slate-100">
                                                {customer.phone || '-'}
                                            </td>
                                        )}
                                        {visibleColumns.email && (
                                            <td className="px-5 py-4 text-slate-500 border-r border-slate-100 truncate">
                                                {customer.email || '-'}
                                            </td>
                                        )}
                                        {visibleColumns.customerType && (
                                            <td className="px-5 py-4 text-slate-500 border-r border-slate-100">
                                                {customer.type || 'Internal'}
                                            </td>
                                        )}
                                        {visibleColumns.website && (
                                            <td className="px-5 py-4 text-indigo-600 border-r border-slate-100 truncate hover:underline">
                                                {customer.website || '-'}
                                            </td>
                                        )}
                                        {visibleColumns.createdAt && (
                                            <td className="px-5 py-4 text-slate-500 border-r border-slate-100">
                                                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', {
                                                    month: '2-digit', day: '2-digit', year: '2-digit'
                                                }) + ' - ' + new Date(customer.createdAt).toLocaleTimeString('en-US', {
                                                    hour: '2-digit', minute: '2-digit', hour12: false
                                                }) : '-'}
                                            </td>
                                        )}
                                        {visibleColumns.hourlyRate && (
                                            <td className="px-5 py-4 text-slate-500 border-r border-slate-100">
                                                {customer.hourlyRate ? `$${customer.hourlyRate}` : 'N/A'}
                                            </td>
                                        )}
                                        <td className="px-4 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="py-24 text-center text-slate-400 bg-white">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <UserSquare className="w-10 h-10" />
                                            <p className="text-[12px] font-bold uppercase tracking-[0.2em] italic">No Customer Dossiers Indexed</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCreateModalOpen && <CustomerModal onClose={() => setIsCreateModalOpen(false)} />}
            
            <AnimatePresence>
                {selectedCustomer && (
                    <CustomerInspector 
                        customer={selectedCustomer} 
                        onClose={() => setSelectedCustomer(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
