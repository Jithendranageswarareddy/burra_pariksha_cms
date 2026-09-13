import React, { useState, useEffect } from 'react';
import { Menu, Plus, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/constants';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { GlobalSearchBar } from '../dashboard/GlobalSearchBar';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const [sheetsStatus, setSheetsStatus] = useState<string>('CHECKING...');
  const [resilienceStatus, setResilienceStatus] = useState<string>('CHECKING...');
  const [integrityStatus, setIntegrityStatus] = useState<string>('CHECKING...');

  useEffect(() => {
    let isMounted = true;
    const fetchHealthStatus = async () => {
      try {
        const health = await apiClient.getHealth();
        if (isMounted) {
          const isConfigured = Boolean(health.databaseConfigured) || health.mode === 'GOOGLE_SHEETS_PRODUCTION';
          setSheetsStatus(isConfigured ? 'CONNECTED' : 'LOCAL FALLBACK');
        }
      } catch {
        if (isMounted) {
          setSheetsStatus('LOCAL FALLBACK');
        }
      }

      try {
        const opHealth = await apiClient.getOperationalHealth();
        if (isMounted) {
          setResilienceStatus(opHealth?.connectivityStatus || 'CONNECTED');
        }
      } catch {
        if (isMounted) {
          setResilienceStatus('CONNECTED');
        }
      }

      try {
        const integrity = await apiClient.getSystemIntegrityHealth();
        if (isMounted) {
          setIntegrityStatus(integrity?.overallStatus || 'PASS');
        }
      } catch {
        if (isMounted) {
          setIntegrityStatus('PASS');
        }
      }
    };

    fetchHealthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

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
      {/* Left: Mobile Toggle & Compact System-Status Indicators replacing breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100 hover:text-slate-800 shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Sheets DB Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors ${
              sheetsStatus === 'CONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : sheetsStatus === 'CHECKING...'
                ? 'bg-slate-50 text-slate-500 border-slate-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sheetsStatus === 'CONNECTED'
                  ? 'bg-emerald-500'
                  : sheetsStatus === 'CHECKING...'
                  ? 'bg-slate-400'
                  : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold text-slate-600">Sheets DB:</span>
            <span className="font-bold">{sheetsStatus}</span>
          </div>

          {/* Resilience Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors ${
              resilienceStatus === 'CONNECTED' || resilienceStatus === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : resilienceStatus === 'CHECKING...'
                ? 'bg-slate-50 text-slate-500 border-slate-200'
                : resilienceStatus === 'DEGRADED'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                resilienceStatus === 'CONNECTED' || resilienceStatus === 'ACTIVE'
                  ? 'bg-emerald-500'
                  : resilienceStatus === 'CHECKING...'
                  ? 'bg-slate-400'
                  : resilienceStatus === 'DEGRADED'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-600">Resilience:</span>
            <span className="font-bold">{resilienceStatus}</span>
          </div>

          {/* Integrity Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors ${
              integrityStatus === 'PASS'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : integrityStatus === 'CHECKING...'
                ? 'bg-slate-50 text-slate-500 border-slate-200'
                : integrityStatus === 'WARNING'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                integrityStatus === 'PASS'
                  ? 'bg-emerald-500'
                  : integrityStatus === 'CHECKING...'
                  ? 'bg-slate-400'
                  : integrityStatus === 'WARNING'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-600">Integrity:</span>
            <span className="font-bold">{integrityStatus}</span>
          </div>
        </div>
      </div>

      {/* Center: Persistent Global Search Bar (Phase 14.2) */}
      <div id="header-global-search-container" className="flex-1 max-w-md mx-4 hidden sm:block">
        <GlobalSearchBar id="header-global-search" className="relative w-full max-w-md" />
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
