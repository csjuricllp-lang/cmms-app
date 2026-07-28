import { cn } from '../../../lib/utils';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, BarChart, Bar } from 'recharts';
import type { AnalyticsData } from '../types';

export const CostMaintenance = ({ data }: { data: AnalyticsData }) => {
    const { costMaintenance } = data || {};
    const { stats, weeklyTrend, breakouts } = costMaintenance || {
        stats: { labor: 0, parts: 0, other: 0, total: 0 },
        weeklyTrend: [],
        breakouts: { asset: [], category: [], location: [] },
        avgCosts: { reactive: 0, preventive: 0, all: 0 }
    };

    return (
        <div className="space-y-10">
            <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-widest pl-1">Cost Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        {[
                            { label: 'Labor', value: stats.labor, color: 'text-emerald-500' },
                            { label: 'Parts', value: stats.parts, color: 'text-indigo-500' },
                            { label: 'Other', value: stats.other, color: 'text-amber-500' },
                            { label: 'Total', value: stats.total, color: 'text-slate-800' }
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-sm">
                                <span className={cn("text-[28px] font-black tracking-tight", item.color)}>${item.value.toLocaleString()}</span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Weekly Trend</span>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weeklyTrend}>
                                    <defs>
                                        <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366F1" stopOpacity={0}/></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip /><Area type="monotone" dataKey="cost" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#costGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-widest pl-1">Cost Breakouts</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {['Asset', 'Work Order Category', 'Location'].map((title, i) => {
                        const key = title.toLowerCase().includes('asset') ? 'asset' : title.toLowerCase().includes('category') ? 'category' : 'location';
                        const chartData = (breakouts as any)[key] || [];
                        return (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[350px] flex flex-col">
                                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-6">{title}</span>
                                <div className="flex-1 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical">
                                            <XAxis type="number" hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} width={80} /><Tooltip /><Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
