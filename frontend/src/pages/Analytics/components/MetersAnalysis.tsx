import { cn } from '../../../lib/utils';
import type { AnalyticsData } from '../types';

export const MetersAnalysis = ({ data }: { data: AnalyticsData }) => {
    const meterReadings = (data as any)?.meterReadings || [];

    const meterStats = (data as any)?.meterStats || { avg: 0, max: 0, min: 0 };
    const avgReading = Number(meterStats.avg ?? 0).toFixed(0);
    const maxReading = Number(meterStats.max ?? 0).toFixed(0);
    const minReading = Number(meterStats.min ?? 0).toFixed(0);

    return (
        <div className="space-y-6 pb-20">
            {/* Top Row: KPI Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-[20px] border border-slate-100 p-20 flex flex-col items-center justify-center text-center shadow-sm min-h-[350px]">
                    <span className="text-[15px] font-medium text-slate-500 mb-6">Average Reading</span>
                    <span className="text-[100px] font-medium text-slate-900 leading-none">{avgReading}</span>
                </div>
                <div className="bg-white rounded-[20px] border border-slate-100 p-20 flex flex-col items-center justify-center text-center shadow-sm min-h-[350px]">
                    <span className="text-[15px] font-medium text-slate-500 mb-6">Max Reading</span>
                    <span className="text-[100px] font-medium text-slate-900 leading-none">{maxReading}</span>
                </div>
                <div className="bg-white rounded-[20px] border border-slate-100 p-20 flex flex-col items-center justify-center text-center shadow-sm min-h-[350px]">
                    <span className="text-[15px] font-medium text-slate-500 mb-6">Min Reading</span>
                    <span className="text-[100px] font-medium text-slate-900 leading-none">{minReading}</span>
                </div>
            </div>

            {/* Bottom Row: Full Width Table */}
            <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-center">
                    <h3 className="text-[14px] font-medium text-slate-900">Meter Readings</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/20">
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">Meter Reading Time</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">Name</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase text-center">Value</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">Units</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">Asset Name</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">Asset Category</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">Location Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meterReadings.length > 0 ? (
                                meterReadings.slice(0, 15).map((reading: any, idx: number) => (
                                    <tr key={reading.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50 transition-colors", idx % 2 === 1 && "bg-slate-50/30")}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[12px] text-slate-400 w-4">{idx + 1}</span>
                                                <span className="text-[13px] text-slate-600">
                                                    {new Date(reading.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[13px] text-slate-900 font-medium">{reading.meter?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-900 text-center font-bold">{reading.value}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-500">{reading.meter?.unit || '-'}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-600">{reading.meter?.asset?.name || '-'}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-500">{reading.meter?.asset?.category?.name || reading.meter?.asset?.categoryRef?.name || '-'}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-600">{reading.meter?.location?.name || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic">
                                        No meter readings found for the selected period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
