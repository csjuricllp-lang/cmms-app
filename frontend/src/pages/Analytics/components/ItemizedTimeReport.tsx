import { useState } from 'react';
import { ChevronDown, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface ItemizedTimeReportProps {
    data: any;
    datePreset: string;
    setDatePreset: (val: string) => void;
    showFilters: boolean;
}

export const ItemizedTimeReport = ({ data, datePreset, setDatePreset, showFilters }: ItemizedTimeReportProps) => {
    const reportData = data?.itemizedTimeReport || [];
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [operator, setOperator] = useState('is in the last');
    const [amount, setAmount] = useState('30');
    const [unit, setUnit] = useState('days');

    const [isOperatorOpen, setIsOperatorOpen] = useState(false);
    const [isUnitOpen, setIsUnitOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(4);

    const totalPages = Math.ceil(reportData.length / pageSize);
    const paginatedData = reportData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const columns = [
        "Start Time", "End Time", "Type", "Worker Full Name", "Hourly Rate",
        "Work Order Title", "Work Order Number", "Work Order Location",
        "Work Order Asset Name", "Work Order Category", "Timer Category Name",
        "Total Time Spent (hours)", "Total Labor Cost"
    ];

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {showFilters && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-3 relative pb-4">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[14px] font-medium text-foreground/90">Start Time</span>
                                <button 
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={cn(
                                        "px-5 py-2.5 bg-[#D9E8FF] text-[#1e293b] rounded-lg text-[15px] font-medium border border-[#4A90E2] hover:bg-[#c6dbf9] transition-all flex items-center gap-2 shadow-sm",
                                        isFilterOpen && "ring-2 ring-primary ring-offset-2"
                                    )}
                                >
                                    {operator} {amount} {unit}
                                </button>
                                
                                <AnimatePresence>
                                    {isFilterOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full left-0 mt-2 bg-card rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-border z-[100] p-4 min-w-[420px]"
                                        >
                                            <div className="flex items-center border border-border rounded bg-card h-12 relative">
                                                <div 
                                                    onClick={() => { setIsOperatorOpen(!isOperatorOpen); setIsUnitOpen(false); }}
                                                    className={cn(
                                                        "flex-1 flex items-center px-4 gap-4 border-r border-border cursor-pointer hover:bg-transparent transition-all group h-full",
                                                        isOperatorOpen && "border border-[#4285f4] ring-1 ring-[#4285f4] -ml-[1px]"
                                                    )}
                                                >
                                                    <span className="text-[15px] font-medium text-foreground/90 whitespace-nowrap">{operator}</span>
                                                    <ChevronDown className={cn("w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ml-auto", isOperatorOpen && "rotate-180")} />
                                                </div>
                                                
                                                <div className="w-[80px] border-r border-border h-full">
                                                    <input 
                                                        type="text" 
                                                        value={amount}
                                                        onChange={(e) => {
                                                            setAmount(e.target.value);
                                                            if (datePreset) setDatePreset(`${operator} ${e.target.value} ${unit}`);
                                                        }}
                                                        className="w-full h-full border-none focus:ring-0 text-center text-[15px] font-medium text-foreground/90"
                                                    />
                                                </div>

                                                <div 
                                                    onClick={() => { setIsUnitOpen(!isUnitOpen); setIsOperatorOpen(false); }}
                                                    className={cn(
                                                        "flex-1 flex items-center px-4 gap-4 cursor-pointer hover:bg-transparent transition-all group h-full",
                                                        isUnitOpen && "border border-[#4285f4] ring-1 ring-[#4285f4] -mr-[1px]"
                                                    )}
                                                >
                                                    <span className="text-[15px] font-medium text-foreground/90">{unit}</span>
                                                    <ChevronDown className={cn("w-4 h-4 text-slate-400 group-hover:text-slate-600 ml-auto transition-transform", isUnitOpen && "rotate-180")} />
                                                </div>

                                                <AnimatePresence>
                                                    {isOperatorOpen && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                                            className="absolute top-full left-0 mt-1 w-[320px] bg-card border border-border rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)] z-[110] py-2 overflow-hidden flex flex-col"
                                                        >
                                                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                                {[
                                                                    'is in the last', 'is on the day', 'is in range', 'is before', 
                                                                    'is on or after', 'is in the year', 'is in the month', 'is this', 
                                                                    'is next', 'is previous', 'is', 'is null', 'is not null', 
                                                                    'is any time', 'matches a user attribute', 'matches (advanced)'
                                                                ].map((op) => (
                                                                    <button 
                                                                        key={op}
                                                                        onClick={() => { setOperator(op); setIsOperatorOpen(false); setDatePreset(`${op} ${amount} ${unit}`); }}
                                                                        className={cn(
                                                                            "w-full px-6 py-2.5 text-left text-[15px] transition-colors",
                                                                            operator === op ? "bg-[#e8f0fe] text-foreground font-medium" : "text-slate-600 hover:bg-transparent"
                                                                        )}
                                                                    >
                                                                        {op}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                    {isUnitOpen && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                                            className="absolute top-full right-0 mt-1 w-[240px] bg-card border border-border rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)] z-[110] py-2 overflow-hidden flex flex-col"
                                                        >
                                                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                                {[
                                                                    'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'quarters', 'years',
                                                                    'complete seconds', 'complete minutes', 'complete hours', 'complete days',
                                                                    'complete weeks', 'complete months', 'complete quarters', 'complete years'
                                                                ].map((u) => (
                                                                    <button 
                                                                        key={u}
                                                                        onClick={() => { setUnit(u); setIsUnitOpen(false); setDatePreset(`${operator} ${amount} ${u}`); }}
                                                                        className={cn(
                                                                            "w-full px-6 py-2.5 text-left text-[15px] transition-colors",
                                                                            unit === u ? "bg-[#e8f0fe] text-foreground font-medium" : "text-slate-600 hover:bg-transparent"
                                                                        )}
                                                                    >
                                                                        {u}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="absolute -right-12 top-1/2 -translate-y-1/2">
                                <button className="w-10 h-10 flex items-center justify-center bg-card border border-border rounded hover:bg-transparent transition-all text-slate-400 hover:text-slate-600">
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm mt-4">
                <div className="max-h-[400px] overflow-auto custom-scrollbar relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="text-white/90 bg-primary">
                            <tr className="border-b border-primary/20">
                                {columns.map((col, idx) => (
                                    <th key={idx} className="px-6 py-4 text-[13px] font-black text-white/90 uppercase tracking-tight border-b border-slate-100 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {col}
                                            {col === "Start Time" && <ChevronDown className="w-4 h-4 text-slate-400" />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-transparent/50 transition-colors">
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">{row.startTime}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">{row.endTime}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">{row.type}</td>
                                        <td className="px-6 py-4 text-[14px] text-foreground font-medium border-b border-slate-50">{row.workerName}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">${row.hourlyRate}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">{row.woTitle}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">#{row.woNumber}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">{row.woLocation}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">{row.woAsset}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">{row.woCategory}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">{row.timerCategory}</td>
                                        <td className="px-6 py-4 text-[14px] text-slate-600 border-b border-slate-50">{row.totalHours}</td>
                                        <td className="px-6 py-4 text-[14px] text-foreground font-bold border-b border-slate-50">${row.totalLaborCost}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="text-slate-400 font-medium text-[16px]">No Results</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="sticky bottom-0 z-20 px-8 py-4 bg-white/95 backdrop-blur-sm border-t border-slate-100 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.03)] print:hidden">
                    <div className="flex items-center gap-4">
                        <span className="text-[13px] text-muted-foreground font-medium italic">
                            Showing <span className="text-foreground font-bold">{((currentPage - 1) * pageSize) + 1}</span> to <span className="text-foreground font-bold">{Math.min(currentPage * pageSize, reportData.length)}</span> of <span className="text-foreground font-bold">{reportData.length}</span> entries
                        </span>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">Rows per page:</span>
                            <select 
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-transparent border-none text-[13px] font-bold text-primary focus:ring-0 cursor-pointer"
                            >
                                {[4, 8, 12, 16, 20].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 hover:bg-card rounded-lg border border-transparent hover:border-border disabled:opacity-30 disabled:pointer-events-none transition-all"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, i, arr) => (
                                <div key={p} className="flex items-center gap-1">
                                    {i > 0 && arr[i-1] !== p - 1 && <span className="text-slate-300">...</span>}
                                    <button 
                                        onClick={() => setCurrentPage(p)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg text-[13px] font-black transition-all",
                                            currentPage === p ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-card hover:text-foreground"
                                        )}
                                    >
                                        {p}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button 
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 hover:bg-card rounded-lg border border-transparent hover:border-border disabled:opacity-30 disabled:pointer-events-none transition-all"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
