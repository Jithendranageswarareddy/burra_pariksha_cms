import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Share2, Youtube, Instagram, Facebook } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { apiClient } from '../../lib/api-client';
import { Publishing, SocialPublishStatus } from '../../types';

interface FinalizePublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Publishing | null;
  onSuccess: (updatedRecord: Publishing, message: string) => void;
}

export const FinalizePublishingModal: React.FC<FinalizePublishingModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess,
}) => {
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const ytPublished = record.youtube?.status === SocialPublishStatus.PUBLISHED;
  const igPublished = record.instagram?.status === SocialPublishStatus.PUBLISHED;
  const fbPublished = record.facebook?.status === SocialPublishStatus.PUBLISHED;
  const publishedCount = (ytPublished ? 1 : 0) + (igPublished ? 1 : 0) + (fbPublished ? 1 : 0);
  const totalConfigured = record.totalPlatformsCount || 3;
  const canFinalize = publishedCount === totalConfigured && ytPublished && igPublished && fbPublished;

  const handleFinalize = async () => {
    if (!canFinalize) {
      setErrorMessage(
        `Cannot finalize publishing: All ${totalConfigured} configured target platforms must be PUBLISHED (${publishedCount}/${totalConfigured} published).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await apiClient.finalizePublishing(record.videoId, remarks.trim() || undefined);
      onSuccess(
        res.publishing || record,
        `Publishing finalized for video ${record.videoId}! Production status moved to UPLOADED.`
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to finalize publishing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="modal-finalize-publishing"
      isOpen={isOpen}
      onClose={onClose}
      title="Finalize Publishing Workflow"
      subtitle={`Video: ${record.videoId} • ${record.videoTitle}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleFinalize}
            disabled={isSubmitting || !canFinalize}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Finalizing...' : 'Confirm Finalize Publishing'}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
          <p className="text-slate-700 leading-relaxed">
            Finalizing publishing marks this video's lifecycle as complete, transitioning the Video Production Status to <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">UPLOADED</span> in the production database.
          </p>
          <div className="text-[11px] text-slate-500">
            Rule: All {totalConfigured} configured target platforms must be PUBLISHED with verified live URLs before finalization ({publishedCount}/{totalConfigured} published).
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="whitespace-pre-wrap">{errorMessage}</div>
          </div>
        )}

        {/* Channels live status */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            Channel Publication Status ({publishedCount} of 3 Live)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-1.5 ${
              ytPublished ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}>
              <Youtube className={`w-3.5 h-3.5 ${ytPublished ? 'text-red-600' : 'text-slate-400'}`} />
              <span className="font-medium">{ytPublished ? 'Live' : 'Pending'}</span>
            </div>

            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-1.5 ${
              igPublished ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}>
              <Instagram className={`w-3.5 h-3.5 ${igPublished ? 'text-pink-600' : 'text-slate-400'}`} />
              <span className="font-medium">{igPublished ? 'Live' : 'Pending'}</span>
            </div>

            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-1.5 ${
              fbPublished ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}>
              <Facebook className={`w-3.5 h-3.5 ${fbPublished ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="font-medium">{fbPublished ? 'Live' : 'Pending'}</span>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            Finalization Remarks (Optional)
          </label>
          <textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Confirmed live playback on YouTube Shorts and Instagram Reels"
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
          />
        </div>
      </div>
    </Modal>
  );
};
