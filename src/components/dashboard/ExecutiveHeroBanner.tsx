import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Video,
  Film,
  UploadCloud,
  PlusCircle,
  Clock,
  Target,
  Award,
} from 'lucide-react';
import { User } from '../../types';

interface ExecutiveHeroBannerProps {
  user: User | null;
  producedTodayCount?: number;
  dailyGoal?: number;
}

export const ExecutiveHeroBanner: React.FC<ExecutiveHeroBannerProps> = ({
  user,
  producedTodayCount = 0,
  dailyGoal = 3,
}) => {
  const currentHour = new Date().getHours();
  let timeGreeting = 'Good Morning';
  if (currentHour >= 12 && currentHour < 17) {
    timeGreeting = 'Good Afternoon';
  } else if (currentHour >= 17) {
    timeGreeting = 'Good Evening';
  }

  const producerName = user?.name || 'Producer';
  const roleLabel =
    user?.role === 'ADMIN'
      ? 'System Administrator / Executive Producer'
      : user?.role === 'EDITOR'
      ? 'Senior Video Editor / Media Specialist'
      : user?.role === 'SME'
      ? 'Subject Matter Expert / Script Writer'
      : 'Content Creator / Producer';

  const progressPct = Math.min(100, Math.round((producedTodayCount / dailyGoal) * 100));

  return (
    <div
      id="executive-hero-banner"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 lg:p-7 border border-slate-800/80 shadow-2xl"
    >
      {/* Background Decorative Mesh Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Greeting & Identity */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>{roleLabel}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Studio Session</span>
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              {timeGreeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200">{producerName}</span>
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              Welcome to the Burra Pariksha Executive Command Center. Drive high-yield Telugu exam shorts from instant AI drafts to live social release.
            </p>
          </div>

          {/* Quick-Jump Secondary Action Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Dispatch:
            </span>
            <Link
              to="/production?status=SCRIPT_READY"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700/70 hover:border-indigo-400/50 transition-all shadow-2xs hover:shadow-indigo-500/10"
            >
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>📹 Teleprompter</span>
            </Link>
            <Link
              to="/production?status=EDITING"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700/70 hover:border-purple-400/50 transition-all shadow-2xs hover:shadow-purple-500/10"
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>✂ Editing Bay</span>
            </Link>
            <Link
              to="/publishing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700/70 hover:border-emerald-400/50 transition-all shadow-2xs hover:shadow-emerald-500/10"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>🚀 Release Station</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Primary Studio Action + Cadence Target Card */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4 shrink-0 bg-slate-900/60 p-4 sm:p-5 rounded-xl border border-slate-800/90 backdrop-blur-sm lg:min-w-[280px]">
          {/* Primary Action Button */}
          <Link
            to="/studio"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-indigo-500/25 border border-indigo-400/30 text-center"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Create New Question in Studio</span>
          </Link>

          {/* Daily Cadence Progress Meter */}
          <div className="w-full space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daily Goal: {dailyGoal} Shorts Target</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {producedTodayCount} of {dailyGoal} Today
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-700 shadow-xs"
                style={{ width: `${Math.max(8, progressPct)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Target: 1 Short every 4 hrs</span>
              </span>
              <span className="text-emerald-400 font-semibold">
                {progressPct >= 100 ? 'Target Met 🎉' : `${100 - progressPct}% remaining`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
