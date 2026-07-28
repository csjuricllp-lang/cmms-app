import { HelpCircle, Palette, Monitor, ChevronRight, PanelLeft, Menu } from 'lucide-react';
import { useLocation, NavLink } from 'react-router-dom';
import { useThemeStore } from '../../store/useThemeStore';
import { THEME_OPTIONS, ACCENT_COLORS } from '../../constants/theme';
import { NotificationsPopover } from '../NotificationsPopover';
import { GlobalSearchModal } from '../GlobalSearchModal';
import { cn } from '../../lib/utils';
import { SyncIndicator } from '../SyncIndicator';

// Route → human-readable label map for breadcrumbs
const ROUTE_LABELS: Record<string, string> = {
    '/':              'Dashboard',
    '/work-orders':   'Work Orders',
    '/pm':            'Preventive Maintenance',
    '/scheduler':     'Scheduler',
    '/requests':      'Requests',
    '/shared':        'Shared Orders',
    '/locations':     'Locations',
    '/assets':        'Assets',
    '/inventory':     'Parts & Inventory',
    '/meters':        'Meters',
    '/po':            'Purchase Orders',
    '/vendors':       'Providers & Network',
    '/customers':     'Customers',
    '/analytics':     'Analytics',
    '/workflows':     'Workflows',
    '/people':        'People & Teams',
    '/shifts':        'Shifts Management',
    '/checklists':    'Checklists',
    '/audit':         'Audit Activity',
    '/files':         'Files',
    '/settings':      'Settings',
};

// Build breadcrumb segments from a pathname
function buildBreadcrumbs(pathname: string): { label: string; path: string }[] {
    if (pathname === '/') return [{ label: 'Dashboard', path: '/' }];

    const crumbs: { label: string; path: string }[] = [{ label: 'Dashboard', path: '/' }];

    // Try exact match first
    const exactLabel = ROUTE_LABELS[pathname];
    if (exactLabel) {
        crumbs.push({ label: exactLabel, path: pathname });
        return crumbs;
    }

    // Build progressive segments for nested paths (e.g. /work-orders/abc123)
    const segments = pathname.split('/').filter(Boolean);
    let accumulated = '';
    segments.forEach((seg) => {
        accumulated += '/' + seg;
        const label = ROUTE_LABELS[accumulated];
        if (label) {
            crumbs.push({ label, path: accumulated });
        } else {
            // Capitalise the raw segment as fallback (e.g. an ID or sub-page)
            let labelText = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
            
            // Check if it is a database ID / UUID
            const isUUID = seg.length > 20 || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(seg);
            const isMongoId = /^[0-9a-fA-F]{24}$/.test(seg);
            const isHexLikeId = seg.length > 10 && /[0-9a-f]/.test(seg) && /[a-f]/.test(seg);
            
            if (isUUID || isMongoId || isHexLikeId) {
                const parentRoute = segments[0];
                if (parentRoute === 'pm') labelText = 'PM Detail';
                else if (parentRoute === 'work-orders') labelText = 'Work Order Detail';
                else if (parentRoute === 'assets') labelText = 'Asset Detail';
                else if (parentRoute === 'locations') labelText = 'Location Detail';
                else if (parentRoute === 'vendors') labelText = 'Provider Detail';
                else if (parentRoute === 'customers') labelText = 'Customer Detail';
                else labelText = 'Detail';
            }
            crumbs.push({ label: labelText, path: accumulated });
        }
    });

    return crumbs;
}

export const Header = () => {
    const { theme, setTheme, setAccentColor, accentColor, toggleSidebar } = useThemeStore();
    const location = useLocation();
    const crumbs = buildBreadcrumbs(location.pathname);

    return (
        <header className="h-14 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-[100] flex items-center justify-between px-4 gap-4 shrink-0">
            {/* Left: toggle + breadcrumbs */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Sidebar toggle */}
                <button
                    onClick={toggleSidebar}
                    className="inline-flex p-2 hover:bg-white/5 rounded-xl text-muted-foreground transition-all shrink-0"
                    title="Toggle sidebar"
                >
                    <PanelLeft className="w-5 h-5 hidden md:block" />
                    <Menu className="w-5 h-5 block md:hidden" />
                </button>

                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 min-w-0" aria-label="Breadcrumb">
                    {crumbs.map((crumb, idx) => {
                        const isLast = idx === crumbs.length - 1;
                        // On mobile: only show the last (current) crumb
                        return (
                            <div key={crumb.path} className={cn("flex items-center space-x-2", !isLast && "hidden md:flex", isLast && "shrink-0")}>
                                {idx > 0 && (
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mx-0.5" />
                                )}
                                {isLast ? (
                                    // Current page — bold, not a link
                                    <span className="text-[13px] font-bold text-foreground truncate max-w-[160px] md:max-w-[200px]">
                                        {crumb.label}
                                    </span>
                                ) : (
                                    // Ancestor — link, muted
                                    <NavLink
                                        to={crumb.path}
                                        className="text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors shrink-0"
                                    >
                                        {crumb.label}
                                    </NavLink>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Centre: Global search — opens ⌘K command palette */}
            <div className="flex items-center gap-2 md:gap-4">
                <div>
                    <SyncIndicator />
                </div>
                <GlobalSearchModal />
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
                {/* Theme Mood Selector */}
                <div className="relative group/mood">
                    <button
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-muted-foreground transition-all"
                        title="Workspace mood"
                    >
                        <Monitor className="w-4.5 h-4.5" />
                    </button>
                    <div className="absolute top-11 right-0 w-60 bg-background/95 border border-border backdrop-blur-2xl rounded-2xl p-3 opacity-0 invisible group-hover/mood:opacity-100 group-hover/mood:visible transition-all duration-200 translate-y-2 group-hover/mood:translate-y-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-[110]">
                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2 px-1">Workspace Mood</p>
                        <div className="grid grid-cols-1 gap-0.5 max-h-[280px] overflow-y-auto pr-0.5">
                            {THEME_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setTheme(opt.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                                        theme === opt.id
                                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                            : 'hover:bg-foreground/5 text-foreground/70 hover:text-foreground'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" style={{ backgroundColor: opt.color }} />
                                        <span className="text-[11px] font-bold whitespace-nowrap">{opt.name}</span>
                                    </div>
                                    {theme === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Accent Color Picker */}
                <div className="relative group/palette">
                    <button
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-muted-foreground transition-all"
                        title="Accent color"
                    >
                        <Palette className="w-4.5 h-4.5" />
                    </button>
                    <div className="absolute top-11 right-0 w-60 bg-background/98 border border-border backdrop-blur-2xl rounded-2xl p-4 opacity-0 invisible group-hover/palette:opacity-100 group-hover/palette:visible transition-all duration-200 translate-y-2 group-hover/palette:translate-y-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[110]">
                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">Branding Accent</p>
                        <div className="grid grid-cols-5 gap-2.5">
                            {ACCENT_COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setAccentColor(color.value)}
                                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 border-2 ${
                                        accentColor === color.value
                                            ? 'border-primary ring-4 ring-primary/40 scale-105'
                                            : 'border-border'
                                    }`}
                                    style={{ backgroundColor: `hsl(${color.value})` }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-7 w-[1px] bg-border mx-1" />

                <button
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-muted-foreground transition-all"
                    title="Help"
                >
                    <HelpCircle className="w-4.5 h-4.5" />
                </button>

                <NotificationsPopover />
            </div>
        </header>
    );
};
