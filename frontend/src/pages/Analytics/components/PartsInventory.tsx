import { useState } from 'react';
import { 
    Package, 
    BarChart3, 
    DollarSign,
    Search,
    Download
} from 'lucide-react';
import type { AnalyticsData } from '../types';
import { PartInspector } from '../../../components/PartInspector';
import { AnimatePresence } from 'framer-motion';

export const PartsInventory = ({ data }: { data: AnalyticsData }) => {
    const { parts } = data || {};
    const inventoryItems = parts?.inventoryItems || [];
    const totalInventoryValue = parts?.totalInventoryValue || 0;
    const itemsOnHandCount = parts?.itemsOnHandCount || 0;

    const [search, setSearch] = useState('');
    const [selectedPart, setSelectedPart] = useState<any>(null);

    const filteredItems = inventoryItems.filter((item: any) => 
        (item.name?.toLowerCase().includes(search.toLowerCase())) ||
        (item.partNumber?.toLowerCase().includes(search.toLowerCase())) ||
        (item.location?.toLowerCase().includes(search.toLowerCase()))
    );

    const downloadInventory = () => {
        const csv = [
            ['#', 'Part Name', 'Part Number', 'Location', 'Quantity', 'Cost', 'Total Value'],
            ...filteredItems.map((item: any, idx: number) => [
                idx + 1,
                item.name,
                item.partNumber || '',
                item.location || '',
                item.quantity,
                item.cost,
                item.quantity * item.cost
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'parts_inventory.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-10">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px] group hover:border-indigo-100 transition-all cursor-default">
                    <div className="w-16 h-16 bg-indigo-50 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-[56px] font-black text-slate-900 tracking-tighter mb-4">
                        ${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Inventory on Hand</p>
                </div>

                <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px] group hover:border-amber-100 transition-all cursor-default">
                    <div className="w-16 h-16 bg-amber-50 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Package className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-[56px] font-black text-slate-900 tracking-tighter mb-4">
                        {itemsOnHandCount.toLocaleString()}
                    </h2>
                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] italic"># of Items on Hand</p>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <h3 className="text-[18px] font-black text-slate-900 flex items-center gap-4 italic uppercase">
                        <BarChart3 className="w-6 h-6 text-indigo-600" />
                        Inventory Registry
                        <span className="ml-2 text-[12px] font-black text-slate-300 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 not-italic">
                            {filteredItems.length} Records
                        </span>
                    </h3>
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input 
                                type="text" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter inventory..." 
                                className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-[14px] font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all w-[320px]"
                            />
                        </div>
                        <button 
                            onClick={downloadInventory}
                            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">#</th>
                                <th className="px-6 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Part Identity</th>
                                <th className="px-6 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Catalog No.</th>
                                <th className="px-6 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Storage Location</th>
                                <th className="px-6 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Stock Qty</th>
                                <th className="px-6 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Unit Cost</th>
                                <th className="px-10 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Position Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredItems.map((item: any, idx: number) => (
                                <tr 
                                    key={item.id} 
                                    onClick={() => setSelectedPart(item)}
                                    className="hover:bg-[#F8FAFF] transition-all group cursor-pointer border-l-2 border-l-transparent hover:border-l-indigo-500"
                                >
                                    <td className="px-10 py-6 text-[13px] font-bold text-slate-300 group-hover:text-indigo-300">{idx + 1}</td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400 font-black text-[12px] italic shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                {item.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[15px] font-black text-slate-700 tracking-tight group-hover:text-indigo-600 transition-colors">{item.name}</span>
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Part Unit</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-[14px] font-bold text-slate-400 tracking-tighter italic">{item.partNumber || '—'}</td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 w-fit group-hover:border-indigo-100 group-hover:bg-indigo-50/50 transition-all">
                                            <span className="text-[12px] font-black text-slate-600 uppercase italic tracking-tighter group-hover:text-indigo-600">{item.location || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-[15px] font-black text-slate-900 italic">{item.quantity}</span>
                                            <div className="w-12 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (item.quantity / (item.maxQuantity || 100)) * 100)}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-[14px] font-bold text-slate-500 italic">${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-10 py-6 text-right">
                                        <span className="text-[16px] font-black text-indigo-600 italic tracking-tight drop-shadow-sm">
                                            ${(item.quantity * item.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-40 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center shadow-inner animate-pulse">
                                                <Package className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <p className="text-[16px] font-black text-slate-300 italic uppercase tracking-[0.3em]">No Matching Inventory</p>
                                            <p className="text-[12px] font-medium text-slate-400 max-w-[280px] mx-auto leading-relaxed">Adjust your search parameters or filters to locate specific parts.</p>
                                            <button 
                                                onClick={() => setSearch('')}
                                                className="mt-4 text-[12px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                            >
                                                Reset Search
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedPart && (
                    <PartInspector 
                        part={selectedPart}
                        onClose={() => setSelectedPart(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
