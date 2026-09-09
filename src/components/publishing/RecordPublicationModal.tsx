import React, { useState, useEffect } from 'react';
import { Share2, Youtube, Instagram, Facebook, AlertCircle, Link as LinkIcon, ExternalLink, Info, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { apiClient } from '../../lib/api-client';
import { Publishing, PlatformType } from '../../types';

interface RecordPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Publishing | null;
  initialPlatform?: PlatformType;
  onSuccess: (updated: Publishing, message: string) => void;
}

export const RecordPublicationModal: React.FC<RecordPublicationModalProps> = ({
  isOpen,
  onClose,
  record,
  initialPlatform = 'youtube',
  onSuccess,
}) => {
  const [platform, setPlatform] = useState<PlatformType>(initialPlatform);
  const [postUrl, setPostUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && record) {
      setPlatform(initialPlatform);
      setErrorMessage(null);
      const existingUrl =
        initialPlatform === 'youtube'
          ? record.youtube?.videoUrl || ''
          : initialPlatform === 'instagram'
          ? record.instagram?.postUrl || ''
          : record.facebook?.postUrl || '';
      setPostUrl(existingUrl);
      setNotes('');
    }
  }, [isOpen, record, initialPlatform]);

  if (!isOpen || !record) return null;

  const getPlatformPlaceholder = (p: PlatformType) => {
    switch (p) {
      case 'youtube':
        return 'https://youtube.com/shorts/... or https://youtu.be/...';
      case 'instagram':
        return 'https://instagram.com/reel/... or https://instagram.com/p/...';
      case 'facebook':
        return 'https://facebook.com/watch/... or https://fb.watch/...';
    }
  };

  const validateUrlLocally = (url: string, p: PlatformType): string | null => {
    const trimmed = url.trim();
    if (!trimmed) return 'Public URL is required.';
    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.toLowerCase();
      if (p === 'youtube') {
        if (!host.includes('youtube.com') && !host.includes('youtu.be')) {
          return 'Invalid YouTube URL: URL domain must be youtube.com or youtu.be';
        }
      } else if (p === 'instagram') {
        if (!host.includes('instagram.com')) {
          return 'Invalid Instagram URL: URL domain must be instagram.com';
        }
      } else if (p === 'facebook') {
        if (!host.includes('facebook.com') && !host.includes('fb.watch')) {
          return 'Invalid Facebook URL: URL domain must be facebook.com or fb.watch';
        }
      }
    } catch {
      return 'Invalid URL format. Please include https://';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const localErr = validateUrlLocally(postUrl, platform);
    if (localErr) {
      setErrorMessage(localErr);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const updated = await apiClient.markPlatformPublished(
        record.videoId,
        platform,
        postUrl.trim(),
        notes.trim() || undefined
      );

      onSuccess(
        updated,
        `Successfully recorded live ${platform.toUpperCase()} URL for video ${record.videoId}`
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to record publication for ${platform}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="modal-record-publication"
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Live ${platform.toUpperCase()} Publication`}
      subtitle={`Video: ${record.videoId} • ${record.videoTitle}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !postUrl.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Recording...' : 'Save Published URL'}</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Human in the loop workflow banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">Human-In-The-Loop Distribution</p>
            <p className="text-slate-600 leading-relaxed">
              Burra Pariksha does not connect directly to social APIs. First, copy the approved package and publish the render to your social channel handle. Once published, record the verified live public URL below.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="whitespace-pre-wrap">{errorMessage}</div>
          </div>
        )}

        {/* Platform Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            Publishing Channel
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setPlatform('youtube');
                setErrorMessage(null);
              }}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                platform === 'youtube'
                  ? 'border-red-500 bg-red-50 text-red-800 font-semibold ring-1 ring-red-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Youtube className="w-4 h-4 text-red-600" />
              <span>YouTube Shorts</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPlatform('instagram');
                setErrorMessage(null);
              }}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                platform === 'instagram'
                  ? 'border-pink-500 bg-pink-50 text-pink-800 font-semibold ring-1 ring-pink-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Instagram Reels</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPlatform('facebook');
                setErrorMessage(null);
              }}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                platform === 'facebook'
                  ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold ring-1 ring-blue-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              <span>Facebook Video</span>
            </button>
          </div>
        </div>

        {/* Public URL Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Verified Public Live URL</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Enforces duplicate URL protection</span>
          </label>
          <input
            type="url"
            value={postUrl}
            onChange={(e) => {
              setPostUrl(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={getPlatformPlaceholder(platform)}
            className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
            required
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            Publishing Notes / Remarks (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Uploaded to Telugu shorts playlist; high initial engagement"
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
          />
        </div>
      </form>
    </Modal>
  );
};
