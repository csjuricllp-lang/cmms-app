import React, { useState, useMemo } from 'react';
import { X, Search, ChevronRight, ChevronDown, Box } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Asset } from '../types';

interface AssetSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (asset: Asset) => void;
    assets: Asset[];
    selectedAssetId?: string | null;
}

interface AssetWithChildren extends Asset {
    children?: AssetWithChildren[];
}

const buildAssetTree = (list: Asset[]): AssetWithChildren[] => {
    const map: Record<string, AssetWithChildren> = {};
    const roots: AssetWithChildren[] = [];

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

const AssetItem = ({ 
    asset, 
    level = 0, 
    selectedId, 
    onSelect, 
    expandedIds, 
    onToggleExpand 
}: { 
    asset: AssetWithChildren, 
    level?: number, 
    selectedId?: string | null, 
    onSelect: (asset: Asset) => void,
    expandedIds: string[],
    onToggleExpand: (id: string) => void
}) => {
    const isSelected = selectedId === asset.id;
    const hasChildren = asset.children && asset.children.length > 0;
    const isExpanded = expandedIds.includes(asset.id);

    return (
        <React.Fragment>
            <tr 
                onClick={() => onSelect(asset)}
                className={cn(
                    "group transition-all cursor-pointer border-b border-slate-100",
                    isSelected ? "bg-white" : "hover:bg-white"
                )}
            >
                <td className="px-6 py-5 border-r border-slate-100 sticky left-0 bg-white z-10 w-[300px] min-w-[300px]">
                    <div className="flex items-center gap-3" style={{ paddingLeft: `${level * 24}px` }}>
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (hasChildren) onToggleExpand(asset.id);
                            }}
                            className={cn(
                                "w-6 h-6 flex items-center justify-center rounded transition-colors",
                                hasChildren ? "hover:bg-slate-100 cursor-pointer" : "opacity-0"
                            )}
                        >
                            {hasChildren && (
                                isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                        </div>
                        <span className={cn("text-[14px] font-bold truncate", isSelected ? "text-blue-600" : "text-slate-700")}>
                            {asset.name}
                        </span>
                    </div>
                </td>
                <td className="px-8 py-5 min-w-[150px]">
                    <span className="text-[14px] font-medium text-slate-400 font-mono tracking-tighter tabular-nums">{asset.id}</span>
                </td>
                <td className="px-8 py-5 min-w-[180px]">
                    <span className="text-[14px] font-medium text-slate-600">{asset.location?.name || "-"}</span>
                </td>
                <td className="px-8 py-5 min-w-[180px]">
                    <span className="text-[14px] font-medium text-slate-600 tabular-nums">{asset.barCode || "-"}</span>
                </td>
                <td className="px-8 py-5 min-w-[250px]">
                    <span className="text-[14px] font-medium text-slate-500 line-clamp-1">{asset.description || "-"}</span>
                </td>
                <td className="px-8 py-5 min-w-[120px]">
                    <span className="text-[14px] font-medium text-slate-600">{asset.status || "-"}</span>
                </td>
            </tr>
            {hasChildren && isExpanded && asset.children?.map(child => (
                <AssetItem 
                    key={child.id} 
                    asset={child} 
                    level={level + 1} 
                    selectedId={selectedId} 
                    onSelect={onSelect}
                    expandedIds={expandedIds}
                    onToggleExpand={onToggleExpand}
                />
            ))}
        </React.Fragment>
    );
};

export const AssetSelectionModal: React.FC<AssetSelectionModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    assets = [],
    selectedAssetId 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSelectedAsset, setTempSelectedAsset] = useState<Asset | null>(
        Array.isArray(assets) ? (assets.find(a => a.id === selectedAssetId) || null) : null
    );
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    const assetTree = useMemo(() => buildAssetTree(Array.isArray(assets) ? assets : []), [assets]);

    const filteredTree = useMemo(() => {
        if (!searchQuery) return assetTree;

        const filter = (nodes: AssetWithChildren[]): AssetWithChildren[] => {
            return nodes
                .map(node => {
                    const children = filter(node.children || []);
                    const matchesName = node.name.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesBarcode = node.barCode?.toLowerCase().includes(searchQuery.toLowerCase());
                    
                    if (matchesName || matchesBarcode || children.length > 0) {
                        return { ...node, children } as AssetWithChildren;
                    }
                    return null;
                })
                .filter((node): node is AssetWithChildren => node !== null);
        };

        return filter(assetTree);
    }, [assetTree, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-slate-900/40 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[1100px] rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200">
                {/* Header */}
                <div className="px-10 py-8 flex items-center justify-between border-b border-slate-100">
                    <h2 className="text-[24px] font-black text-slate-800 tracking-tight">Choose Assets</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors group">
                        <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-10 py-6">
                    <div className="relative max-w-[280px] group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Name or Barcode"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 bg-white border border-blue-400 rounded-lg pl-10 pr-4 text-[14px] font-medium outline-none shadow-[0_0_0_1px_rgba(59,130,246,0.1)] transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead className="sticky top-0 bg-white z-20 border-b border-slate-100">
                            <tr>
                                <th className="px-10 py-5 text-[14px] font-bold text-slate-700 border-r border-slate-100 sticky left-0 bg-white z-30 w-[300px] min-w-[300px]">Name</th>
                                <th className="px-8 py-5 text-[14px] font-bold text-slate-700">ID</th>
                                <th className="px-8 py-5 text-[14px] font-bold text-slate-700">Location</th>
                                <th className="px-8 py-5 text-[14px] font-bold text-slate-700">Barcode</th>
                                <th className="px-8 py-5 text-[14px] font-bold text-slate-700">Description</th>
                                <th className="px-8 py-5 text-[14px] font-bold text-slate-700">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTree.map(asset => (
                                <AssetItem 
                                    key={asset.id} 
                                    asset={asset} 
                                    selectedId={tempSelectedAsset?.id} 
                                    onSelect={setTempSelectedAsset}
                                    expandedIds={expandedIds}
                                    onToggleExpand={(id) => setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                                />
                            ))}
                        </tbody>
                    </table>
                    {filteredTree.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                <Box className="w-8 h-8 text-slate-100" />
                            </div>
                            <p className="text-slate-400 font-bold italic uppercase tracking-widest text-[13px]">No matching assets found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-[14px] font-medium text-slate-400">
                            {tempSelectedAsset ? `1 Asset selected` : "No asset selected"}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="h-11 px-8 text-[14px] font-medium text-slate-600 hover:bg-slate-50 transition-all border border-slate-300 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={!tempSelectedAsset}
                            onClick={() => tempSelectedAsset && onConfirm(tempSelectedAsset)}
                            className="bg-[#3B82F6] text-white px-8 h-11 rounded-lg text-[14px] font-bold hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
