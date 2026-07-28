import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, X, Edit2, Trash2 } from 'lucide-react';
import { useTags } from '../hooks/useData';
import { toast } from 'react-hot-toast';

export const TagSettingsWorkspace: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [editingTag, setEditingTag] = React.useState<any>(null);
    const [tagName, setTagName] = React.useState('');
    const [selectedModel, setSelectedModel] = React.useState('WORK_ORDER');
    const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

    const { data: tags, createTag, updateTag, deleteTag } = useTags();

    const handleConfirm = () => {
        if (!tagName.trim()) return;
        if (editingTag) {
            updateTag.mutate({ id: editingTag.id, name: tagName, model: selectedModel }, {
                onSuccess: () => {
                    setEditingTag(null);
                    setTagName('');
                    toast.success('Tag updated');
                }
            });
        } else {
            createTag.mutate({ name: tagName, model: selectedModel }, {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    setTagName('');
                    toast.success('Tag created');
                }
            });
        }
    };

    const models = [
        { id: 'WORK_ORDER', label: 'Work Order' },
        { id: 'ASSET', label: 'Asset' },
        { id: 'PART', label: 'Part & Inventory' },
        { id: 'PURCHASE_ORDER', label: 'Purchase Order' },
        { id: 'METER', label: 'Meter' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Tabs */}
            <div className="border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                    <button className="pb-4 px-2 text-[14px] font-bold text-slate-800 relative">
                        Tags
                        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-600 rounded-t-full" />
                    </button>
                </div>
                <div className="pb-4">
                    <button 
                        onClick={() => {
                            setEditingTag(null);
                            setTagName('');
                            setSelectedModel('WORK_ORDER');
                            setIsAddModalOpen(true);
                        }}
                        className="px-6 py-2.5 bg-[#4F7CFF] text-white text-[13px] font-bold rounded-lg hover:bg-blue-600 transition-all shadow-md shadow-blue-500/10"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-gray-100">
                            <th className="px-10 py-5 text-[14px] font-bold text-slate-800">Name</th>
                            <th className="px-10 py-5 text-[14px] font-bold text-slate-800 text-center">Date Created</th>
                            <th className="px-10 py-5 text-[14px] font-bold text-slate-800 w-[100px]"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tags && tags.length > 0 ? (
                            tags.map((tag: any) => (
                                <tr key={tag.id} className="border-b border-gray-50 last:border-b-0 hover:bg-slate-50/30 transition-all group">
                                    <td className="px-10 py-6">
                                        <div className="space-y-1">
                                            <div className="text-[15px] font-medium text-slate-600 italic">{tag.name}</div>
                                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                {models.find(m => m.id === tag.model)?.label || tag.model}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-[15px] font-medium text-slate-400 text-center">
                                        {new Date(tag.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                                    </td>
                                    <td className="px-10 py-6 text-right relative">
                                        <button 
                                            onClick={() => setActiveMenu(activeMenu === tag.id ? null : tag.id)}
                                            className="p-2 hover:bg-white rounded-lg transition-all"
                                        >
                                            <MoreHorizontal className="w-6 h-6 text-slate-400" />
                                        </button>
                                        
                                        <AnimatePresence>
                                            {activeMenu === tag.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        className="absolute right-10 top-14 w-40 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 overflow-hidden"
                                                    >
                                                        <button 
                                                            onClick={() => {
                                                                setEditingTag(tag);
                                                                setTagName(tag.name);
                                                                setSelectedModel(tag.model);
                                                                setIsAddModalOpen(true);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full px-5 py-4 text-left text-[14px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-all border-b border-slate-50"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteTag.mutate(tag.id, {
                                                                onSuccess: () => {
                                                                    toast.success('Tag deleted');
                                                                    setActiveMenu(null);
                                                                }
                                                            })}
                                                            className="w-full px-5 py-4 text-left text-[14px] font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-10 py-24 text-center">
                                    <div className="space-y-2">
                                        <div className="text-[17px] font-bold text-slate-800">No Tags Found</div>
                                        <div className="text-[14px] text-slate-400 font-medium italic">Create your first tag to start classifying your assets and work orders.</div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[20px] font-bold text-slate-800">{editingTag ? 'Edit Tag' : 'Add Tag'}</h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg">
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <input 
                                            autoFocus
                                            type="text"
                                            placeholder="Enter tag name"
                                            value={tagName}
                                            onChange={(e) => setTagName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                            className="w-full px-4 py-3.5 bg-white border border-blue-400 rounded-lg text-[15px] font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Models</label>
                                        <select 
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-600 outline-none focus:border-blue-400 transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[right_15px_center] bg-no-repeat shadow-sm"
                                        >
                                            {models.map(m => (
                                                <option key={m.id} value={m.id}>{m.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <button 
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-6 py-2.5 border border-slate-200 text-slate-600 text-[14px] font-bold rounded-lg hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleConfirm}
                                        disabled={!tagName.trim() || createTag.isPending}
                                        className="px-8 py-2.5 bg-slate-100 text-slate-400 text-[14px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 shadow-lg shadow-blue-500/10"
                                    >
                                        {createTag.isPending ? 'Saving...' : 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
