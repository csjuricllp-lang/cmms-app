import { useState } from 'react';
import {
    Maximize2,
    Settings,
    History,
    Zap,
    FileText,
    MapPin,
    Activity,
    Clock,
    AlertTriangle,
    Plus,
    X,
    DollarSign,
    TrendingDown,
    ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAssetMetrics } from '../hooks/useData';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useAssetSettings } from '../hooks/useAssetSettings';
import { api } from '../lib/api';

interface AssetInspectorProps {
    asset: any;
    onClose: () => void;
    onIssueWorkOrder?: (asset: any) => void;
}

export const AssetInspector = ({ asset, onClose, onIssueWorkOrder }: AssetInspectorProps) => {
    const [activeTab, setActiveTab] = useState<'details' | 'financials' | 'history' | 'meters' | 'files'>('details');

    const { workOrders: woHistory } = useWorkOrders({ assetId: asset.id });
    const { data: metrics } = useAssetMetrics(asset.id);
    const { fields: customFieldsQuery } = useAssetSettings('ASSET');
    const customFields = customFieldsQuery.data || [];
    const specs = (asset.specifications as Record<string, string>) || {};

    const tabs = [
        { id: 'details', label: 'Overview', icon: Settings },
        { id: 'financials', label: 'Financials', icon: DollarSign },
        { id: 'history', label: 'WO History', icon: History },
        { id: 'meters', label: 'Meters', icon: Zap },
        { id: 'files', label: 'Files', icon: FileText }
    ];

    // Depreciation Logic (Straight Line)
    const calculateDepreciation = () => {
        if (!asset.purchasePrice || !asset.usefulLifeYears) return null;
        
        const price = Number(asset.purchasePrice);
        const residual = Number(asset.residualValue || 0);
        const life = Number(asset.usefulLifeYears);
        const purchaseDate = new Date(asset.purchaseDate || asset.createdAt);
        
        const ageYears = (new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        const annualDepreciation = (price - residual) / life;
        const currentAccumulated = Math.min(price - residual, annualDepreciation * ageYears);
        const bookValue = Math.max(residual, price - currentAccumulated);
        
        const replacementDate = new Date(purchaseDate);
        replacementDate.setFullYear(purchaseDate.getFullYear() + life);

        return {
            bookValue: bookValue.toFixed(2),
            accumulated: currentAccumulated.toFixed(2),
            annual: annualDepreciation.toFixed(2),
            replacementDate: replacementDate.toLocaleDateString(),
            percentDepreciated: ((currentAccumulated / (price - residual)) * 100).toFixed(1)
        };
    };

    const financialData = calculateDepreciation();

    return (
        <aside className="w-[480px] glass-panel fixed right-6 top-24 bottom-6 z-40 flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl rounded-[2.5rem] overflow-hidden border-t border-white/10">
            {/* Header / Identity */}
            <div className="bg-primary/5 p-10 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 -mr-8 -mt-8 opacity-[0.05] pointer-events-none">
                    <Maximize2 className="w-32 h-32" />
                </div>

                <div className="flex items-start justify-between relative">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-inner">
                        <Maximize2 className="w-8 h-8" />
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all active:scale-90">
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                <h2 className="text-3xl font-black tracking-tight italic uppercase">{asset.name}</h2>
                <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 italic">
                        {asset.serialNumber || 'SN-UNDEFINED'}
                    </span>
                    <button
                        onClick={async () => {
                            const newStatus = asset.status === 'OPERATIONAL' ? 'DOWN' : 'OPERATIONAL';
                            await api.patch(`/assets/${asset.id}`, { status: newStatus });
                            window.location.reload();
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 ${asset.status === 'OPERATIONAL'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${asset.status === 'OPERATIONAL' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                        {asset.status || 'Operational'}
                    </button>
                </div>
            </div>

            {/* Tab Navigation (Premium Italic Style) */}
            <div className="flex border-b border-white/5 bg-white/[0.01]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-5 flex flex-col items-center gap-1.5 transition-all relative group ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
                    >
                        <tab.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'scale-110' : 'opacity-60'}`} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] italic">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div 
                                layoutId="activeTab"
                                className="absolute bottom-0 inset-x-4 h-[3px] bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-raw),0.5)]" 
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                {activeTab === 'details' && (
                    <div className="space-y-10">
                        {/* Specifications Grid */}
                        <div className="grid grid-cols-2 gap-8 p-8 rounded-[32px] bg-white/[0.02] border border-white/5 shadow-inner">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">Model</label>
                                <p className="text-sm font-bold tracking-tight">{asset.model || 'N/A'}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">Brand</label>
                                <p className="text-sm font-bold tracking-tight">{asset.brand || 'N/A'}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">Location</label>
                                <div className="flex items-center gap-2 text-primary">
                                    <MapPin className="w-4 h-4" />
                                    <p className="text-sm font-black italic uppercase tracking-tighter">{asset.location?.name || 'Main Production Site'}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">Category</label>
                                <p className="text-sm font-bold tracking-tight">{asset.category || 'Production'}</p>
                            </div>
                        </div>

                        {/* Custom Fields from specifications */}
                        {customFields.length > 0 && (
                            <div className="space-y-4 p-8 rounded-[32px] bg-white/[0.02] border border-white/5">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic opacity-60">Custom Fields</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    {customFields.map((field: any) => (
                                        <div key={field.id} className="space-y-1">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">{field.label}</label>
                                            <p className="text-sm font-bold tracking-tight">{specs[field.label] || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Health Pulse */}
                        <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-6 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">RELIABILITY MATRIX</h4>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <span className="text-[10px] font-black text-emerald-400">{(metrics?.uptime ?? 100).toFixed(1)}% UPTIME</span>
                                    <Activity className={`w-3.5 h-3.5 ${metrics?.uptime < 90 ? 'text-amber-400' : 'text-emerald-400'}`} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 group hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-widest italic">MTTR (Repair)</span>
                                    </div>
                                    <p className="text-3xl font-black">{(metrics?.mttr ?? 0).toFixed(1)}h</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 group hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-2 text-orange-400">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-widest italic">MTBF (Failure)</span>
                                    </div>
                                    <p className="text-3xl font-black">{(metrics?.mtbf ?? 0).toLocaleString()}h</p>
                                </div>
                            </div>
                        </div>

                        {/* LOTO Safety Settings */}
                        <div className="p-8 rounded-[32px] bg-red-500/5 border border-red-500/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic leading-none">SAFETY PROTOCOL</h4>
                                        <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest mt-1">Hazardous Energy Control</p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const newVal = !asset.requiresLOTO;
                                        await api.patch(`/assets/${asset.id}`, { requiresLOTO: newVal });
                                        window.location.reload();
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${asset.requiresLOTO ? 'bg-red-600' : 'bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${asset.requiresLOTO ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            
                            {asset.requiresLOTO && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic mb-2 opacity-40">Lockout Procedure</p>
                                        <p className="text-xs font-bold italic text-slate-300 leading-relaxed">
                                            {asset.lockoutProcedure || "No procedure defined. System will enforce standard energy isolation audit."}
                                        </p>
                                    </div>
                                    <button className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest italic text-primary hover:bg-white/10 transition-all uppercase">
                                        Update LOTO Procedure
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'financials' && (
                    <div className="space-y-10">
                        {financialData ? (
                            <>
                                <div className="p-10 rounded-[40px] bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 shadow-2xl relative overflow-hidden group">
                                    <TrendingDown className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] italic mb-2">Current Book Value</p>
                                    <h3 className="text-6xl font-black italic tracking-tighter shadow-primary/20 drop-shadow-xl text-white">
                                        ${Number(financialData.bookValue).toLocaleString()}
                                    </h3>
                                    <div className="mt-8 flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                                            <div 
                                                className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-raw),0.5)] transition-all duration-1000"
                                                style={{ width: `${financialData.percentDepreciated}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-black text-muted-foreground italic">{financialData.percentDepreciated}% Depreciated</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">Annual Expense</p>
                                        <p className="text-2xl font-black italic">${Number(financialData.annual).toLocaleString()}</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">Replacement Era</p>
                                        <p className="text-2xl font-black italic">{financialData.replacementDate}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic ml-2">ASSET ACCOUNTING</h4>
                                    <div className="space-y-2">
                                        {[
                                            { label: "Acquisition Cost", value: `$${Number(asset.purchasePrice).toLocaleString()}` },
                                            { label: "Residual/Salvage", value: `$${Number(asset.residualValue || 0).toLocaleString()}` },
                                            { label: "Depreciation Strategy", value: "Straight Line (SLM)" },
                                            { label: "Lifecycle Status", value: `${asset.usefulLifeYears} Year Industrial Life` }
                                        ].map(row => (
                                            <div key={row.label} className="flex justify-between items-center p-4 rounded-2xl border border-white/5 hover:bg-white/[0.02] transition-all group">
                                                <span className="text-[11px] font-bold text-muted-foreground italic group-hover:text-white transition-colors uppercase tracking-tight">{row.label}</span>
                                                <span className="text-sm font-black tracking-tight">{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="py-20 text-center space-y-6">
                                <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto border border-white/10">
                                    <DollarSign className="w-10 h-10 text-muted-foreground opacity-20" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">No Financial Profile</p>
                                    <p className="text-xs text-muted-foreground mt-2 font-medium max-w-[200px] mx-auto italic">Complete the Purchase Price & Useful Life fields to unlock Lifecycle Analytics.</p>
                                </div>
                                <button className="btn-primary text-xs italic tracking-widest py-3 px-8 rounded-2xl active:scale-95 transition-all">Initialize Accounting</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">EVENT LEDGER</h4>
                            <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 italic tracking-tighter">{woHistory?.length || 0} RECORDS</span>
                        </div>
                        {woHistory?.length === 0 ? (
                            <div className="py-20 text-center opacity-40">
                                <History className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] italic">No maintenance history</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {woHistory?.map((wo: any) => (
                                    <div key={wo.id} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-primary/20 transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start mb-4">
                                            <h5 className="text-sm font-black italic uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">{wo.title}</h5>
                                            <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight italic ${
                                                wo.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                                            }`}>
                                                {wo.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                            <p className="text-[10px] text-muted-foreground font-bold tracking-tight">{new Date(wo.createdAt).toLocaleDateString()} • Technician AI</p>
                                            <p className="text-[10px] font-black text-primary tracking-widest group-hover:translate-x-1 transition-transform italic uppercase">Details →</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'meters' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">TELEMETRY DATA</h4>
                            <button className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 active:scale-90">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {asset.meters?.length === 0 ? (
                                <div className="py-20 text-center space-y-6">
                                    <Zap className="w-12 h-12 mx-auto text-muted-foreground opacity-10" />
                                    <p className="text-xs text-muted-foreground italic font-medium max-w-[200px] mx-auto opacity-40">No configured telemetry streams for this unit.</p>
                                </div>
                            ) : (
                                asset.meters?.map((meter: any) => (
                                    <div key={meter.id} className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.05] transition-all">
                                        <div>
                                            <p className="text-sm font-black italic uppercase tracking-tighter">{meter.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60 italic">{meter.unit}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-4xl font-black text-primary italic tracking-tighter drop-shadow-sm">{meter.currentValue || 0}</p>
                                            <p className="text-[8px] text-emerald-400 font-black tracking-widest uppercase mt-1">Live Update</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="space-y-6">
                        <div className="p-12 border-4 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center group hover:border-primary/20 hover:bg-white/[0.01] transition-all cursor-pointer">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FileText className="w-10 h-10 text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all shadow-inner" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] italic text-muted-foreground group-hover:text-white transition-colors">VIRTUAL VAULT</p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-2 italic opacity-60">Upload schematics, photos, or service manuals.</p>
                        </div>
                        <div className="space-y-3">
                            {asset.attachments?.map((file: any) => (
                                <div key={file.id} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>
                                        <p className="text-xs font-bold truncate max-w-[220px] italic tracking-tight">{file.filename}</p>
                                    </div>
                                    <button className="text-[10px] font-black text-primary hover:underline italic uppercase tracking-[0.1em]">Retrieve</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-10 bg-[#0A0A0A] border-t border-white/5 mt-auto shadow-2xl">
                <button 
                    onClick={() => onIssueWorkOrder?.(asset)}
                    className="w-full btn-primary h-16 flex items-center justify-center gap-3 active:scale-[0.98] transition-all group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span className="text-sm font-black italic tracking-widest uppercase">Issue Work Order</span>
                </button>
            </div>
        </aside>
    );
};
