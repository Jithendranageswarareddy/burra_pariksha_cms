/**
 * BURRA PARIKSHA CMS — Workflow Action Panel
 * Stage 27 Feature Contract: FC-005 (Canonical 15-Step Workflow State Machine)
 * Traced to:
 * - docs/features/FC-005-WORKFLOW-STATE-ENGINE.md (Section 7)
 * - docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md
 *
 * Renders contextual transition buttons based on backend state and user capability.
 * Blocks unavailable transitions with informative explanations.
 * UX-only: Security and state-machine authority strictly enforced by backend.
 */

import React, { useState } from 'react';
import {
  WorkflowInstanceDocument,
  ValidTransitionTarget,
  WorkflowStepNumber,
  CANONICAL_WORKFLOW_STEPS,
} from '../../types/workflow';

interface WorkflowActionPanelProps {
  workflow: WorkflowInstanceDocument;
  validTargets: ValidTransitionTarget[];
  onTransition: (targetStep: number, action: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
  userRole?: string;
  userId?: string;
}

export const WorkflowActionPanel: React.FC<WorkflowActionPanelProps> = ({
  workflow,
  validTargets,
  onTransition,
  isLoading = false,
}) => {
  const [selectedAction, setSelectedAction] = useState<ValidTransitionTarget | null>(null);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stepDef = CANONICAL_WORKFLOW_STEPS[workflow.currentStep];

  const handleExecute = async () => {
    if (!selectedAction) return;
    setErrorMsg(null);
    try {
      await onTransition(selectedAction.targetStep, selectedAction.action, reason.trim() || undefined);
      setSelectedAction(null);
      setReason('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Transition failed. Please check requirements.');
    }
  };

  const getActionColor = (target: ValidTransitionTarget): string => {
    if (!target.isAvailable) return 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed';
    if (target.type === 'FORWARD') {
      if (target.action.includes('APPROVE') || target.action.includes('VERIFY') || target.action.includes('COMPLETE')) {
        return 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-900/30';
      }
      return 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-900/30';
    }
    if (target.type === 'REVISION') {
      return 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-amber-900/30';
    }
    if (target.type === 'TERMINAL') {
      return 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-rose-900/30';
    }
    return 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600';
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">Stage {workflow.currentStep} Actions</h4>
          <p className="text-xs text-slate-400 mt-0.5">{stepDef.description}</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
          Required Cap: <code className="text-indigo-300 font-mono">{stepDef.requiredCapability}</code>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {validTargets.map((target) => {
          const isSelected = selectedAction?.action === target.action && selectedAction?.targetStep === target.targetStep;
          const colorClass = getActionColor(target);

          return (
            <div key={`${target.targetStep}-${target.action}`} className="relative flex flex-col">
              <button
                type="button"
                disabled={!target.isAvailable || isLoading}
                onClick={() => setSelectedAction(isSelected ? null : target)}
                className={`w-full py-2.5 px-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all duration-200 shadow-sm ${colorClass} ${
                  isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950' : ''
                }`}
              >
                <span>{target.action.replace(/_/g, ' ')}</span>
                <span className="text-[10px] opacity-80 font-mono">
                  {target.targetStep === workflow.currentStep
                    ? 'In-Place'
                    : target.type === 'REVISION'
                    ? `← Step ${target.targetStep}`
                    : `→ Step ${target.targetStep}`}
                </span>
              </button>

              {/* Explanatory banner for blocked actions */}
              {!target.isAvailable && target.blockedReason && (
                <span className="mt-1 text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  ⚠️ {target.blockedReason}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation & Reason Drawer for Selected Action */}
      {selectedAction && (
        <div className="mt-5 p-4 bg-slate-800/70 border border-slate-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold text-white">
              Confirm Transition: <span className="text-indigo-400">{selectedAction.action}</span>
            </h5>
            <span className="text-[11px] text-slate-400 font-mono">Target: Step {selectedAction.targetStep}</span>
          </div>

          <p className="text-xs text-slate-300 mb-3">
            {selectedAction.type === 'FORWARD' && 'Advancing content item to the next sequential stage.'}
            {selectedAction.type === 'REVISION' && 'Returning content item for revisions. Explanatory remarks required.'}
            {selectedAction.type === 'TERMINAL' && 'Halt or finalize this production workflow instance.'}
          </p>

          <div className="mb-3">
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Transition Remarks {selectedAction.type === 'REVISION' ? '(Required)' : '(Optional)'}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. 10-point audit certified, or timecoded defect notes..."
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedAction(null)}
              className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoading || (selectedAction.type === 'REVISION' && !reason.trim())}
              onClick={handleExecute}
              className="px-4 py-1.5 rounded text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow"
            >
              {isLoading ? 'Executing...' : 'Confirm Transition'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
