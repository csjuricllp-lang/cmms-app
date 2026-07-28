import { useState } from 'react';
import { 
    Search, 
    X, 
    TrendingUp, 
    Users, 
    Clock, 
    ShieldAlert, 
    Box, 
    Package, 
    BarChart2, 
    Pin,
    ChevronRight,
    Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { ALL_DASHBOARDS } from '../dashboards';

interface AnalyticsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    pinnedIds: string[];
    onTogglePin: (id: string) => void;
    activeTab: string;
    onSelectTab: (id: string) => void;
}

export const AnalyticsSidebar = ({
    isOpen,
    onClose,
    pinnedIds,
    onTogglePin,
    activeTab,
    onSelectTab
}: AnalyticsSidebarProps) => {
    const [search, setSearch] = useState('');

    const categories = [
        { name: 'General', icon: TrendingUp },
        { name: 'Work Orders', icon: BarChart2 },
        { name: 'Assets', icon: Box },
        { name: 'Parts', icon: Package },
        { name: 'Meters', icon: Clock },
        { name: 'Requests', icon: ShieldAlert },
        { name: 'Users', icon: Users },
        { name: 'Audit Trail', icon: Clock }
    ];

    const filteredDashboards = ALL_DASHBOARDS.filter(d => 
        d.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[500]"
                    />

                    {/* Sidebar Panel */}
                    <motion.div 
                        initial={{ x: -320 }}
                        animate={{ x: 0 }}
                        exit={{ x: -320 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed left-0 top-0 bottom-0 w-[320px] bg-white border-r border-slate-200 shadow-2xl z-[501] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-[16px] font-black text-slate-800 tracking-tight italic uppercase">All Dashboards</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-6 pb-2">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search dashboards..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                            {categories.map(cat => {
                                const catDashboards = filteredDashboards.filter(d => d.category === cat.name);
                                if (catDashboards.length === 0) return null;

                                return (
                                    <div key={cat.name} className="space-y-1">
                                        <div className="px-3 py-2 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">
                                            <cat.icon className="w-3 h-3" />
                                            {cat.name}
                                        </div>
                                        <div className="space-y-0.5">
                                            {catDashboards.map(d => (
                                                <div 
                                                    key={d.id}
                                                    onClick={() => { onSelectTab(d.id); onClose(); }}
                                                    className={cn(
                                                        "group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all",
                                                        activeTab === d.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-600"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-1 h-1 rounded-full",
                                                            activeTab === d.id ? "bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" : "bg-transparent"
                                                        )} />
                                                        <span className={cn("text-[13px] font-bold", activeTab === d.id ? "text-indigo-700" : "text-slate-600")}>
                                                            {d.label}
                                                        </span>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onTogglePin(d.id); }}
                                                        className={cn(
                                                            "p-1.5 rounded-lg transition-all",
                                                            pinnedIds.includes(d.id) 
                                                                ? "text-indigo-600 bg-indigo-100" 
                                                                : "text-slate-300 hover:text-indigo-400 opacity-0 group-hover:opacity-100"
                                                        )}
                                                    >
                                                        <Pin className={cn("w-3.5 h-3.5", pinnedIds.includes(d.id) && "fill-current")} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                            <button 
                                onClick={() => { onSelectTab('Performance'); onClose(); }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-md transition-all text-slate-600 group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                    <Home className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                </div>
                                <span className="text-[13px] font-bold">Analytics Home</span>
                                <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
