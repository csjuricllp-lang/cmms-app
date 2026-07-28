import { 
    Info,
    ChevronDown
} from 'lucide-react';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    ComposedChart,
    Bar,
    Line
} from 'recharts';
import type { AnalyticsData } from '../types';

export const WOAging = ({ data }: { data: AnalyticsData }) => {
    const woAgingData = data?.woAging || {
        count: 0,
        avgAge: 0,
        assignedWorkers: [],
        assets: []
    };

    const avgAgeVal = Number(woAgingData?.avgAge ?? 0);
    const assignedWorkers = woAgingData?.assignedWorkers || [];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="text-center py-6">
                <h3 className="text-[14px] font-bold text-slate-500 italic">How are our incomplete work orders aging?</h3>
            </div>

            {/* Top Grid: Count & Assigned Worker */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Incomplete Work Orders Summary */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-center gap-3">
                        <h4 className="text-[16px] font-black text-slate-800 uppercase italic tracking-tight">Incomplete Work Orders</h4>
                        <Info className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="flex gap-20 text-center">
                            <div className="flex flex-col gap-2">
                                <span className="text-[64px] font-black text-slate-800 leading-none">{woAgingData.count ?? 0}</span>
                                <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Count</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[64px] font-black text-slate-800 leading-none">{avgAgeVal.toFixed(1)}</span>
                                <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">Average Work Order Age</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assigned Worker Table */}
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                        <h4 className="text-[16px] font-black text-slate-800 uppercase italic tracking-tight">Assigned Worker</h4>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Assigned To</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Incomplete Work Orders</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Average Work Order Age</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignedWorkers.map((worker: any, i: number) => (
                                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6 text-[13px] font-bold text-slate-600">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                    {i + 1}
                                                </div>
                                                {worker.name || 'Unassigned'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 bg-indigo-50 rounded-full overflow-hidden min-w-[120px]">
                                                    <div className="h-full bg-indigo-100 rounded-full" style={{ width: '80%' }} />
                                                </div>
                                                <span className="text-[13px] font-black text-slate-800">{worker.count ?? 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 bg-rose-50 rounded-full overflow-hidden min-w-[120px]">
                                                    <div className="h-full bg-rose-100 rounded-full" style={{ width: '90%' }} />
                                                </div>
                                                <span className="text-[13px] font-black text-slate-800">{Number(worker.avgAge ?? 0).toFixed(1)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Bottom Chart: Assets */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-center gap-3">
                    <h4 className="text-[16px] font-black text-slate-800 uppercase italic tracking-tight">Assets</h4>
                    <Info className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex-1 p-12 pt-8">
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={woAgingData.assets}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                                />
                                <YAxis 
                                    yAxisId="left"
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                                />
                                <YAxis 
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                                />
                                <Bar 
                                    yAxisId="left"
                                    dataKey="count" 
                                    fill="#73B4D9" 
                                    barSize={200}
                                    name="Incomplete Work Orders"
                                />
                                <Line 
                                    yAxisId="right"
                                    type="monotone" 
                                    dataKey="avgAge" 
                                    stroke="#9D178C" 
                                    strokeWidth={3}
                                    dot={{ fill: '#9D178C', strokeWidth: 2, r: 4 }}
                                    name="Average Age"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-8 mt-8">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#73B4D9]" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Incomplete Work Orders</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#9D178C]" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Average Age</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
