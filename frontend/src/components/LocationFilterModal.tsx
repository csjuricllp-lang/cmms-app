import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { useLocations } from '../hooks/useData';
import type { Location } from '../types';
import { cn } from '../lib/utils';

interface LocationWithChildren extends Location {
    children?: LocationWithChildren[];
}

interface LocationFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedIds: string[], includeSublocations: boolean) => void;
    initialSelectedIds?: string[];
    initialIncludeSublocations?: boolean;
    className?: string;
    anchorRect?: DOMRect;
}

const buildTree = (list: Location[]): LocationWithChildren[] => {
    const map: Record<string, LocationWithChildren> = {};
    const roots: LocationWithChildren[] = [];

    list.forEach(item => {
        map[item.id] = { ...item, children: [] };
    });

    list.forEach(item => {
        if (item.parentId && map[item.parentId]) {
            map[item.parentId].children?.push(map[item.id]);
        } else {
            roots.push(map[item.id]);
        }
    });

    return roots;
};

const LocationItem = ({ 
    location, 
    level = 0, 
    selectedIds, 
    onToggle, 
    expandedIds, 
    onToggleExpand 
}: { 
    location: LocationWithChildren, 
    level?: number, 
    selectedIds: string[], 
    onToggle: (id: string, children: LocationWithChildren[]) => void,
    expandedIds: string[],
    onToggleExpand: (id: string) => void
}) => {
    const isSelected = selectedIds.includes(location.id);
    const hasChildren = (location.children && location.children.length > 0) || (location._count && location._count.children > 0);
    const isExpanded = expandedIds.includes(location.id);

    return (
        <div className="flex flex-col">
            <div 
                className={`flex items-center gap-3 py-2.5 px-4 hover:bg-slate-50 cursor-pointer group transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                style={{ paddingLeft: `${(level * 24) + 12}px` }}
                onClick={() => onToggle(location.id, location.children || [])}
            >
                <div 
                    className="flex items-center justify-center w-5 h-5 -ml-1 transition-colors hover:bg-slate-200 rounded"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) onToggleExpand(location.id);
                    }}
                >
                    {hasChildren && (
                        isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                </div>
                
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white group-hover:border-blue-400'
                }`}>
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>

                <span className={`text-[13px] ${isSelected ? 'font-bold text-slate-900' : 'text-slate-700 font-medium'}`}>
                    {location.name}
                </span>

                {location._count && location._count.children > 0 && (
                    <span className="ml-auto text-[11px] text-slate-400 font-medium">
                        {location._count.children}
                    </span>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div className="flex flex-col">
                    {location.children?.map(child => (
                        <LocationItem 
                            key={child.id} 
                            location={child} 
                            level={level + 1} 
                            selectedIds={selectedIds} 
                            onToggle={onToggle}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const LocationFilterModal: React.FC<LocationFilterModalProps> = ({ 
    isOpen,
    onClose, 
    onSave, 
    initialSelectedIds = [],
    initialIncludeSublocations = true,
    className,
    anchorRect
}) => {
    const { data: locations = [], isLoading } = useLocations();
    const [searchQuery, setSearchQuery] = useState('');
    const [includeSublocations, setIncludeSublocations] = useState(initialIncludeSublocations);
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    const locationTree = useMemo(() => buildTree(locations), [locations]);

    const filteredTree = useMemo(() => {
        if (!searchQuery) return locationTree;

        const filter = (nodes: LocationWithChildren[]): LocationWithChildren[] => {
            return nodes
                .map(node => {
                    const children = filter(node.children || []);
                    if (node.name.toLowerCase().includes(searchQuery.toLowerCase()) || children.length > 0) {
                        return { ...node, children } as LocationWithChildren;
                    }
                    return null;
                })
                .filter((node): node is LocationWithChildren => node !== null);
        };

        return filter(locationTree);
    }, [locationTree, searchQuery]);

    if (!isOpen || !anchorRect) return null;

    return (
        <>
            {/* Click away layer */}
            <div className="fixed inset-0 z-[240]" onClick={onClose} />
            
            <div 
                className={cn(
                    "fixed z-[250] bg-white w-[380px] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[60vh] border border-slate-200 animate-in fade-in zoom-in-95 duration-200",
                    className
                )}
                style={{ 
                    top: anchorRect.bottom + 8, 
                    left: Math.max(16, Math.min(anchorRect.left, window.innerWidth - 380 - 16))
                }}
            >
                {/* Search */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/30">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-9 pr-4 text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Toggle Section */}
                <div className="px-4 py-2 flex items-center justify-between border-b border-slate-50">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Include Sub-locations</span>
                    <button 
                        onClick={() => setIncludeSublocations(!includeSublocations)}
                        className={`w-9 h-4.5 rounded-full transition-colors relative flex items-center px-1 ${
                            includeSublocations ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full transition-all shadow-sm ${
                            includeSublocations ? 'translate-x-3.5' : 'translate-x-0'
                        }`} />
                    </button>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto py-1 custom-scrollbar min-h-[150px]">
                    {isLoading ? (
                        <div className="flex flex-col gap-2 p-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-6 bg-slate-50 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : filteredTree.length > 0 ? (
                        filteredTree.map(location => (
                            <LocationItem 
                                key={location.id} 
                                location={location} 
                                selectedIds={selectedIds} 
                                onToggle={(id) => {
                                    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                                }}
                                expandedIds={expandedIds}
                                onToggleExpand={(id) => {
                                    setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                                }}
                            />
                        ))
                    ) : (
                        <div className="py-8 text-center flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-slate-100" />
                            <p className="text-slate-400 text-[11px] font-medium italic">No matches found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">{selectedIds.length} Selected</span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                setSelectedIds([]);
                                onSave([], includeSublocations);
                                onClose();
                            }}
                            className="h-8 px-3 text-[11px] font-bold text-slate-600 hover:bg-white rounded-lg transition-all"
                        >
                            Reset
                        </button>
                        <button 
                            onClick={() => onSave(selectedIds, includeSublocations)}
                            className="bg-blue-600 text-white px-4 h-8 rounded-lg text-[11px] font-bold hover:bg-blue-700 transition-all shadow-sm"
                        >
                            Apply Selection
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
