import { ArrowRight, Plus, Minus, Edit2 } from 'lucide-react';

interface JsonDiffViewerProps {
    oldData?: any;
    newData?: any;
    compact?: boolean;
}

const formatFieldName = (key: string) => {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
};

const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

export const JsonDiffViewer = ({ oldData, newData, compact = false }: JsonDiffViewerProps) => {
    const oldObj = oldData || {};
    const newObj = newData || {};
    
    // Get all unique keys from both objects
    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
    
    // Filter out keys where values haven't changed (for updates)
    const changedKeys = allKeys.filter(key => {
        return JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key]);
    });

    if (changedKeys.length === 0) {
        return (
            <div className="text-sm italic text-muted-foreground opacity-60">
                No significant data changes recorded in payload.
            </div>
        );
    }

    return (
        <div className="w-full space-y-2">
            {!compact && (
                <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-200 px-4">
                    <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Property</div>
                    <div className="col-span-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Change Log</div>
                </div>
            )}
            
            <div className="space-y-1">
                {changedKeys.map(key => {
                    const oldVal = oldObj[key];
                    const newVal = newObj[key];
                    const isAdded = oldVal === undefined && newVal !== undefined;
                    const isRemoved = oldVal !== undefined && newVal === undefined;
                    const isModified = oldVal !== undefined && newVal !== undefined && oldVal !== newVal;

                    return (
                        <div key={key} className={`group grid grid-cols-12 gap-4 items-center p-3 sm:px-4 rounded-xl transition-colors hover:bg-slate-200/50 ${compact ? 'text-xs' : 'text-sm'}`}>
                            <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
                                {isAdded && <Plus className="w-3 h-3 text-emerald-500 shrink-0" />}
                                {isRemoved && <Minus className="w-3 h-3 text-rose-500 shrink-0" />}
                                {isModified && <Edit2 className="w-3 h-3 text-amber-500 shrink-0" />}
                                <span className="font-bold text-foreground/80 truncate" title={key}>
                                    {formatFieldName(key)}
                                </span>
                            </div>
                            
                            <div className="col-span-12 sm:col-span-8 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 overflow-hidden">
                                {isRemoved || isModified ? (
                                    <span className="text-rose-400/80 line-through truncate font-mono text-[11px] bg-rose-500/10 px-2 py-1 rounded-md">
                                        {formatValue(oldVal)}
                                    </span>
                                ) : null}

                                {isModified && (
                                    <ArrowRight className="w-3 h-3 text-slate-300 shrink-0 hidden sm:block" />
                                )}

                                {isAdded || isModified ? (
                                    <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-1 rounded-md truncate">
                                        {formatValue(newVal)}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
