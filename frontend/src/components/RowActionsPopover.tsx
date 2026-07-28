import React from 'react';

interface RowActionsPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSubLocation: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    anchorRect?: DOMRect;
}

export const RowActionsPopover: React.FC<RowActionsPopoverProps> = ({
    isOpen,
    onClose,
    onAddSubLocation,
    onEdit,
    onDelete,
    anchorRect
}) => {
    if (!isOpen || !anchorRect) return null;

    return (
        <>
            <div className="fixed inset-0 z-[250]" onClick={onClose} />
            <div 
                className="fixed z-[260] w-48 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200"
                style={{ 
                    top: anchorRect.bottom + 8, 
                    right: window.innerWidth - anchorRect.right 
                }}
            >
                {onEdit && (
                    <button
                        onClick={() => { onEdit(); onClose(); }}
                        className="w-full text-left px-5 py-3 text-[15px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Edit Location
                    </button>
                )}
                <button
                    onClick={() => { onAddSubLocation(); onClose(); }}
                    className="w-full text-left px-5 py-3 text-[15px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    Add Sub Location
                </button>
                {onDelete && (
                    <button
                        onClick={() => { onDelete(); onClose(); }}
                        className="w-full text-left px-5 py-3 text-[15px] font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                    >
                        Delete Location
                    </button>
                )}
            </div>
        </>
    );
};
