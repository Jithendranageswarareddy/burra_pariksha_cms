import React from 'react';
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Cpu,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PieChart,
} from 'lucide-react';

export interface PhaseDistribution {
  conceptionCount: number; // Stages 1-2
  productionCount: number; // Stages 3-5
  postQcCount: number;      // Stages 6-9
  distributionCount: number; // Stages 10-15
  totalInFlight: number;
}

export interface IntegrationStatus {
  name: string;
  category: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'NOT_CHECKED';
  details: string;
  lastChecked?: string;
}

interface ThroughputAndHealthRowProps {
  distribution: PhaseDistribution;
  integrations: IntegrationStatus[];
  producedToday: number;
  approvedToday: number;
  createdToday: number;
  publishedLast7Days: number;
  isLoading?: boolean;
}

export const ThroughputAndHealthRow: React.FC<ThroughputAndHealthRowProps> = ({
  distribution,
  integrations,
  producedToday,
  approvedToday,
  createdToday,
  publishedLast7Days,
  isLoading = false,
}) => {
  const total = distribution.totalInFlight || 1;
  const pctConception = Math.round((distribution.conceptionCount / total) * 100);
  const pctProduction = Math.round((distribution.productionCount / total) * 100);
  const pctPostQc = Math.round((distribution.postQcCount / total) * 100);
  const pctDistribution = Math.round((distribution.distributionCount / total) * 100);

  const getStatusDot = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'HEALTHY':
        return <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />;
      case 'DEGRADED':
        return <span className="w-2 h-2 rounded-full bg-amber-500" />;
      case 'UNAVAILABLE':
        return <span className="w-2 h-2 rounded-full bg-rose-500" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-300" />;
    }
  };

  const getStatusBadge = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            HEALTHY
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            DEGRADED
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            OFFLINE
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            IDLE / ON-DEMAND
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left 6 cols: Production Throughput & Pipeline Balance */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Throughput &amp; Lifecycle Phase Distribution
              </h3>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              Total In-Flight: {distribution.totalInFlight}
            </span>
          </div>

          {/* Today & 7-Day Velocity Tiles */}
          <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Created Today</div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                {createdToday}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <div className="text-[10px] text-indigo-700 uppercase font-semibold">Approved Today</div>
              <div className="text-lg font-bold font-mono text-indigo-800 mt-0.5">
                {approvedToday}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <div className="text-[10px] text-emerald-700 uppercase font-semibold">Published Today</div>
              <div className="text-lg font-bold font-mono text-emerald-800 mt-0.5">
                {producedToday}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-100">
              <div className="text-[10px] text-blue-700 uppercase font-semibold">7-Day Output</div>
              <div className="text-lg font-bold font-mono text-blue-800 mt-0.5">
                {publishedLast7Days}
              </div>
            </div>
          </div>

          {/* Stacked Balance Bar */}
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>WIP Distribution Across Pipeline Phases</span>
              <span>{distribution.totalInFlight > 0 ? '100% Total' : '0 in-flight'}</span>
            </div>
            {distribution.totalInFlight > 0 ? (
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  style={{ width: `${Math.max(3, pctConception)}%` }}
                  className="bg-indigo-500 h-full"
                  title={`Conception (Stages 01-02): ${distribution.conceptionCount}`}
                />
                <div
                  style={{ width: `${Math.max(3, pctProduction)}%` }}
                  className="bg-blue-500 h-full"
                  title={`Production (Stages 03-05): ${distribution.productionCount}`}
                />
                <div
                  style={{ width: `${Math.max(3, pctPostQc)}%` }}
                  className="bg-violet-500 h-full"
                  title={`Post & QC (Stages 06-09): ${distribution.postQcCount}`}
                />
                <div
                  style={{ width: `${Math.max(3, pctDistribution)}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Distribution (Stages 10-15): ${distribution.distributionCount}`}
                />
              </div>
            ) : (
              <div className="w-full py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500 italic">
                Production queue is clear — all 15 workflow stages idle
              </div>
            )}
          </div>

          {/* Phase Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 flex-none" />
              <span className="truncate text-slate-600">Conception ({distribution.conceptionCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 flex-none" />
              <span className="truncate text-slate-600">Production ({distribution.productionCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-500 flex-none" />
              <span className="truncate text-slate-600">Post QC ({distribution.postQcCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 flex-none" />
              <span className="truncate text-slate-600">Distribution ({distribution.distributionCount})</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Timezone: Local System</span>
          <span>{distribution.totalInFlight > 0 ? 'WIP In Flow' : 'Queue Clear • All Stages Ready'}</span>
        </div>
      </div>

      {/* Right 6 cols: Integration & Connectivity Health */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Publishing & Subsystem Health Probes
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Zero Credential Disclosure</span>
          </div>

          <div className="space-y-2">
            {integrations.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {getStatusDot(item.status)}
                  <div>
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.details}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Probes: Active Liveness &amp; Readiness</span>
          <span>Checked continuously</span>
        </div>
      </div>
    </div>
  );
};
