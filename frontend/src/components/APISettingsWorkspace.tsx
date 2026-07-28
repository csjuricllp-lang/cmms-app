import { useState } from 'react';
import { Key, Plus, Trash2, Copy, Check, BookOpen, Terminal, AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApiKeys } from '../hooks/useData';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const AVAILABLE_SCOPES = [
    { value: 'read:work_orders', label: 'Read Work Orders' },
    { value: 'write:work_orders', label: 'Write Work Orders' },
    { value: 'read:assets', label: 'Read Assets' },
    { value: 'write:assets', label: 'Write Assets' },
    { value: 'read:meters', label: 'Read/Write Meters' }
];

export const APISettingsWorkspace = () => {
    const [activeTab, setActiveTab] = useState<'keys' | 'docs'>('keys');
    const { keys, isLoading, createApiKey, revokeApiKey } = useApiKeys();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [keyName, setKeyName] = useState('');
    const [scopes, setScopes] = useState<string[]>(['read:work_orders']);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Copied to clipboard');
    };

    const handleRevoke = async (id: string) => {
        if (!window.confirm('Are you sure you want to revoke this API key? This action is immediate and cannot be undone.')) return;
        try {
            await revokeApiKey.mutateAsync(id);
            toast.success('API Key revoked successfully');
        } catch (error) {
            toast.error('Failed to revoke API key');
        }
    };

    const handleCreateKey = async () => {
        if (!keyName.trim()) {
            toast.error('Please enter a name for the key');
            return;
        }

        try {
            const result = await createApiKey.mutateAsync({
                name: keyName,
                scopes
            });
            setGeneratedKey(result.rawKey);
            setKeyName('');
            setScopes(['read:work_orders']);
        } catch (error) {
            toast.error('Failed to create API key');
        }
    };

    const handleToggleScope = (scope: string) => {
        setScopes(prev => 
            prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
        );
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setGeneratedKey(null);
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">API & Developers</h2>
                <p className="text-slate-500 font-medium mt-1 text-[15px]">Manage authentication keys and explore the interactive REST API documentation.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('keys')}
                    className={cn(
                        "pb-3 text-[14px] font-black transition-colors relative",
                        activeTab === 'keys' ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        API Keys
                    </div>
                    {activeTab === 'keys' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('docs')}
                    className={cn(
                        "pb-3 text-[14px] font-black transition-colors relative",
                        activeTab === 'docs' ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        API Documentation
                    </div>
                    {activeTab === 'docs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
                </button>
            </div>

            {isLoading ? (
                <div className="h-[400px] flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                </div>
            ) : activeTab === 'keys' ? (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-[15px] font-black text-slate-800">Standard API Keys</h3>
                                <p className="text-[13px] text-slate-500 mt-0.5">These keys allow other apps to access your CMMS data via the API.</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-black transition-all shadow-sm active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Create Secret Key
                            </button>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Name & Scope</th>
                                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Key Prefix</th>
                                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Created / Last Used</th>
                                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(keys || []).map(key => (
                                        <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[14px] font-black text-slate-800">{key.name}</span>
                                                    <div className="flex gap-1.5 flex-wrap mt-1">
                                                        {key.scopes.map((s: string) => (
                                                            <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold tracking-tight">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <code className="text-[13px] font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                                        {key.prefix}...
                                                    </code>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-slate-700">{format(new Date(key.createdAt), 'yyyy-MM-dd')}</span>
                                                    <span className="text-[11px] font-medium text-slate-400">
                                                        {key.lastUsedAt ? `Used ${format(new Date(key.lastUsedAt), 'yyyy-MM-dd HH:mm')}` : 'Never used'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleRevoke(key.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Revoke API Key"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(keys || []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <Key className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                                <p className="text-[14px] font-bold text-slate-500">No API keys generated yet.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Warning Card */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                            <h4 className="text-[13px] font-black text-amber-900">Security Notice</h4>
                            <p className="text-[12px] font-medium text-amber-700/80 mt-1 max-w-2xl leading-relaxed">
                                Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth. If you suspect a key has been compromised, revoke it immediately.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden min-h-[600px] flex flex-col">
                    <div className="h-12 bg-slate-950 border-b border-slate-800 flex items-center px-4 justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                            <span className="text-[13px] font-black text-slate-300 tracking-wider">JURIC API REFERENCE v2.1</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                        </div>
                    </div>
                    
                    {/* Mock Swagger Embed UI */}
                    <div className="flex-1 flex text-slate-300">
                        <div className="w-64 border-r border-slate-800 p-4 space-y-6">
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Core Resources</h4>
                                <ul className="space-y-2">
                                    <li className="text-[13px] font-bold text-indigo-400 cursor-pointer">Work Orders</li>
                                    <li className="text-[13px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">Assets</li>
                                    <li className="text-[13px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">Inventory Parts</li>
                                    <li className="text-[13px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">Purchase Orders</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Webhooks</h4>
                                <ul className="space-y-2">
                                    <li className="text-[13px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">Events</li>
                                    <li className="text-[13px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">Signatures</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="max-w-3xl space-y-8">
                                <div>
                                    <h1 className="text-3xl font-black text-white">Work Orders</h1>
                                    <p className="text-[14px] text-slate-400 mt-2">Manage work orders, including creation, updates, and fetching lists of work orders.</p>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* GET Endpoint */}
                                    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl overflow-hidden">
                                        <div className="flex items-center px-4 py-3 border-b border-emerald-500/10">
                                            <span className="px-2 py-1 bg-emerald-500 text-white text-[11px] font-black rounded uppercase tracking-wider">GET</span>
                                            <span className="ml-3 font-mono text-[14px] font-bold text-emerald-400">/api/v2/work-orders</span>
                                            <span className="ml-4 text-[13px] text-slate-400 font-medium">List all work orders</span>
                                        </div>
                                    </div>
                                    
                                    {/* POST Endpoint */}
                                    <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl overflow-hidden">
                                        <div className="flex items-center px-4 py-3 border-b border-amber-500/10">
                                            <span className="px-2 py-1 bg-amber-500 text-white text-[11px] font-black rounded uppercase tracking-wider">POST</span>
                                            <span className="ml-3 font-mono text-[14px] font-bold text-amber-400">/api/v2/work-orders</span>
                                            <span className="ml-4 text-[13px] text-slate-400 font-medium">Create a new work order</span>
                                        </div>
                                        <div className="p-4 bg-black/20">
                                            <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Request Body (JSON)</h5>
                                            <pre className="font-mono text-[12px] text-slate-300">
{`{
  "title": "Fix HVAC Unit in Sector 4",
  "priority": "HIGH",
  "assetId": "ast_938194",
  "assignedTo": "usr_91241"
}`}
                                            </pre>
                                        </div>
                                    </div>

                                    {/* GET Single Endpoint */}
                                    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl overflow-hidden">
                                        <div className="flex items-center px-4 py-3 border-b border-emerald-500/10">
                                            <span className="px-2 py-1 bg-emerald-500 text-white text-[11px] font-black rounded uppercase tracking-wider">GET</span>
                                            <span className="ml-3 font-mono text-[14px] font-bold text-emerald-400">/api/v2/work-orders/:id</span>
                                            <span className="ml-4 text-[13px] text-slate-400 font-medium">Retrieve a work order</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* API Key Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-black text-slate-800">
                                {generatedKey ? 'API Key Generated' : 'Create New API Key'}
                            </h2>
                            {!generatedKey && (
                                <button 
                                    onClick={handleCloseModal}
                                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="p-6 space-y-5">
                            {generatedKey ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <div className="text-[13px]">
                                            <p className="font-bold">Copy this key now!</p>
                                            <p className="mt-1 opacity-90 leading-relaxed">For security reasons, this key will only be shown once. You will not be able to retrieve it later.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Secret Token</label>
                                        <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                                            <code className="flex-1 font-mono text-[13px] text-emerald-400 font-bold break-all select-all">
                                                {generatedKey}
                                            </code>
                                            <button 
                                                onClick={() => handleCopy('newkey', generatedKey)}
                                                className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white rounded-lg transition-all active:scale-95"
                                                title="Copy key"
                                            >
                                                {copiedId === 'newkey' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Key Name</label>
                                        <input 
                                            type="text" 
                                            value={keyName}
                                            onChange={e => setKeyName(e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500/50 transition-colors" 
                                            placeholder="e.g. ERP Sync"
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Scopes / Permissions</label>
                                        <div className="space-y-2">
                                            {AVAILABLE_SCOPES.map(sc => (
                                                <label key={sc.value} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/50 transition-colors cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={scopes.includes(sc.value)}
                                                        onChange={() => handleToggleScope(sc.value)}
                                                        className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                                                    />
                                                    <div>
                                                        <p className="text-[13px] font-bold text-slate-800">{sc.label}</p>
                                                        <code className="text-[10px] text-slate-400 font-mono mt-0.5 block">{sc.value}</code>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                            {generatedKey ? (
                                <button 
                                    onClick={handleCloseModal}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-black rounded-xl shadow-sm transition-colors"
                                >
                                    I have copied the key
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-[13px] font-black text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleCreateKey}
                                        disabled={createApiKey.isPending}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-black rounded-xl shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        {createApiKey.isPending ? 'Generating...' : 'Generate Secret Key'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
