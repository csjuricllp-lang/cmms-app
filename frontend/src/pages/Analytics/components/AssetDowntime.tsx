import { Activity, CircleCheck, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { cn } from '../../../lib/utils';
import { Widget } from './Widget';
import type { AnalyticsData } from '../types';

export const AssetDowntime = ({ data }: { data: AnalyticsData }) => {
    const { assetDowntime } = data || {};
    const { status, topAssets, locationUtilization, categoryUtilization } = assetDowntime || {
        status: { utilization: "0.0", operational: 0, nonOperational: 0 },
        topAssets: [],
        locationUtilization: [],
        categoryUtilization: [],
        utilizationOverTime: [],
        downtimeHistory: []
    };

    return (
        <div className="space-y-12 pb-20">
            <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-widest pl-1">Current Status</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[
                        { label: 'Utilization', value: `${status.utilization}%`, color: 'text-emerald-500', icon: Activity },
                        { label: 'Operational', value: status.operational, color: 'text-emerald-600', icon: CircleCheck },
                        { label: 'Non-operational', value: status.nonOperational, color: 'text-rose-500', icon: ShieldAlert }
                    ].map((item, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-sm">
                            <span className={cn("text-[42px] font-black tracking-tighter mb-1", item.color)}>{item.value}</span>
                            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-widest pl-1">Assets With Most Downtime</h3>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                {['Asset Name', 'Location Name', 'Operational Status', 'Downtime (Hours)', 'Downtime Events', '% Utilization'].map((h, i) => (
                                    <th key={i} className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {topAssets.map((asset: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-[13px] font-bold text-slate-700">{asset.name}</td>
                                    <td className="px-6 py-4 text-[13px] text-slate-500">{asset.location}</td>
                                    <td className="px-6 py-4"><div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest", asset.status === 'OPERATIONAL' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{asset.status}</div></td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{asset.downtimeHours}</td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{asset.events}</td>
                                    <td className="px-6 py-4 text-[13px] font-bold text-slate-800">{asset.utilization}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Widget title="Utilization % by Location" data={locationUtilization}>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={locationUtilization} layout="vertical">
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} width={120} />
                                <Tooltip /><Bar dataKey="value" fill="#60A5FA" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Widget>
                <Widget title="Utilization % by Category" data={categoryUtilization}>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryUtilization} layout="vertical">
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} width={120} />
                                <Tooltip /><Bar dataKey="value" fill="#34D399" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Widget>
            </div>
        </div>
    );
};
