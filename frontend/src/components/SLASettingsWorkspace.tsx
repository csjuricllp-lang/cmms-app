import { ShieldCheck } from 'lucide-react';

export const SLASettingsWorkspace = () => {
    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">SLA Configuration</h2>
                <p className="text-slate-500 font-medium mt-1 text-[15px]">Define Service Level Agreements for work orders and configure escalation rules.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Priority Targets</h3>
                        <p className="text-[13px] text-slate-500 font-medium">Set response and resolution times based on priority.</p>
                    </div>
                </div>
                
                <div className="p-6">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Priority Level</th>
                                <th className="pb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Response Time (Hours)</th>
                                <th className="pb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Resolution Time (Hours)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(priority => (
                                <tr key={priority}>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                                priority === 'CRITICAL' ? 'bg-rose-500' :
                                                priority === 'HIGH' ? 'bg-rose-400' :
                                                priority === 'MEDIUM' ? 'bg-amber-400' :
                                                'bg-blue-400'
                                            }`} />
                                            <span className="text-[13px] font-bold text-slate-700">{priority}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <input type="number" defaultValue={priority === 'CRITICAL' ? 1 : priority === 'HIGH' ? 4 : priority === 'MEDIUM' ? 24 : 72} className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </td>
                                    <td className="py-4">
                                        <input type="number" defaultValue={priority === 'CRITICAL' ? 4 : priority === 'HIGH' ? 24 : priority === 'MEDIUM' ? 72 : 168} className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Escalation & Alerts</h3>
                        <p className="text-[13px] text-slate-500 font-medium">Configure what happens when an SLA is breached.</p>
                    </div>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 w-5 h-5 rounded border-2 border-indigo-600 bg-indigo-600 flex items-center justify-center text-white">
                            <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <h4 className="text-[14px] font-bold text-slate-800">Enable Escalation Protocol</h4>
                            <p className="text-[13px] text-slate-500 mt-0.5">Automatically mark work orders as 'Escalated' when targets are missed.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 w-5 h-5 rounded border-2 border-indigo-600 bg-indigo-600 flex items-center justify-center text-white">
                            <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <h4 className="text-[14px] font-bold text-slate-800">Send Breach Notifications</h4>
                            <p className="text-[13px] text-slate-500 mt-0.5">Notify assigned technicians and managers when SLA targets are breached.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
