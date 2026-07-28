import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { useUsers } from '../hooks/useData';
import { cn } from '../lib/utils';

interface AssignedToFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedIds: string[]) => void;
    initialSelectedIds?: string[];
}

export const AssignedToFilterModal: React.FC<AssignedToFilterModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialSelectedIds = []
}) => {
    const { data: users = [] } = useUsers();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

    if (!isOpen) return null;

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleId = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = () => {
        onSave(selectedIds);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[1px]">
            <div className="bg-white w-full max-w-[400px] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between">
                    <h3 className="text-[16px] font-bold text-slate-800">Assigned To</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 pb-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 bg-white border border-slate-200 rounded-lg pl-10 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* List container */}
                <div className="max-h-[300px] overflow-y-auto border-t border-slate-50">
                    <div className="py-2">
                        {/* Unassigned row */}
                        <div 
                            onClick={() => toggleId('unassigned')}
                            className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <div className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                selectedIds.includes('unassigned') ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                            )}>
                                {selectedIds.includes('unassigned') && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-[14px] font-medium text-slate-700">Unassigned</span>
                        </div>

                        {/* User rows */}
                        {filteredUsers.map(user => (
                            <div 
                                key={user.id}
                                onClick={() => toggleId(user.id)}
                                className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                    selectedIds.includes(user.id) ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                                )}>
                                    {selectedIds.includes(user.id) && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-500 shrink-0">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[14px] font-medium text-slate-700">{user.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <span className="text-[13px] font-medium text-slate-400">
                        {selectedIds.length} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onClose}
                            className="h-9 px-4 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-600 hover:bg-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-bold transition-all shadow-sm active:scale-95"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
