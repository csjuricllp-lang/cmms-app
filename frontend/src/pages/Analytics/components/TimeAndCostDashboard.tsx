import { Info } from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from 'recharts';
import { Widget } from './Widget';
import type { AnalyticsData } from '../types';

export const TimeAndCostDashboard = ({ data }: { data: AnalyticsData }) => {
    const { timeAndCost } = data || {};
    const { summary, workerTime, costTrends } = timeAndCost || {
        summary: { hoursWorked: 0, partCost: 0, laborCost: 0, additionalCost: 0, totalCost: 0 },
        workerTime: [],
        costTrends: [],
        hoursPerAsset: []
    };

    const summarySafe = summary || { hoursWorked: 0, partCost: 0, laborCost: 0, additionalCost: 0, totalCost: 0 };
    const workerTimeSafe = workerTime || [];
    const costTrendsSafe = costTrends || [];

    return (
        <div className="space-y-12 pb-20 font-inter">

            <p className="text-center text-[13px] font-medium text-slate-500 italic py-4">How are we spending our time and money?</p>

            <div className="bg-[#FEFCE8] border border-amber-100 p-4 rounded-xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <p className="text-[11px] font-bold text-amber-900 leading-relaxed">
                    <span className="font-black">Aug 31, 2023 Update:</span> The "Worker Time" tile has been updated to reflect the total time logged by each worker, replacing the previous tile which grouped all labor under the primary assignee.
                </p>
            </div>

            {/* KPI Row */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-5 divide-x divide-slate-100">
                    {[
                        { label: 'Hours Worked', value: Number(summarySafe.hoursWorked ?? 0).toFixed(2), prefix: '' },
                        { label: 'Part Cost', value: Number(summarySafe.partCost ?? 0).toFixed(2), prefix: '$' },
                        { label: 'Labor Cost', value: Number(summarySafe.laborCost ?? 0).toFixed(2), prefix: '$' },
                        { label: 'Additional Cost', value: Number(summarySafe.additionalCost ?? 0).toFixed(2), prefix: '$' },
                        { label: 'Total Cost', value: Number(summarySafe.totalCost ?? 0).toFixed(2), prefix: '$' },
                    ].map((stat, i) => (
                        <div key={i} className="p-8 flex flex-col items-center justify-center text-center group hover:bg-slate-50 transition-colors">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{stat.label}</span>
                            <span className="text-[32px] font-black text-slate-800 tracking-tighter">
                                {stat.prefix}{stat.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Worker Time Table */}
                <Widget title="Worker Time" className="h-[500px]" data={workerTimeSafe}>
                    <div className="overflow-auto h-full">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr className="border-b border-slate-100">
                                    {['Worker Full Name', 'Work Orders', 'Total Time Logged (Hrs)', 'Total Labor Cost'].map((h, i) => (
                                        <th key={i} className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {workerTimeSafe.length > 0 ? (
                                    workerTimeSafe.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-4 text-[13px] font-bold text-slate-700">{row.name}</td>
                                            <td className="px-4 py-4 text-[13px] text-slate-500">{row.workOrders}</td>
                                            <td className="px-4 py-4 text-[13px] font-bold text-slate-800">{row.time}</td>
                                            <td className="px-4 py-4 text-[13px] font-black text-emerald-600">${row.cost}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                                <Info className="w-8 h-8 opacity-20" />
                                                <span className="text-[12px] font-bold uppercase tracking-widest">No results</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Widget>

                {/* Cost Trends Chart */}
                <Widget title="Cost Trends" className="h-[500px]" data={costTrendsSafe}>
                    <div className="h-full flex flex-col">
                        <div className="flex-1 w-full mt-4">
                            {costTrendsSafe.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={costTrendsSafe}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                        <Area type="monotone" dataKey="parts" stackId="1" stroke="#6366F1" fill="#6366F1" fillOpacity={0.6} />
                                        <Area type="monotone" dataKey="additional" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                                        <Area type="monotone" dataKey="labor" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center gap-6">
                                    <div className="w-px h-[200px] bg-slate-100 relative">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-200" />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No completed data found</span>
                                        <div className="flex items-center gap-6 mt-4">
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-200" /><span className="text-[10px] font-bold text-slate-400">Parts Cost</span></div>
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-200" /><span className="text-[10px] font-bold text-slate-400">Additional Cost</span></div>
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-200" /><span className="text-[10px] font-bold text-slate-400">Labor Cost</span></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Widget>
            </div>

            <Widget title="Hours per Asset">
                <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
                    <Info className="w-8 h-8 text-slate-200" />
                    <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest italic">No results</p>
                </div>
            </Widget>
        </div>
    );
};
