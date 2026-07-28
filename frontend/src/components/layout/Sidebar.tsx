import {
    ClipboardList,
    BarChart3,
    MessageSquare,
    MapPin,
    Box,
    Package,
    ShoppingCart,
    Gauge,
    Users,
    Truck,
    CheckSquare,
    Files,
    Settings,
    LayoutDashboard,
    LogOut,
    History,
    RefreshCcw,
    Zap,
    Download
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/useThemeStore';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useUserRole } from '../../hooks/useUserRole';
import { db } from '../../lib/db';

const navGroups = [
    {
        title: "Maintenance",
        items: [
            { name: "Dashboard", path: "/", icon: LayoutDashboard, end: true },
            { name: "Work Orders", path: "/work-orders", icon: ClipboardList, permission: "work-orders.read" },
            { name: "Preventive Maintenance", path: "/pm", icon: RefreshCcw, permission: "pm.read", roles: ['ADMINISTRATOR', 'OWNER', 'MANAGER', 'ADMIN', 'LIMITED ADMINISTRATOR', 'MAINTENANCE MANAGER'] },
            { name: "Scheduler", path: "/scheduler", icon: CheckSquare, permission: "pm.read", roles: ['ADMINISTRATOR', 'OWNER', 'MANAGER', 'ADMIN', 'LIMITED ADMINISTRATOR', 'MAINTENANCE MANAGER'] },
            { name: "Requests", path: "/requests", icon: MessageSquare, permission: "requests.read" },
        ]
    },
    {
        title: "Assets & Inventory",
        items: [
            { name: "Locations", path: "/locations", icon: MapPin, permission: "locations.read" },
            { name: "Assets", path: "/assets", icon: Box, permission: "assets.read" },
            { name: "Parts & Inventory", path: "/inventory", icon: Package, permission: "parts.read" },
            { name: "Meters", path: "/meters", icon: Gauge, permission: "assets.read" },
        ]
    },
    {
        title: "Procurement",
        permission: "po.read",
        roles: ['ADMINISTRATOR', 'OWNER', 'MANAGER', 'ADMIN', 'LIMITED ADMINISTRATOR', 'MAINTENANCE MANAGER'],
        items: [
            { name: "Purchase Orders", path: "/po", icon: ShoppingCart, permission: "po.read" },
            { name: "Providers & Network", path: "/vendors", icon: Truck, permission: "vendors.read" },
            { name: "Customers", path: "/customers", icon: Users, permission: "customers.read" },
        ]
    },
    {
        title: "System",
        items: [
            { name: "Analytics", path: "/analytics", icon: BarChart3, permission: "analytics.view", roles: ['ADMINISTRATOR', 'OWNER', 'MANAGER', 'ADMIN', 'LIMITED ADMINISTRATOR', 'MAINTENANCE MANAGER'] },
            { name: "People & Teams", path: "/people", icon: Users, permission: "users.manage", roles: ['ADMINISTRATOR', 'OWNER', 'ADMIN', 'LIMITED ADMINISTRATOR', 'MAINTENANCE MANAGER'] },
            { name: "Checklists", path: "/checklists", icon: CheckSquare, permission: "checklists.read" },
            { name: "Files", path: "/files", icon: Files },
            { name: "Settings", path: "/settings", icon: Settings, permission: "settings.manage", roles: ['ADMINISTRATOR', 'OWNER', 'ADMIN', 'MAINTENANCE MANAGER'] },
        ]
    }
];

export const Sidebar = () => {
    const { sidebarCollapsed, toggleSidebar } = useThemeStore();
    const { isInstallable, isInstalled, install } = usePWAInstall();
    const { role, hasPermission } = useUserRole();
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : { name: "Guest User", email: "guest@example.com" };

    const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

    let userRole = (role || user.roleName || '').toUpperCase();
    if (!userRole && user.organizations?.[0]?.role) {
        userRole = user.organizations[0].role.toUpperCase();
    }
    if (!userRole) userRole = 'TECHNICIAN';

    const handleLogout = async () => {
        try {
            await Promise.all([
                db.workOrders.clear(),
                db.syncQueue.clear(),
                db.mediaQueue.clear()
            ]);
        } catch (err) {
            console.error('Failed to clear IndexedDB tables on logout:', err);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('organization');
        navigate('/login');
    };

    const canSee = (permission?: string, requiredRoles?: string[]) => {
        if (permission && requiredRoles) {
            return hasPermission(permission) && requiredRoles.includes(userRole);
        }
        if (permission) return hasPermission(permission);
        if (requiredRoles) return requiredRoles.includes(userRole);
        return true;
    };

    return (
        <aside className={cn(
            "flex w-60 h-screen glass-panel fixed left-0 top-0 z-[150] flex-col transition-transform duration-300",
            sidebarCollapsed ? "-translate-x-full" : "translate-x-0"
        )}>
            {/* Logo */}
            <div className="px-6 py-5 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
                        <Settings className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="text-[15px] font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent tracking-tighter uppercase italic">
                        CMMS ENGINE
                    </h1>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-hide">
                {navGroups.filter(g => canSee((g as any).permission, (g as any).roles)).map((group) => {
                    const visibleItems = group.items.filter(item => canSee((item as any).permission, (item as any).roles));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.title}>
                            {/* Group label */}
                            <p className="px-3 mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/60 select-none">
                                {group.title}
                            </p>
                            <div className="space-y-0.5">
                                {visibleItems.map((item: any) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        end={item.end}
                                        onClick={() => {
                                            if (window.innerWidth < 768) {
                                                toggleSidebar();
                                            }
                                        }}
                                        className={({ isActive }) => cn(
                                            // Base
                                            "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group/nav",
                                            isActive
                                                // Active: vivid left-accent bar + tinted bg + primary text
                                                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5 pl-[calc(0.75rem+3px)]"
                                                // Inactive: muted + hover state
                                                : "text-foreground/65 hover:text-foreground hover:bg-foreground/5"
                                        )}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {/* Left accent bar — only on active */}
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                                                )}

                                                {/* Icon */}
                                                <item.icon className={cn(
                                                    "shrink-0 transition-all duration-200",
                                                    isActive
                                                        ? "w-[17px] h-[17px] text-primary drop-shadow-[0_0_6px_hsl(var(--primary-raw)/0.5)]"
                                                        : "w-[17px] h-[17px] group-hover/nav:scale-110"
                                                )} />

                                                {/* Label */}
                                                <span className={cn(
                                                    "tracking-tight leading-none",
                                                    isActive ? "font-bold" : "font-medium"
                                                )}>
                                                    {item.name}
                                                </span>

                                                {/* Active dot indicator */}
                                                {isActive && (
                                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User footer */}
            <div className="p-4 border-t border-border/40 space-y-3 shrink-0">
                {/* User card */}
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-foreground/5 transition-colors cursor-default">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-[11px] font-black border border-primary/20 shadow-inner shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black text-foreground truncate tracking-tight">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold truncate uppercase tracking-widest leading-none mt-0.5">
                            {user.roleName || 'Mission Specialist'}
                        </p>
                    </div>
                </div>

                {/* Install App Prompt */}
                {isInstallable && !isInstalled && (
                    <button
                        onClick={install}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 border border-primary/20 shadow-lg shadow-primary/20 transition-all text-[11px] font-black uppercase tracking-widest group/install mb-3 animate-bounce-subtle"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Install App
                    </button>
                )}

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground/5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 border border-border/40 hover:border-rose-500/25 transition-all text-[11px] font-black uppercase tracking-widest group/logout"
                >
                    <LogOut className="w-3.5 h-3.5 group-hover/logout:-translate-x-0.5 transition-transform" />
                    Secure Logout
                </button>
            </div>
        </aside>
    );
};
