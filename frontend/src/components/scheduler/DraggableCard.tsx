import { useDraggable } from '@dnd-kit/core';
import { Link, Edit3, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';
import { type WorkOrderSync } from '../../lib/db';
import { PriorityBadge } from '../PriorityBadge';

interface DraggableCardProps {
    wo: WorkOrderSync;
    onClick: () => void;
    onEdit: () => void;
    tagConfig: TagConfig[];
}

import { type TagConfig } from './ConfigureTagsModal';

export const DraggableCard = ({ wo, onClick, onEdit, tagConfig }: DraggableCardProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: wo.id,
        data: { wo }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
        opacity: isDragging ? 0.4 : 1
    } : undefined;

    return (
        <div 
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                "bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col gap-4 cursor-grab active:cursor-grabbing relative",
                isDragging && "scale-105 shadow-xl border-primary/20"
            )}
        >
            <div className="space-y-4">
                <div className="flex-1 text-[13px] font-bold text-slate-700 leading-snug group-hover:text-primary transition-colors pr-12">
                    #{wo.woNumber?.padStart(3, '0') || '---'}: {wo.title}
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                    <button 
                        onClick={(e) => { e.stopPropagation(); (window as any).openWoLinks?.(wo); }}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition-all"
                        title="Link Work Order"
                    >
                        <Link className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition-all"
                        title="Edit Mission"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {wo.priority && <PriorityBadge priority={wo.priority} />}
                    {tagConfig?.filter(t => t.visible).map(tag => {
                        if (tag.id === 'status' && wo.status) {
                            return <span key={tag.id} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-tight border border-slate-200/50 truncate max-w-[140px]">{wo.status}</span>;
                        }
                        if (tag.id === 'asset' && wo.assetName) {
                            return <span key={tag.id} className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-tight border border-amber-100 truncate max-w-[140px]">{wo.assetName}</span>;
                        }
                        if (tag.id === 'location' && wo.locationId) {
                            return <span key={tag.id} className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-[9px] font-black uppercase tracking-tight border border-teal-100 truncate max-w-[140px]">{wo.locationId}</span>;
                        }
                        if (tag.id === 'category' && wo.category) {
                            return <span key={tag.id} className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-[9px] font-black uppercase tracking-tight border border-purple-100 truncate max-w-[140px]">{wo.category}</span>;
                        }
                        return null;
                    })}
                </div>
            </div>
            <div className="mt-auto flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-50/50">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.2)]", 
                        wo.priority === 'High' ? "bg-rose-500 shadow-rose-500/20" : "bg-primary shadow-primary/20"
                    )} />
                    {wo.startDate ? format(parseISO(wo.startDate), 'M/d/yyyy') : 'None'}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-gray-100/50">
                    <Clock className="w-3 h-3 text-gray-300" />
                    <span>{wo.estimatedHours || 1}H</span>
                </div>
            </div>
        </div>
    );
};
