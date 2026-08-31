import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  ListOrdered,
  Kanban,
  Share2,
  Settings,
  GraduationCap,
  Layers,
  HelpCircle,
  Compass,
  UserCheck,
  Users,
} from 'lucide-react';
import { NAVIGATION_SECTIONS } from '../../config/navigation';
import { APP_CONFIG } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

// Icon map for navigation configuration
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  ListOrdered,
  Kanban,
  Share2,
  Settings,
  Compass,
  UserCheck,
  Users,
};

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isCurrentActive = (href: string) => {
    if (href === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return true;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white shadow-inner font-bold text-base">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight uppercase">
              {APP_CONFIG.name}
            </span>
            <span className="text-[11px] text-indigo-400 font-medium tracking-wide">
              {APP_CONFIG.phase}
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          {NAVIGATION_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-0.5 mt-1">
                {section.items.map((item) => {
                  const Icon = iconMap[item.iconName] || Layers;
                  const active = isCurrentActive(item.href);

                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      id={`nav-${item.href.replace('/', '').replace('/', '-') || 'home'}`}
                      onClick={onCloseMobile}
                      className={`group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        active
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                            active
                              ? 'bg-indigo-700/80 text-indigo-100'
                              : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/50'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Admin Status Badge */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/30">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200 text-[11px] leading-tight">
                  {user ? `${user.role} Active` : 'Production System'}
                </span>
                <span className="text-[10px] text-emerald-400/90 font-mono">Google Sheets Store</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
