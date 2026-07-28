import { useState } from 'react';
import { RefreshCcw, Filter, MoreVertical, ChevronDown, Info, Square, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface UserLoginReportProps {
    data: any;
    showFilters: boolean;
}

export const UserLoginReport = ({ data, showFilters }: UserLoginReportProps) => {
    const reportData = data?.userLoginReport || [];
    const [isAccountTypeOpen, setIsAccountTypeOpen] = useState(false);
    const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>([]);
    const [activeFilter, setActiveFilter] = useState('Yes');

    const accountTypes = ['Administrator', 'Vendor / Customer'];

    const toggleAccountType = (type: string) => {
        if (selectedAccountTypes.includes(type)) {
            setSelectedAccountTypes(selectedAccountTypes.filter(t => t !== type));
        } else {
            setSelectedAccountTypes([...selectedAccountTypes, type]);
        }
    };

    const accountTypeLabel = selectedAccountTypes.length === 0 
        ? 'is any value' 
        : selectedAccountTypes.join(', ');

    const columns = [
        "Name", "Email", "ID", "Job Title", "Date of Last Login", "Account Type"
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-[28px] font-black text-slate-800 tracking-tight italic uppercase">Last Login</h2>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-[12px] font-bold uppercase tracking-widest">
                    <span className="opacity-60 italic">just now</span>
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
                            <div className="space-y-1.5 relative">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Account Type</span>
                                <button 
                                    onClick={() => setIsAccountTypeOpen(!isAccountTypeOpen)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-[13px] text-slate-600 hover:bg-slate-100 transition-all min-w-[140px]",
                                        isAccountTypeOpen && "border-[#4A90E2] ring-1 ring-[#4A90E2]"
                                    )}
                                >
                                    {accountTypeLabel}
                                    <ChevronDown className={cn("w-3.5 h-3.5 opacity-40 ml-auto transition-transform", isAccountTypeOpen && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {isAccountTypeOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="absolute top-full left-0 mt-2 w-[280px] bg-white border border-slate-200 rounded-lg shadow-xl z-[100] py-3 px-4 space-y-2"
                                        >
                                            {accountTypes.map(type => (
                                                <button 
                                                    key={type}
                                                    onClick={() => toggleAccountType(type)}
                                                    className="w-full flex items-center gap-3 hover:bg-slate-50 p-2 rounded transition-colors group"
                                                >
                                                    {selectedAccountTypes.includes(type) ? (
                                                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                                                    )}
                                                    <span className="text-[14px] text-slate-700 font-medium">{type}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active (Yes / No)</span>
                                <div className="flex border border-slate-200 rounded overflow-hidden">
                                    <button 
                                        onClick={() => setActiveFilter('Yes')}
                                        className={cn(
                                            "px-6 py-2 text-[13px] font-bold transition-all",
                                            activeFilter === 'Yes' ? "bg-indigo-50 text-indigo-600" : "bg-white text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        Yes
                                    </button>
                                    <button 
                                        onClick={() => setActiveFilter('No')}
                                        className={cn(
                                            "px-6 py-2 text-[13px] font-bold transition-all border-l border-slate-200",
                                            activeFilter === 'No' ? "bg-indigo-50 text-indigo-600" : "bg-white text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-4">
                <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-center gap-2 bg-slate-50/30">
                    <h3 className="text-[15px] font-bold text-slate-600 uppercase tracking-widest">Last Login</h3>
                    <Info className="w-4 h-4 text-slate-300" />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white">
                                {columns.map((col, idx) => (
                                    <th key={idx} className="px-8 py-4 text-[12px] font-black text-slate-800 uppercase tracking-tighter border-b border-slate-100 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {col}
                                            {col === "Date of Last Login" && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                reportData.map((row: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-4 text-[13px] text-slate-500 border-b border-slate-50">{row.name}</td>
                                        <td className="px-8 py-4 text-[13px] text-slate-500 border-b border-slate-50">{row.email}</td>
                                        <td className="px-8 py-4 text-[13px] text-slate-400 font-mono border-b border-slate-50">{row.id}</td>
                                        <td className="px-8 py-4 text-[13px] text-slate-400 italic border-b border-slate-50">{row.jobTitle || 'n/a'}</td>
                                        <td className="px-8 py-4 text-[13px] text-slate-600 font-bold border-b border-slate-50">{row.lastLogin}</td>
                                        <td className="px-8 py-4 text-[13px] text-slate-600 font-medium border-b border-slate-50">{row.accountType}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-3">
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
