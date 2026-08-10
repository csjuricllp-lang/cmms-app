import { motion } from 'framer-motion';
import { CircleCheck, RefreshCcw, MapPin } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell } from 'recharts';
import { Widget, StatBox } from './Widget';
import type { AnalyticsData } from '../types';

export const TeamPerformance = ({ data }: { data: AnalyticsData }) => {
    const { teamPerformance } = data || {};
    const { monthlyTrend, topTechnicians, topLocations, typeMix } = teamPerformance || {
        monthlyTrend: [],
        topTechnicians: [],
        topLocations: [],
        typeMix: [],
        backlog: { priority: { HIGH: 0, MEDIUM: 0, LOW: 0 }, type: { PREVENTIVE: 0, REACTIVE: 0 }, total: 0 }
    };

    const displayTechnicians = topTechnicians.length > 0 ? topTechnicians : [{ name: 'No completions yet', count: 0, avatar: '?' }];
    const displayLocations = topLocations.length > 0 ? topLocations : [{ name: 'No data', count: 0 }];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Widget title="Work Order Completion Rate" data={monthlyTrend}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                        <CircleCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Efficiency Metrics</span>
                    </div>
                    <div className="flex items-center gap-12 mb-8">
                        <StatBox title="Created" value={data?.overview?.totalWorkOrders || 0} color="indigo" />
                        <StatBox title="Completed" value={data?.statusReport?.summary?.completed || 0} color="emerald" />
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                <YAxis hide /><Tooltip cursor={{ fill: '#F1F5F9' }} />
                                <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Widget>

            <Widget title="Preventive vs. Reactive Mix" data={typeMix}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                        <RefreshCcw className="w-4 h-4 text-indigo-500" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Maintenance Balance</span>
                    </div>
                    <div className="h-[250px] w-full relative mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={typeMix} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {typeMix.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Widget>

            <Widget title="Completed Work Orders - Top Technicians" data={displayTechnicians}>
                <div className="space-y-4">
                    {displayTechnicians.map((tech: any, i: number) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 border border-slate-200">{tech.avatar}</div>
                                <span className="text-[14px] font-medium text-slate-700">{tech.name}</span>
                            </div>
                            <div className="flex items-center gap-4 flex-1 max-w-[200px] ml-4">
                                <div className="h-2 flex-1 bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(tech.count / (displayTechnicians[0].count || 1)) * 100}%` }} className="h-full bg-indigo-500" />
                                </div>
                                <span className="text-[13px] font-bold text-slate-500 w-8 text-right">{tech.count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Widget>

            <Widget title="Completed Work Orders - Top Locations" data={displayLocations}>
                <div className="space-y-4">
                    {displayLocations.map((loc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="text-[14px] font-medium text-slate-700 truncate max-w-[180px]">{loc.name}</span>
                            </div>
                            <div className="flex items-center gap-4 flex-1 max-w-[200px] ml-4">
                                <div className="h-2 flex-1 bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(loc.count / (displayLocations[0].count || 1)) * 100}%` }} className="h-full bg-amber-500" />
                                </div>
                                <span className="text-[13px] font-bold text-slate-500 w-8 text-right">{loc.count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Widget>
        </div>
    );
};
