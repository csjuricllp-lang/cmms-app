import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ALL_DASHBOARDS } from '../dashboards';

interface EditPinnedItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pinnedIds: string[];
    onSave: (ids: string[]) => void;
}

export const EditPinnedItemsModal = ({ 
    isOpen, 
    onClose, 
    pinnedIds, 
    onSave 
}: EditPinnedItemsModalProps) => {
    const [tempIds, setTempIds] = useState(pinnedIds);
    const [search, setSearch] = useState('');

    const toggleId = (id: string) => {
        if (tempIds.includes(id)) {
            setTempIds(tempIds.filter(tid => tid !== id));
        } else if (tempIds.length < 3) {
            setTempIds([...tempIds, id]);
        } else {
            toast.error('You can only pin up to 3 dashboards at a time.');
        }
    };

    const filteredDashboards = ALL_DASHBOARDS.filter(d => 
        d.label.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-card rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden"
            >
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-[20px] font-black text-slate-800 tracking-tight italic uppercase">Edit Pinned Items</h2>
                        <p className="text-[13px] text-muted-foreground font-medium">Choose up to three dashboard views to pin for quick access on your tab list.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-transparent rounded-lg transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border border-border rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-foreground/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Pinned Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-black text-slate-800 uppercase italic">Pinned</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{3 - tempIds.length} remaining</span>
                        </div>
                        <div className="space-y-2">
                            {ALL_DASHBOARDS.filter(d => tempIds.includes(d.id)).map(d => (
                                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/10">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={true} onChange={() => toggleId(d.id)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                        <span className="text-[14px] font-bold text-indigo-900">{d.label}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">{d.recommended ? 'Recommended' : d.category}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommended Section */}
                    {filteredDashboards.filter(d => d.recommended && !tempIds.includes(d.id)).length > 0 && (
                        <div className="space-y-4">
                            <span className="text-[13px] font-black text-slate-800 uppercase italic">Recommended Dashboards</span>
                            <div className="space-y-2">
                                {filteredDashboards.filter(d => d.recommended && !tempIds.includes(d.id)).map(d => (
                                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-transparent border border-transparent hover:border-slate-100 transition-all cursor-pointer group" onClick={() => toggleId(d.id)}>
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={false} onChange={() => {}} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                            <span className="text-[14px] font-bold text-slate-600 group-hover:text-foreground">{d.label}</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recommended</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other Dashboards Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-black text-slate-800 uppercase italic">Other Dashboards</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{filteredDashboards.filter(d => !d.recommended && !tempIds.includes(d.id)).length} available</span>
                        </div>
                        <div className="space-y-2">
                            {filteredDashboards.filter(d => !d.recommended && !tempIds.includes(d.id)).map(d => (
                                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-transparent border border-transparent hover:border-slate-100 transition-all cursor-pointer group" onClick={() => toggleId(d.id)}>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={false} onChange={() => {}} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                                        <span className="text-[14px] font-bold text-slate-600 group-hover:text-foreground">{d.label}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{d.category}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 bg-transparent border-t border-border flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-muted transition-all">Cancel</button>
                    <button 
                        onClick={() => { onSave(tempIds); onClose(); }} 
                        className="px-8 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-[13px] font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        Save pins
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
