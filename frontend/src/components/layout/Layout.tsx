import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNavbar } from './BottomNavbar';
import { GlobalAlerts } from '../GlobalAlerts';
import { SyncStatus } from '../SyncStatus';
import { Outlet } from 'react-router-dom';
import { useThemeStore } from '../../store/useThemeStore';
import { cn } from '../../lib/utils';

export const Layout = () => {
    const { sidebarCollapsed, toggleSidebar } = useThemeStore();

    useEffect(() => {
        // Enforce visible sidebar on desktop viewports on initial mount, and collapsed on mobile viewports.
        // We check the direct localStorage state synchronously to bypass any async hydration race conditions.
        let isCollapsed = sidebarCollapsed;
        try {
            const themeStorage = localStorage.getItem('elite-theme-storage');
            if (themeStorage) {
                const parsed = JSON.parse(themeStorage);
                if (parsed.state && parsed.state.sidebarCollapsed !== undefined) {
                    isCollapsed = parsed.state.sidebarCollapsed;
                }
            }
        } catch (e) {}

        if (window.innerWidth < 768) {
            if (!isCollapsed) {
                useThemeStore.setState({ sidebarCollapsed: true });
            }
        } else {
            if (isCollapsed) {
                useThemeStore.setState({ sidebarCollapsed: false });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
            <Sidebar />

            {/* Mobile backdrop overlay when sidebar is open */}
            {!sidebarCollapsed && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] md:hidden cursor-pointer"
                    onClick={toggleSidebar}
                />
            )}

            <main className={cn(
                "flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300",
                sidebarCollapsed ? "ml-0" : "ml-0 md:ml-60"
            )}>
                <Header />

                <div className="flex-1 overflow-auto pb-16 md:pb-0">
                    <Outlet />
                </div>
            </main>

            <div className="block md:hidden">
                <BottomNavbar />
            </div>

            <GlobalAlerts />
            <SyncStatus />
        </div>
    );
};

