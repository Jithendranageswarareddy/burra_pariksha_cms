import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Share2,
  ArrowRight,
  ArrowLeft,
  Eye,
  RefreshCw,
  Clock,
  Send,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Video, PinnedComment, Question } from '../types';
import { apiClient } from '../lib/api-client';
import { AssetWorkflowHeader } from '../components/social/AssetWorkflowHeader';
import { PageHeader } from '../design-system/components/PageHeader';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Alert } from '../design-system/components/Alert';
import { PageLoading } from '../design-system/components/Loading';
import { EmptyState } from '../design-system/components/EmptyState';

export const VideoPinnedCommentPage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const videoId = routeVideoId || searchParams.get('videoId') || searchParams.get('id') || '';

  // State
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [pinnedComment, setPinnedComment] = useState<PinnedComment | null>(null);

  // Form Fields
  const [commentText, setCommentText] = useState<string>('');
  const [solutionBreakdown, setSolutionBreakdown] = useState<string>('');
  const [nextChallengeQuestion, setNextChallengeQuestion] = useState<string>('');
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // UI & Loading State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadVideoList = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await apiClient.getVideos();
      setVideoList(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load video records');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVideoAndComment = async (targetId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const vid = await apiClient.getVideoById(targetId);
      setSelectedVideo(vid);

      let loadedQuestion: Question | null = null;
      if (vid.questionId) {
        try {
          loadedQuestion = await apiClient.getQuestionById(vid.questionId);
          setQuestion(loadedQuestion);
        } catch (qErr) {
          console.warn('Could not fetch linked question:', qErr);
        }
      }

      const res = await apiClient.getPinnedComment(targetId);
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
      } else if (loadedQuestion) {
        // Auto draft initial values from question
        const correctOpt = loadedQuestion.correctAnswer?.toUpperCase() || 'A';
        const correctVal = loadedQuestion.options ? (loadedQuestion.options as any)[correctOpt] || '' : '';
        setCommentText(`🎯 Correct Answer: Option ${correctOpt}${correctVal ? ` (${correctVal})` : ''}! Detailed solution below 👇`);
        setSolutionBreakdown(loadedQuestion.explanation || 'Step-by-step formula and shortcut applied.');
        setNextChallengeQuestion(`Try this next: Can you solve with double the initial values in under 15 seconds? Drop your answer below!`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load pinned comment data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      loadVideoAndComment(videoId);
    } else {
      loadVideoList();
    }
  }, [videoId]);

  const handleSave = async (approvedStatus = isApproved) => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

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

      const saved = await apiClient.savePinnedComment(targetId, payload);
      const record = saved?.pinnedComment || saved;
      setPinnedComment(record);
      setIsApproved(Boolean(record?.isApproved));
      setSuccessMessage(
        approvedStatus
          ? 'Pinned comment saved and marked APPROVED! (Synchronized with PUBLISHING checklist)'
          : 'Pinned comment draft saved successfully.'
      );
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

  const handleAutoDraftFromQuestion = () => {
    if (!question) {
      setError('No linked question found to auto-draft solution.');
      return;
    }

    const correctOpt = question.correctAnswer?.toUpperCase() || 'A';
    const correctVal = question.options ? (question.options as any)[correctOpt] || '' : '';

    setCommentText(`🎯 Correct Answer: Option ${correctOpt}${correctVal ? ` (${correctVal})` : ''}! Full solution below 👇`);
    setSolutionBreakdown(
      question.explanation || 'Formula: Work = Rate × Time. Applying shortcut simplifies this directly.'
    );
    setNextChallengeQuestion(
      `🎯 Next Challenge for you: If time allowed is cut in half, what would the new answer be? Comment below! 🚀`
    );
    setSuccessMessage('Smart auto-draft generated from question record!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Video Selection List View
  if (!videoId && !selectedVideo) {
    const filteredVideos = videoList.filter(
      (v) =>
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.questionId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <AssetWorkflowHeader currentStep={9} />

        <PageHeader
          title="Pinned Comment Studio"
          description="Author top pinned solution comments, mathematical explanations, and algorithm-boosting engagement prompts"
        />

        {error && (
          <Alert variant="error" title="Error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card padding="md">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Select Video for Pinned Comment Authoring</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a video to compose and approve sticky comments for YouTube Shorts, Instagram Reels, and Facebook
            </p>
          </div>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Search by Video ID, Question ID, or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
            />

            {isLoading ? (
              <PageLoading message="Loading video production records..." />
            ) : filteredVideos.length === 0 ? (
              <EmptyState
                title="No Videos Found"
                description="No video production items matched your search query."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredVideos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => navigate(`/videos/${encodeURIComponent(vid.id)}/pinned-comment`)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/30 transition-all cursor-pointer space-y-2.5 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {vid.id}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {vid.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 line-clamp-2">
                      {vid.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>{vid.questionId || 'Question Asset'}</span>
                      <span className="text-teal-600 font-semibold flex items-center gap-1">
                        Author Comment <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const socialReviewLink = selectedVideo?.questionId
    ? `/social-review?questionId=${encodeURIComponent(selectedVideo.questionId)}`
    : `/videos/${encodeURIComponent(videoId)}/social-review`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <AssetWorkflowHeader
        currentStep={9}
        videoId={selectedVideo?.id || videoId}
        videoTitle={selectedVideo?.title}
        videoStatus={selectedVideo?.status}
        questionId={selectedVideo?.questionId}
      />

      <PageHeader
        title="Pinned Comment Studio"
        description="Craft interactive sticky top comments with verified mathematical answers and community challenge questions"
        actions={
          <div className="flex items-center gap-2">
            <Link to={`/videos/${encodeURIComponent(videoId)}/thumbnail`}>
              <Button
                variant="outline"
                size="sm"
                icon={ArrowLeft}
                className="text-xs"
              >
                Back to Thumbnail
              </Button>
            </Link>

            <Link to={socialReviewLink}>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Proceed to Social Review
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <Alert variant="error" title="Comment Notice" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Action Completed" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <PageLoading message="Loading pinned comment workspace data..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Structured Comment Editor */}
          <div className="space-y-6">
            {/* Status & Actions Card */}
            <Card padding="md">
              <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Sticky Pinned Comment</h3>
                      {isApproved ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
                          APPROVED
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded text-[10px]">
                          DRAFT / PENDING
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Syncs with Google Sheets <code>PINNED_COMMENTS</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    icon={copied ? Check : Copy}
                    className="text-xs"
                  >
                    {copied ? 'Copied!' : 'Copy Text'}
                  </Button>

                  <Button
                    variant={isApproved ? 'outline' : 'primary'}
                    size="sm"
                    disabled={isSaving}
                    onClick={() => handleSave(!isApproved)}
                    icon={CheckCircle2}
                    className={`text-xs ${!isApproved ? 'bg-teal-600 hover:bg-teal-700 text-white font-bold' : ''}`}
                  >
                    {isApproved ? 'Mark Draft' : 'Approve & Ready'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Comment Inputs */}
            <Card padding="md">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Comment Content Editor</h3>
                  <p className="text-xs text-slate-500">
                    Optimized for top pinned placement across YouTube, Instagram, and Facebook
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoDraftFromQuestion}
                  icon={Sparkles}
                  className="text-xs text-teal-700 border-teal-200 hover:bg-teal-50"
                >
                  Auto-Draft from Question
                </Button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    1. Top Sticky Callout & Answer Key
                  </label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    placeholder="e.g. 🎯 Correct Answer: Option C (24 days)! Full detailed breakdown below 👇"
                    className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 font-medium"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Lead with emoji + correct option letter + celebratory hook.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    2. Detailed Mathematical Solution Breakdown
                  </label>
                  <textarea
                    value={solutionBreakdown}
                    onChange={(e) => setSolutionBreakdown(e.target.value)}
                    rows={4}
                    placeholder="Formula: (A * B) / (A + B)... Step 1: Compute individual daily rates. Step 2: Combine..."
                    className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 font-sans"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Clean, readable steps explaining the shortcut and standard method.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    3. Next Engagement Challenge Question (Algorithm Booster)
                  </label>
                  <input
                    type="text"
                    value={nextChallengeQuestion}
                    onChange={(e) => setNextChallengeQuestion(e.target.value)}
                    placeholder="e.g. 🎯 Challenge: What if B worked for 3 days and left? Drop your time in comments!"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 font-medium"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Questions provoke immediate comments from viewers, increasing video virality.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => handleSave(isApproved)}
                    icon={Save}
                    className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold"
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Live Feed Simulation & Handoff */}
          <div className="space-y-6">
            {/* Live Social Comment Simulation Card */}
            <Card padding="md">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">Live Social Feed Preview</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">PINNED_COMMENTS</span>
              </div>

              <div className="p-4 bg-slate-900 rounded-b-xl space-y-3">
                {/* Social Channel Profile & Pin Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      BP
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Burra Pariksha Official</span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-semibold border border-slate-700">
                          Author
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Just now • Telugu Aptitude</span>
                    </div>
                  </div>

                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700/60 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    📌 Pinned
                  </span>
                </div>

                {/* Comment Bubble Body */}
                <div className="text-xs text-slate-100 space-y-2.5 whitespace-pre-wrap leading-relaxed bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 shadow-xs">
                  <p className="font-bold text-yellow-300 text-xs">
                    {commentText || '🎯 Correct Answer: Option C! Full solution below 👇'}
                  </p>

                  {solutionBreakdown && (
                    <div className="pt-2 border-t border-slate-700/80 text-slate-200">
                      <span className="font-bold text-teal-300 block mb-1">📌 Solution Breakdown:</span>
                      <p className="text-slate-300 font-sans leading-normal">{solutionBreakdown}</p>
                    </div>
                  )}

                  {nextChallengeQuestion && (
                    <div className="pt-2 border-t border-slate-700/80 text-pink-300 font-medium">
                      <span>{nextChallengeQuestion}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 px-1 pt-1">
                  <span className="hover:text-slate-200 cursor-pointer">👍 248 Likes</span>
                  <span className="hover:text-slate-200 cursor-pointer">💬 42 Replies</span>
                  <span className="text-slate-500">YouTube Shorts / Reels</span>
                </div>
              </div>
            </Card>

            {/* Linked Question Summary Card */}
            {question && (
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Source Question Reference</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {question.id}
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <p className="font-medium text-slate-900">{question.questionText}</p>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                    <span className="font-bold text-slate-900">Correct Answer: </span>
                    <span className="font-bold text-emerald-700 font-mono">
                      Option {question.correctAnswer}
                    </span>
                    {question.options && (
                      <span className="text-slate-600">
                        {' '}({String((question.options as any)[question.correctAnswer || 'A'] || '')})
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Direct Workflow Handoff Card */}
            <Card padding="md">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono">
                    ✓
                  </span>
                  <span>Next Step: Social Review</span>
                </div>
                <p className="text-xs text-slate-600">
                  Thumbnail and pinned comment complete. Assemble and review the complete social package in Social Review.
                </p>
                <Link to={socialReviewLink}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={ArrowRight}
                    className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Proceed to Social Review
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoPinnedCommentPage;
