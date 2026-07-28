import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface DroppableSlotProps {
    slotId: string;
    userId: string;
    time: Date;
    children?: React.ReactNode;
}

export const DroppableSlot = ({ slotId, userId, time, children }: DroppableSlotProps) => {
    const { isOver, setNodeRef } = useDroppable({
        id: slotId,
        data: { userId, time }
    });

    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "min-w-[150px] h-20 border-r border-gray-50/50 last:border-0 transition-colors relative",
                isOver ? "bg-primary/10" : "hover:bg-slate-50/30",
                format(time, 'HH') === '14' && "bg-primary/5/20 border-r-primary/5"
            )}
        >
            {children}
        </div>
    );
};
