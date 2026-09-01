import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface SortPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSortChange: (sortBy: string) => void;
    onOrderChange: (order: 'asc' | 'desc') => void;
    anchorRect?: DOMRect;
}

export const SortPopover: React.FC<SortPopoverProps> = ({
    isOpen,
    onClose,
    sortBy,
    sortOrder,
    onSortChange,
    onOrderChange,
    anchorRect
}) => {
    if (!isOpen || !anchorRect) return null;

    const SORT_OPTIONS = ['Name', 'Address', 'No. of Children', 'Date Created'];

    return (
        <>
            <div className="fixed inset-0 z-[250]" onClick={onClose} />
            <div 
                className="fixed z-[260] w-64 bg-card border border-slate-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{ 
                    top: anchorRect.bottom + 8, 
                    left: anchorRect.left - 160 // Adjusting to align right side if needed
                }}
            >
                {/* Sort By Section */}
                <div className="px-5 py-4">
                    <h3 className="text-[15px] font-bold text-foreground mb-3">Sort By</h3>
                    <div className="space-y-1">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                onClick={() => { onSortChange(opt); onClose(); }}
                                className={cn(
                                    "w-full text-left px-0 py-2 text-[15px] font-medium transition-colors",
                                    sortBy === opt ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[1px] bg-muted" />

                {/* Order Section */}
                <div className="px-5 py-4">
                    <h3 className="text-[15px] font-bold text-foreground mb-3">Order</h3>
                    <div className="space-y-1">
                        <button
                            onClick={() => { onOrderChange('desc'); onClose(); }}
                            className="w-full flex items-center justify-between py-2 group"
                        >
                            <span className={cn(
                                "text-[15px] font-medium transition-colors",
                                sortOrder === 'desc' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                Descending
                            </span>
                            {sortOrder === 'desc' && <Check className="w-4 h-4 text-primary" />}
                        </button>
                        <button
                            onClick={() => { onOrderChange('asc'); onClose(); }}
                            className="w-full flex items-center justify-between py-2 group"
                        >
                            <span className={cn(
                                "text-[15px] font-medium transition-colors",
                                sortOrder === 'asc' ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                Ascending
                            </span>
                            {sortOrder === 'asc' && <Check className="w-4 h-4 text-primary" />}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
