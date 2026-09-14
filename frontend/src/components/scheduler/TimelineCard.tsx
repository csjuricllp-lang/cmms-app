import { useDraggable } from '@dnd-kit/core';
import { Edit3, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { type WorkOrderSync } from '../../lib/db';
import { parseISO, format } from 'date-fns';
import { type TagConfig } from './ConfigureTagsModal';

interface TimelineCardProps {
    wo: WorkOrderSync;
    onClick: () => void;
    onEdit: () => void;
    tagConfig: TagConfig[];
    hasConflict?: boolean;
    activeView?: string;
}

export const TimelineCard = ({ wo, onClick, onEdit, tagConfig, hasConflict, activeView }: TimelineCardProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `scheduled-${wo.id}`,
        data: { wo }
    });

    let dynamicStyle: React.CSSProperties = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000
    } : {};

    if (activeView === 'Day') {
        const startDate = wo.startDate ? parseISO(wo.startDate) : new Date();
        const minutes = startDate.getMinutes();
        const leftPercent = (minutes / 60) * 100;
        const durationHours = Number(wo.estimatedHours) || 1;
        const widthPercent = durationHours * 100;
        
        dynamicStyle = {
            ...dynamicStyle,
            left: `${leftPercent}%`,
            width: `calc(${widthPercent}% - 8px)`,
        };
    }

    return (
        <div 
            ref={setNodeRef}
            style={dynamicStyle}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                "absolute inset-y-1 bg-card border-l-4 border-primary shadow-sm rounded-lg p-3 flex flex-col justify-center cursor-grab active:cursor-grabbing hover:shadow-md transition-all z-10 overflow-hidden",
                activeView !== 'Day' && "inset-x-1", // For week/month view, take up full width
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
                {wo.startDate && (
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {format(parseISO(wo.startDate), 'h:mm a')}
                        {wo.estimatedHours ? ` - ${format(new Date(parseISO(wo.startDate).getTime() + Number(wo.estimatedHours) * 60 * 60 * 1000), 'h:mm a')}` : ''}
                    </div>
                )}
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
                className="absolute top-1 right-1 p-1 hover:bg-blue-50 rounded text-primary transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 bg-card shadow-sm border border-blue-100"
            >
                <Edit3 className="w-2.5 h-2.5" />
            </button>
        </div>
    );
};
