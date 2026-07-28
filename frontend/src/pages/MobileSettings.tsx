import { useState } from 'react';
import {
    Settings2, Box, Package, Bell,
    UserCircle, Cpu, ClipboardList, ShoppingCart, Gauge, Tag,
    Code2, Lock, Webhook, Clock, ShieldAlert, Globe, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { AssetSettingsWorkspace } from '../components/AssetSettingsWorkspace';
import { PartsSettingsWorkspace } from '../components/PartsSettingsWorkspace';
import { PurchaseOrderSettingsWorkspace } from '../components/PurchaseOrderSettingsWorkspace';
import { RolesWorkspace } from '../components/RolesWorkspace';
import { WorkOrderSettingsWorkspace } from '../components/WorkOrderSettingsWorkspace';
import { SLASettingsWorkspace } from '../components/SLASettingsWorkspace';
import { ApprovalChainsWorkspace } from '../components/ApprovalChainsWorkspace';
import { APISettingsWorkspace } from '../components/APISettingsWorkspace';
import { IntegrationsWorkspace } from '../components/IntegrationsWorkspace';

type SettingModule =
    | 'general' | 'automation' | 'roles'
    | 'assets' | 'parts' | 'requests' | 'workorders' | 'purchaseorders' | 'meters' | 'tags'
    | 'api' | 'auth' | 'webhooks' | 'sla' | 'approvals' | 'integrations';

const sections = [
    {
        title: 'Organization',
        emoji: '🏢',
        items: [
            { id: 'general', label: 'General', icon: Settings2 },
            { id: 'automation', label: 'Automation', icon: Cpu },
            { id: 'roles', label: 'User Roles', icon: UserCircle },
            { id: 'sla', label: 'SLA Config', icon: Clock },
        ]
    },
    {
        title: 'Modules',
        emoji: '📦',
        items: [
            { id: 'assets', label: 'Assets', icon: Box },
            { id: 'parts', label: 'Parts & Inventory', icon: Package },
            { id: 'requests', label: 'Requests', icon: Bell },
            { id: 'workorders', label: 'Work Orders', icon: ClipboardList },
            { id: 'purchaseorders', label: 'Purchase Orders', icon: ShoppingCart },
            { id: 'meters', label: 'Meters', icon: Gauge },
            { id: 'tags', label: 'Tags', icon: Tag },
        ]
    },
    {
        title: 'Advanced',
        emoji: '⚡',
        items: [
            { id: 'api', label: 'API', icon: Code2 },
            { id: 'auth', label: 'Authentication', icon: Lock },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'approvals', label: 'Approval Chains', icon: ShieldAlert },
            { id: 'integrations', label: 'Integrations', icon: Globe },
        ]
    }
];

const workspaceModules = ['assets', 'parts', 'workorders', 'roles', 'purchaseorders', 'sla', 'approvals', 'api', 'integrations'];

const getActiveItem = (id: SettingModule) => {
    for (const section of sections) {
        const found = section.items.find((item) => item.id === id);
        if (found) return found;
    }
    return null;
};

export const MobileSettings = () => {
    const [activeModule, setActiveModule] = useState<SettingModule>('parts');
    const [isNavOpen, setIsNavOpen] = useState(false);

    const activeItem = getActiveItem(activeModule);
    const ActiveIcon = activeItem?.icon ?? Settings2;

    const handleSelect = (id: SettingModule) => {
        setActiveModule(id);
        setIsNavOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] font-outfit relative overflow-hidden">

            {/* Top Header Bar */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm shrink-0 px-4 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Settings2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Settings</p>
                        <h1 className="text-[16px] font-black text-slate-900 tracking-tight truncate">{activeItem?.label ?? 'Organization'}</h1>
                    </div>
                </div>

                {/* Module Picker Trigger */}
                <button
                    onClick={() => setIsNavOpen(true)}
                    className="shrink-0 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 active:scale-95 transition-transform"
                >
                    <ActiveIcon className="w-3.5 h-3.5 text-indigo-500" />
                    Change
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
            </div>

            {/* Scrollable Workspace Content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 pb-24">
                <div className="max-w-full mx-auto min-h-full">
                    {activeModule === 'assets' && <AssetSettingsWorkspace />}
                    {activeModule === 'parts' && <PartsSettingsWorkspace />}
                    {activeModule === 'workorders' && <WorkOrderSettingsWorkspace />}
                    {activeModule === 'purchaseorders' && <PurchaseOrderSettingsWorkspace />}
                    {activeModule === 'roles' && <RolesWorkspace />}
                    {activeModule === 'sla' && <SLASettingsWorkspace />}
                    {activeModule === 'approvals' && <ApprovalChainsWorkspace />}
                    {activeModule === 'api' && <APISettingsWorkspace />}
                    {activeModule === 'integrations' && <IntegrationsWorkspace />}

                    {!workspaceModules.includes(activeModule) && (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 animate-pulse">
                                <Settings2 className="w-8 h-8 text-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-800">Module Under Construction</h3>
                                <p className="text-slate-400 max-w-[280px] text-[13px]">This configuration segment is coming soon.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Save / Back Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
                <button className="flex-1 h-11 bg-slate-50 border border-slate-200 text-slate-600 text-[13px] font-black rounded-xl hover:bg-slate-100 transition-all active:scale-95">
                    Back to Registry
                </button>
                <button className="flex-1 h-11 bg-indigo-600 text-white text-[13px] font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                    Save Changes
                </button>
            </div>

            {/* Module Navigation Drawer (Bottom Sheet) */}
            <AnimatePresence>
                {isNavOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNavOpen(false)}
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                        />

                        {/* Sheet */}
                        <motion.div
                            key="sheet"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[82vh] flex flex-col"
                        >
                            {/* Sheet Handle */}
                            <div className="flex justify-center pt-3 pb-1 shrink-0">
                                <div className="w-10 h-1 rounded-full bg-slate-200" />
                            </div>

                            {/* Sheet Header */}
                            <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 shrink-0">
                                <h2 className="text-[16px] font-black text-slate-900">Settings Modules</h2>
                                <button
                                    onClick={() => setIsNavOpen(false)}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90 transition-transform"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Sections List */}
                            <div className="overflow-y-auto flex-1 px-4 py-3 pb-8 space-y-5">
                                {sections.map((section) => (
                                    <div key={section.title}>
                                        {/* Section Title */}
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] px-1 mb-2">
                                            {section.emoji} {section.title}
                                        </p>
                                        <div className="space-y-1">
                                            {section.items.map((item) => {
                                                const isActive = activeModule === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleSelect(item.id as SettingModule)}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-[13px] text-left",
                                                            isActive
                                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                                                                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                                        )}
                                                    >
                                                        <item.icon className={cn(
                                                            "w-4 h-4 shrink-0",
                                                            isActive ? "text-white" : "text-slate-400"
                                                        )} />
                                                        <span className="flex-1">{item.label}</span>
                                                        {isActive && (
                                                            <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-md">Active</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
