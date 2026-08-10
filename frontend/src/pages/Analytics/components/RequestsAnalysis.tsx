import { 
    CircleCheck, 
    XCircle, 
    Clock, 
    TrendingUp,
    BarChart3
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import type { AnalyticsData } from '../types';

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981'];

export const RequestsAnalysis = ({ data }: { data: AnalyticsData }) => {
    const { requests } = data || {};
    const requestsSafe = requests || {};
    const approvedCount = Number(requestsSafe.approvedCount ?? 0);
    const declinedCount = Number(requestsSafe.declinedCount ?? 0);
    const pendingCount = Number(requestsSafe.pendingCount ?? 0);
    const avgCycleTime = Number(requestsSafe.avgCycleTime ?? 0);
    const byPriority = requestsSafe.byPriority || [];
    const cycleTimeTrend = requestsSafe.cycleTimeTrend || [];

    return (
        <div className="space-y-10">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px] group hover:border-indigo-100 transition-all cursor-default">
                    <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <CircleCheck className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-[56px] font-black text-slate-900 tracking-tighter mb-4">
                        {approvedCount.toFixed(2)}
                    </h2>
                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Approved Requests</p>
                    <div className="mt-4 text-[11px] font-bold text-slate-300 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        {approvedCount.toFixed(1)} of {(approvedCount + declinedCount + pendingCount).toFixed(1)} Total Requests
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px] group hover:border-amber-100 transition-all cursor-default">
                    <div className="w-16 h-16 bg-amber-50 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <XCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-[56px] font-black text-slate-900 tracking-tighter mb-4">
                        {declinedCount.toFixed(2)}
                    </h2>
                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Declined Requests</p>
                    <div className="mt-4 text-[11px] font-bold text-slate-300 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        {declinedCount.toFixed(1)} Work Order Count
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px] group hover:border-slate-200 transition-all cursor-default">
                    <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Clock className="w-8 h-8 text-slate-600" />
                    </div>
                    <h2 className="text-[56px] font-black text-slate-900 tracking-tighter mb-4">
                        {pendingCount.toFixed(2)}
                    </h2>
                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Request Pending Count</p>
                </div>

                <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px] group hover:border-indigo-100 transition-all cursor-default">
                    <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-[56px] font-black text-slate-900 tracking-tighter mb-4">
                        {avgCycleTime === 0 ? 'ø' : avgCycleTime.toFixed(1)}
                    </h2>
                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Average Cycle Time (days)</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Priority Breakdown */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm min-h-[480px]">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-[18px] font-black text-slate-900 flex items-center gap-4 italic uppercase">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                            Requests by Priority
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={byPriority.length > 0 ? byPriority : [{ name: 'None', value: 100 }]}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {(byPriority.length > 0 ? byPriority : [{ name: 'None', value: 100 }]).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={byPriority.length > 0 ? COLORS[index % COLORS.length] : '#f1f5f9'} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontStyle: 'italic', fontWeight: '900' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex items-center justify-center gap-8 mt-4">
                            {byPriority.length > 0 ? byPriority.map((item: any, idx: number) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="text-[12px] font-black text-slate-500 uppercase tracking-tighter italic">{item.name} {((item.value / byPriority.reduce((a: any, b: any) => a + b.value, 0)) * 100).toFixed(1)}%</span>
                                </div>
                            )) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-100" />
                                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-tighter italic">None 100.00%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cycle Time Trend */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm min-h-[480px]">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-[18px] font-black text-slate-900 flex items-center gap-4 italic uppercase">
                            <Clock className="w-6 h-6 text-indigo-600" />
                            Cycle Time
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        {cycleTimeTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cycleTimeTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontStyle: 'italic', fontWeight: '900' }}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Clock className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-[14px] font-black text-slate-300 uppercase tracking-widest italic">No results</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
