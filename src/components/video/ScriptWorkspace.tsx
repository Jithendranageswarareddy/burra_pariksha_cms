import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  GitBranch,
  History,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import { Script, ScriptVersion, VideoProductionStatus } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';

interface ScriptWorkspaceProps {
  videoId: string;
  videoStatus: VideoProductionStatus;
  onStatusChange?: () => void;
}

export const ScriptWorkspace: React.FC<ScriptWorkspaceProps> = ({
  videoId,
  videoStatus,
  onStatusChange,
}) => {
  const [script, setScript] = useState<Script | null>(null);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Form Fields
  const [hookText, setHookText] = useState<string>('');
  const [problemStatement, setProblemStatement] = useState<string>('');
  const [stepByStepSolution, setStepByStepSolution] = useState<string>('');
  const [speedTrickOrTakeaway, setSpeedTrickOrTakeaway] = useState<string>('');
  const [callToAction, setCallToAction] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Versioning state
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
  const [changeSummary, setChangeSummary] = useState<string>('');
  const [selectedVersionForDiff, setSelectedVersionForDiff] = useState<ScriptVersion | null>(null);

  const fetchScriptData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getScript(videoId);
      if (res.script) {
        setScript(res.script);
        setHookText(res.script.hookText || '');
        setProblemStatement(res.script.problemStatement || '');
        setStepByStepSolution(res.script.stepByStepSolution || '');
        setSpeedTrickOrTakeaway(res.script.speedTrickOrTakeaway || '');
        setCallToAction(res.script.callToAction || '');
        setNotes(res.script.notes || '');

        // Fetch version history
        const vers = await apiClient.getScriptVersions(res.script.id);
        setVersions(vers);
      } else if (res.draftProposal) {
        // Populate draft proposal
        setHookText(res.draftProposal.hookText || '');
        setProblemStatement(res.draftProposal.problemStatement || '');
        setStepByStepSolution(res.draftProposal.stepByStepSolution || '');
        setSpeedTrickOrTakeaway(res.draftProposal.speedTrickOrTakeaway || '');
        setCallToAction(res.draftProposal.callToAction || '');
        setNotes(res.draftProposal.notes || '');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load script data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScriptData();
  }, [videoId]);

  // Teleprompter / Pacing Calculations
  const combinedScriptText = `${hookText}\n\n${problemStatement}\n\n${stepByStepSolution}\n\n${speedTrickOrTakeaway}\n\n${callToAction}`;
  const totalWords = combinedScriptText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  // Estimated reading time at standard fast short-form pacing (~140 wpm)
  const estimatedSeconds = Math.round((totalWords / 140) * 60);

  const handleSave = async (createNewVersion: boolean) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        hookText,
        problemStatement,
        stepByStepSolution,
        speedTrickOrTakeaway,
        callToAction,
        notes,
        createNewVersion,
        changeSummary: createNewVersion ? changeSummary || 'Script content revision' : undefined,
      };

      const res = await apiClient.saveScript(videoId, payload);
      setScript(res.script);

      if (res.script) {
        const vers = await apiClient.getScriptVersions(res.script.id);
        setVersions(vers);
      }

      setSuccessMessage(
        createNewVersion
          ? `Successfully saved as new Version ${res.script.currentVersion}!`
          : 'Script draft saved successfully in-place.'
      );
      setShowVersionModal(false);
      setChangeSummary('');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save script');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = async (versionNumber: number) => {
    if (!script) return;
    if (!window.confirm(`Are you sure you want to revert active script content to Version ${versionNumber}?`)) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const reverted = await apiClient.revertScript(script.id, versionNumber);
      setScript(reverted);
      setHookText(reverted.hookText || '');
      setProblemStatement(reverted.problemStatement || '');
      setStepByStepSolution(reverted.stepByStepSolution || '');
      setSpeedTrickOrTakeaway(reverted.speedTrickOrTakeaway || '');
      setCallToAction(reverted.callToAction || '');
      setNotes(reverted.notes || '');

      setSuccessMessage(`Active script reverted to content from Version ${versionNumber}.`);
      setSelectedVersionForDiff(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to rollback version');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkReady = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await apiClient.markScriptReady(videoId, 'Script reviewed, timed, and marked ready for production');
      setSuccessMessage('Script marked READY! Production stage updated to SCRIPT_READY.');
      if (onStatusChange) onStatusChange();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to mark script ready');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateTeluguAI = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const res = await apiClient.generateTeluguScript(videoId);
      if (res.scriptPayload) {
        setHookText(res.scriptPayload.hookText || '');
        setProblemStatement(res.scriptPayload.problemStatement || '');
        setStepByStepSolution(res.scriptPayload.stepByStepSolution || '');
        setSpeedTrickOrTakeaway(res.scriptPayload.speedTrickOrTakeaway || '');
        setCallToAction(res.scriptPayload.callToAction || '');
        setNotes(res.scriptPayload.notes || '');
        setSuccessMessage('AI Telugu teleprompter narration generated! Review and save to persist.');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate Telugu script');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReturnToEditing = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await apiClient.returnScriptToEditing(videoId, 'Script returned for revision');
      setSuccessMessage('Script returned to SCRIPT_REQUIRED for revision.');
      if (onStatusChange) onStatusChange();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to return script');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyTeleprompter = () => {
    const formatted = `=== BURRA PARIKSHA TELEPROMPTER SCRIPT ===\n\n[HOOK (3-5s)]\n${hookText}\n\n[QUESTION / PROBLEM]\n${problemStatement}\n\n[STEP-BY-STEP SOLUTION]\n${stepByStepSolution}\n\n[SPEED TRICK / TAKEAWAY]\n${speedTrickOrTakeaway}\n\n[CALL TO ACTION]\n${callToAction}\n`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
        <p className="text-xs">Loading script workspace & version history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* Script Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Teleprompter & Reel Script</h2>
              {script ? (
                <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  v{script.currentVersion}
                </span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                  Draft Proposal
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Short-form pacing • ~140 wpm • 5-Part Viral Exam Hook Structure
            </p>
          </div>
        </div>

        {/* Teleprompter Metrics & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-medium text-slate-600">
              Words: <strong className="text-slate-900">{totalWords}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-slate-600">
              Est. Duration:{' '}
              <strong className={estimatedSeconds > 60 ? 'text-rose-600' : 'text-emerald-600'}>
                ~{estimatedSeconds}s
              </strong>
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTeleprompter}
            className="text-xs flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Formatted'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isGenerating || isSaving}
            onClick={handleGenerateTeluguAI}
            className="text-xs text-indigo-700 border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 flex items-center gap-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-indigo-600' : 'text-indigo-600'}`} />
            <span>{isGenerating ? 'Generating AI Telugu...' : 'Generate Telugu (AI)'}</span>
          </Button>

          {videoStatus === VideoProductionStatus.SCRIPT_REQUIRED && (
            <Button
              variant="primary"
              size="sm"
              disabled={isSaving}
              onClick={handleMarkReady}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Script Ready</span>
            </Button>
          )}

          {videoStatus === VideoProductionStatus.SCRIPT_READY && (
            <Button
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={handleReturnToEditing}
              className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return to Editing</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Editor */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            {/* Part 1: Hook */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px]">1</span>
                  Hook & Attention Grabber (0-5s)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {hookText.length} chars
                </span>
              </div>
              <textarea
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                rows={2}
                placeholder="e.g., 90% of students make this mistake in Time & Work! Can you solve it in 20 seconds?"
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Part 2: Problem Statement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px]">2</span>
                  Question & Problem Statement (5-15s)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {problemStatement.length} chars
                </span>
              </div>
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                rows={3}
                placeholder="The exact exam question clearly stated with 4 options..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* Part 3: Step-by-Step Solution */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px]">3</span>
                  Step-by-Step Mathematical Solution (15-35s)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {stepByStepSolution.length} chars
                </span>
              </div>
              <textarea
                value={stepByStepSolution}
                onChange={(e) => setStepByStepSolution(e.target.value)}
                rows={4}
                placeholder="Step 1: Write equation... Step 2: Simplify..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* Part 4: Speed Trick or Takeaway */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px]">4</span>
                  Speed Exam Shortcut / Takeaway (35-45s)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {speedTrickOrTakeaway.length} chars
                </span>
              </div>
              <textarea
                value={speedTrickOrTakeaway}
                onChange={(e) => setSpeedTrickOrTakeaway(e.target.value)}
                rows={2}
                placeholder="Pro-Tip: In the actual exam, check the units digit to eliminate Options B and D instantly!"
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans bg-amber-50/30"
              />
            </div>

            {/* Part 5: Call to Action */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px]">5</span>
                  Call to Action (CTA) (45-50s)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {callToAction.length} chars
                </span>
              </div>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="Save this reel & follow @BurraPariksha for daily shortcuts!"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Internal Notes */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Internal Production Notes (Prompter cues, graphic overlays, audio stingers)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Flash red buzzer on Option B, pop celebratory bell on Option C"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-600 bg-slate-50"
              />
            </div>

            {/* Save Buttons Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                {script ? `Last synced with Google Sheets: ${new Date(script.updatedAt).toLocaleTimeString()}` : 'Unsaved Draft'}
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => handleSave(false)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft In-Place</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => setShowVersionModal(true)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Save as New Version</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Version History & Comparison */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Version History</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">SCRIPT_VERSIONS</span>
            </div>

            {versions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                No versions committed yet. Click "Save as New Version" to snapshot your first revision.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {versions.map((ver) => {
                  const isCurrent = script?.currentVersion === ver.versionNumber;
                  const isSelected = selectedVersionForDiff?.id === ver.id;

                  return (
                    <div
                      key={ver.id}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? 'bg-indigo-50/70 border-indigo-300'
                          : isSelected
                          ? 'bg-slate-100 border-slate-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">Version {ver.versionNumber}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ver.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-slate-600 text-[11px] line-clamp-2 mb-2">
                        {ver.changeSummary || 'Version commit snapshot'}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                        <span className="text-[10px] text-slate-400 font-mono">By: {ver.editedBy}</span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedVersionForDiff(isSelected ? null : ver)}
                            className="text-[11px] text-indigo-600 hover:underline font-medium"
                          >
                            {isSelected ? 'Close' : 'View'}
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleRevert(ver.versionNumber)}
                              className="text-[11px] text-rose-600 hover:underline font-medium"
                            >
                              Revert
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Version Snapshot Inspector */}
          {selectedVersionForDiff && (
            <div className="bg-slate-900 text-white rounded-xl p-4 text-xs space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold">Snapshot: v{selectedVersionForDiff.versionNumber}</span>
                </div>
                <button
                  onClick={() => setSelectedVersionForDiff(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {(() => {
                const parsed =
                  selectedVersionForDiff.contentJson ||
                  (selectedVersionForDiff.content ? JSON.parse(selectedVersionForDiff.content) : {});
                return (
                  <div className="space-y-2 text-[11px] text-slate-300 max-h-60 overflow-y-auto">
                    <div>
                      <strong className="text-indigo-300 block">Hook:</strong>
                      <p>{parsed.hookText || 'N/A'}</p>
                    </div>
                    <div>
                      <strong className="text-indigo-300 block">Problem:</strong>
                      <p>{parsed.problemStatement || 'N/A'}</p>
                    </div>
                    <div>
                      <strong className="text-indigo-300 block">Solution:</strong>
                      <p>{parsed.stepByStepSolution || 'N/A'}</p>
                    </div>
                    <div>
                      <strong className="text-indigo-300 block">Trick:</strong>
                      <p>{parsed.speedTrickOrTakeaway || 'N/A'}</p>
                    </div>
                  </div>
                );
              })()}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRevert(selectedVersionForDiff.versionNumber)}
                className="w-full text-xs border-indigo-400 text-indigo-200 hover:bg-slate-800"
              >
                Restore this version to editor
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Save as New Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Save as New Version</h3>
              </div>
              <button onClick={() => setShowVersionModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              This will increment the script to <strong>Version {(script?.currentVersion || 1) + 1}</strong> and write an immutable snapshot into the <code>SCRIPT_VERSIONS</code> worksheet.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Change Summary / Revision Remarks
              </label>
              <textarea
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="e.g. Shortened hook to 4 seconds, added visual cue for formula trick..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isSaving}
                onClick={() => handleSave(true)}
                className="text-xs bg-indigo-600 text-white"
              >
                {isSaving ? 'Saving...' : 'Commit Version Snapshot'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
