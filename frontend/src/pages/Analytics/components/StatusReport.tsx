import { Info } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, ComposedChart, CartesianGrid, XAxis, YAxis, Bar, Line } from 'recharts';
import { Widget } from './Widget';
import { CHART_COLORS } from '../dashboards';
import type { AnalyticsData } from '../types';

export const StatusReport = ({ data }: { data: AnalyticsData }) => {
    const { statusReport } = data || {};
    const { summary, workOrderStatus, workRemaining, totals } = statusReport || {
        summary: { total: 0, completed: 0, compliant: 0, avgCycleTimeDays: 0 },
        workOrderStatus: [],
        workRemaining: [],
        totals: { estimatedHours: 0, actualHours: 0 }
    };

    const summarySafe = summary || { total: 0, completed: 0, compliant: 0, avgCycleTimeDays: 0 };
    const totalsSafe = totals || { estimatedHours: 0, actualHours: 0 };
    const workOrderStatusSafe = workOrderStatus || [];
    const workRemainingSafe = workRemaining || [];

    return (
        <div className="space-y-12 pb-20">
            {/* KPIs */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-[18px] font-black text-slate-800 tracking-tight italic uppercase">By the numbers</h3>
                    <Info className="w-4 h-4 text-slate-300" />
                </div>
                <div className="grid grid-cols-5 gap-6">
                    {[
                        { label: 'Count', value: summarySafe.total ?? 0 },
                        { label: 'Complete Count', value: summarySafe.completed ?? 0 },
                        { label: 'Compliant Count', value: summarySafe.compliant ?? 0 },
                        { label: 'Deferred', value: data?.backlog?.deferred ?? 0, icon: '⏸' },
                        { label: 'Average Cycle Time (days)', value: summarySafe.avgCycleTimeDays ?? 0, icon: 'ø' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[48px] font-black text-slate-800 tracking-tighter flex items-center gap-2">
                                    {stat.icon && <span className="text-[32px] text-slate-300 font-normal">{stat.icon}</span>}
                                    {stat.value}
                                </span>
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.15em]">{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Widget title="Work Order Status" data={workOrderStatusSafe} className="h-[400px]">
                    <div className="h-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={workOrderStatusSafe} 
                                    innerRadius={90} 
                                    outerRadius={130} 
                                    paddingAngle={2} 
                                    dataKey="value"
                                >
                                    {workOrderStatusSafe.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                />
                                <Legend 
                                    layout="vertical" 
                                    align="right" 
                                    verticalAlign="middle"
                                    iconType="circle"
                                    formatter={(value: any, entry: any) => {
                                        const { payload } = entry;
                                        const total = summarySafe.total || 1;
                                        const percent = ((payload.value / total) * 100).toFixed(2);
                                        return <span className="text-[13px] font-bold text-slate-600">{value} {percent}%</span>;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Widget>

                <Widget title="Work Remaining" data={workRemainingSafe} className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={workRemainingSafe} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAFA" />
                            <XAxis dataKey="name" hide />
                            <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#F59E0B' }} label={{ value: 'Work Order Incomplete Count', angle: -90, position: 'insideLeft', style: { fill: '#F59E0B', fontSize: 10, fontWeight: 'bold' } }} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1' }} label={{ value: 'Estimated Hours', angle: 90, position: 'insideRight', style: { fill: '#6366F1', fontSize: 10, fontWeight: 'bold' } }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                            />
                            <Bar yAxisId="left" dataKey="count" fill="#EAB308" opacity={0.7} radius={[4, 4, 0, 0]} barSize={200} />
                            <Line yAxisId="right" type="monotone" dataKey="estimatedHours" stroke="#6366F1" strokeWidth={0} dot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Widget>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[64px] font-black text-slate-800 tracking-tighter leading-none">{Number(totalsSafe.estimatedHours ?? 0).toFixed(1)}</span>
                    <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-4">Estimated Hours</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[64px] font-black text-slate-800 tracking-tighter leading-none">{Number(totalsSafe.actualHours ?? 0).toFixed(1)}</span>
                    <span className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-4">Total Time Spent (hours)</span>
                </div>
            </div>
        </div>
    );
};
