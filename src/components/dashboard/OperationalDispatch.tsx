import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Layers,
  Target,
  ArrowRight,
  CheckCircle2,
  Video,
  Film,
  FileText,
  UploadCloud,
  ChevronRight,
  BookOpen,
  Compass,
  AlertCircle,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import { ActionableProductionItem } from './ContinueProductionCard';
import { WaitingCounts } from './WhatsWaitingSection';

interface OperationalDispatchProps {
  continueItem: ActionableProductionItem | null;
  waitingCounts: WaitingCounts;
  isLoading?: boolean;
}

export const OperationalDispatch: React.FC<OperationalDispatchProps> = ({
  continueItem,
  waitingCounts,
  isLoading = false,
}) => {
  const totalWaiting =
    waitingCounts.questionsToReview +
    waitingCounts.scriptsToReview +
    waitingCounts.videosToEdit +
    waitingCounts.socialReviews +
    waitingCounts.readyToPublish;

  return (
    <div
      id="operational-dispatch-container"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* ==================================================================== */}
      {/* LEFT COLUMN (65% / lg:col-span-8): What's Waiting & Action Dispatch  */}
      {/* ==================================================================== */}
      <div className="lg:col-span-8 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  What's Waiting & Action Dispatch
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono font-semibold">
                  {totalWaiting} Tasks Queued
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prioritized queue dispatch for scripts, recording takes, video editing, and QC locks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/production"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
              >
                <span>View Full Dispatch Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* DISPATCH CONTENT: If queue has items vs empty */}
          <div className="pt-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-20 bg-slate-100 animate-pulse rounded-xl" />
                <div className="h-20 bg-slate-100 animate-pulse rounded-xl" />
              </div>
            ) : totalWaiting > 0 || continueItem ? (
              <div className="space-y-3">
                {/* 1. Continue In-Flight Active Item Card (if available) */}
                {continueItem && (
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 rounded-xl border border-indigo-500/30 shadow-md relative overflow-hidden group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500 text-white uppercase tracking-wider">
                            Step {continueItem.stepNumber} • {continueItem.stepName}
                          </span>
                          <span className="text-xs text-indigo-300 font-medium">
                            Highest Priority In-Flight
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                          {continueItem.title}
                        </h3>
                        {continueItem.topic && (
                          <div className="text-xs text-slate-300 flex items-center gap-2 font-mono">
                            <span>Topic: {continueItem.topic}</span>
                            {continueItem.subtopic && <span>• {continueItem.subtopic}</span>}
                          </div>
                        )}
                      </div>

                      <Link
                        to={continueItem.targetUrl || '/studio'}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition-all shrink-0 shadow-sm"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Continue Production</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* 2. Queue Dispatch Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card: Generated Questions Needing Review */}
                  {waitingCounts.questionsToReview > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-3 hover:bg-amber-50 transition-all">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-xs font-bold text-amber-900">
                            {waitingCounts.questionsToReview} Questions to Verify
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-700 truncate">
                          Generated drafts awaiting SME sign-off
                        </p>
                      </div>
                      <Link
                        to="/questions?status=GENERATED"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-2xs"
                      >
                        Review
                      </Link>
                    </div>
                  )}

                  {/* Card: Scripts Ready for Recording */}
                  {waitingCounts.scriptsToReview > 0 && (
                    <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-center justify-between gap-3 hover:bg-purple-50 transition-all">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="text-xs font-bold text-purple-900">
                            {waitingCounts.scriptsToReview} Scripts Ready for Recording
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-700 truncate">
                          Teleprompter & video take ready
                        </p>
                      </div>
                      <Link
                        to="/production?status=SCRIPT_READY"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shrink-0 shadow-2xs"
                      >
                        Film Take #1
                      </Link>
                    </div>
                  )}

                  {/* Card: Videos Needing Editing */}
                  {waitingCounts.videosToEdit > 0 && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex items-center justify-between gap-3 hover:bg-indigo-50 transition-all">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-xs font-bold text-indigo-900">
                            {waitingCounts.videosToEdit} Videos in Editing Bay
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-700 truncate">
                          9:16 Shorts editing & captions
                        </p>
                      </div>
                      <Link
                        to="/production?status=EDITING"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-2xs"
                      >
                        Open Editor
                      </Link>
                    </div>
                  )}

                  {/* Card: Ready for Release / Social Review */}
                  {waitingCounts.readyToPublish > 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-3 hover:bg-emerald-50 transition-all">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <UploadCloud className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-emerald-900">
                            {waitingCounts.readyToPublish} Shorts Ready to Release
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 truncate">
                          Final QC passed • Social publishing
                        </p>
                      </div>
                      <Link
                        to="/publishing"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-2xs"
                      >
                        Release Station
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* EMPTY QUEUE: Production Sprint Launcher */
              <div className="bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/30 p-5 rounded-2xl border border-indigo-100 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Production Queue Empty — Production Sprint Launcher
                    </h3>
                    <p className="text-xs text-slate-500">
                      Zero items waiting! Choose a sprint format below to generate high-yield Telugu content instantly:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Sprint Action 1: 15-Minute Short Sprint */}
                  <Link
                    to="/studio?mode=instant"
                    className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        ⚡ Fast Track
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        15-Minute Short Sprint
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Generate 1 instant Telugu aptitude question for immediate filming.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
                      <span>Start Sprint</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>

                  {/* Sprint Action 2: Topic Batch Sprint */}
                  <Link
                    to="/planning"
                    className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        📚 Batch Mode
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Topic Batch Sprint
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Queue a batch of 5 questions for Time & Work or High-Yield topics.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
                      <span>Queue Batch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>

                  {/* Sprint Action 3: Exam Target Sprint */}
                  <Link
                    to="/studio?topicId=BP-TOP-001"
                    className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        🎯 Exam Focus
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Exam Target Sprint
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Focus specifically on APPSC/TSPSC high-yield math shortcuts.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
                      <span>Launch Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* RIGHT COLUMN (35% / lg:col-span-4): AI Content Copilot & Topic Radar */}
      {/* ==================================================================== */}
      <div className="lg:col-span-4 space-y-5">
        {/* CARD 1: AI Content Copilot Recommendation */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-2xl border border-indigo-700/50 p-5 shadow-lg relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between gap-2 border-b border-indigo-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <h3 className="text-sm font-extrabold tracking-tight text-white">
                AI Recommended Next Topic
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              High Yield
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-indigo-300 font-mono">
              Topic: <strong className="text-white">Quantitative Aptitude</strong>
            </div>
            <div className="text-sm font-extrabold text-white leading-snug">
              Time & Work — Alternate Days Shortcut Formula
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Recommended based on recent APPSC Group II / TSPSC DAO exam paper trends. High virality potential for 60s shorts.
            </p>
          </div>

          {/* One-Click Action Button */}
          <Link
            to="/studio?topicId=BP-TOP-001&subtopicId=BP-SUB-0002"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-900 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20"
          >
            <span>✦ Auto-Draft in Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* CARD 2: Real-Life Telugu Contexts Showcase */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Real-Life Telugu Contexts
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Local Exam Radar</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2">
              <span className="text-base shrink-0">🌾</span>
              <div>
                <strong className="text-slate-900 font-semibold block">AP Rythu Bharosa / Agricultural Math</strong>
                <span className="text-slate-500 text-[11px]">Real-life crop yield percentage calculations</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2">
              <span className="text-base shrink-0">🏛️</span>
              <div>
                <strong className="text-slate-900 font-semibold block">APPSC Group 1/2 Data Interpretation</strong>
                <span className="text-slate-500 text-[11px]">State budget distribution percentages</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2">
              <span className="text-base shrink-0">👮</span>
              <div>
                <strong className="text-slate-900 font-semibold block">TS Police SI Speed & Distance Tricks</strong>
                <span className="text-slate-500 text-[11px]">Relative speed math for ground test prep</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2">
              <span className="text-base shrink-0">🏢</span>
              <div>
                <strong className="text-slate-900 font-semibold block">TSPSC DAO Mensuration Shortcuts</strong>
                <span className="text-slate-500 text-[11px]">Fast area calculations for quick solving</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
