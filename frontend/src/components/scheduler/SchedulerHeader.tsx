import { RotateCcw, Zap, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SchedulerHeaderProps {
    onReload: () => void;
    onSave: () => void;
    onSmartSchedule: () => void;
    isOptimizing: boolean;
    onOpenSavedViews: () => void;
}

export const SchedulerHeader = ({ onReload, onSave, onSmartSchedule, isOptimizing, onOpenSavedViews }: SchedulerHeaderProps) => {
    return (
        <header className="px-4 md:px-8 py-4 bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30">
            <h1 className="text-[24px] font-black text-[#1E293B] tracking-tight">Scheduler</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button 
                    onClick={onOpenSavedViews} 
                    className="p-2 hover:bg-gray-50 rounded-xl border border-gray-100 text-gray-400 transition-all hover:text-primary active:scale-95" 
                    title="Saved Views"
                >
                    <Eye className="w-5 h-5" />
                </button>
                <button onClick={onReload} className="p-2 hover:bg-gray-50 rounded-xl border border-gray-100 text-gray-400 transition-all hover:text-primary active:scale-95" title="Refresh">
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={onSave} className="px-4 py-2 bg-gray-50 text-gray-400 rounded-xl text-[14px] font-bold border border-gray-100 hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-95">
                    Save Schedule
                </button>
                <button 
                    onClick={onSmartSchedule}
                    disabled={isOptimizing}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-[14px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95",
                        isOptimizing && "opacity-80 cursor-wait"
                    )}
                >
                    <Zap className={cn("w-4 h-4 fill-current", isOptimizing && "animate-pulse")} />
                    {isOptimizing ? "Optimizing..." : "Smart Schedule"}
                </button>
            </div>
        </header>
    );
};
