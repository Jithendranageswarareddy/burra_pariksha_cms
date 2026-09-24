import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Sliders,
  ShieldCheck,
  Check,
  Copy,
  Layers,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../design-system/components/PageHeader';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Card } from '../design-system/components/Card';
import { Alert } from '../design-system/components/Alert';
import { PageLoading } from '../design-system/components/Loading';
import { EmptyState } from '../design-system/components/EmptyState';
import { QuestionWorkflowHeader } from '../components/questions/QuestionWorkflowHeader';
import { apiClient } from '../lib/api-client';
import { CandidateValidator, CandidateValidationReport } from '../lib/ai/validators/candidate.validator';
import {
  AiRefinementAction,
  QuestionCandidate,
} from '../lib/ai/types';
import {
  Question,
  QuestionStatus,
  DifficultyLevel,
  QuestionStyle,
  QuestionLanguage,
} from '../types';

export const QuestionImprovePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeQuestionId = id || searchParams.get('id') || '';

  // Questions selector list state (if no active question ID)
  const [candidateList, setCandidateList] = useState<Question[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [listSearch, setListSearch] = useState<string>('');

  // Active question state
  const [question, setQuestion] = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);
  const [savingQuestion, setSavingQuestion] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Taxonomy & Config
  const [topics, setTopics] = useState<any[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState<boolean>(false);
  const [aiStatus, setAiStatus] = useState<{ isConfigured: boolean; model: string }>({
    isConfigured: false,
    model: 'gemini-2.5-flash',
  });

  // Human Editor Form state
  const [topicId, setTopicId] = useState<string>('');
  const [subtopicId, setSubtopicId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Intermediate');
  const [questionStyle, setQuestionStyle] = useState<string>('STORY_BASED');
  const [language, setLanguage] = useState<QuestionLanguage>(QuestionLanguage.ENGLISH);
  const [realLifeContext, setRealLifeContext] = useState<string>('');
  const [questionText, setQuestionText] = useState<string>('');
  const [optionA, setOptionA] = useState<string>('');
  const [optionB, setOptionB] = useState<string>('');
  const [optionC, setOptionC] = useState<string>('');
  const [optionD, setOptionD] = useState<string>('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [explanation, setExplanation] = useState<string>('');
  const [tags, setTags] = useState<string>('Aptitude');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // AI Refinement State
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinementAction, setRefinementAction] = useState<AiRefinementAction>(AiRefinementAction.MAKE_REALISTIC);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [aiSuggestion, setAiSuggestion] = useState<QuestionCandidate | null>(null);
  const [aiSuggestionApplied, setAiSuggestionApplied] = useState<boolean>(false);

  // Duplicate Check
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);

  // Client Validation Report
  const [clientReport, setClientReport] = useState<CandidateValidationReport | null>(null);

  // 1. Load taxonomy & AI status
  useEffect(() => {
    async function init() {
      try {
        setLoadingTaxonomy(true);
        const [pureTree, aiInfo] = await Promise.all([
          apiClient.getPureTopicTree().catch(() => []),
          apiClient.getAiStatus().catch(() => ({ isConfigured: false, model: 'gemini-2.5-flash' })),
        ]);

        let topicsList: any[] = pureTree;
        if (!topicsList || topicsList.length === 0) {
          const legacyTree = await apiClient.getTaxonomyTree().catch(() => []);
          const flattened: any[] = [];
          legacyTree.forEach((cat: any) => {
            if (cat.topics) {
              cat.topics.forEach((top: any) => {
                flattened.push({ ...top, categoryId: cat.id, categoryName: cat.name });
              });
            }
          });
          topicsList = flattened;
        }

        setTopics(topicsList);
        setAiStatus(aiInfo);
      } catch (err) {
        console.error('Failed to load taxonomy in improve page:', err);
      } finally {
        setLoadingTaxonomy(false);
      }
    }
    init();
  }, []);

  // 2. If no active question ID, load questions needing improvement
  useEffect(() => {
    if (!activeQuestionId) {
      async function loadDraftQuestions() {
        try {
          setLoadingList(true);
          const data = await apiClient.getQuestions({});
          setCandidateList(data);
        } catch (err: any) {
          console.error('Failed to load candidate list:', err);
        } finally {
          setLoadingList(false);
        }
      }
      loadDraftQuestions();
    }
  }, [activeQuestionId]);

  // 3. Load active question data
  const loadActiveQuestion = useCallback(async (qId: string) => {
    setLoadingQuestion(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);
    setAiSuggestion(null);
    setAiSuggestionApplied(false);
    try {
      const q = await apiClient.getQuestionById(qId);
      setQuestion(q);
      setTopicId(q.topicId || '');
      setSubtopicId(q.subtopicId || '');
      setDifficulty(q.difficulty || 'Intermediate');
      setQuestionStyle(q.questionStyle || 'STORY_BASED');
      setLanguage((q.language as QuestionLanguage) || QuestionLanguage.ENGLISH);
      setRealLifeContext(q.realWorldContext || '');
      setQuestionText(q.questionText || '');
      setOptionA(q.options?.a || '');
      setOptionB(q.options?.b || '');
      setOptionC(q.options?.c || '');
      setOptionD(q.options?.d || '');
      setCorrectAnswer((q.correctAnswer?.toUpperCase() as any) || 'A');
      setExplanation(q.explanation || '');
      setTags(q.tags ? q.tags.join(', ') : 'Aptitude');
      setIsDirty(false);

      // Validate on load
      const report = CandidateValidator.validate({
        content: q.questionText,
        option_a: q.options?.a,
        option_b: q.options?.b,
        option_c: q.options?.c,
        option_d: q.options?.d,
        correct_answer: (q.correctAnswer?.toUpperCase() as any) || 'A',
        explanation: q.explanation,
        language: (q.language as QuestionLanguage) || QuestionLanguage.ENGLISH,
        question_style: q.questionStyle,
        real_world_context: q.realWorldContext,
      });
      setClientReport(report);
    } catch (err: any) {
      setErrorMessage(err?.message || `Question "${qId}" could not be loaded.`);
    } finally {
      setLoadingQuestion(false);
    }
  }, []);

  useEffect(() => {
    if (activeQuestionId) {
      navigate(`/questions/${encodeURIComponent(activeQuestionId)}?mode=edit`, { replace: true });
      return;
    }
  }, [activeQuestionId, navigate]);

  useEffect(() => {
    if (activeQuestionId) {
      loadActiveQuestion(activeQuestionId);
    }
  }, [activeQuestionId, loadActiveQuestion]);

  // Derived taxonomy subtopics
  const currentTopic = useMemo(() => {
    return topics.find((t: any) => t.id === topicId);
  }, [topics, topicId]);

  const currentSubtopics = currentTopic?.subtopics || [];

  const handleTopicChange = (newTopicId: string) => {
    setTopicId(newTopicId);
    setIsDirty(true);
    const top = topics.find((t: any) => t.id === newTopicId);
    if (top && top.subtopics && top.subtopics.length > 0) {
      setSubtopicId(top.subtopics[0].id);
    } else {
      setSubtopicId('');
    }
  };

  // Re-run validation on field changes
  const runLiveValidation = useCallback(
    (updates: {
      text?: string;
      a?: string;
      b?: string;
      c?: string;
      d?: string;
      ans?: 'A' | 'B' | 'C' | 'D';
      exp?: string;
      lang?: QuestionLanguage;
      style?: string;
      ctx?: string;
    }) => {
      const qCandidate: Partial<QuestionCandidate> = {
        content: updates.text !== undefined ? updates.text : questionText,
        option_a: updates.a !== undefined ? updates.a : optionA,
        option_b: updates.b !== undefined ? updates.b : optionB,
        option_c: updates.c !== undefined ? updates.c : optionC,
        option_d: updates.d !== undefined ? updates.d : optionD,
        correct_answer: updates.ans !== undefined ? updates.ans : correctAnswer,
        explanation: updates.exp !== undefined ? updates.exp : explanation,
        language: updates.lang !== undefined ? updates.lang : language,
        question_style: updates.style !== undefined ? updates.style : questionStyle,
        real_world_context: updates.ctx !== undefined ? updates.ctx : realLifeContext,
      };
      setClientReport(CandidateValidator.validate(qCandidate));
    },
    [questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, language, questionStyle, realLifeContext]
  );

  // Duplicate check trigger
  useEffect(() => {
    if (!questionText || questionText.trim().length < 15) {
      setDuplicateMatches([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      try {
        const res = await apiClient.checkDuplicate(questionText.trim(), activeQuestionId);
        setDuplicateMatches(res.matches || []);
      } catch (err) {
        console.warn('Duplicate check warning:', err);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [questionText, activeQuestionId]);

  // AI Refinement Handler
  const handleTriggerAiRefine = async () => {
    if (!questionText.trim()) {
      setErrorMessage('Please enter question text before requesting AI refinement.');
      return;
    }

    setIsRefining(true);
    setErrorMessage(null);
    setAiSuggestionApplied(false);

    try {
      const activeCandidate: QuestionCandidate = {
        content: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: correctAnswer,
        explanation: explanation,
        difficulty: difficulty as DifficultyLevel,
        language: language,
        question_style: questionStyle,
        real_world_context: realLifeContext,
      };

      const res = await apiClient.refineAiQuestion({
        action: refinementAction,
        currentCandidate: activeCandidate,
        promptModifier: customInstructions.trim() || undefined,
        targetLanguage: language,
      });

      if (res && res.candidate) {
        setAiSuggestion(res.candidate);
      } else {
        throw new Error('No refinement candidate returned by AI.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'AI refinement failed. Human editing remains fully available.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setQuestionText(aiSuggestion.content || '');
    setOptionA(aiSuggestion.option_a || '');
    setOptionB(aiSuggestion.option_b || '');
    setOptionC(aiSuggestion.option_c || '');
    setOptionD(aiSuggestion.option_d || '');
    if (aiSuggestion.correct_answer) {
      setCorrectAnswer(aiSuggestion.correct_answer.toUpperCase() as any);
    }
    setExplanation(aiSuggestion.explanation || '');
    if (aiSuggestion.real_world_context) {
      setRealLifeContext(aiSuggestion.real_world_context);
    }
    if (aiSuggestion.language) {
      setLanguage(aiSuggestion.language as QuestionLanguage);
    }
    setIsDirty(true);
    setAiSuggestionApplied(true);
    runLiveValidation({
      text: aiSuggestion.content,
      a: aiSuggestion.option_a,
      b: aiSuggestion.option_b,
      c: aiSuggestion.option_c,
      d: aiSuggestion.option_d,
      ans: aiSuggestion.correct_answer?.toUpperCase() as any,
      exp: aiSuggestion.explanation,
      lang: aiSuggestion.language as QuestionLanguage,
      ctx: aiSuggestion.real_world_context,
    });
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (!activeQuestionId) return;
    if (!questionText.trim()) {
      setErrorMessage('Question text cannot be empty.');
      return;
    }

    setSavingQuestion(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updated = await apiClient.updateQuestion(activeQuestionId, {
        questionText: questionText.trim(),
        options: {
          a: optionA.trim(),
          b: optionB.trim(),
          c: optionC.trim(),
          d: optionD.trim(),
        },
        correctAnswer: correctAnswer,
        explanation: explanation.trim(),
        topicId: topicId || question?.topicId || '',
        subtopicId: subtopicId || question?.subtopicId || '',
        difficulty: difficulty as DifficultyLevel,
        questionStyle: questionStyle as QuestionStyle,
        realWorldContext: realLifeContext.trim() || undefined,
        language: language,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });

      setQuestion(updated);
      setIsDirty(false);
      setSaveSuccessMessage('Question changes saved successfully.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save question improvements.');
    } finally {
      setSavingQuestion(false);
    }
  };

  // Render questions picker if no question selected
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
          title="Edit & Refine Question"
          description="Select a question to refine, improve formulas, enhance explanations, or apply optional AI suggestions."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Question Bank', href: '/questions' },
            { label: 'Edit & Refine Question' },
          ]}
          actions={
            <Link to="/questions">
              <Button variant="outline" size="sm" icon={ArrowLeft}>
                Back to Question Bank
              </Button>
            </Link>
          }
        />

        <QuestionWorkflowHeader currentStep={3} />

        <Card variant="default" padding="lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select a Question to Improve</h3>
              <p className="text-xs text-slate-500">
                Choose a question currently in Draft or Generated stage to begin human refinement.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Filter by keyword or Topic..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loadingList ? (
            <PageLoading message="Loading questions..." />
          ) : filteredList.length === 0 ? (
            <EmptyState
              title="No matching questions found"
              description="Generate a new question to start the improvement workflow."
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
                        {q.topicName || 'General Topic'}
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
                    onClick={() => navigate(`/questions/${encodeURIComponent(q.id)}/improve`)}
                    icon={Edit3}
                  >
                    Improve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Active question improve workspace
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <PageHeader
        title="Edit & Refine Question"
        description="Refine problem statements, correct options, format solutions, and optionally apply AI improvements."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Question Bank', href: '/questions' },
          { label: question?.id || 'Question', href: `/questions/${activeQuestionId}` },
          { label: 'Edit & Refine' },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/questions')}
              icon={ArrowLeft}
            >
              Back to Question Bank
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveChanges}
              disabled={savingQuestion || !isDirty}
              icon={Save}
              className={isDirty ? 'ring-2 ring-indigo-400 animate-pulse' : ''}
            >
              {savingQuestion ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/questions/${encodeURIComponent(activeQuestionId)}/verify`)}
              icon={ArrowRight}
            >
              Continue to Review & Approve
            </Button>
          </div>
        }
      />

      <QuestionWorkflowHeader
        currentStep={3}
        questionId={activeQuestionId}
        questionTitle={question?.questionText ? question.questionText.slice(0, 45) + '...' : undefined}
      />

      {/* Notifications */}
      {errorMessage && (
        <Alert variant="error" title="Improvement Alert" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}
      {saveSuccessMessage && (
        <Alert variant="success" title="Success" onDismiss={() => setSaveSuccessMessage(null)}>
          {saveSuccessMessage}
        </Alert>
      )}

      {loadingQuestion ? (
        <PageLoading message="Loading question workspace..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLS: HUMAN EDITOR */}
          <div className="lg:col-span-7 space-y-5">
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Human Question Editor</h3>
                </div>
                <Badge variant={isDirty ? 'draft' : 'approved'} size="sm">
                  {isDirty ? 'Unsaved Changes' : 'All Changes Saved'}
                </Badge>
              </div>

              {/* Taxonomy & Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                  <select
                    value={topicId}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {topics.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subtopic</label>
                  <select
                    value={subtopicId}
                    onChange={(e) => {
                      setSubtopicId(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {currentSubtopics.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => {
                      setDifficulty(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Question Statement */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Question Statement</label>
                  <span className="text-[11px] text-slate-400 font-mono">{questionText.length} chars</span>
                </div>
                <textarea
                  value={questionText}
                  onChange={(e) => {
                    setQuestionText(e.target.value);
                    setIsDirty(true);
                    runLiveValidation({ text: e.target.value });
                  }}
                  rows={4}
                  placeholder="Enter clear, unambiguous question statement..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-900 leading-relaxed focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Options A-D Grid */}
              <div className="space-y-2 mb-4">
                <label className="text-xs font-semibold text-slate-700 block">
                  Options & Correct Answer (Select the radio button for the correct key)
                </label>
                {(['A', 'B', 'C', 'D'] as const).map((key) => {
                  const val = key === 'A' ? optionA : key === 'B' ? optionB : key === 'C' ? optionC : optionD;
                  const isCorrect = correctAnswer === key;

                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                        isCorrect
                          ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/40'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectAnswer(key);
                          setIsDirty(true);
                          runLiveValidation({ ans: key });
                        }}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-colors shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title={`Set ${key} as correct answer`}
                      >
                        {key}
                      </button>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (key === 'A') setOptionA(v);
                          if (key === 'B') setOptionB(v);
                          if (key === 'C') setOptionC(v);
                          if (key === 'D') setOptionD(v);
                          setIsDirty(true);
                          runLiveValidation({ [key.toLowerCase()]: v });
                        }}
                        placeholder={`Option ${key} text...`}
                        className="flex-1 bg-transparent border-none text-xs text-slate-900 font-medium focus:outline-hidden"
                      />
                      {isCorrect && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation & Solution */}
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-semibold text-slate-700 block">
                  Detailed Solution & Pedagogical Explanation
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => {
                    setExplanation(e.target.value);
                    setIsDirty(true);
                    runLiveValidation({ exp: e.target.value });
                  }}
                  rows={4}
                  placeholder="Provide step-by-step arithmetic breakdown, mental math shortcuts, and why the correct answer holds..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-900 leading-relaxed focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Real World Context & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Real-World Context Hook
                  </label>
                  <input
                    type="text"
                    value={realLifeContext}
                    onChange={(e) => {
                      setRealLifeContext(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Cricket tournament net run rate, Supermarket discounts"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => {
                      setTags(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Aptitude, SpeedMath, Percentage"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSaveChanges}
                  disabled={savingQuestion || !isDirty}
                  icon={Save}
                >
                  {savingQuestion ? 'Saving Changes...' : 'Save Question Improvements'}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate(`/questions/${encodeURIComponent(activeQuestionId)}/verify`)}
                  icon={ArrowRight}
                >
                  Continue to 04 Verify & Approve
                </Button>
              </div>
            </Card>
          </div>

          {/* RIGHT 5 COLS: OPTIONAL AI REFINEMENT & QUALITY CHECKS */}
          <div className="lg:col-span-5 space-y-5">
            {/* OPTIONAL AI REFINEMENT CARD */}
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold">Optional AI Refinement</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-100/70 text-indigo-800 rounded-full font-semibold">
                  {aiStatus.model}
                </span>
              </div>

              <p className="text-xs text-indigo-900 mb-3 leading-relaxed">
                Enhance your question with AI assistance. Refinement is entirely optional; human edits always take precedence.
              </p>

              {/* Refinement Actions Selection */}
              <div className="space-y-2 mb-3">
                <label className="text-xs font-semibold text-slate-700 block">Choose Refinement Goal</label>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  {[
                    { id: AiRefinementAction.MAKE_REALISTIC, label: 'Add Real-World Context Hook' },
                    { id: AiRefinementAction.SIMPLIFY_LANGUAGE, label: 'Simplify & Clarify Language' },
                    { id: AiRefinementAction.IMPROVE_OPTIONS, label: 'Improve Distractor Options' },
                    { id: AiRefinementAction.IMPROVE_EXPLANATION, label: 'Improve Solution & Explanation' },
                    { id: AiRefinementAction.IMPROVE_TELUGU, label: 'Translate / Improve Telugu Script' },
                  ].map((act) => (
                    <label
                      key={act.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        refinementAction === act.id
                          ? 'bg-indigo-50 border-indigo-300 font-semibold text-indigo-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="refinementGoal"
                        value={act.id}
                        checked={refinementAction === act.id}
                        onChange={() => setRefinementAction(act.id)}
                        className="text-indigo-600"
                      />
                      <span>{act.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Guidance */}
              <div className="space-y-1 mb-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  Custom AI Guidance (Optional)
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., Use relatable Telugu names, emphasize ratio formula..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Trigger AI Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleTriggerAiRefine}
                disabled={isRefining}
                icon={Sparkles}
                className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white mb-3"
              >
                {isRefining ? 'Generating AI Suggestion...' : 'Improve with AI'}
              </Button>

              {/* AI Suggestion Preview Box */}
              {aiSuggestion && (
                <div className="p-3 bg-white border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      AI Suggestion Ready
                    </span>
                    {aiSuggestionApplied ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Applied
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-800 font-medium line-clamp-3">
                    {aiSuggestion.content}
                  </p>
                  <div className="text-[11px] text-slate-500 grid grid-cols-2 gap-1 font-mono">
                    <span>A: {aiSuggestion.option_a}</span>
                    <span>B: {aiSuggestion.option_b}</span>
                    <span>C: {aiSuggestion.option_c}</span>
                    <span>D: {aiSuggestion.option_d}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                    Solution: {aiSuggestion.explanation}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApplyAiSuggestion}
                      disabled={aiSuggestionApplied}
                      icon={Check}
                      className="flex-1 justify-center text-xs"
                    >
                      {aiSuggestionApplied ? 'Suggestion Applied' : 'Apply to Editor'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAiSuggestion(null)}
                      className="text-xs"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* LIVE VALIDATION & QUALITY STATUS CARD */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold">Live Quality Status</h3>
                </div>
                <Badge
                  variant={clientReport?.isValid ? 'approved' : 'rejected'}
                  size="sm"
                >
                  {clientReport?.isValid ? 'Ready for Verify' : 'Needs Correction'}
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Question Content</span>
                  <span className={questionText.trim().length >= 10 ? 'text-emerald-700 font-semibold' : 'text-amber-600'}>
                    {questionText.trim().length >= 10 ? '✓ Complete' : '⚠ Too Short'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">4 Distinct Options</span>
                  <span
                    className={
                      optionA.trim() && optionB.trim() && optionC.trim() && optionD.trim()
                        ? 'text-emerald-700 font-semibold'
                        : 'text-amber-600'
                    }
                  >
                    {optionA.trim() && optionB.trim() && optionC.trim() && optionD.trim()
                      ? '✓ All 4 Present'
                      : '⚠ Missing Options'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Correct Answer Key</span>
                  <span className="font-mono font-bold text-indigo-700">Option {correctAnswer}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Detailed Explanation</span>
                  <span className={explanation.trim().length >= 15 ? 'text-emerald-700 font-semibold' : 'text-amber-600'}>
                    {explanation.trim().length >= 15 ? '✓ Detailed' : '⚠ Needs Detail'}
                  </span>
                </div>
              </div>

              {/* Duplicate Detection Alert */}
              {isCheckingDuplicate ? (
                <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Checking question similarity in repository...</span>
                </div>
              ) : duplicateMatches.length > 0 ? (
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Potential Duplicate Detected ({duplicateMatches.length} match)</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Similar text exists in question <span className="font-mono font-bold">{duplicateMatches[0]?.id}</span>.
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-2 bg-emerald-50/50 border border-emerald-200/60 rounded-lg text-[11px] text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>No duplicate matches found in library.</span>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
