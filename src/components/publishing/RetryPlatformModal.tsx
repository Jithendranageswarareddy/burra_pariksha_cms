import React, { useState } from 'react';
import { RotateCcw, Clock, AlertTriangle, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { apiClient } from '../../lib/api-client';
import { Publishing, PlatformType, SocialPublishStatus } from '../../types';

interface RetryPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Publishing | null;
  platform: PlatformType;
  onSuccess: (updated: Publishing, message: string) => void;
}

export const RetryPlatformModal: React.FC<RetryPlatformModalProps> = ({
  isOpen,
  onClose,
  record,
  platform,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'immediate' | 'reschedule'>('immediate');
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const platformInfo = record[platform];
  const lastFailureReason = platformInfo?.lastFailureReason || (record as any)[`${platform}LastFailureReason`] || 'Unknown error occurred during publishing';
  const retryCount = platformInfo?.retryCount ?? (record as any)[`${platform}RetryCount`] ?? 0;
  const failedAt = platformInfo?.failedAt || (record as any)[`${platform}FailedAt`];

  const handleRetry = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      let options: { scheduledAt?: string; remarks?: string } | undefined = undefined;

      if (mode === 'reschedule') {
        if (!scheduleDateTime) {
          setErrorMessage('Please select a future scheduled date and time.');
          setIsSubmitting(false);
          return;
        }
        const selectedDate = new Date(scheduleDateTime);
        if (isNaN(selectedDate.getTime()) || selectedDate.getTime() <= Date.now()) {
          setErrorMessage('Scheduled time must be strictly in the future.');
          setIsSubmitting(false);
          return;
        }
        options = {
          scheduledAt: selectedDate.toISOString(),
          remarks: `Rescheduled retry to ${selectedDate.toISOString()}`,
        };
      } else {
        options = {
          remarks: 'Immediate retry initiated via Publishing UI (reset to DRAFT)',
        };
      }

      const updated = await apiClient.retryPublishing(record.videoId, platform, options);

      const actionText = mode === 'reschedule' ? 'rescheduled for publishing' : 'reset to DRAFT for immediate publishing';
      onSuccess(
        updated,
        `Successfully ${actionText} on ${platform.toUpperCase()} (Attempt #${(retryCount || 0) + 1})`
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to retry publishing for ${platform}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="modal-retry-platform"
      isOpen={isOpen}
      onClose={onClose}
      title={`Retry Failed Platform: ${platform.toUpperCase()}`}
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
            onClick={handleRetry}
            disabled={isSubmitting}
            className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? 'Retrying...'
                : mode === 'reschedule'
                ? 'Confirm Reschedule'
                : 'Retry Now (Set to DRAFT)'}
            </span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Failure Details Card */}
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-900 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Publishing Failure Recorded</span>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-200/70 text-rose-800">
              Retry Count: #{retryCount}
            </span>
          </div>

          <div className="text-xs text-rose-800 bg-white/70 p-2.5 rounded border border-rose-200/50 font-mono break-words">
            {lastFailureReason}
          </div>

          {failedAt && (
            <div className="text-[11px] text-rose-700 flex items-center gap-1">
              <Clock className="w-3 h-3 text-rose-500" />
              <span>Failed at: {new Date(failedAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="whitespace-pre-wrap">{errorMessage}</div>
          </div>
        )}

        {/* Action Mode Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Select Resolution Strategy
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('immediate')}
              className={`p-3 rounded-lg border text-left text-xs transition-all ${
                mode === 'immediate'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 text-indigo-950 font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Retry Now</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Resets platform status to <strong>DRAFT</strong> so the video can be immediately republished.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('reschedule')}
              className={`p-3 rounded-lg border text-left text-xs transition-all ${
                mode === 'reschedule'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 text-indigo-950 font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Reschedule</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Sets platform status to <strong>SCHEDULED</strong> at a specified future date/time.
              </p>
            </button>
          </div>
        </div>

        {/* Datetime input if rescheduling */}
        {mode === 'reschedule' && (
          <div className="space-y-1.5 pt-1 animate-in fade-in">
            <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Future Scheduled Date & Time</span>
            </label>
            <input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(e) => setScheduleDateTime(e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
              required
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
