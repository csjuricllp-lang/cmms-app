import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';
import { useAssets } from '../hooks/useData';

interface AssetFilterModalProps {
    onClose: () => void;
    onSave: (selectedIds: string[]) => void;
    initialSelectedIds?: string[];
}

export const AssetFilterModal: React.FC<AssetFilterModalProps> = ({ 
    onClose, 
    onSave, 
    initialSelectedIds = [] 
}) => {
    const { data: assets = [], isLoading } = useAssets();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

    const filteredAssets = useMemo(() => {
        if (!searchQuery) return assets;
        return assets.filter(asset => 
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [assets, searchQuery]);

    const handleToggle = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Asset</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-900" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 pb-4 border-b border-gray-50">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#F3F4F6] border-none rounded-lg py-3 px-10 text-[15px] focus:ring-0 transition-all font-medium text-gray-900 placeholder-gray-500"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar min-h-[350px]">
                    {isLoading ? (
                        <div className="flex flex-col gap-4 p-6">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : filteredAssets.length > 0 ? (
                        filteredAssets.map(asset => {
                            const isSelected = selectedIds.includes(asset.id);
                            return (
                                <div 
                                    key={asset.id}
                                    className={`flex items-center gap-4 py-3.5 px-6 hover:bg-gray-50 cursor-pointer group transition-colors ${isSelected ? 'bg-[#F0F5FF]' : ''}`}
                                    onClick={() => handleToggle(asset.id)}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                        isSelected ? 'bg-[#3b82f6] border-[#3b82f6]' : 'border-gray-300 bg-white group-hover:border-blue-400'
                                    }`}>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-[15px] truncate ${isSelected ? 'font-bold text-gray-900' : 'text-gray-700 font-medium'}`}>
                                            {asset.name}
                                        </span>
                                        {asset.description && (
                                            <span className="text-[12px] text-gray-400 truncate">
                                                {asset.description}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center text-gray-400 italic text-sm">
                            No assets found
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 flex items-center justify-between border-t border-gray-100 bg-white">
                    <button 
                        onClick={() => setSelectedIds([])}
                        className="text-[17px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Clear
                    </button>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 text-[17px] font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-all border border-gray-300 min-w-[120px]"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onSave(selectedIds)}
                            className="bg-[#3b82f6] text-white px-10 py-3 rounded-xl text-[17px] font-semibold hover:bg-blue-700 transition-all active:scale-95 shadow-sm min-w-[120px]"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
