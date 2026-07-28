import { useState, useEffect } from 'react';
import { 
    BarChart as BarChartIcon, 
    LineChart as LineChartIcon, 
    PieChart as PieChartIcon, 
    AreaChart as AreaChartIcon, 
    Table as TableIcon,
    Trash2, 
    Download, 
    Save, 
    FileText, 
    LayoutGrid, 
    Check, 
    HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    LineChart, 
    Line, 
    PieChart, 
    Pie, 
    Cell, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend 
} from 'recharts';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

interface CustomReportBuilderProps {
    data: any;
}

interface SavedReport {
    id: string;
    name: string;
    dimension: string;
    metric: string;
    chartType: string;
    createdAt: string;
}

const DIMENSIONS = [
    { id: 'woLocation', label: 'Location', description: 'Group by site facility or building area' },
    { id: 'woAsset', label: 'Asset', description: 'Group by machine, vehicle, or equipment' },
    { id: 'workerName', label: 'Technician', description: 'Group by assigned maintenance staff' },
    { id: 'woCategory', label: 'Work Order Category', description: 'Group by electrical, mechanical, plumbing, etc.' },
    { id: 'type', label: 'Maintenance Type', description: 'Group by preventive, reactive, safety, etc.' }
];

const METRICS = [
    { id: 'workOrderCount', label: 'Work Order Count', unit: 'orders', description: 'Total unique tickets executed' },
    { id: 'totalHours', label: 'Labor Hours', unit: 'hrs', description: 'Total labor time logged by technicians' },
    { id: 'totalLaborCost', label: 'Labor Cost', unit: '$', description: 'Total financial expenditure on labor' }
];

const CHART_TYPES = [
    { id: 'bar', label: 'Bar Chart', icon: BarChartIcon },
    { id: 'line', label: 'Line Chart', icon: LineChartIcon },
    { id: 'pie', label: 'Pie Chart', icon: PieChartIcon },
    { id: 'area', label: 'Area Chart', icon: AreaChartIcon },
    { id: 'table', label: 'Data Table', icon: TableIcon }
];

const PALETTE = ['#6366F1', '#F43F5E', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

export const CustomReportBuilder = ({ data }: CustomReportBuilderProps) => {
    const rawLogs = data?.itemizedTimeReport || [];

    // State variables
    const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [chartType, setChartType] = useState<string>('bar');
    const [reportName, setReportName] = useState<string>('');
    const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [dragOverX, setDragOverX] = useState(false);
    const [dragOverY, setDragOverY] = useState(false);

    // Load saved reports from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('juric_custom_reports');
        if (saved) {
            try {
                setSavedReports(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved reports', e);
            }
        } else {
            // Seed a default sample report
            const defaultReport: SavedReport = {
                id: 'sample-1',
                name: 'Labor Cost by Location (Sample)',
                dimension: 'woLocation',
                metric: 'totalLaborCost',
                chartType: 'bar',
                createdAt: new Date().toISOString()
            };
            setSavedReports([defaultReport]);
            localStorage.setItem('juric_custom_reports', JSON.stringify([defaultReport]));
        }
    }, []);

    // Process & Aggregate raw data based on selection
    const chartData = useEffectMemo(() => {
        if (!selectedDimension || !selectedMetric) return [];

        const groups: Record<string, { label: string; sum: number; uniqueWOs: Set<string> }> = {};

        rawLogs.forEach((log: any) => {
            let dimValue = log[selectedDimension] || 'Unassigned / General';
            if (selectedDimension === 'type') {
                dimValue = log.type || 'General Maintenance';
            }

            if (!groups[dimValue]) {
                groups[dimValue] = {
                    label: dimValue,
                    sum: 0,
                    uniqueWOs: new Set()
                };
            }

            // Uniqueness track for WO counts
            if (log.woNumber) {
                groups[dimValue].uniqueWOs.add(log.woNumber);
            } else if (log.woTitle) {
                groups[dimValue].uniqueWOs.add(log.woTitle);
            }

            // Sum metrics
            if (selectedMetric === 'totalHours') {
                groups[dimValue].sum += Number(log.totalHours) || 0;
            } else if (selectedMetric === 'totalLaborCost') {
                groups[dimValue].sum += Number(log.totalLaborCost) || 0;
            }
        });

        return Object.values(groups).map((g) => {
            let value = 0;
            if (selectedMetric === 'workOrderCount') {
                value = g.uniqueWOs.size;
            } else {
                value = Math.round(g.sum * 100) / 100; // Round to 2 decimal places
            }

            return {
                name: g.label,
                value: value
            };
        }).sort((a, b) => b.value - a.value); // Sort descending for better chart aesthetics
    }, [rawLogs, selectedDimension, selectedMetric]);

    // Aggregate helper hook replacement
    function useEffectMemo<T>(fn: () => T, deps: any[]): T {
        const [state, setState] = useState<T>(fn);
        useEffect(() => {
            setState(fn());
        }, deps);
        return state;
    }

    // Drag-and-Drop Handlers
    const handleDragStart = (e: React.DragEvent, type: 'dimension' | 'metric', id: string) => {
        e.dataTransfer.setData('text/plain', `${type}:${id}`);
    };

    const handleDropX = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverX(false);
        const dataStr = e.dataTransfer.getData('text/plain');
        if (dataStr.startsWith('dimension:')) {
            const dimId = dataStr.split(':')[1];
            setSelectedDimension(dimId);
            toast.success(`Dimension set to: ${DIMENSIONS.find(d => d.id === dimId)?.label}`);
        } else {
            toast.error('Only Dimensions can be dropped onto the X-Axis target.');
        }
    };

    const handleDropY = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverY(false);
        const dataStr = e.dataTransfer.getData('text/plain');
        if (dataStr.startsWith('metric:')) {
            const metricId = dataStr.split(':')[1];
            setSelectedMetric(metricId);
            toast.success(`Metric set to: ${METRICS.find(m => m.id === metricId)?.label}`);
        } else {
            toast.error('Only Metrics can be dropped onto the Y-Axis target.');
        }
    };

    // Save and load reports
    const handleSaveReport = () => {
        if (!reportName.trim()) {
            toast.error('Please enter a name for the report');
            return;
        }
        if (!selectedDimension || !selectedMetric) {
            toast.error('Select a dimension and a metric first');
            return;
        }

        const newReport: SavedReport = {
            id: `report-${Date.now()}`,
            name: reportName,
            dimension: selectedDimension,
            metric: selectedMetric,
            chartType: chartType,
            createdAt: new Date().toISOString()
        };

        const updated = [newReport, ...savedReports];
        setSavedReports(updated);
        localStorage.setItem('juric_custom_reports', JSON.stringify(updated));
        setIsSaveModalOpen(false);
        setReportName('');
        toast.success(`Report "${newReport.name}" saved successfully`);
    };

    const handleLoadReport = (report: SavedReport) => {
        setSelectedDimension(report.dimension);
        setSelectedMetric(report.metric);
        setChartType(report.chartType);
        toast.success(`Loaded report: ${report.name}`);
    };

    const handleDeleteReport = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedReports.filter(r => r.id !== id);
        setSavedReports(updated);
        localStorage.setItem('juric_custom_reports', JSON.stringify(updated));
        toast.success('Saved report deleted');
    };

    // Export current report configuration and data to CSV
    const exportCSV = () => {
        if (chartData.length === 0) {
            toast.error('No data to export');
            return;
        }

        const dimLabel = DIMENSIONS.find(d => d.id === selectedDimension)?.label || 'Dimension';
        const metricLabel = METRICS.find(m => m.id === selectedMetric)?.label || 'Metric';

        const headers = [dimLabel, metricLabel];
        const rows = chartData.map(d => [
            `"${d.name.replace(/"/g, '""')}"`,
            d.value.toString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `custom_report_${selectedDimension}_by_${selectedMetric}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV data exported successfully');
    };

    const resetCanvas = () => {
        setSelectedDimension(null);
        setSelectedMetric(null);
        toast.success('Canvas reset');
    };

    // Get current unit label
    const currentUnit = METRICS.find(m => m.id === selectedMetric)?.unit || '';

    return (
        <div className="space-y-8 font-inter select-none">
            {/* Control Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                        <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-bold text-slate-800 tracking-tight">Ad-Hoc BI Playground</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Drag & Drop Dimensions and Metrics to visualize</p>
                    </div>
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                    {/* Quick Saved Reports Dropdown */}
                    {savedReports.length > 0 && (
                        <div className="relative group">
                            <select 
                                onChange={(e) => {
                                    const rep = savedReports.find(r => r.id === e.target.value);
                                    if (rep) handleLoadReport(rep);
                                }}
                                value=""
                                className="h-9 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500/50 hover:bg-slate-100 transition-colors appearance-none pr-8 cursor-pointer"
                            >
                                <option value="" disabled>📁 Saved Reports ({savedReports.length})</option>
                                {savedReports.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">▼</span>
                        </div>
                    )}

                    <button 
                        onClick={resetCanvas}
                        className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-500 rounded-xl transition-all active:scale-95 flex items-center gap-2"
                    >
                        Clear Canvas
                    </button>

                    <button 
                        onClick={() => setIsSaveModalOpen(true)}
                        disabled={!selectedDimension || !selectedMetric}
                        className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-[12px] font-bold text-white rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Save className="w-3.5 h-3.5" /> Save Configuration
                    </button>

                    <button 
                        onClick={exportCSV}
                        disabled={chartData.length === 0}
                        className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-[12px] font-bold text-slate-600 rounded-xl transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Main Builder Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Panel: Field Selector Library */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Dimension Library */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">1. Dimensions (X-Axis)</span>
                            <span title="Drag to X-Axis drop zone or click to select"><HelpCircle className="w-3.5 h-3.5 text-slate-300" /></span>
                        </div>
                        
                        <div className="space-y-2.5">
                            {DIMENSIONS.map((dim) => {
                                const isSelected = selectedDimension === dim.id;
                                return (
                                    <div 
                                        key={dim.id}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, 'dimension', dim.id)}
                                        onClick={() => setSelectedDimension(dim.id)}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing text-left group",
                                            isSelected 
                                                ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20" 
                                                : "bg-slate-50/50 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[13px] font-bold text-slate-700">{dim.label}</span>
                                            {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 animate-in fade-in zoom-in-75" />}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-normal mt-1 opacity-70 group-hover:opacity-100 transition-opacity">{dim.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Metric Library */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">2. Metrics (Y-Axis)</span>
                            <span title="Drag to Y-Axis drop zone or click to select"><HelpCircle className="w-3.5 h-3.5 text-slate-300" /></span>
                        </div>

                        <div className="space-y-2.5">
                            {METRICS.map((metric) => {
                                const isSelected = selectedMetric === metric.id;
                                return (
                                    <div 
                                        key={metric.id}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, 'metric', metric.id)}
                                        onClick={() => setSelectedMetric(metric.id)}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing text-left group",
                                            isSelected 
                                                ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20" 
                                                : "bg-slate-50/50 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[13px] font-bold text-slate-700">{metric.label}</span>
                                            <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[9px] font-black text-slate-500 font-mono">{metric.unit}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-normal mt-1 opacity-70 group-hover:opacity-100 transition-opacity">{metric.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Center Panel: Drop Targets and Live Chart Canvas */}
                <div className="lg:col-span-9 space-y-6">
                    
                    {/* Visual Drop Targets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* X-Axis Dimension Drop Target */}
                        <div 
                            onDragOver={(e) => { e.preventDefault(); setDragOverX(true); }}
                            onDragLeave={() => setDragOverX(false)}
                            onDrop={handleDropX}
                            className={cn(
                                "border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all min-h-[100px]",
                                dragOverX 
                                    ? "border-indigo-500 bg-indigo-50/40 scale-[1.01]" 
                                    : selectedDimension 
                                        ? "border-indigo-100 bg-indigo-50/10" 
                                        : "border-slate-200 bg-white"
                            )}
                        >
                            {selectedDimension ? (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">X-Axis Grouping</span>
                                    <div className="flex items-center gap-2 bg-indigo-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md shadow-indigo-100">
                                        <span>{DIMENSIONS.find(d => d.id === selectedDimension)?.label}</span>
                                        <button onClick={() => setSelectedDimension(null)} className="hover:text-red-200 font-bold ml-1">×</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm font-bold text-slate-500">Drag a Dimension Here</p>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">X-Axis representation</p>
                                </div>
                            )}
                        </div>

                        {/* Y-Axis Metric Drop Target */}
                        <div 
                            onDragOver={(e) => { e.preventDefault(); setDragOverY(true); }}
                            onDragLeave={() => setDragOverY(false)}
                            onDrop={handleDropY}
                            className={cn(
                                "border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all min-h-[100px]",
                                dragOverY 
                                    ? "border-emerald-500 bg-emerald-50/40 scale-[1.01]" 
                                    : selectedMetric 
                                        ? "border-emerald-100 bg-emerald-50/10" 
                                        : "border-slate-200 bg-white"
                            )}
                        >
                            {selectedMetric ? (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Y-Axis Metric</span>
                                    <div className="flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md shadow-emerald-100">
                                        <span>{METRICS.find(m => m.id === selectedMetric)?.label}</span>
                                        <button onClick={() => setSelectedMetric(null)} className="hover:text-red-200 font-bold ml-1">×</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm font-bold text-slate-500">Drag a Metric Here</p>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Y-Axis representation</p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Chart Canvas */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm min-h-[480px] flex flex-col relative overflow-hidden">
                        
                        {/* Selector Controls for Chart Type */}
                        {selectedDimension && selectedMetric && (
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 shrink-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[14px] font-bold text-slate-800">Visualizer Output</h4>
                                </div>

                                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                                    {CHART_TYPES.map((type) => {
                                        const isSelected = chartType === type.id;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => setChartType(type.id)}
                                                className={cn(
                                                    "p-2 rounded-lg flex items-center justify-center transition-all",
                                                    isSelected ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                                )}
                                                title={type.label}
                                            >
                                                <type.icon className="w-4 h-4" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Chart Render Canvas */}
                        <div className="flex-1 w-full flex flex-col justify-center">
                            {!selectedDimension || !selectedMetric ? (
                                <div className="text-center py-20 max-w-sm mx-auto space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mx-auto animate-bounce-subtle">
                                        <LayoutGrid className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[15px] font-black text-slate-700">Canvas Awaiting Configuration</p>
                                        <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                                            Select fields from the left menu or drag them onto the active dashed drop zones to build your custom business intelligence report.
                                        </p>
                                    </div>
                                </div>
                            ) : chartData.length === 0 ? (
                                <div className="text-center py-20 space-y-4">
                                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto border border-amber-100">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[15px] font-black text-slate-700">No Relational Match Found</p>
                                        <p className="text-[12px] text-slate-400 font-medium">The selected dimensions have no corresponding time logs matching this profile.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex-1 min-h-[380px]">
                                    
                                    {/* DATA TABLE VIEW */}
                                    {chartType === 'table' ? (
                                        <div className="border border-slate-150 rounded-2xl overflow-hidden mt-2 max-h-[360px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
                                                            {DIMENSIONS.find(d => d.id === selectedDimension)?.label}
                                                        </th>
                                                        <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 text-right">
                                                            {METRICS.find(m => m.id === selectedMetric)?.label} ({currentUnit})
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-[13px]">
                                                    {chartData.map((d, index) => (
                                                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-3.5 font-bold text-slate-700">{d.name}</td>
                                                            <td className="px-6 py-3.5 font-mono text-slate-900 text-right font-bold">
                                                                {currentUnit === '$' ? `$${d.value.toLocaleString()}` : `${d.value.toLocaleString()} ${currentUnit}`}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            {/* BAR CHART */}
                                            {chartType === 'bar' ? (
                                                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => currentUnit === '$' ? `$${v}` : v} />
                                                    <Tooltip cursor={{ fill: '#F8FAFC' }} formatter={(value: any) => [currentUnit === '$' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} ${currentUnit}`, METRICS.find(m => m.id === selectedMetric)?.label]} />
                                                    <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={40}>
                                                        {chartData.map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            ) : 
                                            
                                            // LINE CHART
                                            chartType === 'line' ? (
                                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => currentUnit === '$' ? `$${v}` : v} />
                                                    <Tooltip formatter={(value: any) => [currentUnit === '$' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} ${currentUnit}`, METRICS.find(m => m.id === selectedMetric)?.label]} />
                                                    <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ r: 5, fill: '#ffffff', strokeWidth: 3, stroke: '#6366F1' }} activeDot={{ r: 7 }} />
                                                </LineChart>
                                            ) :
                                            
                                            // PIE CHART
                                            chartType === 'pie' ? (
                                                <PieChart>
                                                    <Pie
                                                        data={chartData}
                                                        cx="50%"
                                                        cy="45%"
                                                        innerRadius={80}
                                                        outerRadius={120}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                    >
                                                        {chartData.map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value: any) => [currentUnit === '$' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} ${currentUnit}`, METRICS.find(m => m.id === selectedMetric)?.label]} />
                                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                                                </PieChart>
                                            ) :
                                            
                                            // AREA CHART
                                            (
                                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                                                    <defs>
                                                        <linearGradient id="customColorGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => currentUnit === '$' ? `$${v}` : v} />
                                                    <Tooltip formatter={(value: any) => [currentUnit === '$' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} ${currentUnit}`, METRICS.find(m => m.id === selectedMetric)?.label]} />
                                                    <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#customColorGradient)" />
                                                </AreaChart>
                                            )}
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                </div>

            </div>

            {/* Saved Reports Table/Admin Drawer */}
            {savedReports.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-3">
                        📁 Saved Reports Ledger
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedReports.map((report) => {
                            const dimLabel = DIMENSIONS.find(d => d.id === report.dimension)?.label || report.dimension;
                            const metricLabel = METRICS.find(m => m.id === report.metric)?.label || report.metric;
                            return (
                                <div 
                                    key={report.id}
                                    onClick={() => handleLoadReport(report)}
                                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/5 hover:shadow-sm transition-all cursor-pointer flex justify-between items-start group"
                                >
                                    <div className="space-y-1">
                                        <p className="text-[13px] font-bold text-slate-700">{report.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {metricLabel} by {dimLabel} • <span className="font-mono text-[9px]">{report.chartType.toUpperCase()}</span>
                                        </p>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDeleteReport(report.id, e)}
                                        className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors"
                                        title="Delete saved configuration"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Save Report Modal Dialog */}
            <AnimatePresence>
                {isSaveModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/25 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-5"
                        >
                            <div className="space-y-2">
                                <h3 className="text-md font-bold text-slate-800">Save Custom BI Configuration</h3>
                                <p className="text-xs text-slate-400 font-medium">This will capture your selected dimensions, metric target, and chart representation format to local presets.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Report Name</label>
                                <input 
                                    type="text" 
                                    value={reportName}
                                    onChange={(e) => setReportName(e.target.value)}
                                    placeholder="e.g., Q3 Mechanical Repairs Cost"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-500/50 outline-none transition-colors placeholder:text-slate-400"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button 
                                    onClick={() => { setIsSaveModalOpen(false); setReportName(''); }}
                                    className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 text-[12px] font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveReport}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-[12px] font-bold text-white rounded-xl shadow-lg shadow-indigo-100 transition-colors"
                                >
                                    Save Config
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};
