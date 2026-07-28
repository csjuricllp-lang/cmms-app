import { useDraggable } from '@dnd-kit/core';
import { Edit3, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { type WorkOrderSync } from '../../lib/db';

interface TimelineCardProps {
    wo: WorkOrderSync;
    onClick: () => void;
    onEdit: () => void;
    tagConfig: TagConfig[];
    hasConflict?: boolean;
}

import { type TagConfig } from './ConfigureTagsModal';

export const TimelineCard = ({ wo, onClick, onEdit, tagConfig, hasConflict }: TimelineCardProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `scheduled-${wo.id}`,
        data: { wo }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000
    } : undefined;

    return (
        <div 
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                "absolute inset-1 m-1 bg-white border-l-4 border-primary shadow-sm rounded-lg p-3 flex flex-col justify-center cursor-grab active:cursor-grabbing hover:shadow-md transition-all z-10 overflow-hidden",
                hasConflict && "border border-amber-200 bg-amber-50/60 border-l-4 border-l-amber-500 shadow-sm shadow-amber-50",
                isDragging && "opacity-50"
            )}
        >
            <div className="flex items-center gap-1 text-[11px] font-black text-slate-800 truncate leading-tight">
                {hasConflict && (
                    <span title="Scheduling Conflict: Overlapping assignments">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    </span>
                )}
                <span className="truncate">#{wo.woNumber?.padStart(3, '0')}: {wo.title}</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
                {tagConfig?.filter(t => t.visible).map(tag => {
                    if (tag.id === 'asset' && wo.assetName) {
                        return <div key={tag.id} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{wo.assetName}</div>;
                    }
                    if (tag.id === 'status' && wo.status) {
                        return <div key={tag.id} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{wo.status}</div>;
                    }
                    if (tag.id === 'location' && wo.locationId) {
                        return <div key={tag.id} className="text-[9px] font-bold text-teal-400 uppercase tracking-widest truncate">{wo.locationId}</div>;
                    }
                    if (tag.id === 'category' && wo.category) {
                        return <div key={tag.id} className="text-[9px] font-bold text-purple-400 uppercase tracking-widest truncate">{wo.category}</div>;
                    }
                    return null;
                })}
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="absolute top-1 right-1 p-1 hover:bg-blue-50 rounded text-blue-500 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 bg-white shadow-sm border border-blue-100"
            >
                <Edit3 className="w-2.5 h-2.5" />
            </button>
        </div>
    );
};
