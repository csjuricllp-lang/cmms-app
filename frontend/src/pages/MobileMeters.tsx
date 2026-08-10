import { useState, useEffect } from 'react';
import { Search, MapPin, Box, AlertTriangle, CircleCheck, Thermometer, Gauge, Zap, Timer, Activity, Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface MobileMetersProps {
  meters: any[];
  isLoading: boolean;
  onSelectMeter: (meter: any) => void;
  onOpenCreateModal: () => void;
}

export const MobileMeters = ({
  meters,
  isLoading,
  onSelectMeter,
  onOpenCreateModal
}: MobileMetersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OVERDUE' | 'OK'>('ALL');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const getMeterIcon = (unit?: string) => {
    if (!unit) return <Activity className="w-5 h-5" />;
    switch (unit.toLowerCase()) {
      case 'c': case 'f': case 'temp': return <Thermometer className="w-5 h-5 text-rose-500" />;
      case 'psi': case 'bar': return <Gauge className="w-5 h-5 text-indigo-500" />;
      case 'v': case 'a': case 'e': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'h': case 'hours': return <Timer className="w-5 h-5 text-emerald-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const getMeterBg = (unit?: string) => {
    if (!unit) return 'bg-slate-50 border-slate-100';
    switch (unit.toLowerCase()) {
      case 'c': case 'f': case 'temp': return 'bg-rose-50 border-rose-100';
      case 'psi': case 'bar': return 'bg-indigo-50 border-indigo-100';
      case 'v': case 'a': case 'e': return 'bg-amber-50 border-amber-100';
      case 'h': case 'hours': return 'bg-emerald-50 border-emerald-100';
      default: return 'bg-slate-50 border-slate-150';
    }
  };

  const filteredMeters = meters.filter((meter) => {
    // Search filter
    const matchesSearch = !debouncedSearch || 
      (meter.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (meter.unit || '').toLowerCase().includes(debouncedSearch.toLowerCase());

    // Status filter
    const isOverdue = Number(meter.currentValue ?? 0) > Number(meter.threshold ?? 100);

    if (activeFilter === 'OVERDUE') return matchesSearch && isOverdue;
    if (activeFilter === 'OK') return matchesSearch && !isOverdue;
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-outfit select-none relative pb-20">
      {/* Header Bar */}
      <div className="bg-white px-4 py-4 border-b border-slate-100 sticky top-0 z-30 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Gauge className="w-4 h-4" />
            </div>
            <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Meter Readings</h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search meter name or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-transparent rounded-xl text-[14px] font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none sticky top-[125px] z-20 bg-[#f8fafc] border-b border-slate-100/50">
        {[
          { id: 'ALL', label: 'All Meters' },
          { id: 'OVERDUE', label: 'Past Due / High' },
          { id: 'OK', label: 'Normal' }
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

      {/* Content Area */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredMeters.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-6 space-y-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
              <Gauge className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-black text-slate-700">No Meters Found</p>
              <p className="text-[11px] text-slate-400 font-medium">Try broadening your search or clear active filters.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMeters.map((meter) => {
              const isOverdue = Number(meter.currentValue ?? 0) > Number(meter.threshold ?? 100);
              const locName = meter.location?.name || meter.asset?.location?.name || 'Unassigned Location';

              return (
                <motion.div
                  key={meter.id}
                  layout
                  onClick={() => onSelectMeter(meter)}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 flex gap-4 items-start shadow-sm active:bg-slate-50/50 active:scale-[0.99] transition-all cursor-pointer"
                >
                  {/* Dynamic Colored Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner",
                    getMeterBg(meter.unit)
                  )}>
                    {getMeterIcon(meter.unit)}
                  </div>

                  {/* Body details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[14px] font-black text-slate-900 leading-snug truncate">
                        {meter.name}
                      </h3>
                      {isOverdue ? (
                        <span className="flex items-center gap-1 bg-rose-50 text-[10px] font-bold text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full shrink-0">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> Alert
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          <CircleCheck className="w-3 h-3 shrink-0" /> Normal
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <span>Frequency: Every {meter.frequency || 1} day(s)</span>
                      {meter.category?.name && (
                        <>
                          <span className="text-slate-200">•</span>
                          <span className="truncate">{meter.category.name}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg w-fit">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{locName}</span>
                    </div>
                  </div>

                  {/* Current Reading */}
                  <div className="flex flex-col items-end justify-center shrink-0">
                    <span className="text-base font-black text-slate-800 tracking-tight leading-none">
                      {meter.currentValue || 0}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      {meter.unit || 'unit'}
                    </span>
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
        title="Add Meter"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
