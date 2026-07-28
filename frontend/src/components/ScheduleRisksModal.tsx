import React from 'react';
import { X, ChevronDown, Info } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { Link } from 'react-router-dom';
import { type WorkOrderSync } from '../lib/db';

interface ScheduleRisksModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrders: WorkOrderSync[];
    onRemoveFromSchedule: (id: string) => void;
    onRemoveAll: (ids: string[]) => void;
}

export const ScheduleRisksModal: React.FC<ScheduleRisksModalProps> = ({ 
    isOpen, 
    onClose, 
    workOrders, 
    onRemoveFromSchedule,
    onRemoveAll
}) => {
    if (!isOpen) return null;

    const overdueOrders = workOrders.filter(wo => {
        if (!wo.startDate || wo.status === 'COMPLETED' || wo.status === 'CLOSED') return false;
        return isBefore(parseISO(wo.startDate), new Date());
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-4xl bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-[24px] font-black text-slate-800 tracking-tight">Schedule Risks</h2>
                        <p className="text-[14px] font-bold text-slate-400 mt-1 uppercase tracking-widest">We've detected some issues with your schedule.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                <div className="flex items-center gap-3">
                                    <h3 className="text-[16px] font-black text-slate-700">Work Orders Overdue</h3>
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md text-[11px] font-black">{overdueOrders.length}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => onRemoveAll(overdueOrders.map(o => o.id))}
                                className="px-4 py-2 bg-blue-50 text-blue-600 text-[13px] font-black rounded-xl border border-blue-100 hover:bg-blue-100 transition-all active:scale-95"
                            >
                                Remove All
                            </button>
                        </div>
                        
                        <div className="px-6 pb-6 pt-2">
                             <p className="text-[14px] font-bold text-slate-400 mb-6 italic">These work orders were scheduled, but not completed.</p>
                             
                             <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Work Order</th>
                                            <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                                            <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Assigned To</th>
                                            <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                                            <th className="px-6 py-4 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                                                <div className="flex items-center gap-2">
                                                    Suggested Actions
                                                    <Info className="w-3.5 h-3.5" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {overdueOrders.map(wo => (
                                            <tr key={wo.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-5">
                                                    <Link to={`/work-orders?id=${wo.id}`} className="text-[13px] font-bold text-blue-600 hover:underline decoration-2 underline-offset-4">
                                                        {wo.title}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-5 text-[13px] font-bold text-slate-600">
                                                    {wo.startDate ? format(parseISO(wo.startDate), 'MMMM dd yyyy, h:mm a') : 'N/A'}
                                                </td>
                                                <td className="px-6 py-5 text-[13px] font-bold text-slate-500 capitalize">
                                                    {wo.assignee || wo.assignedTo || 'Unassigned'}
                                                </td>
                                                <td className="px-6 py-5 text-[13px] font-bold text-slate-500">
                                                    {wo.locationName || 'N/A'}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <button 
                                                        onClick={() => onRemoveFromSchedule(wo.id)}
                                                        className="px-4 py-2 bg-blue-50 text-blue-600 text-[12px] font-black rounded-lg border border-blue-100 hover:bg-blue-200 transition-all active:scale-95 whitespace-nowrap"
                                                    >
                                                        Remove from Schedule
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-200 text-slate-600 rounded-xl text-[14px] font-black hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
