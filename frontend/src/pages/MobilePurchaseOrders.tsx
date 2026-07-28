import { useState, useEffect } from 'react';
import { Search, MapPin, Box, FileText, ShoppingBag, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface MobilePurchaseOrdersProps {
  orders: any[];
  isLoading: boolean;
  onSelectOrder: (order: any) => void;
  onOpenCreateModal: () => void;
}

export const MobilePurchaseOrders = ({
  orders,
  isLoading,
  onSelectOrder,
  onOpenCreateModal
}: MobilePurchaseOrdersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<'ALL' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DECLINED'>('ALL');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredOrders = orders.filter((order) => {
    // Search filter
    const matchesSearch = !debouncedSearch || 
      (order.poNumber || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (order.vendor?.name || '').toLowerCase().includes(debouncedSearch.toLowerCase());

    // Status filter
    if (activeStatus === 'ALL') return matchesSearch;
    return matchesSearch && (order.status || '').toUpperCase() === activeStatus;
  });

  const getStatusColor = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'DECLINED': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'SUBMITTED': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-150';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-outfit select-none relative pb-20">
      {/* Header Bar */}
      <div className="bg-white px-4 py-4 border-b border-slate-100 sticky top-0 z-30 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Purchase Orders</h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search PO number or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-transparent rounded-xl text-[14px] font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none sticky top-[125px] z-20 bg-[#f8fafc] border-b border-slate-100/50">
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'DRAFT', label: 'Draft' },
          { id: 'SUBMITTED', label: 'Submitted' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'DECLINED', label: 'Declined' }
        ].map((tab) => {
          const isSelected = activeStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id as any)}
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

      {/* Content Area */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-6 space-y-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-black text-slate-700">No Purchase Orders Found</p>
              <p className="text-[11px] text-slate-400 font-medium">Try broadening your search or clear active filters.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const totalPrice = Number(order.totalCost ?? order.totalPrice ?? 0);
              const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice);
              const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';

              return (
                <motion.div
                  key={order.id}
                  layout
                  onClick={() => onSelectOrder(order)}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 flex gap-4 items-start shadow-sm active:bg-slate-50/50 active:scale-[0.99] transition-all cursor-pointer font-sans"
                >
                  {/* Dynamic Colored Icon */}
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
                    <FileText className="w-5 h-5" />
                  </div>

                  {/* Body details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="space-y-0.5">
                      <h3 className="text-[14px] font-black text-slate-900 leading-snug truncate">
                        {order.poNumber || 'PO-No Number'}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Created {dateStr}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {order.vendor?.name && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg w-fit">
                          <span className="truncate">{order.vendor.name}</span>
                        </span>
                      )}
                      <span className={cn(
                        "flex items-center gap-1 text-[10px] font-bold border px-2.5 py-0.5 rounded-full shrink-0",
                        getStatusColor(order.status)
                      )}>
                        {order.status || 'DRAFT'}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Indicator */}
                  <div className="flex flex-col items-end justify-center shrink-0">
                    <span className="text-sm font-black text-slate-800 tracking-tight leading-none">
                      {formattedPrice}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onOpenCreateModal}
        className="fixed right-6 bottom-20 z-40 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 transition-transform active:scale-90"
        title="Create PO"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
