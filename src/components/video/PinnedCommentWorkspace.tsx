import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Share2,
} from 'lucide-react';
import { PinnedComment } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';

interface PinnedCommentWorkspaceProps {
  videoId: string;
  onStatusChange?: () => void;
}

export const PinnedCommentWorkspace: React.FC<PinnedCommentWorkspaceProps> = ({
  videoId,
  onStatusChange,
}) => {
  const [pinnedComment, setPinnedComment] = useState<PinnedComment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Form Fields
  const [commentText, setCommentText] = useState<string>('');
  const [solutionBreakdown, setSolutionBreakdown] = useState<string>('');
  const [nextChallengeQuestion, setNextChallengeQuestion] = useState<string>('');
  const [isApproved, setIsApproved] = useState<boolean>(false);

  const fetchPinnedCommentData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getPinnedComment(videoId);
      if (res.pinnedComment) {
        setPinnedComment(res.pinnedComment);
        setCommentText(res.pinnedComment.commentText || '');
        setSolutionBreakdown(res.pinnedComment.solutionBreakdown || '');
        setNextChallengeQuestion(res.pinnedComment.nextChallengeQuestion || '');
        setIsApproved(Boolean(res.pinnedComment.isApproved));
      } else if (res.draftProposal) {
        setCommentText(res.draftProposal.commentText || '');
        setSolutionBreakdown(res.draftProposal.solutionBreakdown || '');
        setNextChallengeQuestion(res.draftProposal.nextChallengeQuestion || '');
        setIsApproved(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load pinned comment');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPinnedCommentData();
  }, [videoId]);

  const handleSave = async (approvedStatus = isApproved) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        commentText,
        solutionBreakdown,
        nextChallengeQuestion,
        isApproved: approvedStatus,
      };

      const saved = await apiClient.savePinnedComment(videoId, payload);
      const record = saved?.pinnedComment || saved;
      setPinnedComment(record);
      setIsApproved(Boolean(record?.isApproved));
      setSuccessMessage(
        approvedStatus
          ? 'Pinned comment saved and marked APPROVED! (Synced with PUBLISHING checklist)'
          : 'Pinned comment draft saved.'
      );
      if (onStatusChange) onStatusChange();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save pinned comment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    const fullText = `${commentText}\n\n📌 Detailed Solution:\n${solutionBreakdown}${
      nextChallengeQuestion ? `\n\n🎯 Next Challenge: ${nextChallengeQuestion}` : ''
    }`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
        <p className="text-xs">Loading pinned comment & engagement data...</p>
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

      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Sticky Pinned Comment & Solution Breakdown</h2>
              {isApproved ? (
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-xs">
                  APPROVED
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded text-xs">
                  DRAFT / PENDING
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Auto-formatted for top comment pin on YouTube Shorts, Instagram Reels, and Facebook Video
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Comment!' : 'Copy Formatted Text'}</span>
          </Button>

          <Button
            variant={isApproved ? 'outline' : 'primary'}
            size="sm"
            disabled={isSaving}
            onClick={() => handleSave(!isApproved)}
            className={`text-xs flex items-center gap-1.5 ${
              !isApproved ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isApproved ? 'Mark as Draft' : 'Approve & Mark Ready'}</span>
          </Button>
        </div>
      </div>

      {/* Editor & Live Social Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Editor */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Pinned Comment Content
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Top Sticky Callout & Question Reference
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="e.g. 🎯 Correct Answer: Option C (24 days)! Full detailed breakdown below 👇"
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Detailed Mathematical Solution Breakdown
            </label>
            <textarea
              value={solutionBreakdown}
              onChange={(e) => setSolutionBreakdown(e.target.value)}
              rows={4}
              placeholder="Formula: (A * B) / (A + B)..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Next Engagement Challenge Question (Boosts comment algorithm)
            </label>
            <input
              type="text"
              value={nextChallengeQuestion}
              onChange={(e) => setNextChallengeQuestion(e.target.value)}
              placeholder="e.g. Next Test: What if both worked for 3 days and then B left? Answer in comments!"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 font-sans"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              disabled={isSaving}
              onClick={() => handleSave()}
              className="text-xs bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Live Comment Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Live Pinned Comment Preview</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">PINNED_COMMENTS</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                BP
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">Burra Pariksha Official</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded font-semibold">Author</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded font-semibold">📌 Pinned</span>
                </div>
                <span className="text-[10px] text-slate-400">Just now</span>
              </div>
            </div>

            <div className="text-xs text-slate-800 space-y-2 whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
              <p className="font-semibold text-slate-900">{commentText || 'Add comment text...'}</p>
              {solutionBreakdown && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold text-teal-700 block mb-0.5">📌 Solution Breakdown:</span>
                  <p className="text-slate-700">{solutionBreakdown}</p>
                </div>
              )}
              {nextChallengeQuestion && (
                <div className="pt-2 border-t border-slate-100 text-amber-900 font-medium">
                  <span>🎯 {nextChallengeQuestion}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
