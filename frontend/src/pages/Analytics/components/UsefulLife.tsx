import { cn } from '../../../lib/utils';
import type { AnalyticsData } from '../types';

export const UsefulLife = ({ data }: { data: AnalyticsData }) => {
    const assets = (data as any)?.assets || [];
    const now = new Date();

    // Calculate Useful Life Metrics
    const usefulLifeData = assets.map((asset: any) => {
        const startDate = asset.placedInServiceDate ? new Date(asset.placedInServiceDate) : 
                         asset.purchaseDate ? new Date(asset.purchaseDate) : 
                         new Date(asset.createdAt);
        
        const usefulLifeYears = asset.usefulLifeYears || 10;
        const usefulLifeDays = usefulLifeYears * 365;
        const daysInService = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysUntilEnd = usefulLifeDays - daysInService;
        const percentThrough = Math.min(100, Math.max(0, (daysInService / usefulLifeDays) * 100));
        
        const endOfUsefulLife = new Date(startDate);
        endOfUsefulLife.setFullYear(endOfUsefulLife.getFullYear() + usefulLifeYears);

        return {
            ...asset,
            startDate: startDate.toISOString().split('T')[0],
            endOfUsefulLife: endOfUsefulLife.toISOString().split('T')[0],
            daysInService,
            daysUntilEnd,
            percentThrough
        };
    }).sort((a: any, b: any) => b.percentThrough - a.percentThrough);

    const over90Percent = usefulLifeData.filter((a: any) => a.percentThrough > 90).length;
    
    // Warranty Data
    const warrantyData = assets.filter((a: any) => a.warrantyExpiry).map((asset: any) => ({
        ...asset,
        expiryDate: new Date(asset.warrantyExpiry).toISOString().split('T')[0],
        placedInService: asset.placedInServiceDate ? new Date(asset.placedInServiceDate).toISOString().split('T')[0] : 'N/A'
    })).sort((a: any, b: any) => new Date(a.warrantyExpiry).getTime() - new Date(b.warrantyExpiry).getTime());

    const expiringWarranties = warrantyData.filter((a: any) => {
        const expiry = new Date(a.warrantyExpiry);
        const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays < 90;
    }).length;

    return (
        <div className="space-y-6 pb-20">
            {/* Top Row: Single KPI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-[20px] border border-slate-100 p-20 flex flex-col items-center justify-center text-center shadow-sm min-h-[350px]">
                    <span className="text-[100px] font-medium text-slate-900 leading-none">{over90Percent}</span>
                    <span className="text-[15px] text-slate-500 mt-6">Active assets {'>'} 90% over their useful life</span>
                </div>
                <div className="lg:col-span-2" />
            </div>

            {/* Middle Row: Full Width Table */}
            <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-center">
                    <h3 className="text-[14px] font-medium text-slate-900">Active Assets x Useful Life</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/20">
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">Asset Name</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase text-center">Placed In Service Date</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase text-center">End of Useful Life</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase text-right">Days In Service</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">Days until End of Useful Life</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">% Through Useful Life</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usefulLifeData.slice(0, 10).map((asset: any, idx: number) => (
                                <tr key={asset.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50 transition-colors", idx % 2 === 1 && "bg-slate-50/30")}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[12px] text-slate-400 w-4">{idx + 1}</span>
                                            <span className="text-[13px] text-slate-900">{asset.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[12px] text-slate-600 text-center">{asset.startDate}</td>
                                    <td className="px-6 py-4 text-[12px] text-slate-600 text-center">{asset.endOfUsefulLife}</td>
                                    <td className="px-6 py-4 text-[13px] text-slate-900 text-right font-medium">{asset.daysInService.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[13px] text-slate-900 w-8">{Math.max(0, asset.daysUntilEnd).toLocaleString()}</span>
                                            <div className="flex-1 h-4 bg-slate-100 rounded-sm overflow-hidden max-w-[150px]">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-sm",
                                                        asset.daysUntilEnd <= 0 ? "bg-[#B91C1C]" : "bg-[#166534]"
                                                    )}
                                                    style={{ width: asset.daysUntilEnd <= 0 ? '100%' : '60%' }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-6 w-full bg-slate-100 rounded-sm overflow-hidden relative">
                                            <div 
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    asset.percentThrough > 90 ? "bg-[#B91C1C]" : "bg-[#166534]"
                                                )}
                                                style={{ width: `${asset.percentThrough}%` }}
                                            />
                                            <span className="absolute inset-0 flex items-center justify-end px-2 text-[11px] font-bold text-white drop-shadow-sm">
                                                {Math.round(asset.percentThrough)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Row: KPI + Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-[20px] border border-slate-100 p-20 flex flex-col items-center justify-center text-center shadow-sm min-h-[350px]">
                    <span className="text-[100px] font-medium text-slate-900 leading-none">{expiringWarranties}</span>
                    <span className="text-[15px] text-slate-500 mt-6">Assets with expiring warranties</span>
                </div>
                <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-sm flex flex-col">
                    <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-center">
                        <h3 className="text-[14px] font-medium text-slate-900">Warranty Breakdown</h3>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/20">
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">Warranty Expiration Date</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase">Asset Name</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase text-right">Purchase Price</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase text-center">Placed In Service Date</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-900 uppercase text-right">Incomplete Work Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {warrantyData.slice(0, 5).map((asset: any, idx: number) => (
                                    <tr key={asset.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50 transition-colors", idx % 2 === 1 && "bg-slate-50/30")}>
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <span className="text-[12px] text-slate-400 w-4">{idx + 1}</span>
                                            <span className="text-[13px] text-slate-600">{asset.expiryDate}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[13px] text-slate-600">{asset.name}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-900 text-right font-medium">${(asset.purchasePrice || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-600 text-center">{asset.placedInService}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-600 text-right">{asset.incompleteWorkOrdersCount || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
