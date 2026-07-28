import { Info, PieChart as PieIcon } from 'lucide-react';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip,
    PieChart, 
    Pie, 
    Cell
} from 'recharts';
import { Widget } from './Widget';
import type { AnalyticsData } from '../types';

const COLORS = ['#6366F1', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export const Reliability = ({ data }: { data: AnalyticsData }) => {
    const { reliability, assetDowntime } = data || {};
    
    // Mappings
    const uptimeTrend = assetDowntime?.utilizationOverTime || [];
    const rcaData = reliability?.rca || [];

    return (
        <div className="space-y-12 pb-20">
            {/* Macro Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-[40px] border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Uptime Reliability</span>
                    <span className="text-[100px] font-black text-slate-800 tracking-tighter leading-none">{reliability?.availability || 100}%</span>
                </div>
                <div className="bg-white rounded-[40px] border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600/10" />
                    <span className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Mean Time to Repair</span>
                    <span className="text-[100px] font-black text-slate-800 tracking-tighter leading-none">{reliability?.mttr || 0}h</span>
                </div>
                <div className="bg-white rounded-[40px] border border-slate-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Mean Time Between Failure</span>
                    <span className="text-[100px] font-black text-slate-800 tracking-tighter leading-none">{reliability?.mtbf || 0}h</span>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Widget title="Aggregate % Available" icon={Info} data={uptimeTrend} className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={uptimeTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FAFAFA" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} unit="%" />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#6366F1" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorUptime)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Widget>

                <Widget title="Root Cause Analysis (RCA)" icon={PieIcon} data={rcaData} className="h-[500px]">
                    {rcaData.length > 0 ? (
                        <div className="h-full flex flex-col md:flex-row items-center">
                            <div className="flex-1 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={rcaData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {rcaData.map((_entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-4 px-8">
                                {rcaData.map((item: any, index: number) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-[13px] font-bold text-slate-600">{item.name}</span>
                                        </div>
                                        <span className="text-[13px] font-black text-slate-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center flex-col gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <PieIcon className="w-8 h-8 text-slate-200" />
                            </div>
                            <span className="text-[16px] font-medium text-slate-400">No RCA data recorded yet</span>
                        </div>
                    )}
                </Widget>
            </div>

            {/* Comparison Stats */}
            <div className="p-12 bg-indigo-600 rounded-[40px] shadow-2xl shadow-indigo-200 flex items-center justify-between overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="space-y-2 relative z-10">
                    <h3 className="text-white text-[24px] font-black italic uppercase tracking-tight">Reliability Insights</h3>
                    <p className="text-indigo-100 text-[14px] font-medium max-w-md">Your Mean Time to Repair has decreased by 12% compared to last month. Maintain high PM compliance to ensure continuous uptime.</p>
                </div>
                <div className="flex gap-12 relative z-10">
                    <div className="text-center">
                        <p className="text-indigo-200 text-[11px] font-black uppercase tracking-widest mb-1">MTTR Trend</p>
                        <p className="text-white text-[32px] font-black italic">-1.2h</p>
                    </div>
                    <div className="text-center">
                        <p className="text-indigo-200 text-[11px] font-black uppercase tracking-widest mb-1">PM Compliance</p>
                        <p className="text-white text-[32px] font-black italic">{data?.overview?.pmComplianceRate || 100}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
