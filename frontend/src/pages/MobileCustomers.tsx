import { useState, useEffect } from 'react';
import { Search, MapPin, Mail, Phone, Users, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface MobileCustomersProps {
  customers: any[];
  isLoading: boolean;
  onSelectCustomer: (customer: any) => void;
  onOpenCreateModal: () => void;
}

export const MobileCustomers = ({
  customers,
  isLoading,
  onSelectCustomer,
  onOpenCreateModal
}: MobileCustomersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeType, setActiveType] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredCustomers = customers.filter((cust) => {
    // Search filter
    const matchesSearch = !debouncedSearch || 
      (cust.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (cust.email || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (cust.address || '').toLowerCase().includes(debouncedSearch.toLowerCase());

    // Type filter
    if (activeType === 'ALL') return matchesSearch;
    const typeLower = (cust.type || 'internal').toLowerCase();
    return matchesSearch && typeLower === activeType.toLowerCase();
  });

  const getInitials = (name: string) => {
    if (!name) return 'CS';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarColors = [
    'bg-indigo-50 text-indigo-700 border-indigo-100',
    'bg-emerald-50 text-emerald-700 border-emerald-100',
    'bg-blue-50 text-blue-700 border-blue-100',
    'bg-amber-50 text-amber-700 border-amber-100',
    'bg-rose-50 text-rose-700 border-rose-100',
    'bg-purple-50 text-purple-700 border-purple-100'
  ];

  const getAvatarColor = (id: string) => {
    const charCodeSum = (id || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return avatarColors[charCodeSum % avatarColors.length];
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-outfit select-none relative pb-20">
      {/* Header Bar */}
      <div className="bg-white px-4 py-4 border-b border-slate-100 sticky top-0 z-30 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Customers</h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search customer name, email, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-transparent rounded-xl text-[14px] font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none sticky top-[125px] z-20 bg-[#f8fafc] border-b border-slate-100/50">
        {[
          { id: 'ALL', label: 'All Customers' },
          { id: 'INTERNAL', label: 'Internal' },
          { id: 'EXTERNAL', label: 'External' }
        ].map((tab) => {
          const isSelected = activeType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id as any)}
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
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-6 space-y-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-black text-slate-700">No Customers Found</p>
              <p className="text-[11px] text-slate-400 font-medium">Try broadening your search or clear active filters.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((cust) => {
              const avatarColor = getAvatarColor(cust.id);
              const totalRate = cust.hourlyRate ? `$${cust.hourlyRate}` : 'N/A';

              return (
                <motion.div
                  key={cust.id}
                  layout
                  onClick={() => onSelectCustomer(cust)}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 flex gap-4 items-start shadow-sm active:bg-slate-50/50 active:scale-[0.99] transition-all cursor-pointer font-sans"
                >
                  {/* Initials Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[15px] border ${avatarColor} shrink-0 shadow-inner`}>
                    {getInitials(cust.name)}
                  </div>

                  {/* Body details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[14px] font-black text-slate-900 leading-tight truncate">
                          {cust.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider shrink-0">
                          {cust.type || 'Internal'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[12px] font-medium text-slate-500">
                      {cust.address && (
                        <p className="flex items-start gap-2 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate">{cust.address}</span>
                        </p>
                      )}
                      {cust.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </p>
                      )}
                      {cust.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pricing Rate Indicator */}
                  <div className="flex flex-col items-end justify-center shrink-0">
                    <span className="text-sm font-black text-slate-800 tracking-tight leading-none">
                      {totalRate}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Rate</span>
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
        title="Add Customer"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
