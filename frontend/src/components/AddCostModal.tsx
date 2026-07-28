import React, { useState } from 'react';
import { X, User as UserIcon, ChevronDown } from 'lucide-react';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useUsers } from '../hooks/useData';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface AddCostModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrderId: string;
    defaultUserId?: string;
}

const AddCostModal: React.FC<AddCostModalProps> = ({ isOpen, onClose, workOrderId, defaultUserId }) => {
    const { addExpense } = useWorkOrders();
    const { data: usersData } = useUsers();
    
    const users = (Array.isArray(usersData) ? usersData : (usersData as any)?.items || []) as any[];
    
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [cost, setCost] = useState(0);
    const [userId, setUserId] = useState(defaultUserId || '');
    const getLocalDateISOString = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
    };
    const [date, setDate] = useState(getLocalDateISOString());

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!description.trim()) {
            toast.error('Description is required');
            return;
        }
        if (cost <= 0) {
            toast.error('Cost must be greater than zero');
            return;
        }

        try {
            await addExpense.mutateAsync({
                workOrderId,
                data: {
                    description,
                    category,
                    cost: Number(cost),
                    userId: userId || undefined,
                    date: new Date(date).toISOString()
                }
            });
            onClose();
            setDescription('');
            setCost(0);
        } catch (error) {
            toast.error('Failed to log cost');
        }
    };

    const selectedWorker = users.find(u => (u.userOrgId || u.id) === userId);

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-[580px] bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[24px] font-[900] text-slate-800 tracking-tight">Add Cost</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-10">
                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-slate-700">Description <span className="text-rose-500">*</span></label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] resize-none"
                            placeholder=""
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-[14px] font-bold text-slate-700">Category <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    <option value="">Select Category</option>
                                    <option value="EQUIPMENT">Equipment Rental</option>
                                    <option value="TRAVEL">Travel / Flight</option>
                                    <option value="LODGING">Lodging / Hotel</option>
                                    <option value="PER_DIEM">Per Diem / Meals</option>
                                    <option value="MATERIALS">External Materials</option>
                                    <option value="SHIPPING">Shipping / Freight</option>
                                    <option value="SERVICE">External Service</option>
                                    <option value="MISC">Miscellaneous</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Cost */}
                        <div className="space-y-2">
                            <label className="text-[14px] font-bold text-slate-700">Cost <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">$</span>
                                <input 
                                    type="number"
                                    value={cost}
                                    onChange={(e) => setCost(Number(e.target.value))}
                                    className="w-full pl-8 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Assigned To */}
                        <div className="space-y-2">
                            <label className="text-[14px] font-bold text-slate-700">Assigned To <span className="text-rose-500">*</span></label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                    <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-black text-white uppercase">
                                        {selectedWorker?.name?.charAt(0) || <UserIcon className="w-3 h-3" />}
                                    </div>
                                </div>
                                <select 
                                    className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                >
                                    <option value="">Select Personnel</option>
                                    {users.map(u => (
                                        <option key={u.userOrgId || u.id} value={u.userOrgId || u.id}>{u.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-[14px] font-bold text-slate-700">Date <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="datetime-local"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-slate-300">
                                    <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-4 pt-6">
                        <button 
                            onClick={onClose}
                            className="px-8 py-2.5 border border-gray-200 text-slate-600 rounded-xl text-[15px] font-black hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={addExpense.isPending || !description || !category || cost <= 0 || !userId}
                            className={cn(
                                "px-10 py-3 rounded-xl text-[15px] font-black transition-all active:scale-95 disabled:opacity-50",
                                description && category && cost > 0 && userId
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
                                    : "bg-slate-100 text-slate-400"
                            )}
                        >
                            {addExpense.isPending ? 'Logging...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCostModal;
