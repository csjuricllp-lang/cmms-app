import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, ClipboardList, Box, Package, MapPin, Users, X, Loader2, ArrowRight, Command, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalSearch } from '../hooks/useData';
import { cn } from '../lib/utils';
import { QRScannerModal } from './QRScannerModal';

// ─── Type icons & colors ─────────────────────────────────────────────────────
const TYPE_CONFIG = {
    'work-order': { icon: ClipboardList, label: 'Work Order', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
    'asset':      { icon: Box,           label: 'Asset',      color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    'part':       { icon: Package,       label: 'Part',       color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
    'location':   { icon: MapPin,        label: 'Location',   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'person':     { icon: Users,         label: 'Person',     color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-100' },
} as const;

type ResultType = keyof typeof TYPE_CONFIG;

interface SearchResult {
    id: string;
    type: ResultType;
    title: string;
    subtitle?: string;
    meta?: string;
    path: string;
}

interface ResultRowProps {
    result: SearchResult;
    isActive: boolean;
    onClick: () => void;
    onHover: () => void;
}

function ResultRow({ result, isActive, onClick, onHover }: ResultRowProps) {
    const cfg = TYPE_CONFIG[result.type];
    const Icon = cfg.icon;
    return (
        <button
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 transition-all text-left group rounded-xl mx-1 w-[calc(100%-8px)]',
                isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
            )}
            onClick={onClick}
            onMouseEnter={onHover}
        >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border', cfg.bg, cfg.border)}>
                <Icon className={cn('w-4 h-4', cfg.color)} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 truncate">{result.title}</p>
                {result.subtitle && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{result.subtitle}</p>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {result.meta && (
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border', cfg.bg, cfg.color, cfg.border)}>
                        {result.meta}
                    </span>
                )}
                <ArrowRight className={cn('w-3.5 h-3.5 text-slate-300 opacity-0 -translate-x-1 transition-all', isActive && 'opacity-100 translate-x-0')} />
            </div>
        </button>
    );
}

interface SectionProps {
    label: string;
    results: SearchResult[];
    activeIdx: number;
    globalOffset: number;
    onSelect: (r: SearchResult) => void;
    onHover: (idx: number) => void;
}

function Section({ label, results, activeIdx, globalOffset, onSelect, onHover }: SectionProps) {
    if (results.length === 0) return null;
    return (
        <div>
            <p className="px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 select-none">
                {label}
            </p>
            {results.map((r, i) => (
                <ResultRow
                    key={r.id}
                    result={r}
                    isActive={activeIdx === globalOffset + i}
                    onClick={() => onSelect(r)}
                    onHover={() => onHover(globalOffset + i)}
                />
            ))}
        </div>
    );
}

// ─── Main modal ──────────────────────────────────────────────────────────────
export function GlobalSearchModal() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const [scannerOpen, setScannerOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Debounce query
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 250);
        return () => clearTimeout(t);
    }, [query]);

    // Reset active when results change
    useEffect(() => { setActiveIdx(0); }, [debouncedQuery]);

    const { data, isFetching } = useGlobalSearch(debouncedQuery);

    // Flatten results into an ordered list for keyboard nav
    const sections: { label: string; results: SearchResult[] }[] = [
        { label: 'Work Orders', results: data?.workOrders ?? [] },
        { label: 'Assets',      results: data?.assets ?? [] },
        { label: 'Parts',       results: data?.parts ?? [] },
        { label: 'Locations',   results: data?.locations ?? [] },
        { label: 'People',      results: data?.people ?? [] },
    ];
    const allResults = sections.flatMap(s => s.results);
    const hasResults = allResults.length > 0;
    const isEmpty = debouncedQuery.length >= 2 && !isFetching && !hasResults;

    // ⌘K / Ctrl+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
            setDebouncedQuery('');
            setActiveIdx(0);
        }
    }, [open]);

    const handleSelect = useCallback((result: SearchResult) => {
        navigate(result.path);
        setOpen(false);
    }, [navigate]);

    const handleScan = useCallback((text: string) => {
        if (text.includes('/assets/')) {
            const assetId = text.split('/assets/').pop();
            if (assetId) navigate(`/assets?id=${assetId}`);
        } else if (text.includes('/work-orders/')) {
            const woId = text.split('/work-orders/').pop();
            if (woId) navigate(`/work-orders?id=${woId}`);
        } else {
            setQuery(text);
        }
    }, [navigate]);

    // Keyboard nav inside modal
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, allResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && allResults[activeIdx]) {
            handleSelect(allResults[activeIdx]);
        }
    };

    // Compute offsets for each section
    let offset = 0;
    const sectionOffsets: number[] = [];
    sections.forEach(s => {
        sectionOffsets.push(offset);
        offset += s.results.length;
    });

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-3 w-72 xl:w-96 h-9 bg-white/5 border border-white/8 rounded-xl px-3.5 text-left transition-all hover:bg-white/8 hover:border-white/15 group"
            >
                <Search className="w-4 h-4 text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />
                <span className="text-[13px] text-muted-foreground/40 flex-1 group-hover:text-muted-foreground/60 transition-colors">
                    Search work orders, assets, parts…
                </span>
                <kbd className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-white/20 bg-white/5 rounded border border-white/10 shrink-0 font-mono">
                    <Command className="w-2.5 h-2.5" />K
                </kbd>
            </button>

            {/* Mobile trigger */}
            <button
                onClick={() => setOpen(true)}
                className="flex md:hidden w-9 h-9 items-center justify-center rounded-xl hover:bg-white/5 text-muted-foreground transition-all"
            >
                <Search className="w-4.5 h-4.5" />
            </button>

            {/* Modal */}
            {createPortal(
                <AnimatePresence>
                    {open && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                key="search-backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[9000]"
                                onClick={() => setOpen(false)}
                            />

                            {/* Panel */}
                            <motion.div
                                key="search-panel"
                                initial={{ opacity: 0, scale: 0.96, y: -16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -16 }}
                                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                className="fixed top-[12vh] left-1/2 -translate-x-1/2 w-full max-w-[640px] px-4 z-[9001]"
                                onKeyDown={handleKeyDown}
                            >
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_24px_60px_rgba(0,0,0,0.12)] overflow-hidden">
                                {/* Input row */}
                                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                                    {isFetching ? (
                                        <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                                    ) : (
                                        <Search className="w-5 h-5 text-slate-400 shrink-0" />
                                    )}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        placeholder="Search work orders, assets, parts, people…"
                                        className="flex-1 bg-transparent text-[15px] text-slate-800 placeholder:text-slate-400 outline-none"
                                    />
                                    <button
                                        onClick={() => setScannerOpen(true)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 transition-all"
                                        title="Scan QR Code"
                                    >
                                        <Maximize className="w-4.5 h-4.5" />
                                    </button>
                                    {query && (
                                        <button
                                            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                                            className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
                                        >
                                            <X className="w-3.5 h-3.5 text-slate-500" />
                                        </button>
                                    )}
                                    <kbd
                                        onClick={() => setOpen(false)}
                                        className="px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors font-mono"
                                    >
                                        ESC
                                    </kbd>
                                </div>

                                {/* Results */}
                                <div className="max-h-[480px] overflow-y-auto p-1">
                                    {/* Idle state */}
                                    {debouncedQuery.length < 2 && (
                                        <div className="px-4 py-8 text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                                                <Search className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p className="text-[13px] font-semibold text-slate-500">Start typing to search</p>
                                            <p className="text-[11px] text-slate-400 mt-1">Work Orders · Assets · Parts · Locations · People</p>
                                            <div className="flex items-center justify-center gap-3 mt-5">
                                                {(['work-order','asset','part','location','person'] as ResultType[]).map(type => {
                                                    const cfg = TYPE_CONFIG[type];
                                                    const Icon = cfg.icon;
                                                    return (
                                                        <div key={type} className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', cfg.bg, cfg.border)}>
                                                            <Icon className={cn('w-4 h-4', cfg.color)} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {isEmpty && (
                                        <div className="px-4 py-8 text-center">
                                            <p className="text-[13px] font-semibold text-slate-500">No results for</p>
                                            <p className="text-[15px] font-bold text-slate-700 mt-1">"{debouncedQuery}"</p>
                                            <p className="text-[11px] text-slate-400 mt-2">Try a different keyword or check spelling</p>
                                        </div>
                                    )}

                                    {/* Results sections */}
                                    {hasResults && sections.map((section, si) => (
                                        <Section
                                            key={section.label}
                                            label={section.label}
                                            results={section.results}
                                            activeIdx={activeIdx}
                                            globalOffset={sectionOffsets[si]}
                                            onSelect={handleSelect}
                                            onHover={setActiveIdx}
                                        />
                                    ))}
                                </div>

                                {/* Footer */}
                                {hasResults && (
                                    <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400 font-medium bg-slate-50/70">
                                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono shadow-sm">↑↓</kbd> navigate</span>
                                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono shadow-sm">↵</kbd> open</span>
                                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono shadow-sm">ESC</kbd> close</span>
                                        <span className="ml-auto">{allResults.length} result{allResults.length !== 1 ? 's' : ''}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
        )}

            <QRScannerModal
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={handleScan}
            />
        </>
    );
}
