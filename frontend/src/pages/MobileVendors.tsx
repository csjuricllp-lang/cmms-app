import { useState, useEffect } from 'react';
import { Search, MapPin, Mail, Star, Phone, Truck, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface MobileVendorsProps {
  vendors: any[];
  isLoading: boolean;
  onSelectVendor: (vendor: any) => void;
  onOpenCreateModal: () => void;
  onFavoriteToggle: (id: string, isFavorite: boolean) => void;
  onContactVendor: (vendor: any) => void;
}

export const MobileVendors = ({
  vendors,
  isLoading,
  onSelectVendor,
  onOpenCreateModal,
  onFavoriteToggle,
  onContactVendor
}: MobileVendorsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'FAVORITES' | 'SUPPLIER' | 'CONTRACTOR' | 'SPECIALIST'>('ALL');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredVendors = vendors.filter((vendor) => {
    // Search filter
    const matchesSearch = !debouncedSearch || 
      (vendor.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (vendor.address || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (vendor.specialties || []).some((s: string) => s.toLowerCase().includes(debouncedSearch.toLowerCase()));

    // Tab filter
    if (activeTab === 'FAVORITES') return matchesSearch && !!vendor.isFavorite;
    if (activeTab === 'ALL') return matchesSearch;
    return matchesSearch && (vendor.type || '').toUpperCase() === activeTab;
  });

  const getInitials = (name: string) => {
    if (!name) return 'WS';
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
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Providers & Network</h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search provider name, specialty, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-transparent rounded-xl text-[14px] font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none sticky top-[125px] z-20 bg-[#f8fafc] border-b border-slate-100/50">
        {[
          { id: 'ALL', label: 'All Providers' },
          { id: 'FAVORITES', label: '⭐ Favorites' },
          { id: 'SUPPLIER', label: 'Suppliers' },
          { id: 'CONTRACTOR', label: 'Contractors' },
          { id: 'SPECIALIST', label: 'Specialists' }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "h-8 px-4 rounded-full text-[12px] font-bold transition-all whitespace-nowrap active:scale-95 shadow-sm",
                isSelected
                  ? "bg-primary text-white shadow-primary/20"
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
        ) : filteredVendors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-6 space-y-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-black text-slate-700">No Providers Found</p>
              <p className="text-[11px] text-slate-400 font-medium">Try broadening your search or clear active filters.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVendors.map((vendor) => {
              const avatarColor = getAvatarColor(vendor.id);
              const specialties = vendor.specialties || [];

              return (
                <motion.div
                  key={vendor.id}
                  layout
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3 shadow-sm font-sans"
                >
                  <div className="flex gap-3 items-start">
                    {/* Initials Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[15px] border ${avatarColor} shrink-0 shadow-inner`}>
                      {getInitials(vendor.name)}
                    </div>

                    {/* Header details */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 
                          onClick={() => onSelectVendor(vendor)}
                          className="text-[14px] font-black text-slate-900 leading-tight truncate hover:underline cursor-pointer"
                        >
                          {vendor.name}
                        </h3>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">
                            {vendor.type || 'Vendor'}
                          </span>
                          
                          <button
                            onClick={() => onFavoriteToggle(vendor.id, !vendor.isFavorite)}
                            className={cn(
                              "p-1 hover:bg-slate-50 rounded-lg transition-colors",
                              vendor.isFavorite ? "text-amber-400" : "text-slate-300"
                            )}
                          >
                            <Star className={cn("w-4 h-4", vendor.isFavorite && "fill-current")} />
                          </button>
                        </div>
                      </div>
                      
                      {vendor.contactName && (
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-1">
                          {vendor.contactName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Body contact info */}
                  <div className="space-y-2 text-[12px] font-medium text-slate-500 border-t border-slate-100 pt-3">
                    {vendor.address && (
                      <p className="flex items-start gap-2 leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{vendor.address}</span>
                      </p>
                    )}
                    {vendor.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{vendor.email}</span>
                      </p>
                    )}
                    {vendor.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{vendor.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Specialties chips */}
                  {specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {specialties.map((spec: string, i: number) => (
                        <span 
                          key={i} 
                          className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200/50 rounded-md text-[10px] font-bold"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100/50 mt-1">
                    <button
                      onClick={() => onContactVendor(vendor)}
                      className="px-3.5 py-1.5 border border-slate-200 hover:border-indigo-200 bg-white text-slate-600 hover:text-indigo-600 rounded-xl text-[12px] font-bold shadow-sm transition-colors active:scale-95"
                    >
                      Contact
                    </button>
                    <button
                      onClick={() => onSelectVendor(vendor)}
                      className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-xl text-[12px] font-bold shadow-sm transition-colors active:scale-95"
                    >
                      View Profile
                    </button>
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
        title="Add Provider"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
