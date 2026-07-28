import { Info } from 'lucide-react';
import { 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    Tooltip, 
    Legend, 
    BarChart, 
    CartesianGrid, 
    XAxis, 
    YAxis, 
    Bar, 
    Line,
    ComposedChart
} from 'recharts';
import { Widget } from './Widget';
import { CHART_COLORS } from '../dashboards';
import type { AnalyticsData } from '../types';

export const WorkOrderAnalysis = ({ data }: { data: AnalyticsData }) => {
    const { statusReport, teamPerformance, costMaintenance, complianceMetrics } = data || {};
    
    // Mappings
    const summary = statusReport?.summary || { total: 0, completed: 0, compliant: 0, avgCycleTimeDays: 0 };
    const workOrderStatus = statusReport?.workOrderStatus || [];
    const workRemaining = statusReport?.workRemaining || [];
    
    const priorityMix = complianceMetrics?.byPriority || [];
    const categoryMix = costMaintenance?.breakouts?.category || [];
    const monthlyTrend = teamPerformance?.monthlyTrend || [];

    return (
        <div className="space-y-12 pb-20">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-[40px] border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[120px] font-black text-slate-800 tracking-tighter leading-none">{summary.total}</span>
                    <span className="text-[16px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6">Count</span>
                </div>
                <div className="bg-white rounded-[40px] border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[120px] font-black text-slate-800 tracking-tighter leading-none">{summary.completed}</span>
                    <span className="text-[16px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6">Compliant Count</span>
                </div>
                <div className="bg-white rounded-[40px] border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[120px] font-black text-slate-800 tracking-tighter leading-none flex items-center">
                        <span className="text-[64px] text-slate-300 font-normal mr-2">ø</span>
                        {summary.avgCycleTimeDays}
                    </span>
                    <span className="text-[16px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6">Average Cycle Time</span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Widget title="Grouped by Assigned To" icon={Info} data={workRemaining} className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workRemaining} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAFA" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </Widget>

                <Widget title="Grouped by Compliance" icon={Info} data={workOrderStatus} className="h-[500px]">
                    <div className="h-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={[
                                        { name: 'Compliant', value: summary.compliant },
                                        { name: 'Non-Compliant', value: summary.total - summary.compliant }
                                    ]} 
                                    innerRadius={110} 
                                    outerRadius={160} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    <Cell fill="#10B981" />
                                    <Cell fill="#F43F5E" />
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Widget>

                <Widget title="Grouped by Priority" icon={Info} data={priorityMix} className="h-[500px]">
                    <div className="h-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={priorityMix} 
                                    innerRadius={110} 
                                    outerRadius={160} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {priorityMix.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Widget>

                <Widget title="Grouped by Category" icon={Info} data={categoryMix} className="h-[500px]">
                    <div className="h-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={categoryMix} 
                                    innerRadius={110} 
                                    outerRadius={160} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {categoryMix.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Widget>

                <Widget title="Completion Comparison" icon={Info} data={monthlyTrend} className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAFA" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Legend align="center" verticalAlign="bottom" />
                            <Bar dataKey="created" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={40} />
                            <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                            <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Widget>

                <Widget title="Labor Hour Trends" icon={Info} data={[]} className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAFA" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="created" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={40} />
                            <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </Widget>
            </div>

            {/* Financial Footer */}
            <div className="grid grid-cols-2 gap-12 border-t border-slate-100 pt-12">
                <div className="flex flex-col">
                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Cost</span>
                    <span className="text-[48px] font-black text-slate-800 tracking-tighter">${(costMaintenance?.stats?.total || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Avg Cost</span>
                    <span className="text-[48px] font-black text-slate-800 tracking-tighter">${(costMaintenance?.avgCosts?.all || 0).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};
