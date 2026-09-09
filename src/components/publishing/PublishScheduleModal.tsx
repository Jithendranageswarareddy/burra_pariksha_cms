import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, Youtube, Instagram, Facebook, Calendar, Globe } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { apiClient } from '../../lib/api-client';
import { Publishing, PlatformType, SocialPublishStatus } from '../../types';

interface PublishScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Publishing | null;
  initialPlatform?: PlatformType;
  isReschedule?: boolean;
  onSuccess: (updated: Publishing, message: string) => void;
}

export const PublishScheduleModal: React.FC<PublishScheduleModalProps> = ({
  isOpen,
  onClose,
  record,
  initialPlatform = 'youtube',
  isReschedule = false,
  onSuccess,
}) => {
  const [platform, setPlatform] = useState<PlatformType>(initialPlatform);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && record) {
      setPlatform(initialPlatform);
      setErrorMessage(null);

      // Pre-fill scheduleDateTime if existing scheduledAt exists
      const currentPlatformInfo = record[initialPlatform];
      const existingScheduled = currentPlatformInfo?.scheduledAt || (record as any)[`${initialPlatform}ScheduledAt`];
      if (existingScheduled) {
        try {
          const date = new Date(existingScheduled);
          // format to local YYYY-MM-DDThh:mm for datetime-local
          const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setScheduleDateTime(localIso);
        } catch {
          setScheduleDateTime('');
        }
      } else {
        // default to tomorrow same time
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setScheduleDateTime(localIso);
      }
    }
  }, [isOpen, record, initialPlatform]);

  if (!isOpen || !record) return null;

  const currentPlatformInfo = record[platform];
  const isFailed = currentPlatformInfo?.status === SocialPublishStatus.FAILED;

  // Calculate UTC conversion
  let utcDisplay = '';
  if (scheduleDateTime) {
    try {
      const d = new Date(scheduleDateTime);
      if (!isNaN(d.getTime())) {
        utcDisplay = d.toISOString();
      }
    } catch {
      utcDisplay = '';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDateTime) {
      setErrorMessage('Please select a scheduled date and time.');
      return;
    }

    const selectedDate = new Date(scheduleDateTime);
    if (isNaN(selectedDate.getTime())) {
      setErrorMessage('Invalid date and time entered.');
      return;
    }

    if (selectedDate.getTime() <= Date.now()) {
      setErrorMessage('Scheduled time must be strictly in the future. Past timestamps cannot be scheduled.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const isoUtc = selectedDate.toISOString();

      let updatedRecord: Publishing;
      if (isFailed || isReschedule) {
        // Use retryPublishing with scheduledAt to reschedule failed or retried platform
        updatedRecord = await apiClient.retryPublishing(record.videoId, platform, {
          scheduledAt: isoUtc,
          remarks: `Rescheduled to ${isoUtc} via Publishing UI`,
        });
      } else {
        updatedRecord = await apiClient.schedulePublishing(record.videoId, platform, isoUtc);
      }

      const formattedLocal = selectedDate.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      onSuccess(
        updatedRecord,
        `Successfully ${isReschedule || isFailed ? 'rescheduled' : 'scheduled'} ${platform.toUpperCase()} for ${formattedLocal}`
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to schedule ${platform}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="modal-publish-schedule"
      isOpen={isOpen}
      onClose={onClose}
      title={isReschedule || isFailed ? `Reschedule ${platform.toUpperCase()}` : `Schedule ${platform.toUpperCase()} Publishing`}
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
            onClick={handleSubmit}
            disabled={isSubmitting || !scheduleDateTime}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Scheduling...' : isReschedule || isFailed ? 'Confirm Reschedule' : 'Confirm Schedule'}</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="whitespace-pre-wrap">{errorMessage}</div>
          </div>
        )}

        {/* Platform Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            Publishing Platform
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPlatform('youtube')}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                platform === 'youtube'
                  ? 'border-red-500 bg-red-50 text-red-800 font-semibold ring-1 ring-red-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Youtube className="w-4 h-4 text-red-600" />
              <span>YouTube</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform('instagram')}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                platform === 'instagram'
                  ? 'border-pink-500 bg-pink-50 text-pink-800 font-semibold ring-1 ring-pink-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform('facebook')}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                platform === 'facebook'
                  ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold ring-1 ring-blue-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* Current Platform Status */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
          <span className="text-slate-600">Current Platform Status:</span>
          <span className="font-semibold text-slate-800 uppercase font-mono">
            {currentPlatformInfo?.status || SocialPublishStatus.NOT_STARTED}
          </span>
        </div>

        {/* Datetime Local Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Scheduled Date & Time (Local Time)</span>
            </span>
          </label>
          <input
            type="datetime-local"
            value={scheduleDateTime}
            onChange={(e) => setScheduleDateTime(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
            required
          />
          <p className="text-[11px] text-slate-500">
            Scheduling requires a future time. The time is preserved as authoritative UTC in Google Sheets.
          </p>
        </div>

        {/* UTC Converted Preview */}
        {utcDisplay && (
          <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
            <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Server Source of Truth (UTC ISO):</span>
              <div className="font-mono text-indigo-700 mt-0.5 break-all">{utcDisplay}</div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
