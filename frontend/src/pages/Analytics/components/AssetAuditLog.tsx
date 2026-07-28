import { RefreshCcw, Filter, MoreVertical, ChevronDown, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface AssetAuditLogProps {
    data: any;
    showFilters: boolean;
}

export const AssetAuditLog = ({ data, showFilters }: AssetAuditLogProps) => {
    const reportData = data?.assetAuditLog || [];
    const dateFilter = 'is any time';

    const columns = [
        "Asset Name", "Action", "Modified By", "Field", "Old Value", "New Value", "Date"
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-[28px] font-black text-slate-800 tracking-tight italic uppercase">Asset Audit Log</h2>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-[12px] font-bold uppercase tracking-widest">
                    <RefreshCcw className="w-3.5 h-3.5 cursor-pointer hover:text-slate-600 transition-colors" />
                    <Filter className="w-3.5 h-3.5 cursor-pointer hover:text-slate-600 transition-colors" />
                    <MoreVertical className="w-3.5 h-3.5 cursor-pointer hover:text-slate-600 transition-colors" />
                </div>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-8 pb-4">
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Created At Date</span>
                                <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-[13px] text-slate-600 hover:bg-slate-100 transition-all">
                                    {dateFilter}
                                    <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-4">
                <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-center gap-2 bg-slate-50/30 relative">
                    <h3 className="text-[15px] font-bold text-slate-600 uppercase tracking-widest">Asset Audit Log</h3>
                    <div className="absolute right-8 flex items-center gap-3">
                        <Circle className="w-4 h-4 text-slate-300 cursor-pointer" />
                        <MoreVertical className="w-4 h-4 text-slate-300 cursor-pointer" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white">
                                {columns.map((col, idx) => (
                                    <th key={idx} className="px-8 py-4 text-[12px] font-black text-slate-800 uppercase tracking-tighter border-b border-slate-100 whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                reportData.map((row: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-4 text-[13px] text-slate-900 font-bold border-b border-slate-50">{row.assetName}</td>
                                        <td className="px-8 py-4 text-[13px] text-slate-500 border-b border-slate-50">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-tighter",
                                                row.action === 'CREATE' ? "bg-emerald-50 text-emerald-600" :
                                                row.action === 'UPDATE' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                                {row.action}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-[13px] text-slate-500 border-b border-slate-50">{row.userName}</td>
                                        <td className="px-8 py-4 text-[13px] text-slate-400 border-b border-slate-50">{row.field || '-'}</td>
                                        <td className="px-8 py-4 text-[13px] text-slate-400 border-b border-slate-50">
                                            <span className="truncate max-w-[150px] block">{row.oldValue || '-'}</span>
                                        </td>
                                        <td className="px-8 py-4 text-[13px] text-slate-600 font-medium border-b border-slate-50">
                                            <span className="truncate max-w-[150px] block">{row.newValue || '-'}</span>
                                        </td>
                                        <td className="px-8 py-4 text-[13px] text-slate-500 border-b border-slate-50">{row.date}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="grid grid-cols-3 grid-rows-3 gap-1 w-12 h-12 opacity-10">
                                                {[...Array(9)].map((_, i) => <div key={i} className="bg-slate-400 rounded-sm" />)}
                                            </div>
                                            <span className="text-slate-300 font-bold text-[14px] uppercase tracking-widest">No Results</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
