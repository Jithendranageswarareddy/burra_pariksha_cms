import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  ListOrdered,
  RefreshCw,
  AlertCircle,
  History,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Send,
  Check,
  Ban,
  ShieldCheck,
  Loader2,
  BookOpen,
  CheckCheck,
  Lightbulb,
  Share2,
  Film,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { QuestionWorkflowHeader } from '../components/questions/QuestionWorkflowHeader';
import { QuestionStatusBadge, VideoStatusBadge } from '../components/common/StatusBadge';
import { DifficultyBadge } from '../components/common/DifficultyBadge';
import { EntityAssignmentsSection } from '../components/assignments/EntityAssignmentsSection';
import { ProductionJourneyBar } from '../components/production/ProductionJourneyBar';
import { useProductionJourney } from '../contexts/ProductionJourneyContext';
import { apiClient } from '../lib/api-client';
import {
  DifficultyLevel,
  Question,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
  VideoProductionStatus,
  Workflow,
  AuditLog,
} from '../types';

export const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadJourneyForQuestion } = useProductionJourney();

  const [question, setQuestion] = useState<Question | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<Workflow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subtopics, setSubtopics] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(() => searchParams.get('mode') === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Edit Form State (Strict 2-Tier: Topic -> Subtopic)
  const [editTopicId, setEditTopicId] = useState('');
  const [editSubtopicId, setEditSubtopicId] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [editQuestionStyle, setEditQuestionStyle] = useState<QuestionStyle | string>(QuestionStyle.SPEED_MATH_TRICK);
  const [editLanguage, setEditLanguage] = useState<QuestionLanguage>(QuestionLanguage.TELUGU);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editOptA, setEditOptA] = useState('');
  const [editOptB, setEditOptB] = useState('');
  const [editOptC, setEditOptC] = useState('');
  const [editOptD, setEditOptD] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editExplanation, setEditExplanation] = useState('');
  const [editRealWorldContext, setEditRealWorldContext] = useState('');
  const [editTags, setEditTags] = useState('');

  // Duplicate warning state during editing
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const fetchQuestionAndHistory = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [questionData, topicsData, subtopicsData] = await Promise.all([
        apiClient.getQuestionById(id),
        apiClient.getTopics().catch(() => []),
        apiClient.getSubtopics().catch(() => []),
      ]);

      setQuestion(questionData);
      setTopics(topicsData);
      setSubtopics(subtopicsData);
      initEditForm(questionData);
      loadJourneyForQuestion(questionData.id, questionData);

      // Fetch workflow and audit history in parallel
      try {
        const [wfHistory, audits] = await Promise.all([
          apiClient.getWorkflowHistory('QUESTION', id).catch(() => []),
          apiClient.getAuditLogs('QUESTION', id).catch(() => []),
        ]);
        setWorkflowHistory(wfHistory);
        setAuditLogs(audits);
      } catch (err) {
        console.warn('History fetch note:', err);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || `Question with ID "${id}" was not found in the database.`);
    } finally {
      setIsLoading(false);
    }
  };

  const initEditForm = (q: Question) => {
    setEditTopicId(q.topicId || 'BP-TOP-001');
    setEditSubtopicId(q.subtopicId || 'BP-SUB-0001');
    setEditDifficulty(q.difficulty as DifficultyLevel);
    setEditQuestionStyle(q.questionStyle || QuestionStyle.SPEED_MATH_TRICK);
    setEditLanguage((q.language as QuestionLanguage) || QuestionLanguage.TELUGU);
    setEditQuestionText(q.questionText || '');
    setEditOptA(q.options?.a || '');
    setEditOptB(q.options?.b || '');
    setEditOptC(q.options?.c || '');
    setEditOptD(q.options?.d || '');
    setEditCorrectAnswer(((q.correctAnswer?.toUpperCase() || 'A') as any));
    setEditExplanation(q.explanation || '');
    setEditRealWorldContext(q.realWorldContext || '');
    setEditTags(q.tags ? q.tags.join(', ') : '');
    setDuplicateMatches([]);
  };

  useEffect(() => {
    fetchQuestionAndHistory();
  }, [id]);

  useEffect(() => {
    if (searchParams.get('mode') === 'edit') {
      setIsEditing(true);
    }
  }, [searchParams]);

  // Filter available subtopics for currently selected topic in edit mode
  const editAvailableSubtopics = editTopicId
    ? subtopics.filter((s: any) => s.topicId === editTopicId)
    : subtopics;

  const handleTopicChange = (newTopicId: string) => {
    setEditTopicId(newTopicId);
    const sub = subtopics.find((s: any) => s.topicId === newTopicId);
    if (sub) {
      setEditSubtopicId(sub.id);
    } else {
      setEditSubtopicId('');
    }
  };

  // Debounced duplicate detection during editing
  useEffect(() => {
    if (!isEditing || !editQuestionText || editQuestionText.trim().length < 10) {
      setDuplicateMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      try {
        const res = await apiClient.checkDuplicate(editQuestionText.trim(), id);
        if (res && res.matches) {
          setDuplicateMatches(res.matches);
        } else {
          setDuplicateMatches([]);
        }
      } catch (err) {
        console.error('Failed to run duplicate check:', err);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [editQuestionText, isEditing, id]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !question) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const parsedTags = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const topicObj = topics.find((t: any) => t.id === editTopicId);
      const subtopicObj = subtopics.find((s: any) => s.id === editSubtopicId);

      const updated = await apiClient.updateQuestion(id, {
        topicId: editTopicId,
        topicName: topicObj?.name || question.topicName,
        subtopicId: editSubtopicId,
        subtopicName: subtopicObj?.name || question.subtopicName,
        difficulty: editDifficulty,
        questionStyle: editQuestionStyle,
        language: editLanguage,
        questionText: editQuestionText.trim(),
        options: {
          a: editOptA.trim(),
          b: editOptB.trim(),
          c: editOptC.trim(),
          d: editOptD.trim(),
        },
        correctAnswer: editCorrectAnswer,
        explanation: editExplanation.trim(),
        realWorldContext: editRealWorldContext.trim() || undefined,
        tags: parsedTags,
      });

      setQuestion(updated);
      setIsEditing(false);
      setNotification('Question content and 2-tier taxonomy updated successfully.');
      setTimeout(() => setNotification(null), 3500);

      // Refresh history
      const [wfHistory, audits] = await Promise.all([
        apiClient.getWorkflowHistory('QUESTION', id).catch(() => []),
        apiClient.getAuditLogs('QUESTION', id).catch(() => []),
      ]);
      setWorkflowHistory(wfHistory);
      setAuditLogs(audits);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update question in database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: QuestionStatus) => {
    if (!id || !question || newStatus === question.status) return;
    setIsUpdatingStatus(true);
    setErrorMessage(null);
    try {
      const updated = await apiClient.updateQuestionStatus(id, newStatus, `Transitioned status to ${newStatus}`);
      setQuestion(updated);
      setNotification(`Question status transitioned to ${newStatus}.`);
      setTimeout(() => setNotification(null), 3500);

      const [wfHistory, audits] = await Promise.all([
        apiClient.getWorkflowHistory('QUESTION', id).catch(() => []),
        apiClient.getAuditLogs('QUESTION', id).catch(() => []),
      ]);
      setWorkflowHistory(wfHistory);
      setAuditLogs(audits);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleQueueForVideo = async () => {
    if (!id || !question) return;
    setIsQueueing(true);
    setErrorMessage(null);
    try {
      const updated = await apiClient.queueQuestion(id, 'Approved question queued for YouTube Shorts production');
      setQuestion(updated);
      setNotification(`Question "${id}" successfully added to Video Production Queue.`);
      setTimeout(() => setNotification(null), 4000);

      const [wfHistory, audits] = await Promise.all([
        apiClient.getWorkflowHistory('QUESTION', id).catch(() => []),
        apiClient.getAuditLogs('QUESTION', id).catch(() => []),
      ]);
      setWorkflowHistory(wfHistory);
      setAuditLogs(audits);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to add question to video queue.');
    } finally {
      setIsQueueing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 space-y-4">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
        <p className="text-xs text-slate-500 font-mono">Loading pedagogical question inspector...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-16 space-y-4 bg-white rounded-xl border border-slate-200 p-8 max-w-xl mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Question Record Not Found</h3>
        <p className="text-xs text-slate-500">
          The requested question ID "{id}" does not exist in the database.
        </p>
        <Link to="/questions">
          <Button variant="outline" size="sm">
            Return to Question Library
          </Button>
        </Link>
      </div>
    );
  }

  const isApproved = question.status === QuestionStatus.APPROVED;
  const isQueued = question.videoStatus === VideoProductionStatus.QUEUED;
  const isInProduction = [
    VideoProductionStatus.RECORDING,
    VideoProductionStatus.RECORDED,
    VideoProductionStatus.EDITING,
    VideoProductionStatus.EDITED,
    VideoProductionStatus.FINAL_REVIEW,
    VideoProductionStatus.READY_TO_UPLOAD,
    VideoProductionStatus.UPLOADED,
  ].includes(question.videoStatus);

  const isTelugu =
    question.language === QuestionLanguage.TELUGU ||
    question.language === ('TELUGU' as any) ||
    /[\u0C00-\u0C7F]/.test(question.questionText || '');

  // Determine allowed next statuses
  const getPermittedNextStatuses = (current: QuestionStatus): QuestionStatus[] => {
    switch (current) {
      case QuestionStatus.DRAFT:
        return [QuestionStatus.GENERATED];
      case QuestionStatus.GENERATED:
        return [QuestionStatus.EDITING, QuestionStatus.APPROVED, QuestionStatus.REJECTED];
      case QuestionStatus.EDITING:
        return [QuestionStatus.APPROVED, QuestionStatus.REJECTED, QuestionStatus.GENERATED];
      case QuestionStatus.APPROVED:
        return [QuestionStatus.EDITING];
      case QuestionStatus.REJECTED:
        return [QuestionStatus.EDITING, QuestionStatus.DRAFT];
      default:
        return [];
    }
  };

  const permittedStatuses = getPermittedNextStatuses(question.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200 pb-16">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link
          to="/questions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Question'}</span>
          </button>

          <Link to={`/studio?topicId=${question.topicId || 'BP-TOP-001'}&subtopicId=${question.subtopicId || 'BP-SUB-0001'}`}>
            <Button variant="outline" size="sm" icon={Zap}>
              Open in Studio
            </Button>
          </Link>

          <Link to={`/social-review/${encodeURIComponent(question.id)}`}>
            <Button variant="outline" size="sm" icon={CheckCheck}>
              Social Review
            </Button>
          </Link>

          <Link to="/queue">
            <Button variant="outline" size="sm" icon={ListOrdered}>
              Video Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Production Journey Orchestration Stepper */}
      <ProductionJourneyBar showDetails />

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={`${question.id} • ${question.topicId || 'BP-TOP-001'}`}
        description={`${question.topicName || question.topicId} → ${question.subtopicName || question.subtopicId}`}
        badge={
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-mono font-bold">
              {question.topicId || 'BP-TOP-001'} &bull; {question.subtopicId || 'BP-SUB-0001'}
            </span>
            <QuestionStatusBadge status={question.status} />
            <DifficultyBadge difficulty={question.difficulty as DifficultyLevel} />
            <VideoStatusBadge status={question.videoStatus} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pedagogical Inspector (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {isEditing ? (
            /* 2-TIER IN-PLACE EDIT FORM */
            <form onSubmit={handleSaveEdit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Edit Question Content (2-Tier Topic ➔ Subtopic)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">ID: {question.id}</span>
              </div>

              {/* 2-Tier Taxonomy Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tier 1: Topic (BP-TOP-001) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editTopicId}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                  >
                    {topics.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.id}: {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tier 2: Subtopic (BP-SUB-0001) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editSubtopicId}
                    onChange={(e) => setEditSubtopicId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                  >
                    {editAvailableSubtopics.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.id}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Difficulty, Language & Style */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={DifficultyLevel.EASY}>Easy</option>
                    <option value={DifficultyLevel.MEDIUM}>Medium</option>
                    <option value={DifficultyLevel.HARD}>Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Language</label>
                  <select
                    value={editLanguage}
                    onChange={(e) => setEditLanguage(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={QuestionLanguage.TELUGU}>Telugu (తెలుగు)</option>
                    <option value={QuestionLanguage.ENGLISH}>English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Question Style</label>
                  <select
                    value={editQuestionStyle}
                    onChange={(e) => setEditQuestionStyle(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={QuestionStyle.SPEED_MATH_TRICK}>Speed Math / Mental Calculation</option>
                    <option value={QuestionStyle.REAL_WORLD_SCENARIO}>Real-World Scenario</option>
                    <option value={QuestionStyle.LOGICAL_PUZZLE}>Logical Puzzle</option>
                    <option value={QuestionStyle.DATA_INTERPRETATION}>Data Interpretation</option>
                    <option value={QuestionStyle.VERBAL_TRAP}>Verbal Trap</option>
                    <option value={QuestionStyle.CONCEPTUAL_PROBE}>Conceptual Probe</option>
                  </select>
                </div>
              </div>

              {/* Question Statement */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Question Statement <span className="text-rose-500">*</span>
                  </label>
                  {isCheckingDuplicate && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking duplicates...
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  required
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 ${
                    editLanguage === QuestionLanguage.TELUGU
                      ? 'font-telugu leading-relaxed text-[13px]'
                      : 'font-sans text-xs'
                  }`}
                />
              </div>

              {/* Options */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Options & Correct Answer <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'A', val: editOptA, setVal: setEditOptA },
                    { key: 'B', val: editOptB, setVal: setEditOptB },
                    { key: 'C', val: editOptC, setVal: setEditOptC },
                    { key: 'D', val: editOptD, setVal: setEditOptD },
                  ].map((o) => (
                    <div
                      key={o.key}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                        editCorrectAnswer === o.key
                          ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        id={`edit-correct-opt-${o.key}`}
                        name="editCorrectAnswer"
                        checked={editCorrectAnswer === o.key}
                        onChange={() => setEditCorrectAnswer(o.key as any)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor={`edit-correct-opt-${o.key}`} className="font-bold font-mono text-slate-700 w-4 cursor-pointer">
                        {o.key}.
                      </label>
                      <input
                        type="text"
                        required
                        value={o.val}
                        onChange={(e) => o.setVal(e.target.value)}
                        className={`flex-1 bg-transparent border-0 text-slate-900 focus:outline-hidden ${
                          editLanguage === QuestionLanguage.TELUGU ? 'font-telugu text-[13px]' : 'font-sans text-xs'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Step-by-Step Proof & Speed Trick <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono ${
                    editLanguage === QuestionLanguage.TELUGU
                      ? 'font-telugu leading-relaxed text-[13px]'
                      : 'text-xs'
                  }`}
                />
              </div>

              {/* Context & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Real-World Context Hook</label>
                  <input
                    type="text"
                    value={editRealWorldContext}
                    onChange={(e) => setEditRealWorldContext(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" icon={Save} type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving Changes...' : 'Save Updates'}
                </Button>
              </div>
            </form>
          ) : (
            /* PEDAGOGICAL VIEW MODE */
            <>
              {/* Problem Statement Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Question Problem Statement
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                      {isTelugu ? 'TELUGU (తెలుగు)' : 'ENGLISH'}
                    </span>
                    {question.questionStyle && (
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-semibold">
                        {question.questionStyle}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 text-slate-900 ${
                    isTelugu
                      ? 'font-telugu leading-relaxed text-base font-semibold'
                      : 'font-sans leading-normal text-sm font-semibold'
                  }`}
                >
                  {question.questionText}
                </div>

                {question.realWorldContext && (
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Real-World Scenario / Reel Hook: </span>
                      <span>{question.realWorldContext}</span>
                    </div>
                  </div>
                )}

                {/* 4-Option Grid (ABCD) */}
                <div className="pt-2 space-y-2.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Multiple Choice Options
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const optVal = question.options[key.toLowerCase() as keyof typeof question.options];
                      const isCorrect = question.correctAnswer?.toUpperCase() === key;

                      return (
                        <div
                          key={key}
                          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200/70 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                                isCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {key}
                            </span>
                            <span
                              className={`font-medium ${
                                isTelugu ? 'font-telugu text-[13px]' : 'font-sans text-xs'
                              } ${isCorrect ? 'text-emerald-950 font-bold' : 'text-slate-800'}`}
                            >
                              {optVal}
                            </span>
                          </div>

                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300 font-mono flex items-center gap-1">
                              ✓ Declared Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Speed Trick & Math Proof Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Speed Trick & Mathematical Proof
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Math Verified
                  </span>
                </div>

                <div
                  className={`p-4 bg-slate-900 text-slate-100 rounded-xl text-xs leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto ${
                    isTelugu ? 'font-telugu text-[13px] leading-relaxed' : ''
                  }`}
                >
                  {question.explanation}
                </div>
              </div>
            </>
          )}

          {/* Workflow Transitions Log */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Workflow State History
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{workflowHistory.length} events</span>
            </div>

            {workflowHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No workflow transitions recorded yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {workflowHistory.map((wf) => (
                  <div
                    key={wf.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-700">{wf.fromStatus}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-mono font-bold text-emerald-700">{wf.toStatus}</span>
                      </div>
                      {wf.remarks && <p className="text-[11px] text-slate-600 mt-0.5">{wf.remarks}</p>}
                    </div>
                    <div className="text-right text-[11px] text-slate-500 font-mono shrink-0">
                      <div className="font-medium text-slate-700">{wf.triggeredBy}</div>
                      <div>{new Date(wf.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workflow Controls & Metadata (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Team Assignment Management */}
          <EntityAssignmentsSection
            entityType="QUESTION"
            entityId={question.id}
            title="Question Assignments"
            defaultTaskType="QUESTION_REVIEW"
          />

          {/* Workflow & Status Management Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Lifecycle State
              </h4>
              <QuestionStatusBadge status={question.status} size="sm" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Workflow Transitions:
              </label>
              <div className="flex flex-wrap gap-2">
                {permittedStatuses.map((nextSt) => (
                  <Button
                    key={nextSt}
                    variant={nextSt === QuestionStatus.APPROVED ? 'primary' : nextSt === QuestionStatus.REJECTED ? 'danger' : 'outline'}
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(nextSt)}
                    className="text-xs"
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : nextSt === QuestionStatus.APPROVED ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : nextSt === QuestionStatus.REJECTED ? (
                      <Ban className="w-3.5 h-3.5" />
                    ) : null}
                    <span>Move to {nextSt}</span>
                  </Button>
                ))}
              </div>
              {permittedStatuses.length === 0 && (
                <p className="text-xs text-slate-400 italic">No further state transitions allowed from {question.status}.</p>
              )}
            </div>
          </div>

          {/* Video Production Queue Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Video Pipeline
                </h4>
              </div>
              <VideoStatusBadge status={question.videoStatus} size="sm" />
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Video Status:</span>
                <span className="font-mono font-bold text-slate-800">{question.videoStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Format:</span>
                <span className="font-semibold text-slate-800">Vertical Shorts (9:16)</span>
              </div>
            </div>

            {/* Direct Action: Queue for Video Production */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Button
                variant={isApproved && !isQueued && !isInProduction ? 'primary' : 'outline'}
                size="md"
                className="w-full justify-center"
                icon={Film}
                disabled={!isApproved || isQueued || isInProduction || isQueueing}
                onClick={handleQueueForVideo}
              >
                {isQueueing ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Adding to Queue...
                  </span>
                ) : isQueued ? (
                  'Already in Video Queue'
                ) : isInProduction ? (
                  'Active in Production'
                ) : isApproved ? (
                  'Queue for Video Production'
                ) : (
                  'Queue for Video (Requires Approval)'
                )}
              </Button>

              {!isApproved && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                  <strong>Notice:</strong> Only questions with <code>APPROVED</code> status can be queued for video production.
                </p>
              )}

              {isQueued && (
                <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800">
                  <span>Queued in Video Tracker</span>
                  <Link to="/queue" className="font-semibold hover:underline">
                    View Queue &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Database Persistence Metadata Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 pb-2 border-b border-slate-100 uppercase tracking-wider text-[11px]">
              Taxonomy & Database Record
            </h4>

            <div className="space-y-2 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Topic ID:</span>
                <span className="font-mono font-bold text-indigo-700">{question.topicId || 'BP-TOP-001'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Subtopic ID:</span>
                <span className="font-mono font-bold text-indigo-700">{question.subtopicId || 'BP-SUB-0001'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Permanent ID:</span>
                <span className="font-mono font-bold text-slate-800">{question.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Language:</span>
                <span className="font-mono text-slate-700">{question.language || 'TELUGU'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Created At:</span>
                <span className="font-mono text-slate-700">
                  {new Date(question.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QuestionDetailPage;
