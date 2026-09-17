import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { QuestionWorkflowHeader } from '../components/questions/QuestionWorkflowHeader';
import { QuestionStatusBadge, VideoStatusBadge } from '../components/common/StatusBadge';
import { DifficultyBadge } from '../components/common/DifficultyBadge';
import { EntityAssignmentsSection } from '../components/assignments/EntityAssignmentsSection';
import { apiClient } from '../lib/api-client';
import { DifficultyLevel, Question, QuestionStatus, QuestionStyle, VideoProductionStatus, Workflow, AuditLog } from '../types';

export const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [question, setQuestion] = useState<Question | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<Workflow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [taxonomyTree, setTaxonomyTree] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Edit Form State
  const [editTopicId, setEditTopicId] = useState('');
  const [editSubtopicId, setEditSubtopicId] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [editQuestionStyle, setEditQuestionStyle] = useState<QuestionStyle | string>(QuestionStyle.SPEED_MATH_TRICK);
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
      const [questionData, treeData] = await Promise.all([
        apiClient.getQuestionById(id),
        apiClient.getTaxonomyTree().catch(() => []),
      ]);

      setQuestion(questionData);
      setTaxonomyTree(treeData);
      initEditForm(questionData);

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
    setEditTopicId(q.topicId);
    setEditSubtopicId(q.subtopicId);
    setEditDifficulty(q.difficulty as DifficultyLevel);
    setEditQuestionStyle(q.questionStyle || QuestionStyle.SPEED_MATH_TRICK);
    setEditQuestionText(q.questionText);
    setEditOptA(q.options?.a || '');
    setEditOptB(q.options?.b || '');
    setEditOptC(q.options?.c || '');
    setEditOptD(q.options?.d || '');
    setEditCorrectAnswer((q.correctAnswer?.toUpperCase() as any) || 'A');
    setEditExplanation(q.explanation);
    setEditRealWorldContext(q.realWorldContext || '');
    setEditTags(q.tags ? q.tags.join(', ') : '');
    setDuplicateMatches([]);
  };

  useEffect(() => {
    fetchQuestionAndHistory();
  }, [id]);

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

  const allTopics = taxonomyTree.flatMap((c: any) => c.topics || (c.id && !c.topics ? [c] : []));
  const currentTopic = allTopics.find((t: any) => t.id === editTopicId);
  const availableSubtopics = currentTopic?.subtopics || [];

  const handleTopicChange = (newTopicId: string) => {
    setEditTopicId(newTopicId);
    const top = allTopics.find((t: any) => t.id === newTopicId);
    if (top && top.subtopics?.length > 0) {
      setEditSubtopicId(top.subtopics[0].id);
    } else {
      setEditSubtopicId('');
    }
  };

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

      const updated = await apiClient.updateQuestion(id, {
        topicId: editTopicId,
        topicName: currentTopic?.name || question.topicName,
        subtopicId: editSubtopicId,
        subtopicName: availableSubtopics.find((s: any) => s.id === editSubtopicId)?.name || question.subtopicName,
        difficulty: editDifficulty,
        questionStyle: editQuestionStyle,
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
      setNotification('Question content and taxonomy updated successfully.');
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

      // Refresh history
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

      // Refresh history
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
        <p className="text-xs text-slate-500 font-mono">Loading question record from database...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-16 space-y-4 bg-white rounded-xl border border-slate-200 p-8 max-w-xl mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Question Record Not Found</h3>
        <p className="text-xs text-slate-500">
          The requested question ID "{id}" does not exist in the authoritative QUESTIONS sheet.
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

  // Determine allowed next statuses based on workflow state machine
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
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link
          to="/questions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library (Step 02)</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/questions/${encodeURIComponent(question.id)}/improve`}>
            <Button variant="outline" size="sm" icon={Edit3}>
              Improve Question (Step 03)
            </Button>
          </Link>

          <Link to={`/questions/${encodeURIComponent(question.id)}/verify`}>
            <Button variant="primary" size="sm" icon={ShieldCheck}>
              Verify & Approve (Step 04)
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

      <QuestionWorkflowHeader
        currentStep={question.status === QuestionStatus.APPROVED ? 4 : question.status === QuestionStatus.GENERATED ? 4 : 3}
        questionId={question.id}
        questionTitle={question.questionText?.slice(0, 45) + '...'}
      />

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
        title={`${question.id} • ${question.topicName}`}
        description={`${question.topicName} → ${question.subtopicName}`}
        badge={
          <div className="flex items-center gap-2">
            {question.contentMasterId ? (
              <Link
                to={`/content-masters/${encodeURIComponent(question.contentMasterId)}`}
                className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 rounded text-xs font-mono font-bold transition-colors inline-flex items-center gap-1"
                title="View Content Master Explorer"
              >
                Content Master: {question.contentMasterId}
              </Link>
            ) : (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-mono">
                Master: Not linked
              </span>
            )}
            <QuestionStatusBadge status={question.status} />
            <DifficultyBadge difficulty={question.difficulty as DifficultyLevel} />
            <VideoStatusBadge status={question.videoStatus} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question Content & Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {isEditing ? (
            /* EDIT FORM */
            <form onSubmit={handleSaveEdit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Edit Question Content & Taxonomy
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">ID: {question.id}</span>
              </div>

              {/* Taxonomy Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Topic <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editTopicId}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    required
                    disabled={allTopics.length === 0}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    {allTopics.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Subtopic <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editSubtopicId}
                    onChange={(e) => setEditSubtopicId(e.target.value)}
                    required
                    disabled={availableSubtopics.length === 0}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableSubtopics.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Difficulty & Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Duplicate Warning Box in Editor */}
              {duplicateMatches.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Duplicate Warning: {duplicateMatches.length} existing question(s) share high text similarity</span>
                  </div>
                  {duplicateMatches.slice(0, 2).map((m) => (
                    <div key={m.questionId} className="text-[11px] bg-white/80 p-1.5 rounded border border-amber-200">
                      <span className="font-mono font-bold text-indigo-700">{m.questionId}</span> ({Math.round(m.similarity * 100)}% match):{' '}
                      <span className="text-slate-600 italic">"{m.questionText.slice(0, 70)}..."</span>
                    </div>
                  ))}
                </div>
              )}

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
                        editCorrectAnswer === o.key ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200'
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
                        className="flex-1 bg-transparent border-0 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Detailed Explanation & Speed Breakdown <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
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
            /* VIEW MODE: QUESTION CONTENT */
            <>
              {/* Question Statement Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Question Statement
                    </span>
                  </div>
                  {question.questionStyle && (
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                      {question.questionStyle}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                  {question.questionText}
                </p>

                {question.realWorldContext && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Real-World Scenario / Hook: </span>
                    <span>{question.realWorldContext}</span>
                  </div>
                )}

                {/* Options List */}
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Multiple Choice Options
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const optVal = question.options[key.toLowerCase() as keyof typeof question.options];
                      const isCorrect = question.correctAnswer?.toUpperCase() === key;

                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'
                              }`}
                            >
                              {key}
                            </span>
                            <span>{optVal}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Solution Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Detailed Solution & Pedagogical Breakdown
                  </span>
                  <span className="text-xs text-indigo-600 font-medium">Author Solution</span>
                </div>

                <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-xs leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
                  {question.explanation}
                </pre>
              </div>
            </>
          )}

          {/* Workflow & Lifecycle History Cards */}
          <div className="space-y-4">
            {/* Workflow Transitions Log */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Workflow State History (WORKFLOW Sheet)
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
                          <span className="text-[10px] text-slate-400">({wf.entityType})</span>
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

            {/* Audit Log Entries */}
            {auditLogs.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Audit Log Entries (AUDIT_LOG Sheet)
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{auditLogs.length} logs</span>
                </div>

                <div className="space-y-2 text-xs">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-800">{log.action}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-mono">{log.entityType}:{log.entityId}</span>
                        </div>
                        {log.details && (
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-md">
                            {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                          </div>
                        )}
                      </div>
                      <div className="text-right font-mono text-slate-400 shrink-0">
                        <div>{log.actorName}</div>
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Workflow Controls & Metadata (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Team Assignment Management (Phase 10) */}
          <EntityAssignmentsSection
            entityType="QUESTION"
            entityId={question.id}
            title="Question Team Assignments"
            defaultTaskType="QUESTION_REVIEW"
          />

          {/* Workflow & Status Management Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Question Workflow State
              </h4>
              <QuestionStatusBadge status={question.status} size="sm" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Allowed Workflow Transitions:
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
                  Video Production Status
                </h4>
              </div>
              <VideoStatusBadge status={question.videoStatus} size="sm" />
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-mono font-bold text-slate-800">{question.videoStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Target Format:</span>
                <span className="font-semibold text-slate-800">Vertical Shorts (9:16)</span>
              </div>
            </div>

            {/* Add to Video Queue Action */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Button
                variant={isApproved && !isQueued && !isInProduction ? 'primary' : 'outline'}
                size="md"
                className="w-full justify-center"
                icon={Send}
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
                  'Add to Video Production Queue'
                ) : (
                  'Add to Video Queue (Approval Required)'
                )}
              </Button>

              {!isApproved && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
                  <strong>Notice:</strong> Only questions with <code>APPROVED</code> status can be queued for video production. Current status: <code>{question.status}</code>.
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
              Database Record Metadata
            </h4>

            <div className="space-y-2 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Content Master:</span>
                {question.contentMasterId ? (
                  <Link
                    to={`/content-masters/${encodeURIComponent(question.contentMasterId)}`}
                    className="font-mono font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 transition-colors inline-flex items-center gap-1"
                    title="View Content Master Explorer"
                  >
                    {question.contentMasterId}
                  </Link>
                ) : (
                  <span className="text-slate-400 italic">Not linked</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Permanent ID:</span>
                <span className="font-mono font-bold text-indigo-700">{question.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Created At:</span>
                <span className="font-mono text-slate-700">
                  {new Date(question.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Updated:</span>
                <span className="font-mono text-slate-700">
                  {question.updatedAt ? new Date(question.updatedAt).toLocaleString() : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Author / Source:</span>
                <span className="text-slate-700">{question.source || 'AI Generator Studio'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Author ID:</span>
                <span className="font-mono text-slate-700">{question.authorId || 'USR-001'}</span>
              </div>
            </div>

            {question.tags && question.tags.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-1.5 text-[11px]">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {question.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
