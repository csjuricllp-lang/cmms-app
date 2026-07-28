import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Lock, ExternalLink, Check, Copy, AlertCircle, Save, Trash2, ShieldAlert } from 'lucide-react';
import { useSsoConfig } from '../hooks/useSsoConfig';
import { toast } from 'react-hot-toast';

export const AuthSettingsWorkspace: React.FC = () => {
    const { config, saveConfig, deleteConfig } = useSsoConfig();
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [step, setStep] = useState<number>(1);
    const [copied, setCopied] = useState(false);

    // Form states
    const [entryPoint, setEntryPoint] = useState('');
    const [issuer, setIssuer] = useState('cmms-app-sp');
    const [cert, setCert] = useState('');
    const [emailAttr, setEmailAttr] = useState('email');
    const [firstNameAttr, setFirstNameAttr] = useState('firstName');
    const [lastNameAttr, setLastNameAttr] = useState('lastName');
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        if (config.data) {
            setSelectedProvider(config.data.provider);
            setEntryPoint(config.data.entryPoint || '');
            setIssuer(config.data.issuer || 'cmms-app-sp');
            setCert(config.data.cert || '');
            setEmailAttr(config.data.attributeMapping?.email || 'email');
            setFirstNameAttr(config.data.attributeMapping?.firstName || 'firstName');
            setLastNameAttr(config.data.attributeMapping?.lastName || 'lastName');
            setIsEnabled(config.data.isEnabled || false);
            setStep(2);
        }
    }, [config.data]);

    const providers = [
        { id: 'okta', name: 'Okta', color: '#007DC1' },
        { id: 'google', name: 'Google Workspace', color: '#4285F4' },
        { id: 'custom', name: 'Custom SAML 2.0', color: '#64748b' }
    ];

    const backendUrl = window.location.origin.replace('5173', '3000'); // helper fallback
    const spMetadataUrl = `${backendUrl}/sso/metadata`;
    const spAssertionConsumerUrl = `${backendUrl}/sso/callback`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        if (!entryPoint.trim()) {
            return toast.error('Identity Provider Single Sign-On URL is required');
        }
        if (!cert.trim()) {
            return toast.error('X.509 Certificate is required');
        }

        saveConfig.mutate({
            provider: selectedProvider!,
            entryPoint: entryPoint.trim(),
            issuer: issuer.trim(),
            cert: cert.trim(),
            isEnabled,
            attributeMapping: {
                email: emailAttr.trim(),
                firstName: firstNameAttr.trim(),
                lastName: lastNameAttr.trim()
            }
        }, {
            onSuccess: () => {
                toast.success('SSO Configuration saved successfully');
                setStep(3);
            },
            onError: () => {
                toast.error('Failed to save SSO configuration');
            }
        });
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to disable and delete the SAML SSO Configuration?')) {
            deleteConfig.mutate(undefined, {
                onSuccess: () => {
                    toast.success('SSO Configuration removed');
                    setSelectedProvider(null);
                    setEntryPoint('');
                    setCert('');
                    setIsEnabled(false);
                    setStep(1);
                }
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.03)] p-6 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 mx-auto md:mx-0">
                        <Lock className="w-8 h-8 text-indigo-500" />
                    </div>

                    <div className="flex-1 space-y-10 text-center md:text-left">
                        <div className="space-y-2">
                            <h2 className="text-[22px] font-black text-slate-800 tracking-tight">SAML Authentication</h2>
                            <p className="text-[14px] text-slate-400 font-medium leading-relaxed max-w-2xl">
                                Configure secure Single Sign-On (SSO) for your organization members.
                            </p>
                        </div>

                        {/* Step Progress indicator */}
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all",
                                        step === s ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" :
                                        step > s ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                                    )}>
                                        {step > s ? <Check className="w-4 h-4" /> : s}
                                    </div>
                                    <span className={cn(
                                        "text-[13px] font-bold",
                                        step === s ? "text-slate-700" : "text-slate-400"
                                    )}>
                                        {s === 1 && "Choose Identity Provider"}
                                        {s === 2 && "Configure details"}
                                        {s === 3 && "Enable & test"}
                                    </span>
                                    {s < 3 && <div className="w-8 h-[1px] bg-slate-200" />}
                                </div>
                            ))}
                        </div>

                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                                <div className="space-y-4">
                                    <h3 className="text-[15px] font-bold text-slate-800">Select your SAML provider</h3>
                                    <p className="text-[13px] text-slate-400 leading-relaxed font-medium">
                                        Choose your provider to map assertions, verify metadata, and enable directory-based logins.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {providers.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedProvider(p.id);
                                                setStep(2);
                                            }}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
                                        >
                                            <span className="text-[14px] font-bold text-slate-700">{p.name}</span>
                                            <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-transparent" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 pt-4 text-left">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity Provider SSO URL (Entry Point)</label>
                                        <input
                                            type="text"
                                            value={entryPoint}
                                            onChange={(e) => setEntryPoint(e.target.value)}
                                            placeholder="https://identity-provider.com/sso/saml"
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Service Provider Issuer ID (Entity ID)</label>
                                        <input
                                            type="text"
                                            value={issuer}
                                            onChange={(e) => setIssuer(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">X.509 Certificate (PEM, without BEGIN/END headers)</label>
                                    <textarea
                                        rows={4}
                                        value={cert}
                                        onChange={(e) => setCert(e.target.value)}
                                        placeholder="MIIDdDCCAlSgAwIBAgIGAX..."
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono"
                                    />
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    <h4 className="text-[13px] font-bold text-slate-800 mb-4">Assertion Attribute Mappings</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400">Email Attribute Field</label>
                                            <input
                                                type="text"
                                                value={emailAttr}
                                                onChange={(e) => setEmailAttr(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400">First Name Attribute Field</label>
                                            <input
                                                type="text"
                                                value={firstNameAttr}
                                                onChange={(e) => setFirstNameAttr(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400">Last Name Attribute Field</label>
                                            <input
                                                type="text"
                                                value={lastNameAttr}
                                                onChange={(e) => setLastNameAttr(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-2.5 border border-slate-200 text-slate-500 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save & Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 pt-4 text-left">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <h4 className="text-[14px] font-bold text-slate-800">Complete IdP configuration</h4>
                                            <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                                                Copy these URLs and paste them into your Identity Provider (Okta, Azure, Google) workspace details:
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 font-mono text-[12px] text-slate-600 bg-white border border-slate-200/60 rounded-xl p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="truncate">
                                                <span className="font-bold text-slate-400 mr-2">Assertion Consumer Service (ACS) URL:</span>
                                                <span>{spAssertionConsumerUrl}</span>
                                            </div>
                                            <button onClick={() => handleCopy(spAssertionConsumerUrl)} className="text-slate-400 hover:text-slate-600 shrink-0 p-1">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                                            <div className="truncate">
                                                <span className="font-bold text-slate-400 mr-2">Service Provider Metadata XML URL:</span>
                                                <span>{spMetadataUrl}</span>
                                            </div>
                                            <button onClick={() => handleCopy(spMetadataUrl)} className="text-slate-400 hover:text-slate-600 shrink-0 p-1">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl">
                                    <div className="space-y-0.5">
                                        <span className="text-[14px] font-bold text-slate-800">Enable SAML Single Sign-On</span>
                                        <p className="text-[12px] text-slate-400 font-medium">When enabled, users can sign in using their SAML credentials</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const updatedEnabled = !isEnabled;
                                            setIsEnabled(updatedEnabled);
                                            saveConfig.mutate({ isEnabled: updatedEnabled });
                                            toast.success(updatedEnabled ? 'SSO Enabled' : 'SSO Disabled');
                                        }}
                                        className={cn(
                                            "w-[54px] h-[28px] rounded-full relative transition-all duration-300 outline-none shrink-0",
                                            isEnabled ? "bg-indigo-600" : "bg-slate-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 bg-white rounded-full absolute top-1 shadow transition-all",
                                            isEnabled ? "right-1" : "left-1"
                                        )} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="px-6 py-2.5 border border-slate-200 text-slate-500 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-all"
                                    >
                                        Edit Details
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleDelete}
                                            className="px-6 py-2.5 bg-rose-50 text-rose-600 text-[13px] font-bold rounded-xl hover:bg-rose-100 transition-all flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Configuration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
