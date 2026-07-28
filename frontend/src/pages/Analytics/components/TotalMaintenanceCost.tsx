import { Info } from 'lucide-react';
import { 
    ResponsiveContainer, 
    ComposedChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip,
    Bar,
    Line,
    Legend
} from 'recharts';
import { Widget } from './Widget';
import type { AnalyticsData } from '../types';

export const TotalMaintenanceCost = ({ data }: { data: AnalyticsData }) => {
    const { costMaintenance, assetDowntime } = data || {};
    
    // Mappings
    const totalCost = costMaintenance?.stats?.total || 0;
    const weeklyTrend = costMaintenance?.weeklyTrend || [];
    const topAssets = assetDowntime?.topAssets || [];

    // Use real cost and downtime data from backend
    const correlationData = topAssets.slice(0, 8).map((a: any) => ({
        name: a.name,
        downtimeHours: parseFloat(a.downtimeHours) || 0,
        cost: a.maintenanceCost || 0
    }));

    const trendCorrelation = weeklyTrend.map((t: any) => ({
        name: t.name,
        cost: t.cost,
        downtimeHours: t.downtimeHours || 0
    }));

    return (
        <div className="space-y-12 pb-20">
            {/* Macro Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-[40px] border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[120px] font-black text-slate-800 tracking-tighter leading-none flex items-center">
                        {costMaintenance?.costAsPctOfRav || "0.00"}%
                    </span>
                    <span className="text-[16px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6">Total Cost As Pct of RAV</span>
                </div>
                <div className="bg-white rounded-[40px] border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600/10" />
                    <span className="text-[120px] font-black text-slate-800 tracking-tighter leading-none">${totalCost.toLocaleString()}</span>
                    <span className="text-[16px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6">Total Maintenance Cost</span>
                </div>
                <div className="bg-white rounded-[40px] border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[120px] font-black text-slate-800 tracking-tighter leading-none">
                        ${(costMaintenance?.totalPurchasePrice || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[16px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6">Total Purchase Price</span>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Widget title="Downtime and Costs" icon={Info} data={correlationData} className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={correlationData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAFA" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'Total Downtime (hrs)', angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: 10, fontWeight: 'bold' } }} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1' }} label={{ value: 'Total Maintenance Cost', angle: 90, position: 'insideRight', style: { fill: '#6366F1', fontSize: 10, fontWeight: 'bold' } }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Legend align="center" verticalAlign="bottom" />
                            <Bar yAxisId="left" dataKey="downtimeHours" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40} name="Total Downtime (hrs)" />
                            <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1' }} name="Total Maintenance Cost" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Widget>

                <Widget title="Downtime and Cost Trends" icon={Info} data={trendCorrelation} className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendCorrelation} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorTrendDowntime" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#CBD5E1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#CBD5E1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAFA" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Legend align="center" verticalAlign="bottom" />
                            <Area yAxisId="left" type="monotone" dataKey="downtimeHours" stroke="#94A3B8" strokeWidth={2} fillOpacity={1} fill="url(#colorTrendDowntime)" name="Total Downtime (hrs)" />
                            <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1' }} name="Total Maintenance Cost" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Widget>
            </div>
        </div>
    );
};
