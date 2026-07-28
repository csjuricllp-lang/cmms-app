import { NavLink, useLocation } from 'react-router-dom';
import { Home, ClipboardList, QrCode, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BottomNavbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/work-orders', label: 'My Jobs', icon: ClipboardList },
    { path: '/scan', label: 'Scan QR', icon: QrCode },
    { path: '/notifications', label: 'Alerts', icon: Bell },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-white/10 flex items-center justify-around z-[90] pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive: linkActive }) =>
              cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1.5 transition-all",
                (linkActive || isActive)
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-bold tracking-tight">
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};
