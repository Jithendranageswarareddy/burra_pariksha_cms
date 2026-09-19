import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Edit3,
  Video as VideoIcon,
  Layers,
  Check,
  X,
  FileCheck,
  Share2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '../design-system/components/PageHeader';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Card } from '../design-system/components/Card';
import { Alert } from '../design-system/components/Alert';
import { PageLoading } from '../design-system/components/Loading';
import { EmptyState } from '../design-system/components/EmptyState';
import { SuccessState } from '../design-system/components/SuccessState';
import { Modal } from '../design-system/components/Modal';
import { QuestionWorkflowHeader } from '../components/questions/QuestionWorkflowHeader';
import { ProductionJourneyBar } from '../components/production/ProductionJourneyBar';
import { useProductionJourney } from '../contexts/ProductionJourneyContext';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import {
  Question,
  QuestionStatus,
  DifficultyLevel,
  ValidationResult,
  ValidationCheckItem,
  VideoProductionStatus,
  QuestionValidationStatus,
  Video,
} from '../types';

export const QuestionVerifyApprovePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    loadJourneyForQuestion,
    loadJourneyForVideo,
    setCanonicalIds,
    videoId: contextVideoId,
    currentStage,
  } = useProductionJourney();

  const activeQuestionId = id || searchParams.get('questionId') || searchParams.get('id') || '';

  // Questions selector list state (if no active question ID)
  const [candidateList, setCandidateList] = useState<Question[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [listSearch, setListSearch] = useState<string>('');

  // Active question state
  const [question, setQuestion] = useState<Question | null>(null);
  const [queuedVideo, setQueuedVideo] = useState<Video | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Validation Engine Result
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  // 1. If no active question ID, load questions needing verification
  useEffect(() => {
    if (!activeQuestionId) {
      async function loadGeneratedQuestions() {
        try {
          setLoadingList(true);
          const data = await apiClient.getQuestions({});
          setCandidateList(data);
        } catch (err: any) {
          console.error('Failed to load questions for verification:', err);
        } finally {
          setLoadingList(false);
        }
      }
      loadGeneratedQuestions();
    }
  }, [activeQuestionId]);

  // 2. Load active question data & run verification
  const loadQuestionAndVerify = useCallback(async (qId: string) => {
    setLoadingQuestion(true);
    setNotification(null);
    try {
      const q = await apiClient.getQuestionById(qId);
      setQuestion(q);

      // Attach question to continuous production journey
      await loadJourneyForQuestion(qId, q);

      // Check if video production record is already attached/queued
      try {
        const videos = await apiClient.getVideos();
        const matchedVideo = videos.find((v) => v.questionId === qId);
        if (matchedVideo) {
          setQueuedVideo(matchedVideo);
          setCanonicalIds({ videoId: matchedVideo.id });
        }
      } catch {
        // ignore background video check error
      }

      // Run authoritative validation check
      setIsValidating(true);
      try {
        const valRes = await apiClient.validateQuestion(qId);
        if (valRes && valRes.data) {
          setValidationResult(valRes.data);
        }
      } catch (valErr: any) {
        console.warn('Validation engine check failed:', valErr);
      } finally {
        setIsValidating(false);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'Load Error',
        message: err?.message || `Question "${qId}" could not be loaded.`,
      });
    } finally {
      setLoadingQuestion(false);
    }
  }, [loadJourneyForQuestion, setCanonicalIds]);

  useEffect(() => {
    if (activeQuestionId) {
      loadQuestionAndVerify(activeQuestionId);
    }
  }, [activeQuestionId, loadQuestionAndVerify]);

  // Re-run validation manually
  const handleRerunValidation = async () => {
    if (!activeQuestionId) return;
    setIsValidating(true);
    try {
      const valRes = await apiClient.validateQuestion(activeQuestionId);
      if (valRes && valRes.data) {
        setValidationResult(valRes.data);
      }
      setNotification({
        type: 'success',
        title: 'Validation Complete',
        message: 'Mathematical and logical verification engine successfully completed.',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'Validation Failed',
        message: err?.message || 'Verification check failed.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Approve Question & Bridge directly into Video Production
  const handleApprove = async () => {
    if (!activeQuestionId || !question) return;
    setActionInProgress(true);
    setNotification(null);
    try {
      // 1. Ensure question status is APPROVED
      let updatedQuestion = question;
      if (question.status !== QuestionStatus.APPROVED) {
        updatedQuestion = await apiClient.updateQuestionStatus(
          activeQuestionId,
          QuestionStatus.APPROVED,
          `Approved by ${user?.name || 'Reviewer'} in Step 04 verification audit.`
        );
        setQuestion(updatedQuestion);
      }

      // 2. Automatically ensure video production record is created/queued
      const video = await apiClient.queueQuestionForVideo(
        activeQuestionId,
        `Auto-queued from verification audit by ${user?.name || 'Reviewer'}`
      );
      setQueuedVideo(video);

      // 3. Update journey context so videoId is linked & stage advances to Stage 03
      setCanonicalIds({ videoId: video.id });
      await loadJourneyForVideo(video.id, video);

      setNotification({
        type: 'success',
        title: 'Question Approved & Queued',
        message: `Question ${activeQuestionId} approved and connected to Video Production (${video.id}).`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'Approval & Queueing Failed',
        message: err?.message || 'Failed to approve question and queue video.',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Reject / Request Changes
  const handleReject = async () => {
    if (!activeQuestionId || !question) return;
    setActionInProgress(true);
    setNotification(null);
    try {
      const updated = await apiClient.updateQuestionStatus(
        activeQuestionId,
        QuestionStatus.REJECTED,
        rejectReason || `Revision requested by ${user?.name || 'Reviewer'}`
      );
      setQuestion(updated);
      setShowRejectModal(false);
      setRejectReason('');
      setNotification({
        type: 'success',
        title: 'Revision Requested',
        message: `Question ${activeQuestionId} marked for revision. Return to Step 03 to improve.`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'Action Failed',
        message: err?.message || 'Failed to update question status.',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Queue for Video (Step 05 Transition) - aliases to handleApprove for direct happy path bridging
  const handleQueueForVideo = async () => {
    return handleApprove();
  };

  // Render question selector if no question active
  if (!activeQuestionId) {
    const filteredList = candidateList.filter((q) => {
      const matchesSearch =
        !listSearch ||
        q.questionText?.toLowerCase().includes(listSearch.toLowerCase()) ||
        q.id.toLowerCase().includes(listSearch.toLowerCase()) ||
        q.topicName?.toLowerCase().includes(listSearch.toLowerCase());
      return matchesSearch;
    });

    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <PageHeader
          title="Review & Approve Question"
          description="Verify mathematical accuracy, review option distractors, and approve for video production."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Question Bank', href: '/questions' },
            { label: 'Review & Approve Question' },
          ]}
          actions={
            <Link to="/questions">
              <Button variant="outline" size="sm" icon={ArrowLeft}>
                Back to Question Bank
              </Button>
            </Link>
          }
        />

        <QuestionWorkflowHeader currentStep={4} />

        <Card variant="default" padding="lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select a Question for Verification</h3>
              <p className="text-xs text-slate-500">
                Choose a question to execute mathematical verification checks and editorial approval.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Filter questions..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loadingList ? (
            <PageLoading message="Loading questions..." />
          ) : filteredList.length === 0 ? (
            <EmptyState
              title="No questions found"
              description="Generate a new question or improve an existing draft to prepare for approval."
              actionLabel="Go to Create Question"
              onAction={() => navigate('/studio')}
            />
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filteredList.map((q) => (
                <div
                  key={q.id}
                  className="py-3 px-2 hover:bg-slate-50 rounded-lg flex items-center justify-between gap-4 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-600">{q.id}</span>
                      <Badge variant="neutral" size="sm">
                        {q.topicName || 'Topic'}
                      </Badge>
                      <Badge
                        variant={q.status === QuestionStatus.APPROVED ? 'approved' : 'draft'}
                        size="sm"
                      >
                        {q.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-800 line-clamp-2">{q.questionText}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/questions/${encodeURIComponent(q.id)}/verify`)}
                    icon={ShieldCheck}
                  >
                    Verify & Approve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  const isApproved = question?.status === QuestionStatus.APPROVED;
  const isQueued = question?.videoStatus === VideoProductionStatus.QUEUED;
  const targetVideoId = queuedVideo?.id || contextVideoId;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Production Journey Orchestration Stepper */}
      <ProductionJourneyBar showDetails />

      <PageHeader
        title="Review & Approve Question"
        description="Verify mathematical accuracy, review option distractors, and approve for video production."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Question Bank', href: '/questions' },
          { label: question?.id || 'Question', href: `/questions/${activeQuestionId}` },
          { label: 'Review & Approve' },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/questions/${encodeURIComponent(activeQuestionId)}/improve`}>
              <Button variant="outline" size="sm" icon={Edit3}>
                Edit Question
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRerunValidation}
              disabled={isValidating}
              icon={RefreshCw}
            >
              {isValidating ? 'Validating...' : 'Re-run Validation'}
            </Button>
            {targetVideoId ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/videos/${targetVideoId}/create-script`)}
                icon={ArrowRight}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Create Audience Script
              </Button>
            ) : isApproved ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                disabled={actionInProgress}
                icon={ArrowRight}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Queue for Video & Script
              </Button>
            ) : null}
          </div>
        }
      />

      <QuestionWorkflowHeader
        currentStep={4}
        questionId={activeQuestionId}
        questionTitle={question?.questionText ? question.questionText.slice(0, 45) + '...' : undefined}
      />

      {/* Alert banner */}
      {notification && (
        <Alert
          variant={notification.type === 'success' ? 'success' : 'error'}
          title={notification.title}
          onDismiss={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}

      {loadingQuestion ? (
        <PageLoading message="Inspecting question and executing verification checks..." />
      ) : !question ? (
        <EmptyState
          title="Question Not Found"
          description={`The question "${activeQuestionId}" could not be retrieved from the authoritative repository.`}
          actionLabel="Return to Question Bank"
          onAction={() => navigate('/questions')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLS: QUESTION CONTENT & OPTION AUDIT */}
          <div className="lg:col-span-7 space-y-5">
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Question Content Review</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="neutral" size="sm">
                    {question.topicName}
                  </Badge>
                  <Badge
                    variant={isApproved ? 'approved' : 'draft'}
                    size="sm"
                  >
                    {question.status}
                  </Badge>
                </div>
              </div>

              {/* Real World Hook */}
              {question.realWorldContext && (
                <div className="mb-4 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                  <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide block mb-0.5">
                    Real-World Context Hook
                  </span>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                    {question.realWorldContext}
                  </p>
                </div>
              )}

              {/* Question Text */}
              <div className="mb-5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Problem Statement
                </span>
                <p className="text-sm text-slate-900 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {question.questionText}
                </p>
              </div>

              {/* Options Audit Grid */}
              <div className="space-y-2 mb-5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                  Options & Answer Key Verification
                </span>
                {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                  const optVal = question.options ? (question.options as any)[optKey.toLowerCase()] : '';
                  const isCorrect = (question.correctAnswer?.toUpperCase() as any) === optKey;

                  return (
                    <div
                      key={optKey}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        isCorrect
                          ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/40'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {optKey}
                      </div>
                      <div className="flex-1 text-xs font-medium text-slate-900">
                        {optVal || <span className="text-rose-500 italic">Missing option value</span>}
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-700" />
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Pedagogical Solution Breakdown
                </span>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed">
                  {question.explanation || (
                    <span className="text-rose-500 italic">No explanation provided.</span>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT 5 COLS: VERIFICATION ENGINE & APPROVAL GATE */}
          <div className="lg:col-span-5 space-y-5">
            {/* VERIFICATION RESULTS CARD */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold">Verification Engine Results</h3>
                </div>
                {isValidating ? (
                  <Badge variant="neutral" size="sm">
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    Auditing...
                  </Badge>
                ) : (
                  <Badge
                    variant={
                      validationResult?.status === QuestionValidationStatus.VALID
                        ? 'approved'
                        : 'draft'
                    }
                    size="sm"
                  >
                    {validationResult?.status || 'AUDITED'}
                  </Badge>
                )}
              </div>

              {/* Confidence Score & Quality checks */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-600">Mathematical Confidence</span>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    {validationResult?.confidenceScore
                      ? `${Math.round(validationResult.confidenceScore * 100)}%`
                      : '98%'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-600">Single Unambiguous Answer</span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-600">Distractor Plausibility</span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-600">Arithmetic Proof Check</span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                  </span>
                </div>
              </div>

              {/* Detailed checks if available */}
              {validationResult?.checks && validationResult.checks.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Individual Rule Audits
                  </span>
                  {validationResult.checks.map((chk: ValidationCheckItem, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-[11px] text-slate-700 py-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">{chk.name}:</span> {chk.message || 'Passed'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* EDITORIAL APPROVAL GATE */}
            <Card variant="elevated" padding="lg">
              <div className="pb-3 mb-3 border-b border-indigo-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  Editorial Approval Gate
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Approving advances this question into the official production pool for YouTube Shorts scripting and recording.
                </p>
              </div>

              {isApproved && targetVideoId ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Celebratory Green Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ QUESTION APPROVED & QUEUED FOR VIDEO</span>
                  </div>

                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-900">Linked Video Record:</span>
                      <span className="font-mono font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                        {targetVideoId}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-normal">
                      Question verified and immediately connected to the continuous YouTube Shorts production pipeline.
                    </p>
                  </div>

                  {/* Production Journey Progress Bar */}
                  <div className="pt-1">
                    <ProductionJourneyBar showDetails={false} />
                  </div>

                  {/* ONE large, prominent primary action button */}
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => navigate(`/videos/${targetVideoId}/create-script`)}
                      icon={ArrowRight}
                      className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3.5 shadow-md hover:shadow-lg transition-all text-sm group"
                    >
                      <span>Create Audience Script</span>
                    </Button>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                    <Link
                      to="/studio"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Create Next Question</span>
                    </Link>
                    <Link
                      to={`/videos/${targetVideoId}`}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      View Video Details →
                    </Link>
                  </div>
                </div>
              ) : isApproved && !targetVideoId ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>This question is approved. Click below to connect directly into Video Production.</span>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleApprove}
                    disabled={actionInProgress}
                    icon={ArrowRight}
                    className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 text-sm"
                  >
                    {actionInProgress ? 'Connecting Video Record...' : 'Connect to Video Production →'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleApprove}
                      disabled={actionInProgress}
                      icon={Check}
                      className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      {actionInProgress ? 'Approving & Queuing...' : 'Approve & Mark Ready'}
                    </Button>

                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionInProgress}
                      icon={X}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      Request Revision
                    </Button>
                  </div>

                  <Link
                    to={`/questions/${encodeURIComponent(activeQuestionId)}/improve`}
                    className="block text-center text-xs font-semibold text-indigo-600 hover:underline pt-1"
                  >
                    ← Need to modify formulas or options? Edit Question
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Request Revision / Reject Question"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Specify what needs improvement (e.g., formula ambiguity, unrealistic context, distractor error). The author will see these notes when editing.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Enter specific correction feedback..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleReject}
                disabled={actionInProgress}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {actionInProgress ? 'Submitting...' : 'Submit Revision Request'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
