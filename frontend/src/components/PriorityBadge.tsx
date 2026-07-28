import { cn } from "../lib/utils";

interface PriorityBadgeProps {
    priority: string;
    className?: string;
}

export const getPriorityColors = (priority: string) => {
    const p = (priority || "").toUpperCase();
    if (p === "CRITICAL") return "bg-rose-600 text-white border-rose-600";
    if (p === "HIGH") return "bg-rose-50 text-rose-600 border-rose-100";
    if (p === "MEDIUM") return "bg-amber-50 text-amber-600 border-amber-100";
    if (p === "LOW") return "bg-emerald-50 text-emerald-600 border-emerald-100";
    return "bg-slate-50 text-slate-600 border-slate-200";
};

export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
    const colors = getPriorityColors(priority);
    return (
        <span className={cn("px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-widest border", colors, className)}>
            {priority || "NONE"}
        </span>
    );
};
