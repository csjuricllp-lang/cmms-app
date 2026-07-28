import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, MoreVertical, Download, RefreshCcw, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface WidgetProps {
    title: string;
    children: React.ReactNode;
    subtitle?: string;
    showControls?: boolean;
    className?: string;
    data?: any;
    icon?: any;
}

export const Widget = ({ title, children, subtitle, showControls = true, className, data, icon: Icon }: WidgetProps) => {
    const [showMenu, setShowMenu] = useState(false);
    
    const downloadCSV = () => {
        if (!data || !Array.isArray(data)) return;
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_data.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowMenu(false);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative", className)}
        >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                            <Icon className="w-4 h-4 text-slate-400" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-[15px] font-bold text-slate-800">{title}</h3>
                        {subtitle && <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>}
                    </div>
                </div>
                {showControls && (
                    <div className="flex items-center gap-2 relative">
                         <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                            <Compass className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className={cn("p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all", showMenu && "bg-slate-100")}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute top-full right-0 mt-2 w-[240px] bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-slate-100 py-2 z-[100]"
                                >
                                    <button className="w-full px-4 py-2 flex items-center gap-3 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                        <Compass className="w-4 h-4" /> Explore from here
                                    </button>
                                    <button onClick={downloadCSV} className="w-full px-4 py-2 flex items-center gap-3 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                        <Download className="w-4 h-4" /> Download data
                                    </button>
                                    <div className="h-px bg-slate-100 my-1 mx-2" />
                                    <button className="w-full px-4 py-2 flex items-center justify-between text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                        <span className="flex items-center gap-3">View</span>
                                        <ChevronRight className="w-4 h-4 opacity-40" />
                                    </button>
                                    <div className="h-px bg-slate-100 my-1 mx-2" />
                                    <button onClick={() => { window.location.reload(); setShowMenu(false); }} className="w-full px-4 py-2 flex items-center gap-3 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                        <RefreshCcw className="w-4 h-4" /> Clear cache & refresh
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
            <div className="p-6 flex-1 min-h-0">
                <div className="h-full w-full">
                    {children}
                </div>
            </div>
        </motion.div>
    );
};

export const StatBox = ({ 
    title, 
    value, 
    trend, 
    icon: Icon, 
    color = "indigo" 
}: { 
    title: string; 
    value: string | number; 
    trend?: string; 
    icon?: any; 
    color?: string;
}) => {
    const colorClasses: Record<string, string> = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100"
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between group hover:shadow-md transition-all">
            <div className="space-y-1">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-[28px] font-black text-slate-800 tracking-tighter">{value}</p>
                    {trend && (
                        <span className={cn(
                            "text-[12px] font-bold px-1.5 py-0.5 rounded-lg",
                            trend.startsWith('+') ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                        )}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
            {Icon && (
                <div className={cn("p-3 rounded-xl border", colorClasses[color] || colorClasses.indigo)}>
                    <Icon className="w-5 h-5" />
                </div>
            )}
        </div>
    );
};
