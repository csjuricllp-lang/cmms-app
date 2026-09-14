import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
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
    HelpCircle,
    Globe,
    Lock,
    Pencil,
    Loader2
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
    description?: string;
    isShared: boolean;
    userId: string;
    config: {
        dimension: string;
        metric: string;
        chartType: string;
    };
    createdAt: string;
}

const ENTITY_TYPE = 'ANALYTICS_REPORT';

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

const PALETTE = ['hsl(var(--primary-raw))', '#F43F5E', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

export const CustomReportBuilder = ({ data }: CustomReportBuilderProps) => {
    const queryClient = useQueryClient();


    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const currentUserId = currentUser?.id;
    const userRole = currentUser?.role || '';
    const isAdmin = ['ADMIN', 'LIMITED_ADMIN'].includes(userRole);

    const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [chartType, setChartType] = useState<string>('bar');
    const [reportName, setReportName] = useState<string>('');
    const [reportDescription, setReportDescription] = useState<string>('');
    const [isSharedNew, setIsSharedNew] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [editingReport, setEditingReport] = useState<SavedReport | null>(null);
    const [dragOverX, setDragOverX] = useState(false);
    const [dragOverY, setDragOverY] = useState(false);
    const [dataSource, setDataSource] = useState<'TIME_LOGS' | 'WORK_ORDERS'>('TIME_LOGS');

    const { data: savedReports = [], isLoading: reportsLoading } = useQuery<SavedReport[]>({
        queryKey: ['saved-views', ENTITY_TYPE],
        queryFn: async () => {
            const res = await api.get('/saved-views', { params: { entityType: ENTITY_TYPE } });
            return res.data;
        },
        staleTime: 30_000,
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: { name: string; description?: string; config: any; isShared: boolean }) => {
            if (editingReport) {
                return api.patch(`/saved-views/${editingReport.id}`, {
                    name: payload.name,
                    description: payload.description,
                    config: payload.config,
                    isShared: payload.isShared,
                });
            }
            return api.post('/saved-views', {
                name: payload.name,
                description: payload.description,
                entityType: ENTITY_TYPE,
                config: payload.config,
                isShared: payload.isShared,
            });
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['saved-views', ENTITY_TYPE] });
            toast.success(editingReport ? `Report "${vars.name}" updated!` : `Report "${vars.name}" saved!`);
            setIsSaveModalOpen(false);
            setEditingReport(null);
            setReportName('');
            setReportDescription('');
            setIsSharedNew(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to save report.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/saved-views/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-views', ENTITY_TYPE] });
            toast.success('Report deleted.');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to delete report.');
        },
    });

    const { data: chartDataResponse } = useQuery({
        queryKey: ['custom-report', dataSource, selectedDimension, selectedMetric],
        queryFn: async () => {
            if (!selectedDimension || !selectedMetric) return [];
            const res = await api.get('/analytics/build-report', {
                params: { dataSource, dimension: selectedDimension, metric: selectedMetric }
            });
            return res.data.data;
        },
        enabled: !!selectedDimension && !!selectedMetric,
    });
    
    const chartData = chartDataResponse || [];

    const handleDragStart = (e: React.DragEvent, type: 'dimension' | 'metric', id: string) => {
        e.dataTransfer.setData('text/plain', `${type}:${id}`);
    };
    const handleDropX = (e: React.DragEvent) => {
        e.preventDefault(); setDragOverX(false);
        const d = e.dataTransfer.getData('text/plain');
        if (d.startsWith('dimension:')) { setSelectedDimension(d.split(':')[1]); toast.success('Dimension set'); }
        else toast.error('Only Dimensions can go on the X-Axis.');
    };
    const handleDropY = (e: React.DragEvent) => {
        e.preventDefault(); setDragOverY(false);
        const d = e.dataTransfer.getData('text/plain');
        if (d.startsWith('metric:')) { setSelectedMetric(d.split(':')[1]); toast.success('Metric set'); }
        else toast.error('Only Metrics can go on the Y-Axis.');
    };

    const handleOpenSaveModal = (report?: SavedReport) => {
        if (report) {
            setEditingReport(report);
            setReportName(report.name);
            setReportDescription(report.description || '');
            setIsSharedNew(report.isShared);
        } else {
            setEditingReport(null);
            setReportName('');
            setReportDescription('');
            setIsSharedNew(false);
        }
        setIsSaveModalOpen(true);
    };

    const handleSaveReport = () => {
        if (!reportName.trim()) { toast.error('Please enter a report name.'); return; }
        if (!selectedDimension || !selectedMetric) { toast.error('Select a dimension and metric first.'); return; }
        saveMutation.mutate({ name: reportName.trim(), description: reportDescription.trim() || undefined, config: { dimension: selectedDimension, metric: selectedMetric, chartType, dataSource }, isShared: isSharedNew });
    };

    const handleLoadReport = (report: SavedReport) => {
        setSelectedDimension(report.config.dimension);
        setSelectedMetric(report.config.metric);
        setChartType(report.config.chartType || 'bar');
        if (report.config.dataSource) setDataSource(report.config.dataSource);
        toast.success(`Loaded: ${report.name}`);
    };

    const handleDeleteReport = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteMutation.mutate(id);
    };

    const exportCSV = () => {
        if (chartData.length === 0) { toast.error('No data to export.'); return; }
        const dimLabel = DIMENSIONS.find(d => d.id === selectedDimension)?.label || 'Dimension';
        const metricLabel = METRICS.find(m => m.id === selectedMetric)?.label || 'Metric';
        const rows = chartData.map(d => [`"${d.name.replace(/"/g, '""')}"`, d.value.toString()]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [[dimLabel, metricLabel].join(','), ...rows.map(e => e.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `report_${selectedDimension}_by_${selectedMetric}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        toast.success('CSV exported!');
    };

    const currentUnit = METRICS.find(m => m.id === selectedMetric)?.unit || '';

    return (
        <div className="space-y-8 font-inter select-none">
            {/* Control Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-4 border border-border rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary shadow-sm shrink-0">
                        <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-[14px] font-bold text-slate-800 tracking-tight">Ad-Hoc BI Playground</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Drag & Drop Dimensions and Metrics to visualize</p>
                    </div>
                </div>
                <div className="flex items-center flex-wrap gap-2.5">
                    <div className="flex bg-muted p-1 rounded-xl border border-slate-200/50 mr-2">
                        <button onClick={() => setDataSource('TIME_LOGS')} className={cn('px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all', dataSource === 'TIME_LOGS' ? 'bg-card text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600')}>Time Logs</button>
                        <button onClick={() => setDataSource('WORK_ORDERS')} className={cn('px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all', dataSource === 'WORK_ORDERS' ? 'bg-card text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600')}>Work Orders</button>
                    </div>
                    {savedReports.length > 0 && (
                        <div className="relative">
                            <select onChange={(e) => { const r = savedReports.find(r => r.id === e.target.value); if (r) handleLoadReport(r); e.target.value = ''; }} defaultValue=""
                                className="h-9 px-4 bg-transparent border border-border rounded-xl text-[12px] font-bold text-foreground/90 focus:outline-none hover:bg-muted transition-colors appearance-none pr-8 cursor-pointer">
                                <option value="" disabled>📁 Saved Reports ({savedReports.length})</option>
                                {savedReports.map(r => <option key={r.id} value={r.id}>{r.isShared ? '🌐 ' : '🔒 '}{r.name}</option>)}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">▼</span>
                        </div>
                    )}
                    <button onClick={() => { setSelectedDimension(null); setSelectedMetric(null); toast.success('Canvas reset'); }}
                        className="h-9 px-3.5 border border-border bg-card hover:bg-transparent text-[12px] font-bold text-muted-foreground rounded-xl transition-all active:scale-95">Clear Canvas</button>
                    <button onClick={() => handleOpenSaveModal()} disabled={!selectedDimension || !selectedMetric}
                        className="h-9 px-3.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-[12px] font-bold text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2">
                        <Save className="w-3.5 h-3.5" /> Save Report
                    </button>
                    <button onClick={exportCSV} disabled={chartData.length === 0}
                        className="h-9 px-3.5 border border-border bg-card hover:bg-transparent disabled:opacity-50 text-[12px] font-bold text-slate-600 rounded-xl transition-all active:scale-95 flex items-center gap-2">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Main Builder */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">1. Dimensions (X-Axis)</span>
                            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                        <div className="space-y-2.5">
                            {DIMENSIONS.map((dim) => (
                                <div key={dim.id} draggable onDragStart={(e) => handleDragStart(e, 'dimension', dim.id)} onClick={() => setSelectedDimension(dim.id)}
                                    className={cn('p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing text-left group',
                                        selectedDimension === dim.id ? 'bg-primary/10 border-primary/20 ring-2 ring-primary/20' : 'bg-transparent/50 border-slate-200/60 hover:bg-transparent hover:border-slate-300')}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] font-bold text-foreground/90">{dim.label}</span>
                                        {selectedDimension === dim.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-normal mt-1">{dim.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">2. Metrics (Y-Axis)</span>
                            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                        <div className="space-y-2.5">
                            {METRICS.map((metric) => (
                                <div key={metric.id} draggable onDragStart={(e) => handleDragStart(e, 'metric', metric.id)} onClick={() => setSelectedMetric(metric.id)}
                                    className={cn('p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing text-left group',
                                        selectedMetric === metric.id ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20' : 'bg-transparent/50 border-slate-200/60 hover:bg-transparent hover:border-slate-300')}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] font-bold text-foreground/90">{metric.label}</span>
                                        <span className="px-1.5 py-0.5 rounded-md bg-card border border-border text-[9px] font-black text-muted-foreground font-mono">{metric.unit}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-normal mt-1">{metric.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-9 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div onDragOver={(e) => { e.preventDefault(); setDragOverX(true); }} onDragLeave={() => setDragOverX(false)} onDrop={handleDropX}
                            className={cn('border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all min-h-[100px]',
                                dragOverX ? 'border-primary/80 bg-primary/5 scale-[1.01]' : selectedDimension ? 'border-primary/20 bg-primary/5' : 'border-border bg-card')}>
                            {selectedDimension ? (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest block">X-Axis Grouping</span>
                                    <div className="flex items-center gap-2 bg-primary text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md shadow-primary/20">
                                        <span>{DIMENSIONS.find(d => d.id === selectedDimension)?.label}</span>
                                        <button onClick={() => setSelectedDimension(null)} className="hover:text-red-200 font-bold ml-1">×</button>
                                    </div>
                                </div>
                            ) : <div><p className="text-sm font-bold text-muted-foreground">Drag a Dimension Here</p><p className="text-[11px] text-slate-400 font-medium mt-0.5">X-Axis representation</p></div>}
                        </div>
                        <div onDragOver={(e) => { e.preventDefault(); setDragOverY(true); }} onDragLeave={() => setDragOverY(false)} onDrop={handleDropY}
                            className={cn('border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all min-h-[100px]',
                                dragOverY ? 'border-emerald-500 bg-emerald-50/40 scale-[1.01]' : selectedMetric ? 'border-emerald-100 bg-emerald-50/10' : 'border-border bg-card')}>
                            {selectedMetric ? (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Y-Axis Metric</span>
                                    <div className="flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold">
                                        <span>{METRICS.find(m => m.id === selectedMetric)?.label}</span>
                                        <button onClick={() => setSelectedMetric(null)} className="hover:text-red-200 font-bold ml-1">×</button>
                                    </div>
                                </div>
                            ) : <div><p className="text-sm font-bold text-muted-foreground">Drag a Metric Here</p><p className="text-[11px] text-slate-400 font-medium mt-0.5">Y-Axis representation</p></div>}
                        </div>
                    </div>

                    <div className="bg-card rounded-3xl border border-border p-8 shadow-sm min-h-[480px] flex flex-col relative overflow-hidden">
                        {selectedDimension && selectedMetric && (
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 shrink-0">
                                <h4 className="text-[14px] font-bold text-slate-800">Visualizer Output</h4>
                                <div className="flex bg-muted p-1 rounded-xl border border-slate-200/50">
                                    {CHART_TYPES.map((type) => (
                                        <button key={type.id} onClick={() => setChartType(type.id)} title={type.label}
                                            className={cn('p-2 rounded-lg flex items-center justify-center transition-all', chartType === type.id ? 'bg-card text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                                            <type.icon className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex-1 w-full flex flex-col justify-center">
                            {!selectedDimension || !selectedMetric ? (
                                <div className="text-center py-20 max-w-sm mx-auto space-y-4">
                                    <div className="w-16 h-16 bg-transparent rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mx-auto"><LayoutGrid className="w-8 h-8" /></div>
                                    <p className="text-[15px] font-black text-foreground/90">Canvas Awaiting Configuration</p>
                                    <p className="text-[12px] text-slate-400 font-medium leading-relaxed">Select fields from the left panel or drag them onto the drop zones.</p>
                                </div>
                            ) : chartData.length === 0 ? (
                                <div className="text-center py-20 space-y-4">
                                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto border border-amber-100"><FileText className="w-8 h-8" /></div>
                                    <p className="text-[15px] font-black text-foreground/90">No Relational Match Found</p>
                                    <p className="text-[12px] text-slate-400 font-medium">No {dataSource === 'TIME_LOGS' ? 'time logs' : 'work orders'} match this combination.</p>
                                </div>
                            ) : (
                                <div className="w-full h-full flex-1 min-h-[380px]">
                                    {chartType === 'table' ? (
                                        <div className="border border-slate-150 rounded-2xl overflow-hidden mt-2 max-h-[360px] overflow-y-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-primary"><tr>
                                                    <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white/90">{DIMENSIONS.find(d => d.id === selectedDimension)?.label}</th>
                                                    <th className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white/90 text-right">{METRICS.find(m => m.id === selectedMetric)?.label} ({currentUnit})</th>
                                                </tr></thead>
                                                <tbody className="divide-y divide-slate-100 text-[13px]">
                                                    {chartData.map((d, i) => (
                                                        <tr key={i} className="hover:bg-muted/50 transition-colors">
                                                            <td className="px-6 py-3.5 font-bold text-foreground/90">{d.name}</td>
                                                            <td className="px-6 py-3.5 font-mono text-foreground text-right font-bold">{currentUnit === '$' ? `$${d.value.toLocaleString()}` : `${d.value.toLocaleString()} ${currentUnit}`}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            {chartType === 'bar' ? (
                                                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => currentUnit === '$' ? `$${v}` : v} />
                                                    <Tooltip cursor={{ fill: '#F8FAFC' }} formatter={(value: any) => [currentUnit === '$' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} ${currentUnit}`, METRICS.find(m => m.id === selectedMetric)?.label]} />
                                                    <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={40}>
                                                        {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />)}
                                                    </Bar>
                                                </BarChart>
                                            ) : chartType === 'line' ? (
                                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => currentUnit === '$' ? `$${v}` : v} />
                                                    <Tooltip formatter={(value: any) => [currentUnit === '$' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} ${currentUnit}`, METRICS.find(m => m.id === selectedMetric)?.label]} />
                                                    <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ r: 5, fill: '#fff', strokeWidth: 3, stroke: '#6366F1' }} activeDot={{ r: 7 }} />
                                                </LineChart>
                                            ) : chartType === 'pie' ? (
                                                <PieChart>
                                                    <Pie data={chartData} cx="50%" cy="45%" innerRadius={80} outerRadius={120} paddingAngle={4} dataKey="value">
                                                        {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />)}
                                                    </Pie>
                                                    <Tooltip formatter={(value: any) => [currentUnit === '$' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} ${currentUnit}`, METRICS.find(m => m.id === selectedMetric)?.label]} />
                                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                                                </PieChart>
                                            ) : (
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

            {/* Saved Reports Ledger */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-[12px] font-black text-muted-foreground uppercase tracking-widest">📁 Saved Reports</h4>
                    {reportsLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                </div>
                {savedReports.length === 0 && !reportsLoading && (
                    <p className="text-[12px] text-slate-400 font-medium text-center py-6">No saved reports yet. Build a chart and click "Save Report".</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedReports.map((report) => {
                        const dimLabel = DIMENSIONS.find(d => d.id === report.config?.dimension)?.label || report.config?.dimension;
                        const metricLabel = METRICS.find(m => m.id === report.config?.metric)?.label || report.config?.metric;
                        const isOwner = report.userId === currentUserId;
                        const canEdit = isOwner || isAdmin;
                        return (
                            <div key={report.id} onClick={() => handleLoadReport(report)}
                                className="p-4 rounded-xl border border-border hover:border-indigo-300 bg-transparent/50 hover:bg-primary/5 hover:shadow-sm transition-all cursor-pointer flex justify-between items-start group">
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        {report.isShared ? <Globe className="w-3 h-3 text-indigo-400 shrink-0" title="Shared with org" /> : <Lock className="w-3 h-3 text-slate-300 shrink-0" title="Private" />}
                                        <p className="text-[13px] font-bold text-foreground/90 truncate">{report.name}</p>
                                    </div>
                                    {report.description && <p className="text-[11px] text-slate-400 font-medium truncate">{report.description}</p>}
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{metricLabel} by {dimLabel} • <span className="font-mono text-[9px]">{report.config?.chartType?.toUpperCase()}</span></p>
                                </div>
                                <div className="flex items-center gap-1 ml-2 shrink-0">
                                    {canEdit && (
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenSaveModal(report); }}
                                            className="text-slate-300 hover:text-indigo-500 p-1 rounded-md transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                                    )}
                                    {canEdit && (
                                        <button onClick={(e) => handleDeleteReport(report.id, e)}
                                            className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors" title="Delete">
                                            {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Save/Edit Modal */}
            <AnimatePresence>
                {isSaveModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/25 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 space-y-5">
                            <div className="space-y-1">
                                <h3 className="text-md font-bold text-slate-800">{editingReport ? 'Edit Report' : 'Save Custom Report'}</h3>
                                <p className="text-xs text-slate-400 font-medium">Reports are stored in your account and persist across all sessions and devices.</p>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Report Name *</label>
                                    <input type="text" value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="e.g., Q3 Mechanical Repairs Cost"
                                        className="w-full px-4 py-2 bg-transparent border border-border rounded-xl text-sm font-semibold text-foreground focus:border-primary/50 outline-none transition-colors placeholder:text-slate-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Description (optional)</label>
                                    <input type="text" value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} placeholder="What does this report measure?"
                                        className="w-full px-4 py-2 bg-transparent border border-border rounded-xl text-sm font-semibold text-foreground focus:border-primary/50 outline-none transition-colors placeholder:text-slate-400" />
                                </div>
                                {isAdmin && (
                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                                        <input type="checkbox" checked={isSharedNew} onChange={(e) => setIsSharedNew(e.target.checked)} className="w-4 h-4 accent-indigo-600 rounded" />
                                        <div>
                                            <p className="text-[13px] font-bold text-foreground/90 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-indigo-500" /> Share with entire organization</p>
                                            <p className="text-[11px] text-slate-400 font-medium">All org members can view and load this report.</p>
                                        </div>
                                    </label>
                                )}
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button onClick={() => { setIsSaveModalOpen(false); setEditingReport(null); }}
                                    className="px-4 py-2 border border-border text-muted-foreground hover:bg-transparent text-[12px] font-bold rounded-xl transition-colors">Cancel</button>
                                <button onClick={handleSaveReport} disabled={saveMutation.isPending}
                                    className="px-5 py-2 bg-primary hover:bg-primary/90 text-[12px] font-bold text-white rounded-xl shadow-lg shadow-primary/20 transition-colors flex items-center gap-2 disabled:opacity-70">
                                    {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {editingReport ? 'Update Report' : 'Save Report'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
