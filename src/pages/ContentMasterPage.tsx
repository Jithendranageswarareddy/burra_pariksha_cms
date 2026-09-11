/**
 * BURRA PARIKSHA CMS - Content Master Relationship Explorer
 * Phase 14.4: Canonical Content Master Lifecycle & Relationship Navigation
 * Phase 16.3: Canonical Lifecycle State, Readiness Blockers, and Status Transitions
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  ArrowLeft,
  BookOpen,
  Video as VideoIcon,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Share2,
  CheckCheck,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Search,
  Calendar,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Archive,
  PlayCircle,
  RefreshCw,
  Lock,
  Plus,
  Edit2,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { QuestionStatusBadge, VideoStatusBadge } from '../components/common/StatusBadge';
import { DifficultyBadge } from '../components/common/DifficultyBadge';
import { apiClient } from '../lib/api-client';
import { ContentMaster, ContentMasterCanonicalState, ContentMasterStatus, DifficultyLevel, UserRole } from '../types';
import { ContentMasterDetails } from '../lib/services/content-master.service';
import { useAuth } from '../contexts/AuthContext';
import { EntityAssignmentsSection } from '../components/assignments/EntityAssignmentsSection';

const renderContentMasterStatusBadge = (status?: string) => {
  switch (status) {
    case ContentMasterStatus.DRAFT:
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          DRAFT
        </span>
      );
    case ContentMasterStatus.ACTIVE:
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          ACTIVE
        </span>
      );
    case ContentMasterStatus.COMPLETED:
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          COMPLETED
        </span>
      );
    case ContentMasterStatus.ARCHIVED:
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          ARCHIVED
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          {status || 'ACTIVE'}
        </span>
      );
  }
};

export const ContentMasterPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [details, setDetails] = useState<ContentMasterDetails | null>(null);
  const [canonicalState, setCanonicalState] = useState<ContentMasterCanonicalState | null>(null);
  const [masterList, setMasterList] = useState<ContentMaster[]>([]);
  const [listSearch, setListSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  // Phase 16.3 Lifecycle Action State
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitionSuccess, setTransitionSuccess] = useState<string | null>(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');

  // Phase 16.5: Directory Filtering & Direct Authoring State
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentMasterStatus>('ALL');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createCategoryId, setCreateCategoryId] = useState('');
  const [createTopicId, setCreateTopicId] = useState('');
  const [createSubtopicId, setCreateSubtopicId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editTopicId, setEditTopicId] = useState('');
  const [editSubtopicId, setEditSubtopicId] = useState('');
  const [editPrimaryQuestionId, setEditPrimaryQuestionId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Link Question Modal State (Phase 16.8)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkQuestionId, setLinkQuestionId] = useState('');
  const [linkAsPrimary, setLinkAsPrimary] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const canCreate = Boolean(
    user && (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.CONTENT_MANAGER
    )
  );

  const handleCreateMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setCreateError('Please provide a Title for the new Content Master.');
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await apiClient.createContentMaster({
        title: createTitle.trim(),
        categoryId: createCategoryId.trim() || undefined,
        topicId: createTopicId.trim() || undefined,
        subtopicId: createSubtopicId.trim() || undefined,
      });
      if (res.success && res.data) {
        setIsCreateModalOpen(false);
        setCreateTitle('');
        setCreateCategoryId('');
        setCreateTopicId('');
        setCreateSubtopicId('');
        const listRes = await apiClient.getContentMasters();
        setMasterList(listRes.data || []);
      } else {
        setCreateError('Failed to create Content Master: Unexpected response.');
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create Content Master.');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = () => {
    if (!details?.contentMaster) return;
    setEditTitle(details.contentMaster.title || '');
    setEditCategoryId(details.contentMaster.categoryId || '');
    setEditTopicId(details.contentMaster.topicId || '');
    setEditSubtopicId(details.contentMaster.subtopicId || '');
    setEditPrimaryQuestionId(details.contentMaster.primaryQuestionId || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editTitle.trim()) {
      setEditError('Title cannot be empty.');
      return;
    }
    setIsUpdating(true);
    setEditError(null);
    try {
      const client = apiClient;
      const res = await client.updateContentMaster(id, {
        title: editTitle.trim(),
        categoryId: editCategoryId.trim() || undefined,
        topicId: editTopicId.trim() || undefined,
        subtopicId: editSubtopicId.trim() || undefined,
        primaryQuestionId: editPrimaryQuestionId.trim() || undefined,
      });
      if (res.success && res.data) {
        setIsEditModalOpen(false);
        setEditError(null);
        await loadMasterData(id);
      } else {
        setEditError('Failed to update Content Master.');
      }
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update Content Master.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLinkQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !linkQuestionId.trim()) {
      setLinkError('Please provide a Question ID to link.');
      return;
    }
    setIsLinking(true);
    setLinkError(null);
    try {
      const res = await apiClient.linkQuestionToContentMaster(id, {
        questionId: linkQuestionId.trim(),
        asPrimary: linkAsPrimary,
      });
      if (res.success) {
        setIsLinkModalOpen(false);
        setLinkQuestionId('');
        setLinkAsPrimary(false);
        await loadMasterData(id);
      } else {
        setLinkError('Failed to link Question.');
      }
    } catch (err: any) {
      setLinkError(err?.message || 'Failed to link Question.');
    } finally {
      setIsLinking(false);
    }
  };

  const loadMasterData = async (masterId: string) => {
    setIsLoading(true);
    setError(null);
    setStatusCode(null);
    try {
      const [detailsRes, stateRes] = await Promise.all([
        apiClient.getContentMasterDetails(masterId),
        apiClient.getContentMasterCanonicalState(masterId).catch((err) => {
          console.warn('Could not load canonical state:', err);
          return { success: false, data: null };
        }),
      ]);

      if (detailsRes.data) {
        setDetails(detailsRes.data);
      } else {
        setError(`Content Master "${masterId}" was not found.`);
        setStatusCode(404);
      }

      if (stateRes && stateRes.data) {
        setCanonicalState(stateRes.data);
      }
    } catch (err: any) {
      const status = err?.statusCode || 500;
      setStatusCode(status);
      if (status === 403) {
        setError('Access Denied: You do not have authorization to view this Content Master.');
      } else if (status === 404) {
        setError(`Content Master "${masterId}" was not found in the database.`);
      } else {
        setError(err?.message || 'Failed to load Content Master details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadMasterData(id);
    } else {
      setIsLoading(true);
      setError(null);
      apiClient
        .getContentMasters()
        .then((res) => {
          setMasterList(res.data || []);
        })
        .catch((err: any) => {
          setError(err?.message || 'Failed to load Content Masters list.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  const handleTransition = async (targetStatus: ContentMasterStatus) => {
    if (!id || isTransitioning) return;
    setIsTransitioning(true);
    setTransitionError(null);
    setTransitionSuccess(null);

    try {
      const res = await apiClient.transitionContentMasterStatus(id, targetStatus, remarksInput.trim() || undefined);
      if (res.success && res.data) {
        setTransitionSuccess(`Content Master status successfully transitioned to ${targetStatus}.`);
        setRemarksInput('');
        // Authoritative server refresh
        await loadMasterData(id);
      } else {
        setTransitionError('Transition failed: Unexpected server response.');
      }
    } catch (err: any) {
      // Preserve current state, display backend rejection details, no optimistic mutation
      setTransitionError(err?.message || `Failed to transition Content Master to ${targetStatus}.`);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleArchive = async () => {
    if (!id || isTransitioning) return;
    setIsTransitioning(true);
    setTransitionError(null);
    setTransitionSuccess(null);

    try {
      const res = await apiClient.archiveContentMaster(id, archiveReason.trim() || undefined);
      if (res.success && res.data) {
        setTransitionSuccess('Content Master successfully archived.');
        setShowArchiveConfirm(false);
        setArchiveReason('');
        // Authoritative server refresh
        await loadMasterData(id);
      } else {
        setTransitionError('Archival failed: Unexpected server response.');
      }
    } catch (err: any) {
      setTransitionError(err?.message || 'Failed to archive Content Master.');
    } finally {
      setIsTransitioning(false);
    }
  };

  // If no ID is provided, render the Content Masters directory / selection view
  if (!id) {
    const filteredMasters = masterList.filter((m) => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (!listSearch.trim()) return true;
      const q = listSearch.toLowerCase();
      return (
        m.id.toLowerCase().includes(q) ||
        (m.title || '').toLowerCase().includes(q) ||
        (m.primaryQuestionId || '').toLowerCase().includes(q) ||
        (m.status || '').toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          id="content-masters-list-header"
          title="Content Masters Explorer"
          description="Permanent Content Master lifecycle anchors connecting questions, videos, production assets, reviews, and publishing."
          badge={
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded text-xs font-mono font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Phase 14.4
            </span>
          }
        />

        {/* Status Filter Tabs (Phase 16.5) */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
          {(['ALL', ContentMasterStatus.DRAFT, ContentMasterStatus.ACTIVE, ContentMasterStatus.COMPLETED, ContentMasterStatus.ARCHIVED] as const).map((st) => {
            const count = st === 'ALL' ? masterList.length : masterList.filter((m) => m.status === st).length;
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{st}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${isSelected ? 'bg-purple-900 text-purple-100' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Directory Controls */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Content Masters by ID, title, status, or primary question..."
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
              {filteredMasters.length} authorized master{filteredMasters.length === 1 ? '' : 's'}
            </div>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setCreateTitle('');
                  setCreateCategoryId('');
                  setCreateTopicId('');
                  setCreateSubtopicId('');
                  setCreateError(null);
                  setIsCreateModalOpen(true);
                }}
              >
                New Content Master
              </Button>
            )}
          </div>
        </div>

        {/* Directory Table / Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-purple-600 border-t-transparent mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading Content Master records...</p>
          </div>
        ) : filteredMasters.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Content Masters Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {listSearch
                ? `No Content Masters match the search query "${listSearch}".`
                : 'No Content Masters are currently available for your user account.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Master ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Primary Question</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMasters.map((m) => (
                  <tr key={m.id} className="hover:bg-purple-50/40 transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">
                      <Link
                        to={`/content-masters/${encodeURIComponent(m.id)}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5 text-purple-500" />
                        {m.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {m.title || 'Untitled Master'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {m.primaryQuestionId ? (
                        <Link
                          to={`/questions/${encodeURIComponent(m.primaryQuestionId)}`}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                        >
                          {m.primaryQuestionId}
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {m.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/content-masters/${encodeURIComponent(m.id)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                      >
                        Explore <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CREATE CONTENT MASTER MODAL (Phase 16.5) */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-purple-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-semibold">Create New Content Master</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateMaster} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="Content Master Title..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={createCategoryId}
                    onChange={(e) => setCreateCategoryId(e.target.value)}
                    placeholder="e.g. BP-CAT-000001"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Topic ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={createTopicId}
                    onChange={(e) => setCreateTopicId(e.target.value)}
                    placeholder="e.g. BP-TOP-000001"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subtopic ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={createSubtopicId}
                    onChange={(e) => setCreateSubtopicId(e.target.value)}
                    placeholder="e.g. BP-SUB-000001"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Content Master'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Handle Loading State
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-purple-600 border-t-transparent" />
        <h3 className="text-base font-semibold text-slate-800">
          Loading Content Master Lifecycle Hierarchy...
        </h3>
        <p className="text-xs text-slate-500 font-mono">Fetching {id}</p>
      </div>
    );
  }

  // Handle Error / Forbidden / Not Found
  if (error || !details) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <div className="bg-white rounded-xl border border-red-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              {statusCode === 403 ? 'Access Restricted' : statusCode === 404 ? 'Content Master Not Found' : 'Unable to Load Master'}
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
              icon={ArrowLeft}
            >
              Go Back
            </Button>
            <Link to="/content-masters">
              <Button variant="primary" size="sm" icon={Layers}>
                All Content Masters
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { contentMaster, primaryQuestion, questions, videos, scripts, thumbnails, pinnedComments, publishingRecords, socialReviews, assignments } = details;

  // Build maps for efficient video-level downstream asset lookups
  const scriptMap = new Map<string, typeof scripts[0]>();
  scripts.forEach((s) => scriptMap.set(s.videoId, s));

  const thumbnailMap = new Map<string, typeof thumbnails[0]>();
  thumbnails.forEach((t) => thumbnailMap.set(t.videoId, t));

  const pinnedCommentMap = new Map<string, typeof pinnedComments[0]>();
  pinnedComments.forEach((p) => pinnedCommentMap.set(p.videoId, p));

  const publishingMap = new Map<string, typeof publishingRecords[0]>();
  publishingRecords.forEach((pub) => publishingMap.set(pub.videoId, pub));

  // Find social reviews associated with this master or question
  const relevantReviews = socialReviews || [];

  const currentStatus = (canonicalState?.status || contentMaster.status || ContentMasterStatus.ACTIVE) as ContentMasterStatus;
  const isManagerOrAdmin = Boolean(
    user && (user.role === UserRole.ADMIN || user.role === UserRole.CONTENT_MANAGER)
  );
  const isCreator = Boolean(user && contentMaster.createdBy === user.id);
  const hasActiveAssignment = Boolean(
    user &&
    assignments &&
    assignments.some(
      (a) =>
        (a.assigneeId === user.id || (a as any).assignedTo === user.id) &&
        a.status !== 'COMPLETED' &&
        a.status !== 'CANCELLED' &&
        (a.entityId === contentMaster.id || (a.entityType === 'CONTENT_MASTER' && (!a.entityId || a.entityId === contentMaster.id)))
    )
  );
  const canModify = isManagerOrAdmin || isCreator || hasActiveAssignment;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            icon={ArrowLeft}
            className="text-slate-600 hover:text-slate-900"
          >
            Back
          </Button>
          <span className="text-slate-300">/</span>
          <Link
            to="/content-masters"
            className="text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors"
          >
            Content Masters
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            {contentMaster.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/questions">
            <Button variant="secondary" size="sm" icon={BookOpen}>
              Question Library
            </Button>
          </Link>
          <Link to="/production">
            <Button variant="secondary" size="sm" icon={VideoIcon}>
              Production Tracker
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Master Anchor Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded border border-purple-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                {contentMaster.id}
              </span>
              {renderContentMasterStatusBadge(currentStatus)}
              {canModify && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Edit2}
                  onClick={openEditModal}
                  className="ml-auto"
                >
                  Edit Details
                </Button>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {contentMaster.title || 'Untitled Content Master'}
            </h1>

            {primaryQuestion && (
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{primaryQuestion.categoryName || 'General'}</span>
                {' → '}
                <span className="font-semibold text-slate-700">{primaryQuestion.topicName || 'General'}</span>
                {' → '}
                <span className="font-semibold text-slate-700">{primaryQuestion.subtopicName || 'General'}</span>
              </p>
            )}
          </div>

          {/* Timestamps & Creator Metadata */}
          <div className="text-left md:text-right text-xs text-slate-500 space-y-1 shrink-0 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-lg border md:border-0 border-slate-200 font-mono text-[11px]">
            <div>Created: {contentMaster.createdAt ? new Date(contentMaster.createdAt).toLocaleString() : 'N/A'}</div>
            {contentMaster.updatedAt && (
              <div>Updated: {new Date(contentMaster.updatedAt).toLocaleString()}</div>
            )}
            {contentMaster.createdBy && <div>Author: {contentMaster.createdBy}</div>}
          </div>
        </div>

        {/* Canonical Lifecycle Hierarchy Flow Banner */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Canonical Content Lifecycle Hierarchy
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-800 rounded border border-purple-200 font-semibold">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Content Master
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded border border-indigo-200 font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Question ({questions.length})
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 rounded border border-blue-200 font-semibold">
              <VideoIcon className="w-3.5 h-3.5 text-blue-600" />
              Video ({videos.length})
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
              <span className="flex items-center gap-1" title="Scripts">
                <FileText className="w-3 h-3 text-amber-600" /> {scripts.length}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1" title="Thumbnails">
                <ImageIcon className="w-3 h-3 text-rose-600" /> {thumbnails.length}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1" title="Pinned Comments">
                <MessageSquare className="w-3 h-3 text-emerald-600" /> {pinnedComments.length}
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link
              to={relevantReviews.length > 0 ? `/social-review/${encodeURIComponent(relevantReviews[0].id)}` : `/social-review`}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-800 rounded border border-violet-200 font-semibold transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-violet-600" />
              Social Review ({relevantReviews.length})
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-800 rounded border border-sky-200 font-semibold">
              <Share2 className="w-3.5 h-3.5 text-sky-600" />
              Publishing ({publishingRecords.length})
            </div>
          </div>
        </div>
      </div>

      {/* CANONICAL LIFECYCLE & GOVERNANCE PANEL (Phase 16.2 / 16.3) */}
      <div id="content-master-lifecycle-panel" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              Canonical Lifecycle & Governance
            </h2>
            <p className="text-xs text-slate-500">
              Authoritative Phase 16.2 lifecycle state, downstream gate verification, and status controls.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Authoritative Status:</span>
              {renderContentMasterStatusBadge(currentStatus)}
            </div>
            {id && (
              <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                onClick={() => loadMasterData(id)}
                disabled={isLoading || isTransitioning}
                title="Refresh Canonical State from Server"
              >
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Lifecycle Progression Pipeline */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Lifecycle Pipeline Progression
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Stage 1: DRAFT */}
            <div
              className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-2 ${
                currentStatus === ContentMasterStatus.DRAFT
                  ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300'
                  : currentStatus === ContentMasterStatus.ACTIVE || currentStatus === ContentMasterStatus.COMPLETED
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide">1. Draft</span>
                {currentStatus === ContentMasterStatus.ACTIVE || currentStatus === ContentMasterStatus.COMPLETED ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : currentStatus === ContentMasterStatus.DRAFT ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-200 text-purple-800">CURRENT</span>
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                Initial concept creation, metadata definition, and primary question linking.
              </p>
            </div>

            {/* Stage 2: ACTIVE */}
            <div
              className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-2 ${
                currentStatus === ContentMasterStatus.ACTIVE
                  ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                  : currentStatus === ContentMasterStatus.COMPLETED
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide">2. Active</span>
                {currentStatus === ContentMasterStatus.COMPLETED ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : currentStatus === ContentMasterStatus.ACTIVE ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-200 text-blue-800">CURRENT</span>
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                Active video production, asset development (scripts, thumbnails), and review.
              </p>
            </div>

            {/* Stage 3: COMPLETED */}
            <div
              className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-2 ${
                currentStatus === ContentMasterStatus.COMPLETED
                  ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide">3. Completed</span>
                {currentStatus === ContentMasterStatus.COMPLETED ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                All downstream assets verified, social review approved, multi-platform publishing finalized.
              </p>
            </div>
          </div>

          {currentStatus === ContentMasterStatus.ARCHIVED && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-900 text-xs font-medium">
              <Archive className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Archived Terminal State:</strong> This Content Master was archived on{' '}
                {contentMaster.archivedAt ? new Date(contentMaster.archivedAt).toLocaleString() : 'N/A'}. Relationships and data are preserved read-only.
              </span>
            </div>
          )}
        </div>

        {/* Downstream Canonical Readiness Matrix */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Downstream Readiness & Integrity Matrix
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Primary Question */}
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Question
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  canonicalState?.primaryQuestion?.validationStatus === 'VALID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {canonicalState?.primaryQuestion?.validationStatus || primaryQuestion?.validationStatus || 'NOT_VALIDATED'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 truncate font-mono">
                {canonicalState?.primaryQuestion?.id || primaryQuestion?.id || 'None Linked'}
              </div>
            </div>

            {/* Video Production */}
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <VideoIcon className="w-3.5 h-3.5 text-blue-600" /> Videos
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  canonicalState?.videoSummary?.areAllUploaded
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {canonicalState?.videoSummary?.totalVideos ?? videos.length} Total
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                {canonicalState?.videoSummary?.areAllUploaded
                  ? 'All Uploaded'
                  : canonicalState?.videoSummary?.isAnyInProduction
                  ? 'In Production'
                  : 'Pending Upload'}
              </div>
            </div>

            {/* Production Assets */}
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-600" /> Assets
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  canonicalState?.assetReadiness?.scriptReady &&
                  canonicalState?.assetReadiness?.thumbnailApproved &&
                  canonicalState?.assetReadiness?.pinnedCommentApproved
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {canonicalState?.assetReadiness?.scriptReady &&
                  canonicalState?.assetReadiness?.thumbnailApproved &&
                  canonicalState?.assetReadiness?.pinnedCommentApproved
                    ? 'All Approved'
                    : 'Pending'}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <div>Script: {canonicalState?.assetReadiness?.scriptReady ? '✓ Ready' : '✗ Pending'}</div>
                <div>Thumb: {canonicalState?.assetReadiness?.thumbnailApproved ? '✓ Approved' : '✗ Pending'}</div>
                <div>Comment: {canonicalState?.assetReadiness?.pinnedCommentApproved ? '✓ Approved' : '✗ Pending'}</div>
              </div>
            </div>

            {/* Social Review */}
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5 text-violet-600" /> Social Review
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  canonicalState?.socialReviewState?.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-violet-100 text-violet-800'
                }`}>
                  {canonicalState?.socialReviewState?.status || 'NONE'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                {canonicalState?.socialReviewState?.isVersionHashMatching
                  ? 'Version Hash Verified'
                  : 'Pending Hash Match'}
              </div>
            </div>

            {/* Publishing */}
            <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-sky-600" /> Publishing
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  canonicalState?.publishingState?.isAllPublished
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-sky-100 text-sky-800'
                }`}>
                  {canonicalState?.publishingState?.completedPlatformsCount ?? 0}/{canonicalState?.publishingState?.totalPlatformsCount ?? 3}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 space-y-0.5">
                <div>YT: {canonicalState?.publishingState?.platforms?.youtube || 'Pending'}</div>
                <div>IG: {canonicalState?.publishingState?.platforms?.instagram || 'Pending'}</div>
                <div>FB: {canonicalState?.publishingState?.platforms?.facebook || 'Pending'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Alerts & Blockers Banner */}
        {currentStatus === ContentMasterStatus.ACTIVE && (
          <div className="space-y-2">
            {canonicalState?.isEligibleForCompletion ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-center gap-2.5 text-emerald-900 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>All Completion Gates Satisfied:</strong> This Content Master is eligible for status transition to COMPLETED.
                </span>
              </div>
            ) : (
              canonicalState?.blockers && canonicalState.blockers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Completion Blockers Detected ({canonicalState.blockers.length} pending gate{canonicalState.blockers.length > 1 ? 's' : ''}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-amber-800 pl-1">
                    {canonicalState.blockers.map((b, idx) => (
                      <li key={idx} className="font-mono text-[11px] leading-relaxed">
                        {b}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/60">
                    All downstream gates must be satisfied before the Content Master can be transitioned to COMPLETED.
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* Transition Error Banner (Preserves state, displays backend validation refusal) */}
        {transitionError && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3 text-rose-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Status Transition Refused by Server</div>
              <p className="text-rose-800">{transitionError}</p>
              <p className="text-[11px] text-rose-600">
                The current state has been preserved. No optimistic mutation was applied. Please resolve the blockers above before retrying.
              </p>
            </div>
          </div>
        )}

        {/* Transition Success Banner */}
        {transitionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-center gap-2.5 text-emerald-900 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{transitionSuccess}</span>
          </div>
        )}

        {/* Lifecycle Action Controls */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Lifecycle Controls
            </div>

            {!canModify && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Read-only: Transition controls require Content Manager, Admin, Creator, or assigned specialist permissions.</span>
              </div>
            )}
          </div>

          {canModify && currentStatus !== ContentMasterStatus.ARCHIVED && (
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-lg border border-slate-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Optional transition remarks / audit log note..."
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  disabled={isTransitioning}
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {currentStatus === ContentMasterStatus.DRAFT && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={PlayCircle}
                    onClick={() => handleTransition(ContentMasterStatus.ACTIVE)}
                    isLoading={isTransitioning}
                    disabled={isTransitioning}
                  >
                    Activate Content Master
                  </Button>
                )}

                {currentStatus === ContentMasterStatus.ACTIVE && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => handleTransition(ContentMasterStatus.COMPLETED)}
                    isLoading={isTransitioning}
                    disabled={isTransitioning}
                    title={
                      canonicalState?.blockers && canonicalState.blockers.length > 0
                        ? 'Backend validation will enforce completion gates'
                        : 'Transition Content Master to Completed'
                    }
                  >
                    Mark as Completed
                  </Button>
                )}

                {currentStatus === ContentMasterStatus.COMPLETED && (
                  <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Content Master Completed (Gates Locked)
                  </span>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  icon={Archive}
                  onClick={() => setShowArchiveConfirm(true)}
                  disabled={isTransitioning}
                >
                  Archive Content Master
                </Button>
              </div>
            </div>
          )}

          {/* Archival Confirmation Card (Inline) */}
          {showArchiveConfirm && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-3 mt-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900">
                    Confirm Archival for Content Master {contentMaster.id}
                  </h4>
                  <p className="text-xs text-amber-800">
                    Archiving is a <strong>terminal lifecycle action</strong>. Once archived, the Content Master cannot be transitioned back to Draft, Active, or Completed. Child questions and video productions will remain linked in read-only mode.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Reason for archival (optional)..."
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  disabled={isTransitioning}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Archive}
                    onClick={handleArchive}
                    isLoading={isTransitioning}
                    disabled={isTransitioning}
                  >
                    Confirm Archive
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowArchiveConfirm(false);
                      setArchiveReason('');
                    }}
                    disabled={isTransitioning}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: PRIMARY QUESTION RELATIONSHIP */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Primary Canonical Question
          </h2>
          <div className="flex items-center gap-2">
            {canModify && currentStatus !== ContentMasterStatus.COMPLETED && currentStatus !== ContentMasterStatus.ARCHIVED && (
              <Button
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setLinkQuestionId('');
                  setLinkAsPrimary(!primaryQuestion);
                  setLinkError(null);
                  setIsLinkModalOpen(true);
                }}
              >
                Link Question
              </Button>
            )}
            {primaryQuestion && (
              <Link
                to={`/questions/${encodeURIComponent(primaryQuestion.id)}`}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
              >
                Open Question Detail <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {primaryQuestion ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link
                  to={`/questions/${encodeURIComponent(primaryQuestion.id)}`}
                  className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors"
                >
                  {primaryQuestion.id}
                </Link>
                <QuestionStatusBadge status={primaryQuestion.status} />
                <DifficultyBadge difficulty={primaryQuestion.difficulty as DifficultyLevel} />
              </div>

              <Link
                to={`/questions/${encodeURIComponent(primaryQuestion.id)}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-xs font-semibold border border-indigo-200 transition-colors"
              >
                Inspect Question <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <p className="text-sm font-medium text-slate-800 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
              {primaryQuestion.questionText}
            </p>

            {primaryQuestion.explanation && (
              <p className="text-xs text-slate-600 line-clamp-2">
                <span className="font-semibold text-slate-700">Explanation:</span> {primaryQuestion.explanation}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-xs">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-700">No Authorized Primary Question</p>
            <p className="mt-0.5 text-slate-400">
              No primary question record is linked to this Content Master, or you do not have permission to access it.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: DOWNSTREAM VIDEO PRODUCTIONS & ASSOCIATED ASSETS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-blue-600" />
              Downstream Video Productions ({videos.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Production assets, social enhancement reviews, and distribution tracking for linked videos.
            </p>
          </div>
          <Link
            to="/production"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
          >
            Production Tracker <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {videos.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-xs">
            <VideoIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No Video Productions Linked</p>
            <p className="mt-0.5 text-slate-400 max-w-md mx-auto">
              No video productions exist for this Content Master yet, or linked videos are outside your assigned permissions.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {videos.map((vid) => {
              const script = scriptMap.get(vid.id);
              const thumb = thumbnailMap.get(vid.id);
              const pin = pinnedCommentMap.get(vid.id);
              const pub = publishingMap.get(vid.id);
              const vidReviews = relevantReviews.filter(
                (r) => r.questionId === vid.questionId || r.contentMasterId === contentMaster.id
              );

              return (
                <div
                  key={vid.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  {/* Video Production Header */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Link
                          to={`/production/${encodeURIComponent(vid.id)}`}
                          className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                        >
                          <VideoIcon className="w-3 h-3" />
                          {vid.id}
                        </Link>
                        <VideoStatusBadge status={vid.status} />
                        {vid.priority && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                            {vid.priority} Priority
                          </span>
                        )}
                        {vid.assignedHost && (
                          <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Host: {vid.assignedHost}
                          </span>
                        )}
                        {vid.assignedEditor && (
                          <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Editor: {vid.assignedEditor}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800">
                        {vid.title || 'Untitled Video Production'}
                      </div>
                    </div>

                    <Link
                      to={`/production/${encodeURIComponent(vid.id)}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white text-blue-700 hover:bg-blue-50 rounded-md text-xs font-semibold border border-slate-200 shadow-2xs transition-colors shrink-0"
                    >
                      Open Video Production <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Downstream Child Assets Grid */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {/* 1. SCRIPT ASSET */}
                    <div className="bg-slate-50/60 rounded-lg border border-slate-200 p-3 flex flex-col justify-between space-y-2.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            Teleprompter Script
                          </span>
                          {script ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              v{script.currentVersion}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">
                              Missing
                            </span>
                          )}
                        </div>

                        {script ? (
                          <div className="text-slate-600 space-y-1 text-[11px]">
                            <p className="line-clamp-2 italic text-slate-700">
                              "{script.hookText || script.problemStatement || 'Script content recorded'}"
                            </p>
                            <div className="text-[10px] text-slate-400">
                              Created: {new Date(script.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic py-1">
                            Script not yet authored for this video.
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/production/${encodeURIComponent(vid.id)}?tab=script`}
                        className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center gap-1 mt-auto pt-1"
                      >
                        {script ? 'View / Edit Script' : 'Author Script'} →
                      </Link>
                    </div>

                    {/* 2. THUMBNAIL ASSET */}
                    <div className="bg-slate-50/60 rounded-lg border border-slate-200 p-3 flex flex-col justify-between space-y-2.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-rose-600" />
                            Thumbnail Asset
                          </span>
                          {thumb ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                              {thumb.status || 'READY'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">
                              Missing
                            </span>
                          )}
                        </div>

                        {thumb ? (
                          <div className="text-slate-600 space-y-1 text-[11px]">
                            <div className="font-medium text-slate-700 truncate">
                              {thumb.hookHeadline || 'Thumbnail Asset'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Version: v{thumb.currentVersion} • Updated: {new Date(thumb.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic py-1">
                            Thumbnail artwork not yet generated.
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/production/${encodeURIComponent(vid.id)}?tab=thumbnail`}
                        className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:underline inline-flex items-center gap-1 mt-auto pt-1"
                      >
                        {thumb ? 'View Thumbnail Studio' : 'Generate Thumbnail'} →
                      </Link>
                    </div>

                    {/* 3. PINNED COMMENT ASSET */}
                    <div className="bg-slate-50/60 rounded-lg border border-slate-200 p-3 flex flex-col justify-between space-y-2.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            Pinned Comment
                          </span>
                          {pin ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              pin.isApproved
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {pin.isApproved ? 'APPROVED' : 'DRAFT'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">
                              Missing
                            </span>
                          )}
                        </div>

                        {pin ? (
                          <div className="text-slate-600 space-y-1 text-[11px]">
                            <p className="line-clamp-2 italic text-slate-700">
                              "{pin.commentText || 'Discussion prompt recorded.'}"
                            </p>
                            <div className="text-[10px] text-slate-400">
                              Audience CTA & engagement anchor
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic py-1">
                            Pinned comment not yet drafted.
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/production/${encodeURIComponent(vid.id)}?tab=pinned-comment`}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline inline-flex items-center gap-1 mt-auto pt-1"
                      >
                        {pin ? 'View Pinned Comment' : 'Draft Pinned Comment'} →
                      </Link>
                    </div>

                    {/* 4. SOCIAL REVIEW STATUS (NON-CLICKABLE DEFERRED TO PHASE 14.5) */}
                    <div className="bg-slate-50/60 rounded-lg border border-slate-200 p-3 flex flex-col justify-between space-y-2.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <CheckCheck className="w-3.5 h-3.5 text-violet-600" />
                            Social Review
                          </span>
                          {vidReviews.length > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-50 text-violet-800 border border-violet-200">
                              {vidReviews[0].decision || 'REVIEWED'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">
                              Pending
                            </span>
                          )}
                        </div>

                        {vidReviews.length > 0 ? (
                          <div className="text-slate-600 space-y-1 text-[11px]">
                            <div className="font-medium text-slate-700">
                              Reviewer: {vidReviews[0].reviewerName || vidReviews[0].reviewerId}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Quality Score: {vidReviews[0].overallQualityScoreAtReview ?? 'N/A'}/100
                            </div>
                            {vidReviews[0].reason && (
                              <p className="line-clamp-2 text-slate-600 italic text-[10px]">
                                "{vidReviews[0].reason}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic py-1">
                            Pending social enhancement review cycle.
                          </div>
                        )}
                      </div>

                      {/* Navigable review deep-link per Phase 14.5 requirement (with fallback note preserving Phase 14.4 regression) */}
                      {vidReviews.length > 0 ? (
                        <Link
                          to={`/social-review/${encodeURIComponent(vidReviews[0].id)}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-900 transition-colors pt-1 border-t border-slate-200/60"
                        >
                          <span>Open Social Review ({vidReviews[0].id}) →</span>
                        </Link>
                      ) : (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-200/60">
                          <Info className="w-3 h-3 shrink-0" />
                          <span>Direct review deep-link deferred to Phase 14.5</span>
                        </div>
                      )}
                    </div>

                    {/* 5. PUBLISHING ASSET */}
                    <div className="bg-slate-50/60 rounded-lg border border-slate-200 p-3 flex flex-col justify-between space-y-2.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5 text-sky-600" />
                            Publishing Tracker
                          </span>
                          {pub ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                              {pub.finalVideoStatus || 'READY'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">
                              Unpublished
                            </span>
                          )}
                        </div>

                        {pub ? (
                          <div className="text-slate-600 space-y-1 text-[11px]">
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="font-semibold text-slate-700">YT:</span> {pub.youtube?.status || 'Pending'}
                              <span>•</span>
                              <span className="font-semibold text-slate-700">IG:</span> {pub.instagram?.status || 'Pending'}
                              <span>•</span>
                              <span className="font-semibold text-slate-700">FB:</span> {pub.facebook?.status || 'Pending'}
                            </div>
                            {pub.youtube?.publishedAt && (
                              <div className="text-[10px] text-slate-400">
                                Published: {new Date(pub.youtube.publishedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic py-1">
                            Distribution package not created yet.
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/publishing?videoId=${encodeURIComponent(vid.id)}`}
                        className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 hover:underline inline-flex items-center gap-1 mt-auto pt-1"
                      >
                        Publishing Hub (?videoId={vid.id}) →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: SECONDARY QUESTIONS & TEAM ASSIGNMENTS (IF PRESENT) */}
      {questions.length > 1 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            Additional Linked Questions ({questions.length - 1})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questions
              .filter((q) => !primaryQuestion || q.id !== primaryQuestion.id)
              .map((q) => (
                <div
                  key={q.id}
                  className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700">{q.id}</span>
                      <QuestionStatusBadge status={q.status} />
                    </div>
                    <p className="text-slate-600 line-clamp-2 text-[11px]">{q.questionText}</p>
                  </div>
                  <Link
                    to={`/questions/${encodeURIComponent(q.id)}`}
                    className="shrink-0 p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* SECTION 4: TEAM TASK ASSIGNMENTS (Phase 16.5) */}
      <div id="content-master-assignments-panel" className="pt-4 border-t border-slate-200">
        <EntityAssignmentsSection
          entityType="CONTENT_MASTER"
          entityId={contentMaster.id}
          title="Content Master Team Task Assignments"
          defaultTaskType="QUESTION_REVIEW"
        />
      </div>

      {/* EDIT CONTENT MASTER DETAILS MODAL (Phase 16.5) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-purple-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-semibold">Edit Content Master Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateMaster} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Content Master Title..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category ID
                </label>
                <input
                  type="text"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  placeholder="e.g. BP-CAT-000001"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Topic ID
                </label>
                <input
                  type="text"
                  value={editTopicId}
                  onChange={(e) => setEditTopicId(e.target.value)}
                  placeholder="e.g. BP-TOP-000001"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subtopic ID
                </label>
                <input
                  type="text"
                  value={editSubtopicId}
                  onChange={(e) => setEditSubtopicId(e.target.value)}
                  placeholder="e.g. BP-SUB-000001"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Question ID (Optional)
                </label>
                <input
                  type="text"
                  value={editPrimaryQuestionId}
                  onChange={(e) => setEditPrimaryQuestionId(e.target.value)}
                  placeholder="e.g. BP-Q-000001"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Must be an active, non-archived Question matching this Content Master's taxonomy.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK QUESTION MODAL (Phase 16.8) */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-purple-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-semibold">Link Question to Content Master</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {linkError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {linkError}
              </div>
            )}

            <form onSubmit={handleLinkQuestion} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Question ID *
                </label>
                <input
                  type="text"
                  value={linkQuestionId}
                  onChange={(e) => setLinkQuestionId(e.target.value)}
                  placeholder="e.g. BP-Q-000001"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Question must exist, must not be archived, and taxonomy must match this Content Master.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="set-as-primary"
                  checked={linkAsPrimary}
                  onChange={(e) => setLinkAsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <label htmlFor="set-as-primary" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Designate as Primary Question for this Content Master
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  disabled={isLinking}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLinking}
                >
                  {isLinking ? 'Linking...' : 'Link Question'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
