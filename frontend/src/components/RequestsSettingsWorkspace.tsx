import { useState } from 'react';

type FieldOption = 'Optional' | 'Hidden' | 'Required';

interface FieldConfig {
    id: string;
    label: string;
    duringCreate: FieldOption;
    duringApproval: FieldOption;
}

const DEFAULT_FIELDS: FieldConfig[] = [
    { id: 'title', label: 'Title', duringCreate: 'Required', duringApproval: 'Required' },
    { id: 'description', label: 'Description', duringCreate: 'Optional', duringApproval: 'Optional' },
    { id: 'priority', label: 'Priority', duringCreate: 'Optional', duringApproval: 'Optional' },
    { id: 'images', label: 'Images', duringCreate: 'Optional', duringApproval: 'Optional' },
    { id: 'dueDate', label: 'Due Date', duringCreate: 'Hidden', duringApproval: 'Optional' },
    { id: 'category', label: 'Category', duringCreate: 'Hidden', duringApproval: 'Optional' },
    { id: 'assignedLocation', label: 'Assigned Location', duringCreate: 'Hidden', duringApproval: 'Optional' },
    { id: 'assignedAsset', label: 'Assigned Asset', duringCreate: 'Hidden', duringApproval: 'Optional' },
    { id: 'primaryWorker', label: 'Primary Worker', duringCreate: 'Hidden', duringApproval: 'Optional' },
    { id: 'assignedTeam', label: 'Assigned Team', duringCreate: 'Hidden', duringApproval: 'Optional' },
    { id: 'files', label: 'Files', duringCreate: 'Optional', duringApproval: 'Optional' },
    { id: 'additionalWorkers', label: 'Additional Workers', duringCreate: 'Hidden', duringApproval: 'Optional' },
    { id: 'startDate', label: 'Start Date', duringCreate: 'Hidden', duringApproval: 'Optional' },
    { id: 'estimatedDuration', label: 'Estimated Duration', duringCreate: 'Hidden', duringApproval: 'Optional' },
    { id: 'checklists', label: 'Checklists', duringCreate: 'Hidden', duringApproval: 'Optional' },
    { id: 'signature', label: 'Signature', duringCreate: 'Hidden', duringApproval: 'Optional' },
];

export const RequestsSettingsWorkspace = () => {
    const [fields, setFields] = useState<FieldConfig[]>(DEFAULT_FIELDS);

    const handleFieldChange = (id: string, key: 'duringCreate' | 'duringApproval', value: FieldOption) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Form Items</h2>
                <p className="text-muted-foreground font-medium mt-1 text-[15px]">
                    These are only displayed during Request creation. After the Request is created, the responses will be included in the Request description.
                </p>
                <button className="text-primary font-bold text-[14px] mt-4 hover:underline">
                    + Add Task
                </button>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-800">Request fields</h3>
                    <p className="text-[13px] text-muted-foreground font-medium mt-1">
                        Configure the request form from this page. You can mark fields as Optional, Hidden or Required.
                    </p>
                </div>
                
                <div className="p-0">
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar px-6 pb-6">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-card z-10">
                                <tr className="border-b border-slate-100">
                                    <th className="py-4 w-1/3 text-[13px] font-black text-slate-800 bg-card"></th>
                                    <th className="py-4 w-1/3 text-[13px] font-black text-slate-800 text-center bg-card">During Create</th>
                                    <th className="py-4 w-1/3 text-[13px] font-black text-slate-800 text-center bg-card">During Approval</th>
                                </tr>
                            </thead>
                        <tbody className="divide-y divide-slate-50">
                            {fields.map((field) => (
                                <tr key={field.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pr-4">
                                        <span className="text-[14px] font-bold text-slate-800">{field.label}</span>
                                    </td>
                                    <td className="py-4 px-2">
                                        <select 
                                            value={field.duringCreate}
                                            onChange={(e) => handleFieldChange(field.id, 'duringCreate', e.target.value as FieldOption)}
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                                        >
                                            <option value="Optional">Optional</option>
                                            <option value="Hidden">Hidden</option>
                                            <option value="Required">Required</option>
                                        </select>
                                    </td>
                                    <td className="py-4 pl-2">
                                        <select 
                                            value={field.duringApproval}
                                            onChange={(e) => handleFieldChange(field.id, 'duringApproval', e.target.value as FieldOption)}
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                                        >
                                            <option value="Optional">Optional</option>
                                            <option value="Hidden">Hidden</option>
                                            <option value="Required">Required</option>
                                        </select>
                                    </td>
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
