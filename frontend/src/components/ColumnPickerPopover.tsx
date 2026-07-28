import React from 'react';
import { GripVertical, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface ColumnPickerPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    columns: { id: string, label: string, isMandatory?: boolean }[];
    visibleColumnIds: string[];
    onToggle: (id: string) => void;
    anchorRect?: DOMRect;
}

export const ColumnPickerPopover: React.FC<ColumnPickerPopoverProps> = ({
    isOpen,
    onClose,
    columns,
    visibleColumnIds,
    onToggle,
    anchorRect
}) => {
    if (!isOpen || !anchorRect) return null;

    return (
        <>
            <div className="fixed inset-0 z-[250]" onClick={onClose} />
            <div 
                className="fixed z-[260] w-64 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden py-3 animate-in fade-in zoom-in-95 duration-200"
                style={{ 
                    top: anchorRect.bottom + 8, 
                    right: window.innerWidth - anchorRect.right 
                }}
            >
                <div className="flex flex-col overflow-y-auto max-h-[500px] custom-scrollbar">
                    {columns.map((col) => {
                        const isVisible = visibleColumnIds.includes(col.id);
                        return (
                            <div 
                                key={col.id}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors group",
                                    col.isMandatory ? "opacity-60 cursor-default" : "cursor-pointer"
                                )}
                                onClick={() => !col.isMandatory && onToggle(col.id)}
                            >
                                <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                                
                                <div className={cn(
                                    "w-5 h-5 rounded flex items-center justify-center transition-all",
                                    isVisible ? "bg-blue-600 border-blue-600" : "bg-white border border-slate-300"
                                )}>
                                    {isVisible && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </div>

                                <span className={cn(
                                    "text-[15px] font-medium",
                                    isVisible ? "text-slate-900" : "text-slate-500"
                                )}>
                                    {col.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
