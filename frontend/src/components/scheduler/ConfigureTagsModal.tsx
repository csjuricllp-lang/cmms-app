import { useState, useEffect } from 'react';
import { X, GripVertical } from 'lucide-react';

import { motion, AnimatePresence, Reorder } from 'framer-motion';

export interface TagConfig {
    id: string;
    label: string;
    visible: boolean;
}

interface ConfigureTagsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tagConfig: TagConfig[];
    onSave: (newConfig: TagConfig[]) => void;
}

export const ConfigureTagsModal = ({ isOpen, onClose, tagConfig, onSave }: ConfigureTagsModalProps) => {
    const [localConfig, setLocalConfig] = useState<TagConfig[]>(tagConfig);

    useEffect(() => {
        if (isOpen) {
            setLocalConfig(tagConfig);
        }
    }, [isOpen, tagConfig]);

    if (!isOpen) return null;

    const handleToggle = (id: string) => {
        setLocalConfig(prev => prev.map(t => t.id === id ? { ...t, visible: !t.visible } : t));
    };

    const handleSelectAll = () => {
        setLocalConfig(prev => prev.map(t => ({ ...t, visible: true })));
    };

    const handleRestoreDefaults = () => {
        setLocalConfig([
            { id: 'status', label: 'Status', visible: true },
            { id: 'asset', label: 'Asset', visible: true },
            { id: 'location', label: 'Location', visible: true },
            { id: 'category', label: 'Category', visible: true },
        ]);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-[210] pointer-events-none p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto flex flex-col"
                        >
                            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
                                <h2 className="text-[16px] font-black text-slate-800">Configure Tags</h2>
                                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-[14px] font-bold text-slate-800 mb-1">Select Detail Tags to Display</h3>
                                    <p className="text-[13px] text-slate-500 font-medium">
                                        Select and reorder the work order details to show on each card. Your selections help prioritize scheduling.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleSelectAll}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Select All
                                    </button>
                                    <button 
                                        onClick={handleRestoreDefaults}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Restore Defaults
                                    </button>
                                </div>

                                <Reorder.Group axis="y" values={localConfig} onReorder={setLocalConfig} className="bg-slate-50 border border-slate-100 rounded-xl p-2 space-y-1">
                                    {localConfig.map((tag) => (
                                        <Reorder.Item key={tag.id} value={tag} className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing">
                                            <button className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-4 h-4" />
                                            </button>
                                            <input 
                                                type="checkbox" 
                                                id={`tag-${tag.id}`}
                                                checked={tag.visible}
                                                onChange={() => handleToggle(tag.id)}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                                            />
                                            <label htmlFor={`tag-${tag.id}`} className="text-[13px] font-bold text-slate-700 cursor-pointer flex-1 select-none">
                                                {tag.label}
                                            </label>
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                            </div>

                            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                                <button 
                                    onClick={onClose}
                                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-black rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => onSave(localConfig)}
                                    className="px-6 py-2.5 bg-blue-600 text-white text-[13px] font-black rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                                >
                                    Apply
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
