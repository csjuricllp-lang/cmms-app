import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, ArrowLeft } from 'lucide-react';

export const SuperAdminLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
      {/* Dark Sidebar specifically for Super Admin */}
      <aside className="w-64 flex flex-col h-full bg-[#0f1226] text-white border-r border-[#1a1f3c] shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-[#1a1f3c]">
          <span className="font-bold text-lg tracking-wide text-white flex items-center gap-2">
            Control Center
          </span>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <NavLink
            to="/super-admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span className="font-medium text-sm">Overview</span>
          </NavLink>
          
          <NavLink
            to="/super-admin/organizations"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Building2 size={20} />
            <span className="font-medium text-sm">Organizations</span>
          </NavLink>

          <NavLink
            to="/super-admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Users size={20} />
            <span className="font-medium text-sm">Users</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-[#1a1f3c]">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium text-sm">Exit Control Center</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-gray-50 overflow-auto">
        <header className="h-16 flex items-center px-8 border-b border-gray-200 bg-white shadow-sm z-10">
          <h1 className="text-xl font-semibold text-gray-800">Super Admin Control Center</h1>
        </header>
        <div className="p-8 flex-1 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
