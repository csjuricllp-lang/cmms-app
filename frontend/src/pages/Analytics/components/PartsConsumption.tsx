import { 
    Package, 
    BarChart3, 
    DollarSign,
    TrendingUp,
    Search,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import type { AnalyticsData } from '../types';

export const PartsConsumption = ({ data }: { data: AnalyticsData }) => {
    const { parts: partsData } = data || {};
    const consumptionItems = partsData?.consumptionItems || [];
    const trends = partsData?.trends || [];
    const totalCost = partsData?.totalConsumptionCost || 0;
    const totalConsumed = partsData?.totalPartsConsumed || 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Stats */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[280px]">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                            <DollarSign className="w-7 h-7 text-indigo-600" />
                        </div>
                        <h2 className="text-[36px] font-black text-slate-900 tracking-tight mb-2">
                            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <p className="text-[14px] font-bold text-slate-500 uppercase tracking-widest">Total Consumption Cost</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[280px]">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                            <Package className="w-7 h-7 text-amber-600" />
                        </div>
                        <h2 className="text-[36px] font-black text-slate-900 tracking-tight mb-2">
                            {totalConsumed.toLocaleString()}
                        </h2>
                        <p className="text-[14px] font-bold text-slate-500 uppercase tracking-widest">Parts Consumed</p>
                    </div>
                </div>

                {/* Right Column - Table */}
                <div className="col-span-12 lg:col-span-9">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-[16px] font-black text-slate-900 flex items-center gap-3">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Parts Consumption
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Search parts..." 
                                        className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-[13px] font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all w-[240px]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Part Name</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Part Number</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Part Location</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Current Quantity</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Price / unit</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Inventory Value</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Parts Consumed</th>
                                        <th className="px-8 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Consumption Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {consumptionItems.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                                                        {item.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-[14px] font-bold text-slate-700">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-[13px] font-bold text-slate-400 tracking-tight">{item.partNumber || '—'}</td>
                                            <td className="px-6 py-5">
                                                <span className="text-[13px] font-bold text-slate-600">{item.location || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-5 text-[13px] font-black text-slate-700">{item.currentQuantity}</td>
                                            <td className="px-6 py-5 text-[13px] font-bold text-slate-500">${item.unitPrice.toLocaleString()}</td>
                                            <td className="px-6 py-5 text-[13px] font-black text-slate-700">${(item.currentQuantity * item.unitPrice).toLocaleString()}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] font-black text-indigo-600">{item.consumedQuantity}</span>
                                                    {item.trend > 0 ? <ArrowUpRight className="w-3 h-3 text-rose-500" /> : <ArrowDownRight className="w-3 h-3 text-emerald-500" />}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-[14px] font-black text-slate-900">${(item.consumedQuantity * item.unitPrice).toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {consumptionItems.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                        <Package className="w-8 h-8 text-slate-200" />
                                                    </div>
                                                    <p className="text-[13px] font-bold text-slate-400 italic">No consumption records found for this period</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom - Trends */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-[16px] font-black text-slate-900 flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        Consumption Trends
                    </h3>
                </div>
                <div className="p-8 h-[400px] w-full">
                    {trends.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="cost" 
                                    stroke="#6366F1" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorCost)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-[13px] font-bold text-slate-400 italic">No trend data available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
