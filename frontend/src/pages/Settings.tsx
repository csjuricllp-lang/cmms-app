import { useState } from 'react';
import { 
    Settings2, Box, Package, Bell, 
    UserCircle, Cpu, ClipboardList, ShoppingCart, Gauge, Tag, 
    Code2, Lock, Webhook, Clock, ShieldAlert, Globe, History
} from 'lucide-react';
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
import { AuditLogSettingsWorkspace } from '../components/AuditLogSettingsWorkspace';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserRole } from '../hooks/useUserRole';
import { MobileSettings } from './MobileSettings';

type SettingModule = 
    | 'general' | 'automation' | 'roles'
    | 'assets' | 'parts' | 'requests' | 'workorders' | 'purchaseorders' | 'meters' | 'tags'
    | 'api' | 'auth' | 'webhooks' | 'sla' | 'approvals' | 'integrations' | 'auditlog';

export const SettingsPage = () => {
    const { role } = useUserRole();
    const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN' || role === 'ADMINISTRATOR';
    const [activeModule, setActiveModule] = useState<SettingModule>('parts');

    const sections = [
        {
            title: 'ORGANIZATION',
            items: [
                { id: 'general', label: 'General', icon: Settings2 },
                { id: 'automation', label: 'Automation', icon: Cpu },
                { id: 'roles', label: 'User Roles', icon: UserCircle },
                { id: 'sla', label: 'SLA Config', icon: Clock },
            ]
        },
        {
            title: 'MODULES',
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
            title: 'ADVANCED',
            items: [
                { id: 'api', label: 'API', icon: Code2 },
                { id: 'auth', label: 'Authentication', icon: Lock },
                { id: 'webhooks', label: 'Webhooks', icon: Webhook },
                { id: 'approvals', label: 'Approval Chains', icon: ShieldAlert },
                { id: 'integrations', label: 'Integrations', icon: Globe },
                ...(isOwnerOrAdmin ? [{ id: 'auditlog', label: 'Audit Log', icon: History }] : []),
            ]
        }
    ];

    const isMobile = useMediaQuery('(max-width: 768px)');

    if (isMobile) {
        return <MobileSettings />;
    }

    return (
        <div className="h-full flex bg-[#F8FAFC]">
            {/* Sidebar Cluster */}
            <div className="w-[280px] border-r border-[#E2E8F0] overflow-y-auto flex flex-col p-6 space-y-8 bg-white shrink-0 scrollbar-hide">
                <div className="px-4 py-2">
                    <h1 className="text-[20px] font-black text-[#1E293B] tracking-tight">Organization</h1>
                </div>
                
                {sections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        <h2 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.1em] px-4 py-2 mb-1">{section.title}</h2>
                        <div className="space-y-0.5">
                            {section.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveModule(item.id as SettingModule)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[13px] group",
                                        activeModule === item.id 
                                            ? "bg-[#6366F1] text-white shadow-lg shadow-indigo-100" 
                                            : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
                                    )}
                                >
                                    <item.icon className={cn("w-4 h-4 transition-colors", activeModule === item.id ? "text-white" : "text-[#94A3B8] group-hover:text-[#64748B]")} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Context */}
            <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden">
                {/* Minimal Header */}
                <div className="px-12 py-8 flex items-center justify-end gap-4 shrink-0 bg-white border-b border-[#E2E8F0]">
                    <button className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#64748B] text-[13px] font-black rounded-xl hover:bg-[#F1F5F9] transition-all">
                        Back to Registry
                    </button>
                    <button className="px-8 py-2.5 bg-[#6366F1] text-white text-[13px] font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-[#4F46E5] transition-all">
                        Save Changes
                    </button>
                </div>

                {/* Workspace Container */}
                <div className="flex-1 overflow-y-auto px-12 py-10 custom-scrollbar scroll-smooth">
                    <div className="max-w-[1100px] mx-auto min-h-full">
                        {activeModule === 'assets' && <AssetSettingsWorkspace />}
                        {activeModule === 'parts' && <PartsSettingsWorkspace />}
                        {activeModule === 'workorders' && <WorkOrderSettingsWorkspace />}
                        {activeModule === 'purchaseorders' && <PurchaseOrderSettingsWorkspace />}
                        {activeModule === 'roles' && <RolesWorkspace />}
                        {activeModule === 'sla' && <SLASettingsWorkspace />}
                        {activeModule === 'approvals' && <ApprovalChainsWorkspace />}
                        {activeModule === 'api' && <APISettingsWorkspace />}
                        {activeModule === 'integrations' && <IntegrationsWorkspace />}
                        {activeModule === 'auditlog' && <AuditLogSettingsWorkspace />}
                        
                        {!['assets', 'parts', 'workorders', 'roles', 'purchaseorders', 'sla', 'approvals', 'api', 'integrations', 'auditlog'].includes(activeModule) && (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 animate-pulse">
                                    <Settings2 className="w-8 h-8 text-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-slate-800">Module Under Construction</h3>
                                    <p className="text-slate-400 max-w-[360px] text-[14px]">CTO Antigravity is currently implementing this configuration segment.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
