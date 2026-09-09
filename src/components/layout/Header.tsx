import React, { useState, useEffect } from 'react';
import { Menu, Plus, Sparkles, Database, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../../config/constants';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { GlobalSearchBar } from '../dashboard/GlobalSearchBar';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dbMode, setDbMode] = useState<'LIVE' | 'MOCK'>('MOCK');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkDbMode = async () => {
      try {
        const health = await apiClient.getHealth();
        if (health.mode === 'GOOGLE_SHEETS_PRODUCTION') {
          setDbMode('LIVE');
        } else {
          setDbMode('MOCK');
        }
      } catch {
        setDbMode('MOCK');
      }
    };
    checkDbMode();
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/studio')) return 'Question Studio';
    if (path.startsWith('/questions/new')) return 'New Question';
    if (path.startsWith('/questions/')) return 'Question Detail & Editor';
    if (path === '/questions') return 'Question Library';
    if (path === '/generate') return 'Question Studio';
    if (path === '/queue') return 'Video Queue';
    if (path.startsWith('/production/')) return 'Production Workspace Detail';
    if (path.startsWith('/videos/')) return 'Production Workspace Detail';
    if (path === '/production') return 'Production Tracker';
    if (path === '/production-board') return 'Production Board';
    if (path === '/publishing') return 'Publishing Manager';
    if (path === '/planning') return 'Planning & Batches';
    if (path === '/my-work') return 'My Work & Schedule';
    if (path === '/team') return 'Team Operations & Workload';
    if (path === '/settings') return 'System Settings';
    return 'Overview';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'BP';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200"
    >
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100 hover:text-slate-800"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Burra Pariksha</span>
          <span className="text-xs text-slate-300 hidden sm:inline">/</span>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Center: Persistent Global Search Bar (Phase 14.2) */}
      <div id="header-global-search-container" className="flex-1 max-w-md mx-4 hidden sm:block">
        <GlobalSearchBar id="header-global-search" className="relative w-full max-w-md" />
      </div>

      {/* Persistence Mode Flag (Requirement 19) */}
      <div className="hidden xl:flex items-center gap-2.5 px-3 py-1 rounded-full text-xs font-mono font-medium border shrink-0">
        {dbMode === 'LIVE' ? (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">LIVE GOOGLE SHEETS</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-800 bg-amber-50 border-amber-200 px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-semibold">MOCK DEVELOPMENT</span>
          </div>
        )}
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2.5">
        <Link
          to="/studio?mode=manual"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Question</span>
        </Link>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-xs">
            {getInitials(user?.name)}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name || APP_CONFIG.adminUser.name}
            </span>
            <span className="text-[10px] text-slate-500">{user?.role || APP_CONFIG.adminUser.role}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
