/**
 * BURRA PARIKSHA CMS — Decoupled 5-Dimensional State Status Bar
 * Stage 27 Feature Contract: FC-005 (Canonical 15-Step Workflow State Machine)
 * Traced to:
 * - docs/features/FC-005-WORKFLOW-STATE-ENGINE.md (Section 5)
 * - docs/architecture/08-STATE-MODEL.md
 *
 * Visualizes the 5 orthogonal decoupled state dimensions:
 * 1. workflowStep
 * 2. contentStatus
 * 3. mediaStatus
 * 4. publicationStatus
 * 5. jobStatus
 *
 * Demonstrates the Fundamental State Axiom: No collapsing into a single generic status string.
 */

import React from 'react';
import {
  ContentStatus,
  MediaStatus,
  PublicationStatus,
  JobStatus,
  WorkflowStepNumber,
  CANONICAL_WORKFLOW_STEPS,
} from '../../types/workflow';

interface WorkflowStatusBarProps {
  workflowStep: WorkflowStepNumber;
  contentStatus: ContentStatus;
  mediaStatus: MediaStatus;
  publicationStatus: PublicationStatus;
  jobStatus: JobStatus;
  version?: number;
  lastTransitionAt?: string;
  lastTransitionBy?: string;
  authorId?: string;
}

const CONTENT_STATUS_COLORS: Record<ContentStatus, string> = {
  DRAFT: 'bg-slate-700/50 text-slate-300 border-slate-600',
  IN_REVIEW: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  REJECTED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  ARCHIVED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

const MEDIA_STATUS_COLORS: Record<MediaStatus, string> = {
  NOT_REQUIRED: 'bg-slate-800 text-slate-400 border-slate-700',
  PENDING_UPLOAD: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  PROCESSING: 'bg-sky-500/20 text-sky-300 border-sky-500/30 animate-pulse',
  READY: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  FAILED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

const PUBLICATION_STATUS_COLORS: Record<PublicationStatus, string> = {
  UNPUBLISHED: 'bg-slate-800 text-slate-400 border-slate-700',
  SCHEDULED: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  LIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  SYNCED: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  ERROR: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  IDLE: 'bg-slate-800 text-slate-400 border-slate-700',
  QUEUED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  PROCESSING: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  FAILED: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export const WorkflowStatusBar: React.FC<WorkflowStatusBarProps> = ({
  workflowStep,
  contentStatus,
  mediaStatus,
  publicationStatus,
  jobStatus,
  version,
  lastTransitionAt,
  lastTransitionBy,
  authorId,
}) => {
  const stepDef = CANONICAL_WORKFLOW_STEPS[workflowStep];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Workflow State Matrix (Stage {workflowStep}: {stepDef.name})
          </h3>
          {stepDef.isVerificationStep && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              GAR-02 Verification Gate
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          {authorId && (
            <span>
              Author: <strong className="text-slate-300 font-mono">{authorId}</strong>
            </span>
          )}
          {version !== undefined && (
            <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-mono border border-slate-700">
              OCC v{version}
            </span>
          )}
        </div>
      </div>

      {/* The 5 Orthogonal State Dimensions */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Dimension 1: Workflow Step */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            1. Workflow Step
          </span>
          <div className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {stepDef.shortName}
          </div>
        </div>

        {/* Dimension 2: Content Status */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            2. Content Status
          </span>
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${CONTENT_STATUS_COLORS[contentStatus]}`}
          >
            {contentStatus}
          </div>
        </div>

        {/* Dimension 3: Media Status */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            3. Media Status
          </span>
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${MEDIA_STATUS_COLORS[mediaStatus]}`}
          >
            {mediaStatus}
          </div>
        </div>

        {/* Dimension 4: Publication Status */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            4. Publication Status
          </span>
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${PUBLICATION_STATUS_COLORS[publicationStatus]}`}
          >
            {publicationStatus}
          </div>
        </div>

        {/* Dimension 5: Async Job Status */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            5. Job Status
          </span>
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${JOB_STATUS_COLORS[jobStatus]}`}
          >
            {jobStatus}
          </div>
        </div>
      </div>

      {lastTransitionAt && (
        <div className="mt-3 pt-2 text-[11px] text-slate-500 border-t border-slate-800/60 flex items-center justify-between">
          <span>Last Transition: {new Date(lastTransitionAt).toLocaleString()}</span>
          {lastTransitionBy && <span>By: {lastTransitionBy}</span>}
        </div>
      )}
    </div>
  );
};
