import { useState, useEffect } from 'react';
import { Globe, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const IntegrationsWorkspace = () => {
    const [qbEnabled, setQbEnabled] = useState(false);
    const [expenseAccount, setExpenseAccount] = useState('Maintenance Expense (6100)');
    const [inventoryAssetAccount, setInventoryAssetAccount] = useState('Inventory Asset (1200)');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('cmms_quickbooks_enabled');
        if (stored === 'true') {
            setQbEnabled(true);
        }
        const storedExp = localStorage.getItem('cmms_quickbooks_expense_account');
        if (storedExp) setExpenseAccount(storedExp);

        const storedInv = localStorage.getItem('cmms_quickbooks_inventory_account');
        if (storedInv) setInventoryAssetAccount(storedInv);
    }, []);

    const handleToggle = () => {
        const nextState = !qbEnabled;
        setQbEnabled(nextState);
        localStorage.setItem('cmms_quickbooks_enabled', String(nextState));
        
        if (nextState) {
            toast.success('QuickBooks Online Integration activated!');
        } else {
            toast.error('QuickBooks Online Integration deactivated.');
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            localStorage.setItem('cmms_quickbooks_expense_account', expenseAccount);
            localStorage.setItem('cmms_quickbooks_inventory_account', inventoryAssetAccount);
            setIsSaving(false);
            toast.success('Integration mapping parameters updated successfully!');
        }, 800);
    };

    return (
        <div className="space-y-8 bg-white border border-[#E2E8F0] rounded-[24px] p-8 shadow-sm">
            <div>
                <h2 className="text-[20px] font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Globe className="w-6 h-6 text-indigo-500" />
                    External Integrations
                </h2>
                <p className="text-slate-500 text-[13px] font-medium mt-1">Connect and synchronize your maintenance transactions with external ERP and accounting software.</p>
            </div>

            <hr className="border-[#F1F5F9]" />

            {/* QuickBooks Integration Segment */}
            <div className="border border-slate-150 rounded-2xl p-6 hover:shadow-md transition-all flex flex-col gap-6 bg-slate-50/20">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="text-[16px] font-black text-slate-800">QuickBooks Online Sync</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                qbEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                            }`}>
                                {qbEnabled ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                        <p className="text-slate-500 text-[13px] font-medium max-w-xl">
                            Automatically mirror finalized Purchase Orders as expenses and sync warehouse part updates to QuickBooks Online ledger.
                        </p>
                    </div>

                    {/* Toggle Switch */}
                    <button 
                        onClick={handleToggle}
                        className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 outline-none flex items-center ${
                            qbEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                        }`}
                    >
                        <div className="w-4.5 h-4.5 bg-white rounded-full shadow-md" />
                    </button>
                </div>

                {qbEnabled && (
                    <div className="pt-4 border-t border-slate-150 grid grid-cols-2 gap-6 animate-in slide-in-from-top-3 duration-300">
                        <div className="space-y-2">
                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-slate-400" />
                                Inventory Asset Account
                            </label>
                            <input 
                                type="text"
                                value={inventoryAssetAccount}
                                onChange={(e) => setInventoryAssetAccount(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                                Maintenance Expense Account
                            </label>
                            <input 
                                type="text"
                                value={expenseAccount}
                                onChange={(e) => setExpenseAccount(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>

                        <div className="col-span-2 flex justify-end pt-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-[13px] font-black shadow-lg shadow-indigo-50 transition-all flex items-center gap-2"
                            >
                                {isSaving ? 'Saving...' : 'Save Mapping Parameters'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Other ERP placeholder */}
            <div className="border border-dashed border-slate-200 rounded-2xl p-6 flex items-center gap-4 bg-slate-50/10">
                <AlertCircle className="w-5 h-5 text-slate-400" />
                <div className="space-y-0.5">
                    <h4 className="text-[13px] font-black text-slate-600">Enterprise Resource Planning (ERP) Integration</h4>
                    <p className="text-slate-400 text-[11px] font-medium">SAP S/4HANA and Oracle NetSuite integrations are available under the Enterprise tier.</p>
                </div>
            </div>
        </div>
    );
};
