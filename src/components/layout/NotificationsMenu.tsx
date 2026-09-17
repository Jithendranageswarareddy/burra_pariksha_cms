import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Radio, ShieldCheck, X } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

export interface NotificationsMenuProps {
  id?: string;
  className?: string;
}

export const NotificationsMenu: React.FC<NotificationsMenuProps> = ({
  id = 'notifications-menu',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState<Array<{ id: string; title: string; message: string; type: 'info' | 'warning' | 'success'; timestamp: string }>>([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const checkSystemAlerts = async () => {
      setLoading(true);
      try {
        const [health, opHealth, integrity] = await Promise.allSettled([
          apiClient.getHealth(),
          apiClient.getOperationalHealth(),
          apiClient.getSystemIntegrityHealth(),
        ]);

        const alerts: Array<{ id: string; title: string; message: string; type: 'info' | 'warning' | 'success'; timestamp: string }> = [];

        // Real Sheets DB Health
        if (health.status === 'fulfilled') {
          const isConfigured = Boolean(health.value.databaseConfigured) || health.value.mode === 'GOOGLE_SHEETS_PRODUCTION';
          if (!isConfigured) {
            alerts.push({
              id: 'sheets-fallback',
              title: 'Storage Fallback Active',
              message: 'Using in-memory/local storage mode. Google Sheets DB is not currently configured.',
              type: 'warning',
              timestamp: 'Current',
            });
          }
        }

        // Real Operational Connectivity
        if (opHealth.status === 'fulfilled' && opHealth.value?.connectivityStatus === 'DEGRADED') {
          alerts.push({
            id: 'connectivity-degraded',
            title: 'Operational Connectivity Degraded',
            message: 'Some services experienced latency. Automatic retry is enabled.',
            type: 'warning',
            timestamp: 'Current',
          });
        }

        // Real System Integrity
        if (integrity.status === 'fulfilled' && integrity.value?.overallStatus === 'WARNING') {
          alerts.push({
            id: 'integrity-warning',
            title: 'Sequence Integrity Warning',
            message: 'A minor sequence gap was detected and safely isolated.',
            type: 'warning',
            timestamp: 'Current',
          });
        }

        if (isMounted) {
          setSystemAlerts(alerts);
        }
      } catch (err) {
        console.warn('Could not query system health for notifications:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSystemAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const hasWarnings = systemAlerts.some((a) => a.type === 'warning');

  return (
    <div id={id} ref={menuRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        id="notifications-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Notifications and system health alerts"
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {systemAlerts.length > 0 ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
        ) : (
          <span className="sr-only">No unread alerts</span>
        )}
      </button>

      {/* Notifications Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden text-xs text-slate-700 animate-in fade-in-50 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">Notifications</span>
              {systemAlerts.length > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                  {systemAlerts.length} alert{systemAlerts.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-100 text-emerald-800">
                  All Systems Clear
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              aria-label="Close notifications"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-72 overflow-y-auto p-3 space-y-2">
            {systemAlerts.length > 0 ? (
              systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs ${
                    alert.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{alert.title}</div>
                      <div className="text-[11px] text-amber-800/90 mt-0.5 leading-normal">
                        {alert.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-800 text-sm">
                  No active system alerts
                </div>
                <p className="text-slate-500 text-[11px] max-w-xs mx-auto leading-relaxed">
                  All production pipelines, sheets persistence, and authoring stages are operational.
                </p>
              </div>
            )}

            {/* Notification Stream Foundation notice */}
            <div className="mt-2 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
              <span>Shell notification foundation active. Real-time task push stream reserved for future integration.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
