import { useState, useEffect } from 'react';
import {
    Search, ListChecks, Plus, CheckSquare,
    Tag, MoreHorizontal, Loader2, X,
    Filter, ChevronRight, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChecklists } from '../hooks/useData';
import { CreateChecklistModal } from '../components/CreateChecklistModal';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

type Tab = 'your' | 'library';

// ─── Tag colour helper ─────────────────────────────────────────────────────────
const TAG_COLORS = [
    'bg-indigo-50 text-indigo-700 border-indigo-100',
    'bg-amber-50 text-amber-700 border-amber-100',
    'bg-emerald-50 text-emerald-700 border-emerald-100',
    'bg-blue-50 text-blue-700 border-blue-100',
    'bg-rose-50 text-rose-700 border-rose-100',
    'bg-purple-50 text-purple-700 border-purple-100',
];

const tagColor = (tag: string) => {
    const sum = tag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return TAG_COLORS[sum % TAG_COLORS.length];
};

// ─── Checklist Card ────────────────────────────────────────────────────────────
interface ChecklistCardProps {
    checklist: any;
    onClick: () => void;
}

const ChecklistCard = ({ checklist, onClick }: ChecklistCardProps) => {
    const taskCount = checklist.items?.length || 0;
    const tags: string[] = checklist.tags || ['Safety', 'Audit'];

    return (
        <motion.div
            layout
            onClick={onClick}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm active:bg-slate-50/50 active:scale-[0.99] transition-all cursor-pointer"
        >
            {/* Header row */}
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <CheckSquare className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[14px] font-black text-slate-900 leading-snug line-clamp-1">
                            {checklist.title || checklist.name}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    </div>
                    {checklist.description && (
                        <p className="text-[12px] text-slate-400 font-medium mt-0.5 line-clamp-2 italic">
                            {checklist.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Footer row */}
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-3 justify-between">
                {/* Task count */}
                <div className="flex items-center gap-1.5">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] font-black text-slate-500">{taskCount} Tasks</span>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 overflow-hidden">
                    {tags.slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border shrink-0",
                                tagColor(tag)
                            )}
                        >
                            {tag}
                        </span>
                    ))}
                    {tags.length > 3 && (
                        <span className="text-[10px] font-bold text-slate-400">+{tags.length - 3}</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ─── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
    <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4 shadow-sm my-4">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center mx-auto">
            <ListChecks className="w-7 h-7 text-blue-400" />
        </div>
        <div className="space-y-1">
            <p className="text-[15px] font-black text-slate-700">No Checklists Found</p>
            <p className="text-[12px] text-slate-400 font-medium max-w-[240px] mx-auto">
                Standardize safety and maintenance procedures by creating your first template.
            </p>
        </div>
        <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 text-blue-600 font-black text-[13px] hover:underline"
        >
            <Plus className="w-4 h-4" />
            Create your first checklist
        </button>
    </div>
);

// ─── Checklist Detail Bottom Sheet ─────────────────────────────────────────────
interface DetailSheetProps {
    checklist: any;
    onClose: () => void;
}

const ChecklistDetailSheet = ({ checklist, onClose }: DetailSheetProps) => {
    const tags: string[] = checklist.tags || ['Safety', 'Audit'];
    const items = checklist.items || [];

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden z-10"
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                </div>

                {/* Header */}
                <div className="px-5 py-3 flex items-start gap-3 border-b border-slate-100 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <CheckSquare className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[16px] font-black text-slate-900 leading-tight line-clamp-2">
                            {checklist.title || checklist.name}
                        </h2>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">{(checklist.items || []).length} Tasks</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90 transition-transform shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {checklist.description && (
                        <p className="text-[13px] text-slate-500 font-medium italic leading-relaxed">
                            {checklist.description}
                        </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, i) => (
                            <span
                                key={i}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border",
                                    tagColor(tag)
                                )}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Task Items */}
                    {items.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Tasks</p>
                            {items.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-3 border border-slate-100">
                                    <div className="w-5 h-5 rounded border-2 border-slate-300 shrink-0" />
                                    <span className="text-[13px] font-bold text-slate-700 flex-1">{item.label || item.name || `Task ${i + 1}`}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{item.type || 'Status'}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center">
                            <p className="text-[13px] text-slate-400 font-bold">No task items defined yet.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ─── Mobile Checklists Page ────────────────────────────────────────────────────
export const MobileChecklists = () => {
    const [activeTab, setActiveTab] = useState<Tab>('your');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<any>(null);

    const { data: checklists, isLoading } = useChecklists();

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const filteredChecklists = (checklists || []).filter((c: any) =>
        (c.title || c.name || '').toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const handleResetFilters = () => {
        setSearchTerm('');
        toast.success('Filters reset to procedural defaults');
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] font-outfit pb-24 relative">
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="bg-white px-4 py-4 border-b border-slate-100 sticky top-0 z-30 shadow-sm shrink-0 space-y-3">
                {/* Title row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                            <ListChecks className="w-4 h-4" />
                        </div>
                        <h1 className="text-[17px] font-black text-slate-900 tracking-tight">Checklists</h1>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-black shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Checklist
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-transparent rounded-xl text-[13px] font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* ── Sub-tabs ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-4 flex items-center gap-6 sticky top-[125px] z-20">
                {[
                    { id: 'your', label: 'Your Checklists' },
                    { id: 'library', label: 'Template Library' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={cn(
                            "text-[13px] font-bold py-3.5 transition-all relative whitespace-nowrap",
                            activeTab === tab.id
                                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary"
                                : "text-slate-400"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Filter row ──────────────────────────────────────────────────── */}
            <div className="bg-white px-4 py-2.5 border-b border-slate-50 flex items-center gap-3">
                <button className="flex items-center gap-1.5 h-8 px-3 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95">
                    <Filter className="w-3.5 h-3.5" />
                    Filters
                </button>
                <button className="flex items-center gap-1.5 h-8 px-3 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95">
                    <Tag className="w-3.5 h-3.5" />
                    Tags
                </button>
                <button
                    onClick={handleResetFilters}
                    className="text-[12px] font-bold text-blue-600 ml-auto"
                >
                    Reset
                </button>
            </div>

            {/* ── Count badge ─────────────────────────────────────────────────── */}
            <div className="px-4 py-2 flex items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {filteredChecklists.length} {filteredChecklists.length === 1 ? 'Checklist' : 'Checklists'}
                </span>
            </div>

            {/* ── Content ─────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : filteredChecklists.length === 0 ? (
                    <EmptyState onAdd={() => setIsCreateModalOpen(true)} />
                ) : (
                    <div className="space-y-3">
                        {filteredChecklists.map((checklist: any) => (
                            <ChecklistCard
                                key={checklist.id}
                                checklist={checklist}
                                onClick={() => setSelectedChecklist(checklist)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── FAB ─────────────────────────────────────────────────────────── */}
            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed right-6 bottom-20 z-40 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 transition-transform active:scale-90"
                title="Add Checklist"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* ── Create Checklist Modal ───────────────────────────────────────── */}
            <CreateChecklistModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* ── Detail Sheet ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {selectedChecklist && (
                    <ChecklistDetailSheet
                        checklist={selectedChecklist}
                        onClose={() => setSelectedChecklist(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
