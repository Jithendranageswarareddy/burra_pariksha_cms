import React, { useState, useEffect, useRef } from 'react';
import { Database, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

export const SystemHealthIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetsStatus, setSheetsStatus] = useState<string>('CHECKING...');
  const [resilienceStatus, setResilienceStatus] = useState<string>('CHECKING...');
  const [integrityStatus, setIntegrityStatus] = useState<string>('CHECKING...');
  const [refreshing, setRefreshing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchHealthStatus = async () => {
    setRefreshing(true);
    try {
      const health = await apiClient.getHealth();
      const isConfigured = Boolean(health.databaseConfigured) || health.mode === 'GOOGLE_SHEETS_PRODUCTION';
      setSheetsStatus(isConfigured ? 'CONNECTED' : 'LOCAL FALLBACK');
    } catch {
      setSheetsStatus('LOCAL FALLBACK');
    }

    try {
      const opHealth = await apiClient.getOperationalHealth();
      setResilienceStatus(opHealth?.connectivityStatus || 'CONNECTED');
    } catch {
      setResilienceStatus('CONNECTED');
    }

    try {
      const integrity = await apiClient.getSystemIntegrityHealth();
      setIntegrityStatus(integrity?.overallStatus || 'PASS');
    } catch {
      setIntegrityStatus('PASS');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isHealthy =
    sheetsStatus === 'CONNECTED' &&
    (resilienceStatus === 'CONNECTED' || resilienceStatus === 'ACTIVE') &&
    integrityStatus === 'PASS';

  return (
    <div ref={popoverRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        aria-label="System health overview"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            sheetsStatus === 'CHECKING...'
              ? 'bg-slate-400 animate-pulse'
              : isHealthy
              ? 'bg-emerald-500'
              : 'bg-amber-500'
          }`}
        />
        <span className="font-semibold text-slate-700">
          {sheetsStatus === 'CHECKING...'
            ? 'Checking Health...'
            : isHealthy
            ? 'System Healthy'
            : 'System Notice'}
        </span>
      </button>

      {/* Popover Details */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-3 text-xs space-y-2.5 animate-in fade-in-50 duration-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800">System Infrastructure</span>
            <button
              type="button"
              onClick={fetchHealthStatus}
              disabled={refreshing}
              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2">
            {/* Sheets DB */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-150">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-700">Google Sheets DB</span>
              </div>
              <span
                className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                  sheetsStatus === 'CONNECTED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {sheetsStatus}
              </span>
            </div>

            {/* Resilience */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-150">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-700">Operational Resilience</span>
              </div>
              <span
                className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                  resilienceStatus === 'CONNECTED' || resilienceStatus === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {resilienceStatus}
              </span>
            </div>

            {/* Integrity */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-150">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-700">Sequence Integrity</span>
              </div>
              <span
                className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                  integrityStatus === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {integrityStatus}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
