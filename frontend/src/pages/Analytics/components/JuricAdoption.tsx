import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell } from 'recharts';
import { Widget } from './Widget';
import { CHART_COLORS } from '../dashboards';
import type { AnalyticsData } from '../types';

export const JuricAdoption = ({ data }: { data: AnalyticsData }) => {
    const adoptionMetricsSafe = data?.adoptionMetrics || {};
    
    const health = adoptionMetricsSafe.health || {
        completionPercentage: "0.0",
        onTimePercentage: "0.0",
        pieCharts: {
            hasCategory: { yes: 0, no: 0 },
            hasDueDate: { yes: 0, no: 0 },
            hasAsset: { yes: 0, no: 0 },
            hasLocation: { yes: 0, no: 0 }
        }
    };
    
    const pieCharts = health.pieCharts || {
        hasCategory: { yes: 0, no: 0 },
        hasDueDate: { yes: 0, no: 0 },
        hasAsset: { yes: 0, no: 0 },
        hasLocation: { yes: 0, no: 0 }
    };
    
    health.pieCharts = pieCharts;
    health.pieCharts.hasCategory = pieCharts.hasCategory || { yes: 0, no: 0 };
    health.pieCharts.hasDueDate = pieCharts.hasDueDate || { yes: 0, no: 0 };
    health.pieCharts.hasAsset = pieCharts.hasAsset || { yes: 0, no: 0 };
    health.pieCharts.hasLocation = pieCharts.hasLocation || { yes: 0, no: 0 };

    const pmHealth = adoptionMetricsSafe.pmHealth || {
        reactiveVsRecurring: { reactive: 0, recurring: 0 },
        assetCoverage: { covered: 0, notCovered: 0 }
    };
    
    pmHealth.reactiveVsRecurring = pmHealth.reactiveVsRecurring || { reactive: 0, recurring: 0 };
    pmHealth.assetCoverage = pmHealth.assetCoverage || { covered: 0, notCovered: 0 };

    const userAdoption = adoptionMetricsSafe.userAdoption || {
        activeUsersLast7Days: 0,
        requestVolume: []
    };
    
    userAdoption.requestVolume = userAdoption.requestVolume || [];

    const timeReport = adoptionMetricsSafe.timeReport || {
        percentWithTime: "0.0",
        workerTable: []
    };
    
    timeReport.workerTable = timeReport.workerTable || [];

    return (
        <div className="space-y-10 pb-20 font-inter">
            {/* Header & Filters */}
            <div className="space-y-8">
                <h2 className="text-[42px] font-medium text-slate-900 tracking-tight">Juric Adoption Metrics</h2>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Section 1: Work Order Health */}
            <div className="space-y-6">
                <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-widest text-center">Work Order Health</h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-sm h-[200px]">
                            <span className="text-[42px] font-black tracking-tighter text-slate-800 mb-1">{health.completionPercentage}%</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Completion Percentage</span>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-sm h-[200px]">
                            <span className="text-[42px] font-black tracking-tighter text-slate-800 mb-1">{health.onTimePercentage}%</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">On-Time Percentage</span>
                        </div>
                    </div>
                    <div className="lg:col-span-3 space-y-6">
                        <Widget title="Work Orders Created vs Completed by Month" className="h-[200px]" data={data?.teamPerformance?.monthlyTrend || []}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.teamPerformance?.monthlyTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <Tooltip />
                                    <Bar dataKey="created" fill="#60A5FA" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Bar dataKey="completed" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Widget>
                        <Widget title="Work Orders Completed vs Task List by Month" className="h-[200px]" data={data?.teamPerformance?.monthlyTrend || []}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.teamPerformance?.monthlyTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <Tooltip />
                                    <Bar dataKey="completed" fill="#60A5FA" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Widget>
                    </div>
                </div>
                {/* Meta Pie Charts */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Work Orders with a Category', data: [{ name: 'Yes', value: health.pieCharts.hasCategory.yes }, { name: 'No', value: health.pieCharts.hasCategory.no }] },
                        { title: 'Work Orders with a Due Date', data: [{ name: 'Yes', value: health.pieCharts.hasDueDate.yes }, { name: 'No', value: health.pieCharts.hasDueDate.no }] },
                        { title: 'Work Orders with an Asset', data: [{ name: 'Yes', value: health.pieCharts.hasAsset.yes }, { name: 'No', value: health.pieCharts.hasAsset.no }] },
                        { title: 'Work Orders with a Location', data: [{ name: 'Yes', value: health.pieCharts.hasLocation.yes }, { name: 'No', value: health.pieCharts.hasLocation.no }] },
                    ].map((chart, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-[200px] flex flex-col items-center">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">{chart.title}</span>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chart.data} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                                        {chart.data.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 2: PM Health */}
            <div className="space-y-6">
                <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-widest text-center">PM Health</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Widget title="Reactive vs Recurring Work Orders" className="h-[250px] flex flex-col items-center" data={[{ name: 'Recurring', value: pmHealth.reactiveVsRecurring.recurring }, { name: 'Reactive', value: pmHealth.reactiveVsRecurring.reactive }]}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{ name: 'Recurring', value: pmHealth.reactiveVsRecurring.recurring }, { name: 'Reactive', value: pmHealth.reactiveVsRecurring.reactive }]} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                    <Cell fill="#60A5FA" /><Cell fill="#F43F5E" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Widget>
                    <Widget title="PM Asset Coverage" className="h-[250px] flex flex-col items-center" data={[{ name: 'Covered', value: pmHealth.assetCoverage.covered }, { name: 'Not Covered', value: pmHealth.assetCoverage.notCovered }]}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{ name: 'Covered', value: pmHealth.assetCoverage.covered }, { name: 'Not Covered', value: pmHealth.assetCoverage.notCovered }]} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                    <Cell fill="#60A5FA" /><Cell fill="#F43F5E" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Widget>
                </div>
            </div>

            {/* Section 3: User Adoption Health */}
            <div className="space-y-6">
                <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-widest text-center">User Adoption Health</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Widget title="Users Active within 7 Days" data={[{ name: 'Active', value: userAdoption.activeUsersLast7Days }]}>
                        <div className="h-[200px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{ name: 'Active', value: userAdoption.activeUsersLast7Days }]}>
                                    <XAxis dataKey="name" hide /><YAxis hide /><Tooltip />
                                    <Bar dataKey="value" fill="#60A5FA" barSize={300} radius={[8, 8, 8, 8]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Widget>
                    <Widget title="Number of Requests Submitted" data={userAdoption.requestVolume}>
                        <div className="h-[200px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userAdoption.requestVolume}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                                    <Tooltip /><Bar dataKey="value" fill="#60A5FA" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Widget>
                </div>
            </div>

            {/* Section 4: Time by Worker Report */}
            <div className="space-y-6">
                <h3 className="text-[14px] font-bold text-slate-500 uppercase tracking-widest text-center">Time by Worker Report</h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-8 shadow-sm h-[300px]">
                        <span className="text-[42px] font-black text-slate-800 mb-1">{timeReport.percentWithTime}%</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Percent of Work Orders with Time Logged</span>
                    </div>
                    <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[300px]">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    {['Full Name', 'Last Logged Date', 'Time Recorded', 'Work Order Count'].map((h, i) => (
                                        <th key={i} className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {timeReport.workerTable.map((worker: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-[13px] font-bold text-slate-700">{worker.name}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-500">{worker.lastLogged}</td>
                                        <td className="px-6 py-4 text-[13px] font-bold text-indigo-600">{worker.totalTime} hrs</td>
                                        <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{worker.woCount}</td>
                                    </tr>
                                ))}
                                {timeReport.workerTable.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-[13px]">No time logs recorded in this period</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
