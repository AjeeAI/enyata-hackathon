import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, Menu, X } from 'lucide-react';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Policies (RAG)', path: '/admin/policies', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Header & Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0F172A] z-50 flex items-center justify-between px-4">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-emerald-500">Edu</span>
          <span className="text-white">Intellect</span>
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-300 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#0F172A] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo Area (Desktop) */}
        <div className="hidden md:flex h-20 items-center px-8 border-b border-slate-800/50">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-emerald-500">Edu</span>
            <span className="text-white">Intellect</span>
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto mt-16 md:mt-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                onClick={() => setIsMobileMenuOpen(false)} // Close mobile menu on click
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                    isActive
                      // The exact teal/green active state from the screenshot
                      ? 'bg-[#00C48C] text-white shadow-md' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`
                }
              >
                <Icon className={`w-5 h-5 ${/* Optional: slightly dim inactive icons */ ''}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0">
        <div className="p-4 md:p-8 min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}