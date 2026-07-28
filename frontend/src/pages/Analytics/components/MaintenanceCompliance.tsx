import { Info } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, CartesianGrid, XAxis, YAxis, Area } from 'recharts';
import { Widget } from './Widget';
import { CHART_COLORS } from '../dashboards';
import type { AnalyticsData } from '../types';

export const MaintenanceCompliance = ({ data }: { data: AnalyticsData }) => {
    const compliance = data?.complianceMetrics || {
        summary: { total: 0, compliant: 0, nonCompliant: 0, rate: "0.0" },
        byPriority: [],
        scheduleCompliance: 0,
        monthlyTrend: [],
        hoursToPlanning: { estimated: 0, actual: 0 }
    };

    const summarySafe = compliance.summary || { total: 0, compliant: 0, nonCompliant: 0, rate: "0.0" };
    const hoursToPlanningSafe = compliance.hoursToPlanning || { estimated: 0, actual: 0 };
    const byPrioritySafe = compliance.byPriority || [];
    const monthlyTrendSafe = compliance.monthlyTrend || [];

    return (
        <div className="space-y-10 pb-20 font-inter">
            {/* Header & Filters */}
            <div className="space-y-8">
                <h2 className="text-[42px] font-medium text-slate-900 tracking-tight">Maintenance Compliance</h2>
            </div>

            <div className="h-px bg-slate-100" />
            <p className="text-center text-[12px] font-medium text-slate-500 italic">What does our compliance look like for completed work orders?</p>

            {/* Big Stats */}
            <div className="grid grid-cols-3 gap-6">
                {[
                    { label: 'Count', value: summarySafe.total ?? 0 },
                    { label: 'Compliant Count', value: summarySafe.compliant ?? 0, info: true },
                    { label: 'Non-Compliant Count', value: summarySafe.nonCompliant ?? 0 },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-50 group-hover:bg-indigo-500 transition-colors" />
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</span>
                            {stat.info && <Info className="w-3 h-3 text-slate-300" />}
                        </div>
                        <span className="text-[72px] font-black text-slate-800 tracking-tighter leading-none">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                    <Widget title="By Priority" className="h-[400px]" data={byPrioritySafe}>
                        <div className="h-full flex items-center justify-center relative">
                            {byPrioritySafe.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={byPrioritySafe} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                                            {byPrioritySafe.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-slate-300">
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center"><Info className="w-6 h-6" /></div>
                                    <span className="text-[12px] font-bold uppercase tracking-widest">No results</span>
                                </div>
                            )}
                        </div>
                    </Widget>
                    <Widget title="Monthly Compliance" className="h-[300px]" data={monthlyTrendSafe}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyTrendSafe}>
                                <defs>
                                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="rate" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Widget>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <Widget title="Compliance Rate" className="h-[250px]">
                        <div className="h-full flex items-center justify-center relative">
                            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-[12px] border-indigo-100 shadow-inner">
                                <span className="text-[28px] font-black text-indigo-600">{summarySafe.rate ?? "0.0"}%</span>
                                <svg className="absolute -inset-[12px] w-[152px] h-[152px] -rotate-90">
                                    <circle cx="76" cy="76" r="68" fill="none" stroke="#6366F1" strokeWidth="12" strokeDasharray={`${parseFloat(summarySafe.rate || "0") * 4.27} 427`} strokeLinecap="round" className="transition-all duration-1000" />
                                </svg>
                            </div>
                        </div>
                    </Widget>

                    <Widget title="Schedule Compliance" subtitle="Please add threshold work order show filters to ensure accuracy" className="h-[250px]">
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-48 h-24 overflow-hidden relative">
                                <div className="w-48 h-48 rounded-full border-[16px] border-slate-100 absolute top-0" />
                                <div className="w-48 h-48 rounded-full border-[16px] border-indigo-500 absolute top-0 rotate-[180deg] origin-center" style={{ clipPath: 'polygon(50% 50%, -50% 100%, 0 100%)' }} />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-400 rounded-full border-2 border-white shadow-sm" />
                            </div>
                            <span className="text-[20px] font-black text-slate-800 mt-2">0%</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">Schedule Compliance</span>
                        </div>
                    </Widget>

                    <Widget title="Actual Hours to Planning" className="h-[200px]">
                        <div className="h-full grid grid-cols-2">
                            <div className="flex flex-col items-center justify-center border-r border-slate-100">
                                <span className="text-[32px] font-black text-slate-800 tracking-tighter">{Number(hoursToPlanningSafe.estimated ?? 0).toFixed(1)}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estimated Hours</span>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-[32px] font-black text-slate-800 tracking-tighter">{Number(hoursToPlanningSafe.actual ?? 0).toFixed(1)}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">Total Time Spent (hours)</span>
                            </div>
                        </div>
                    </Widget>
                </div>
            </div>
        </div>
    );
};
