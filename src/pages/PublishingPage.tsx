import React, { useState, useEffect } from 'react';
import {
  Share2,
  Youtube,
  Instagram,
  Facebook,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
  AlertCircle,
  Info,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { PublishingTable } from '../components/publishing/PublishingTable';
import { Publishing, SocialPublishStatus } from '../types';
import { apiClient } from '../lib/api-client';

export const PublishingPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<Publishing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeModalRecord, setActiveModalRecord] = useState<Publishing | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');

  // Modal Form state
  const [ytUrl, setYtUrl] = useState('');
  const [ytStatus, setYtStatus] = useState<SocialPublishStatus>(SocialPublishStatus.NOT_STARTED);
  const [igUrl, setIgUrl] = useState('');
  const [igStatus, setIgStatus] = useState<SocialPublishStatus>(SocialPublishStatus.NOT_STARTED);
  const [fbUrl, setFbUrl] = useState('');
  const [fbStatus, setFbStatus] = useState<SocialPublishStatus>(SocialPublishStatus.NOT_STARTED);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await apiClient.getPublishing();
      setRecords(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load publishing records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleOpenModal = (rec: Publishing) => {
    setActiveModalRecord(rec);
    setYtUrl(rec.youtube?.videoUrl || '');
    setYtStatus(rec.youtube?.status || SocialPublishStatus.NOT_STARTED);

    setIgUrl(rec.instagram?.postUrl || '');
    setIgStatus(rec.instagram?.status || SocialPublishStatus.NOT_STARTED);

    setFbUrl(rec.facebook?.postUrl || '');
    setFbStatus(rec.facebook?.status || SocialPublishStatus.NOT_STARTED);
  };

  const handleSaveUrls = async () => {
    if (!activeModalRecord) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updates: Partial<Publishing> = {
        youtube: {
          status: ytUrl ? SocialPublishStatus.PUBLISHED : ytStatus,
          videoUrl: ytUrl || undefined,
          publishedAt: (ytUrl || ytStatus === SocialPublishStatus.PUBLISHED)
            ? activeModalRecord.youtube?.publishedAt || new Date().toISOString()
            : undefined,
        },
        instagram: {
          status: igUrl ? SocialPublishStatus.PUBLISHED : igStatus,
          postUrl: igUrl || undefined,
          publishedAt: (igUrl || igStatus === SocialPublishStatus.PUBLISHED)
            ? activeModalRecord.instagram?.publishedAt || new Date().toISOString()
            : undefined,
        },
        facebook: {
          status: fbUrl ? SocialPublishStatus.PUBLISHED : fbStatus,
          postUrl: fbUrl || undefined,
          publishedAt: (fbUrl || fbStatus === SocialPublishStatus.PUBLISHED)
            ? activeModalRecord.facebook?.publishedAt || new Date().toISOString()
            : undefined,
        },
      };

      const updated = await apiClient.updatePublishing(activeModalRecord.id, updates);

      setRecords((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );

      setActiveModalRecord(null);
      setNotification(`Published social media URLs saved for video ${updated.videoId}.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save publishing URLs');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      !searchQuery ||
      rec.videoId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.questionId.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterPlatform === 'PENDING_YOUTUBE') return rec.youtube.status !== SocialPublishStatus.PUBLISHED;
    if (filterPlatform === 'PENDING_INSTAGRAM') return rec.instagram.status !== SocialPublishStatus.PUBLISHED;
    if (filterPlatform === 'PENDING_FACEBOOK') return rec.facebook.status !== SocialPublishStatus.PUBLISHED;
    if (filterPlatform === 'ALL_PUBLISHED') return (rec.completedPlatformsCount || 0) >= 3;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <PageHeader
        title="Publishing Manager"
        description="Manual multi-platform upload and URL tracking for YouTube Shorts, Instagram Reels, and Facebook Video."
        badge={
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Manual Upload Workflow • Google Sheets
          </span>
        }
      />

      {/* Manual Workflow Notice */}
      <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-start justify-between gap-3.5 text-xs shadow-xs">
        <div className="flex items-start gap-3.5">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-100">
              Manual Publishing Architecture (No Social APIs by Design)
            </p>
            <p className="text-slate-400 leading-relaxed">
              Burra Pariksha uses a manual human-in-the-loop upload workflow. Final rendered videos are manually posted by the admin to YouTube, Instagram, and Facebook. The live post URLs and statuses are recorded in the <code>PUBLISHING</code> worksheet.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecords}
          disabled={isLoading}
          className="text-xs shrink-0 text-slate-200 border-slate-700 hover:bg-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-medium animate-in fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-700 font-bold">×</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-lg text-xs font-medium animate-in fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 font-bold">×</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Video ID, title, or Question ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Publishing Records</option>
            <option value="PENDING_YOUTUBE">Pending YouTube Shorts</option>
            <option value="PENDING_INSTAGRAM">Pending Instagram Reels</option>
            <option value="PENDING_FACEBOOK">Pending Facebook Video</option>
            <option value="ALL_PUBLISHED">All 3 Channels Live</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
          <p className="text-xs">Loading publishing records from Google Sheets...</p>
        </div>
      ) : (
        <PublishingTable records={filteredRecords} onOpenRecord={handleOpenModal} />
      )}

      {/* Manage Links Modal */}
      {activeModalRecord && (
        <Modal
          isOpen={Boolean(activeModalRecord)}
          onClose={() => setActiveModalRecord(null)}
          title={`Manual Post URLs: ${activeModalRecord.videoId}`}
          subtitle={activeModalRecord.videoTitle}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(`/videos/${activeModalRecord.videoId}`);
                }}
                className="text-xs flex items-center gap-1"
              >
                <span>Open Full Video Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveModalRecord(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleSaveUrls}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSaving ? 'Saving...' : 'Save Published URLs'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              Paste the public live URLs after manually publishing this video on your channel handles. Saving will update the <code>PUBLISHING</code> worksheet in Google Sheets.
            </div>

            {/* YouTube Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-600" />
                  <span>YouTube Shorts URL</span>
                </div>
                <select
                  value={ytStatus}
                  onChange={(e) => setYtStatus(e.target.value as SocialPublishStatus)}
                  className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white"
                >
                  <option value={SocialPublishStatus.NOT_STARTED}>Not Started</option>
                  <option value={SocialPublishStatus.DRAFT}>Draft</option>
                  <option value={SocialPublishStatus.SCHEDULED}>Scheduled</option>
                  <option value={SocialPublishStatus.PUBLISHED}>Published</option>
                </select>
              </label>
              <input
                type="url"
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                placeholder="https://youtube.com/shorts/..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Instagram Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span>Instagram Reel URL</span>
                </div>
                <select
                  value={igStatus}
                  onChange={(e) => setIgStatus(e.target.value as SocialPublishStatus)}
                  className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white"
                >
                  <option value={SocialPublishStatus.NOT_STARTED}>Not Started</option>
                  <option value={SocialPublishStatus.DRAFT}>Draft</option>
                  <option value={SocialPublishStatus.SCHEDULED}>Scheduled</option>
                  <option value={SocialPublishStatus.PUBLISHED}>Published</option>
                </select>
              </label>
              <input
                type="url"
                value={igUrl}
                onChange={(e) => setIgUrl(e.target.value)}
                placeholder="https://instagram.com/reel/..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Facebook Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Facebook Video URL</span>
                </div>
                <select
                  value={fbStatus}
                  onChange={(e) => setFbStatus(e.target.value as SocialPublishStatus)}
                  className="text-[11px] border border-slate-300 rounded px-1.5 py-0.5 bg-white"
                >
                  <option value={SocialPublishStatus.NOT_STARTED}>Not Started</option>
                  <option value={SocialPublishStatus.DRAFT}>Draft</option>
                  <option value={SocialPublishStatus.SCHEDULED}>Scheduled</option>
                  <option value={SocialPublishStatus.PUBLISHED}>Published</option>
                </select>
              </label>
              <input
                type="url"
                value={fbUrl}
                onChange={(e) => setFbUrl(e.target.value)}
                placeholder="https://facebook.com/watch/..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
