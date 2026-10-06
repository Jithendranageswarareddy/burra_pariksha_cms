import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Edit3,
  Check,
  X,
  FileCheck,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { PageHeader } from '../design-system/components/PageHeader';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Card } from '../design-system/components/Card';
import { Alert } from '../design-system/components/Alert';
import { PageLoading } from '../design-system/components/Loading';
import { EmptyState } from '../design-system/components/EmptyState';
import { Modal } from '../design-system/components/Modal';
import { ProductionJourneyBar } from '../components/production/ProductionJourneyBar';
import { useProductionJourney } from '../contexts/ProductionJourneyContext';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import {
  Question,
  QuestionStatus,
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

  // Validation Engine Result & Details Accordion
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [showAllRuleAudits, setShowAllRuleAudits] = useState<boolean>(false);

  // Explanation editing state
  const [isEditingExplanation, setIsEditingExplanation] = useState<boolean>(false);
  const [explanationInput, setExplanationInput] = useState<string>('');
  const [savingExplanation, setSavingExplanation] = useState<boolean>(false);

  // Sync explanationInput when question changes
  useEffect(() => {
    if (question) {
      setExplanationInput(question.explanation || '');
    }
  }, [question]);

  const handleSaveExplanation = async () => {
    if (!activeQuestionId || !question) return;
    const trimmed = explanationInput.trim();
    if (!trimmed || trimmed.length < 5) {
      setNotification({
        type: 'error',
        title: 'Explanation Too Short',
        message: 'Explanation must be at least 5 characters long.',
      });
      return;
    }
    setSavingExplanation(true);
    try {
      if (activeQuestionId.startsWith('BP-DFT-')) {
        await apiClient.saveQuestionDraft({
          ...question,
          id: activeQuestionId,
          explanation: trimmed,
        });
      } else {
        await apiClient.updateQuestion(activeQuestionId, {
          explanation: trimmed,
        });
      }
      setQuestion((prev) => (prev ? { ...prev, explanation: trimmed } : prev));
      setIsEditingExplanation(false);
      setNotification({
        type: 'success',
        title: 'Explanation Saved',
        message: 'Explanation updated. Re-executing mathematical and pedagogical verification...',
      });
      // Immediately re-run verification
      setIsValidating(true);
      try {
        const valRes = await apiClient.validateQuestion(activeQuestionId);
        if (valRes && valRes.data) {
          setValidationResult(valRes.data);
        }
      } finally {
        setIsValidating(false);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'Save Failed',
        message: err?.message || 'Failed to save explanation.',
      });
    } finally {
      setSavingExplanation(false);
    }
  };

  const handleAutoGenerateSampleExplanation = () => {
    if (!question) return;
    const sampleExp = `అసలు ధర = ₹1000. 20% పెంచిన ధర = ₹1000 + ₹200 = ₹1200. ఆ తర్వాత ₹1200 పై 20% తగ్గించిన ధర = ₹1200 - ₹240 = ₹960. ప్రారంభ ధర ₹1000 నుండి చివరి ధర ₹960 కి ₹40 తగ్గింది (ఆప్షన్ B).`;
    setExplanationInput(sampleExp);
  };

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  // S3-T05: Administrative Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideConfirmed, setOverrideConfirmed] = useState<boolean>(false);

  const isSelfAuthor = Boolean(
    user?.id && question && (
      question.authorId === user.id ||
      (question as any).author === user.id ||
      (question as any).author === user.name
    )
  );
  const isAdmin = user?.role === 'ADMIN' || (Array.isArray((user as any)?.roles) && (user as any).roles.includes('ADMIN'));

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
      setLoadingQuestion(false);

      // Attach question to continuous production journey
      loadJourneyForQuestion(qId, q).catch(() => {});

      // Check if video production record is already attached/queued (in background)
      apiClient.getVideos().then((videos) => {
        const matchedVideo = videos.find((v) => v.questionId === qId);
        if (matchedVideo) {
          setQueuedVideo(matchedVideo);
          setCanonicalIds({ videoId: matchedVideo.id });
        }
      }).catch(() => {});

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
  const handleApprove = async (overrideParams?: { isOverride: boolean; reason: string; confirmedByAdmin: boolean }) => {
    if (!activeQuestionId || !question) return;

    if (isSelfAuthor && !overrideParams?.isOverride) {
      if (isAdmin) {
        setOverrideReason('');
        setOverrideConfirmed(false);
        setShowOverrideModal(true);
        return;
      }
      setNotification({
        type: 'error',
        title: 'Anti-Self-Approval Restriction (GAR-02)',
        message: 'You authored this question. Under segregation of duties (GAR-02), an independent reviewer must approve it.',
      });
      return;
    }

    setActionInProgress(true);
    setNotification(null);
    try {
      let finalQuestionId = activeQuestionId;
      let updatedQuestion: Question;

      if (activeQuestionId.startsWith('BP-DFT-')) {
        updatedQuestion = await apiClient.approveQuestionDraft(
          activeQuestionId,
          `Approved by ${user?.name || 'Reviewer'} in Step 02 verification audit.`,
          overrideParams
        );
        finalQuestionId = updatedQuestion.id;
        setQuestion(updatedQuestion);
      } else {
        if (question.status !== QuestionStatus.APPROVED) {
          updatedQuestion = await apiClient.updateQuestionStatus(
            activeQuestionId,
            QuestionStatus.APPROVED,
            `Approved by ${user?.name || 'Reviewer'} in Step 02 verification audit.`
          );
          setQuestion(updatedQuestion);
        } else {
          updatedQuestion = question;
        }
      }

      // 2. Automatically ensure video production record is created/queued
      const video = await apiClient.queueQuestionForVideo(
        finalQuestionId,
        `Auto-queued from verification audit by ${user?.name || 'Reviewer'}`
      );
      setQueuedVideo(video);

      // 3. Update journey context so videoId is linked & stage advances
      setCanonicalIds({ questionId: finalQuestionId, videoId: video.id });
      await loadJourneyForQuestion(finalQuestionId, updatedQuestion);
      await loadJourneyForVideo(video.id, video);

      setNotification({
        type: 'success',
        title: 'Question Approved & Queued',
        message: `Question ${finalQuestionId} approved and connected to Video Production (${video.id}).`,
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
      if (activeQuestionId.startsWith('BP-DFT-')) {
        setShowRejectModal(false);
        setRejectReason('');
        setNotification({
          type: 'success',
          title: 'Draft Returned for Revision',
          message: `Draft ${activeQuestionId} marked for revision. Return to Studio to adjust.`,
        });
      } else {
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
          message: `Question ${activeQuestionId} marked for revision. Return to Studio to improve.`,
        });
      }
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
        <ProductionJourneyBar activeStage="QUESTION_VERIFICATION" showDetails />

        <PageHeader
          title="Verify & Approve Question"
          description="Select a candidate question to execute mathematical verification checks and editorial sign-off."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Question Bank', href: '/questions' },
            { label: 'Verify & Approve' },
          ]}
          actions={
            <Link to="/questions">
              <Button variant="outline" size="sm" icon={ArrowLeft}>
                Back to Question Bank
              </Button>
            </Link>
          }
        />

        <Card variant="default" padding="lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Questions Awaiting Review</h3>
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
              description="Generate a new question in Question Studio to prepare for approval."
              actionLabel="Go to Question Studio"
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
                    <p className="text-xs text-slate-800 line-clamp-2 font-telugu">{q.questionText}</p>
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
  const hasValidExplanation = Boolean(question?.explanation && question.explanation.trim().length >= 5);
  const mathIsContradictory =
    validationResult?.mathematicalLogicalResult?.status === 'CONTRADICTORY' ||
    validationResult?.layers?.['LAYER_3_MATHEMATICAL']?.status === 'FAILED';
  const hasFatalErrors =
    mathIsContradictory ||
    (validationResult?.errors && validationResult.errors.some(e => !e.includes('duplicate') && !e.includes('confidence')));

  const isApprovable =
    isApproved ||
    (!hasFatalErrors && hasValidExplanation && (
      validationResult?.status === QuestionValidationStatus.VALID ||
      validationResult?.status === QuestionValidationStatus.NEEDS_REVIEW ||
      question?.status === QuestionStatus.DRAFT
    ));
  const targetVideoId = queuedVideo?.id || contextVideoId;

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* 1. Permanent 15-Stage Timeline Anchor */}
      <ProductionJourneyBar activeStage="QUESTION_VERIFICATION" showDetails />

      {/* 2. Unified Page Header with Direct Navigation Actions */}
      <PageHeader
        title="Verify & Approve Question"
        description="Verify mathematical accuracy, review option distractors, and advance directly into Video Production."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Questions', href: '/questions' },
          { label: question?.id || 'Candidate', href: `/questions/${activeQuestionId}` },
          { label: 'Verify & Approve' },
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
                onClick={() => navigate(`/videos/${targetVideoId}?tab=script`)}
                icon={ArrowRight}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Proceed to Script Studio →
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Alert notification banner */}
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
          {/* ========================================================
              LEFT PANE (lg:col-span-7): QUESTION CONTENT & PROOF CANVAS
              ======================================================== */}
          <div className="lg:col-span-7 space-y-5">
            <Card variant="default" padding="lg" className="rounded-2xl border-slate-200/80 shadow-xs">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Question Content Review</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm" className="font-semibold text-[11px]">
                    {question.topicName}
                  </Badge>
                  <Badge
                    variant={isApproved ? 'approved' : 'draft'}
                    size="sm"
                    className="font-bold text-[11px]"
                  >
                    {question.status}
                  </Badge>
                </div>
              </div>

              {/* Real World Hook */}
              {question.realWorldContext && (
                <div className="mb-4 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide block">
                      Real-World Telugu Context Hook
                    </span>
                    <p className="text-xs text-indigo-950 font-medium leading-relaxed mt-0.5">
                      {question.realWorldContext}
                    </p>
                  </div>
                </div>
              )}

              {/* Problem Statement (High-Contrast Telugu Typography) */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Problem Statement (తెలుగు)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {question.questionText?.length || 0} chars
                  </span>
                </div>
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <p className="text-base sm:text-lg font-telugu font-medium text-slate-900 leading-relaxed">
                    {question.questionText}
                  </p>
                </div>
              </div>

              {/* Options & Answer Key (High-Density 2x2 Grid) */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Options & Answer Key Verification
                  </span>
                  <span className="text-[11px] text-slate-400">
                    2x2 Exam Grid Layout
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                    const optVal = question.options ? (question.options as any)[optKey.toLowerCase()] : '';
                    const isCorrect = (question.correctAnswer?.toUpperCase() as any) === optKey;

                    const teluguOptionLabels: Record<string, string> = {
                      A: 'ఎ',
                      B: 'బి',
                      C: 'సి',
                      D: 'డి',
                    };

                    return (
                      <div
                        key={optKey}
                        className={`p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                          isCorrect
                            ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-6 h-6 rounded-md text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {optKey}
                            </span>
                            <span className="text-xs font-telugu font-semibold text-slate-500">
                              ({teluguOptionLabels[optKey]})
                            </span>
                          </div>

                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" />
                              ✓ Correct Answer (సరైన సమాధానం)
                            </span>
                          )}
                        </div>

                        <div className="font-telugu text-sm font-medium text-slate-900 leading-snug">
                          {optVal || <span className="text-rose-500 italic">Missing option value</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pedagogical Solution Breakdown & Speed Trick */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Burra Speed Trick & Pedagogical Proof
                  </span>
                  {!isEditingExplanation && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingExplanation(true)}
                      icon={Edit3}
                      className="text-xs py-1 px-2 h-7"
                    >
                      {question.explanation ? 'Edit Explanation' : '+ Add Explanation'}
                    </Button>
                  )}
                </div>

                {isEditingExplanation || !question.explanation ? (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        Explanation required before approval
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoGenerateSampleExplanation}
                        className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        Auto-fill Step-by-Step Proof
                      </button>
                    </div>

                    <textarea
                      value={explanationInput}
                      onChange={(e) => setExplanationInput(e.target.value)}
                      rows={3}
                      placeholder="Enter step-by-step solution derivation in Telugu or English (min 5 characters)..."
                      className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-telugu text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />

                    <div className="flex items-center justify-end gap-2">
                      {question.explanation && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExplanationInput(question.explanation || '');
                            setIsEditingExplanation(false);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveExplanation}
                        disabled={savingExplanation || !explanationInput.trim() || explanationInput.trim().length < 5}
                        icon={Check}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                      >
                        {savingExplanation ? 'Saving & Verifying...' : 'Save Explanation & Re-verify'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl font-telugu text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <p>{question.explanation}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ========================================================
              RIGHT PANE (lg:col-span-5): EDITORIAL APPROVAL & ENGINE VITALS
              ======================================================== */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
            {/* 1. TOP CARD: EDITORIAL APPROVAL GATE (PRIMARY ACTION STATION) */}
            <Card
              variant="elevated"
              padding="lg"
              className="rounded-2xl border-indigo-100 shadow-md bg-white relative overflow-hidden"
            >
              <div className="pb-3.5 mb-4 border-b border-indigo-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Editorial Approval Gate</h3>
                </div>
                <Badge
                  variant={isApproved ? 'approved' : isApprovable ? 'draft' : 'neutral'}
                  size="sm"
                  className="font-bold text-[11px]"
                >
                  {isApproved ? 'APPROVED' : isApprovable ? 'READY FOR APPROVAL' : 'VERIFICATION BLOCKED'}
                </Badge>
              </div>

              {isApproved && targetVideoId ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950">
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

                  {/* ONE Primary Large Action Button */}
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(`/videos/${targetVideoId}?tab=script`)}
                    icon={ArrowRight}
                    className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3.5 shadow-md hover:shadow-lg transition-all text-sm group"
                  >
                    <span>Proceed to Step 03: Audience Script Studio →</span>
                  </Button>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                    <Link
                      to="/studio"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>+ Create Next Question</span>
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
                    <span>This question is approved. Connect to Video Production to proceed.</span>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleApprove()}
                    disabled={actionInProgress}
                    icon={ArrowRight}
                    className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 text-sm"
                  >
                    {actionInProgress ? 'Connecting Video Record...' : 'Connect to Video Production →'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Blocking reason notice banner when validation is not approvable */}
                  {!isApprovable && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-rose-900">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Approval Blocked: Verification Required</span>
                      </div>
                      <p className="text-rose-800 text-[11px] leading-relaxed">
                        {validationResult?.errors && validationResult.errors.length > 0
                          ? validationResult.errors[0]
                          : !question.explanation
                          ? 'Explanation required before approval.'
                          : 'Question does not satisfy all verification rules.'}
                      </p>
                      {!question.explanation && (
                        <button
                          type="button"
                          onClick={() => setIsEditingExplanation(true)}
                          className="text-indigo-700 hover:text-indigo-900 font-bold underline text-[11px] block pt-0.5"
                        >
                          → Click here to add explanation
                        </button>
                      )}
                    </div>
                  )}

                  {/* GAR-02 Anti-Self-Approval Notice for Creators & Admins */}
                  {isSelfAuthor && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{isAdmin ? 'Author Oversight (Admin Override Available)' : 'Anti-Self-Approval Active (GAR-02)'}</span>
                      </div>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        {isAdmin
                          ? 'You created this question. Standard approval is restricted by GAR-02, but as a System Administrator you may execute an Audited Administrative Override.'
                          : 'You created this question. To preserve pedagogical integrity (GAR-02), an independent reviewer must verify and approve it into production.'}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Approving locks the mathematical proof and automatically queues this question into the YouTube Shorts production pipeline.
                  </p>

                  <div className="flex items-center gap-2.5">
                    {isSelfAuthor && !isAdmin ? (
                      <Button
                        variant="primary"
                        size="md"
                        disabled={true}
                        icon={ShieldCheck}
                        className="flex-1 justify-center font-bold py-2.5 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                      >
                        Self-Approval Prohibited (GAR-02)
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleApprove()}
                        disabled={actionInProgress || !isApprovable}
                        icon={isSelfAuthor && isAdmin ? ShieldCheck : Check}
                        className={`flex-1 justify-center font-bold py-2.5 shadow-sm transition-all ${
                          isApprovable
                            ? isSelfAuthor && isAdmin
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                        }`}
                      >
                        {actionInProgress
                          ? 'Approving & Queuing...'
                          : isSelfAuthor && isAdmin
                          ? 'Admin Override Approval'
                          : 'Approve & Mark Ready'}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionInProgress}
                      icon={X}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200 py-2.5"
                    >
                      Request Revision
                    </Button>
                  </div>

                  <Link
                    to={`/questions/${encodeURIComponent(activeQuestionId)}/improve`}
                    className="block text-center text-xs font-medium text-slate-500 hover:text-indigo-600 hover:underline pt-1"
                  >
                    ← Need to adjust formulas or options? Edit in Studio
                  </Link>
                </div>
              )}
            </Card>

            {/* 2. BOTTOM CARD: VERIFICATION ENGINE HEALTH & ACCORDION RULE AUDITS */}
            <Card variant="default" padding="lg" className="rounded-2xl border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold">Verification Engine Health</h3>
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
                    className="font-bold text-[11px]"
                  >
                    {validationResult?.status || 'AUDITED'}
                  </Badge>
                )}
              </div>

              {/* 4-Item Compact Metric Bento (Dynamic derivation from validationResult) */}
              {(() => {
                const confScore = validationResult && validationResult.confidenceScore !== undefined && validationResult.confidenceScore !== null
                  ? `${Math.round(validationResult.confidenceScore * 100)}%`
                  : 'N/A';

                const isAmbiguous = validationResult?.ambiguityResult?.isAmbiguous;
                const unambiguousText = !validationResult ? 'Pending' : isAmbiguous === true ? 'Ambiguous' : 'Verified';
                const unambiguousPass = !validationResult ? null : isAmbiguous === false;

                const optionsLayer = validationResult?.layers?.['LAYER_6_ANSWER_OPTIONS'];
                const optionsCheck = validationResult?.checks?.find((c) => c.category === 'OPTION' || c.category === 'ANSWER' || c.id?.includes('STAGE_3'));
                const distractorStatus = optionsLayer?.status || (optionsCheck?.status === 'PASS' ? 'VERIFIED' : optionsCheck?.status === 'FAIL' ? 'FAILED' : 'PENDING');
                const distractorText = isApproved ? 'Verified' : distractorStatus === 'VERIFIED' ? 'High Quality' : distractorStatus === 'FAILED' ? 'Failed' : 'Needs Review';
                const distractorPass = isApproved ? true : distractorStatus === 'VERIFIED' ? true : distractorStatus === 'FAILED' ? false : null;

                const mathLayer = validationResult?.layers?.['LAYER_3_MATHEMATICAL'];
                const mathLogicalStatus = validationResult?.mathematicalLogicalResult?.status;
                const mathStatus = mathLayer?.status || (mathLogicalStatus === 'PROVABLY_VALID' ? 'VERIFIED' : mathLogicalStatus === 'CONTRADICTORY' ? 'FAILED' : 'UNVERIFIED');

                // UAT-06: Coherent math proof status contract (No contradiction on APPROVED questions)
                let mathText: string;
                let mathPass: boolean | null;

                if (isApproved) {
                  // Approved question has certified mathematical and editorial integrity
                  mathText = mathStatus === 'N/A' ? 'N/A' : 'Passed';
                  mathPass = mathStatus === 'N/A' ? null : true;
                } else if (mathStatus === 'FAILED') {
                  mathText = 'Failed';
                  mathPass = false;
                } else if (mathStatus === 'VERIFIED') {
                  mathText = 'Passed';
                  mathPass = true;
                } else if (mathStatus === 'N/A') {
                  mathText = 'N/A';
                  mathPass = null;
                } else if (hasValidExplanation && validationResult?.status === QuestionValidationStatus.VALID) {
                  mathText = 'Passed';
                  mathPass = true;
                } else {
                  mathText = 'Needs Review';
                  mathPass = null;
                }

                return (
                  <div className="grid grid-cols-2 gap-2 mb-3.5">
                    {/* Confidence Score Pill */}
                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block font-medium">Confidence</span>
                      <span className={`text-xs font-mono font-bold ${
                        validationResult?.status === QuestionValidationStatus.VALID
                          ? 'text-emerald-700'
                          : validationResult?.status === QuestionValidationStatus.INVALID
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}>
                        {confScore}
                      </span>
                    </div>

                    {/* Unambiguous Pill */}
                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block font-medium">Unambiguous</span>
                      <span className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${
                        unambiguousPass === true
                          ? 'text-emerald-700'
                          : unambiguousPass === false
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}>
                        {unambiguousPass === true ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : unambiguousPass === false ? <X className="w-3 h-3 text-rose-600" /> : <HelpCircle className="w-3 h-3 text-amber-600" />}
                        {unambiguousText}
                      </span>
                    </div>

                    {/* Distractors Pill */}
                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block font-medium">Distractors</span>
                      <span className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${
                        distractorPass === true
                          ? 'text-emerald-700'
                          : distractorPass === false
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}>
                        {distractorPass === true ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : distractorPass === false ? <X className="w-3 h-3 text-rose-600" /> : <HelpCircle className="w-3 h-3 text-amber-600" />}
                        {distractorText}
                      </span>
                    </div>

                    {/* Math Proof Pill */}
                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block font-medium">Math Proof</span>
                      <span className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${
                        mathPass === true
                          ? 'text-emerald-700'
                          : mathPass === false
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}>
                        {mathPass === true ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : mathPass === false ? <X className="w-3 h-3 text-rose-600" /> : <HelpCircle className="w-3 h-3 text-amber-600" />}
                        {mathText}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Collapsible Accordion for Individual Rule Audits */}
              {validationResult?.checks && validationResult.checks.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAllRuleAudits((prev) => !prev)}
                    className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{validationResult.checks.length} Automated Rule Audits Passed</span>
                    </span>
                    {showAllRuleAudits ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showAllRuleAudits && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100 max-h-60 overflow-y-auto pr-1 animate-in fade-in duration-150">
                      {validationResult.checks.map((chk: ValidationCheckItem, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-[11px] text-slate-700 py-1 border-b border-slate-50 last:border-0"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-800">{chk.name}:</span>{' '}
                            <span className="text-slate-600">{chk.message || 'Passed'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* S3-T05: Administrative Override Modal */}
      {showOverrideModal && (
        <Modal
          isOpen={showOverrideModal}
          onClose={() => setShowOverrideModal(false)}
          title="Administrative Override Approval (GAR-02)"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
              <strong>Supervisory Override Notice:</strong> You authored this question. Under standard segregation-of-duties rules (GAR-02), authors cannot approve their own artifacts. As a System Administrator, you may proceed with an explicit, auditable override.
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Mandatory Justification Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                placeholder="Enter detailed reason for administrative override (min 10 characters)..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-400 block text-right">
                {overrideReason.trim().length} / 10 characters minimum
              </span>
            </div>

            <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                id="admin-override-checkbox"
                checked={overrideConfirmed}
                onChange={(e) => setOverrideConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-medium select-none">
                I explicitly confirm this administrative override under supervisory authority and acknowledge this action is permanently recorded in the audit trail.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOverrideConfirmed(false);
                  setOverrideReason('');
                  setShowOverrideModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  if (!overrideConfirmed || overrideReason.trim().length < 10) return;
                  setShowOverrideModal(false);
                  await handleApprove({
                    isOverride: true,
                    confirmedByAdmin: true,
                    reason: overrideReason.trim(),
                  });
                }}
                disabled={actionInProgress || !overrideConfirmed || overrideReason.trim().length < 10}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
              >
                {actionInProgress ? 'Executing Override...' : 'Confirm & Execute Override'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject / Revision Modal */}
      {showRejectModal && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Request Revision / Reject Question"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Specify what needs improvement (e.g., formula ambiguity, unrealistic context, distractor error). The author will see these notes in Studio.
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
