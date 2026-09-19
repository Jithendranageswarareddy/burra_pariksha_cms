/**
 * BURRA PARIKSHA CMS - Phase 9: Content Planning, Batch Management & Question Intelligence
 * 
 * Comprehensive operational interface featuring:
 * 1. Content Plans Hub (Strategic Syllabus Sprints)
 * 2. Production Batches (Sprint Lifecycle Tracking & Question Linking)
 * 3. Taxonomy Coverage Intelligence Matrix
 * 4. Curriculum Gap Analysis & Concentration Risk Diagnostics
 * 5. Similarity Radar & Duplicate Detection Engine
 * 6. Gemini AI Planning Assistant (Advisory Proposals)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  Zap,
  Target,
  FileSpreadsheet,
  Trash2,
  Link,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
  Sliders,
  Eye,
  Film,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Scale,
  Calendar,
  CalendarDays,
  ExternalLink,
  Wand2,
  List,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  AiContentPlanRecommendation,
  BatchProgressMetrics,
  CategoryCoverage,
  ContentBatch,
  ContentBatchStatus,
  ContentGapAnalysis,
  ContentPlan,
  ContentPlanStatus,
  CoverageOverviewData,
  DifficultyLevel,
  PriorityLevel,
  QuestionLanguage,
  QuestionStyle,
  TopicCoverage,
} from '../types';
import { DiversityRadarReport, QuestionSimilarityMatch } from '../lib/services/similarity.service';

type ActiveTab = 'plans' | 'batches' | 'coverage' | 'gaps' | 'radar' | 'ai-assistant';

export const PlanningPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('plans');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Core Data States
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [batches, setBatches] = useState<{ batch: ContentBatch; metrics: BatchProgressMetrics }[]>([]);
  const [coverage, setCoverage] = useState<CoverageOverviewData | null>(null);
  const [gaps, setGaps] = useState<ContentGapAnalysis | null>(null);
  const [radar, setRadar] = useState<DiversityRadarReport | null>(null);

  // Taxonomy Reference for Forms
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [topics, setTopics] = useState<{ id: string; name: string; categoryId: string }[]>([]);
  const [subtopics, setSubtopics] = useState<{ id: string; name: string; topicId: string }[]>([]);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);

  // Plan Details Drawer / Modal State
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<ContentPlan | null>(null);
  const [planViewMode, setPlanViewMode] = useState<'grid' | 'calendar'>('grid');

  // Create Plan Modal State
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState({
    categoryId: '',
    topicId: '',
    subtopicId: '',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
    targetQuestionCount: 10,
    realWorldContext: '',
    questionStyle: QuestionStyle.REAL_WORLD_SCENARIO,
    priority: PriorityLevel.NORMAL,
    plannedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Create Batch Modal State
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    name: '',
    description: '',
    planId: '',
    targetCount: 10,
    priority: PriorityLevel.NORMAL,
    plannedDate: new Date().toISOString().split('T')[0],
  });

  // Link Questions Modal State
  const [isLinkQuestionsOpen, setIsLinkQuestionsOpen] = useState(false);
  const [selectedBatchForLinking, setSelectedBatchForLinking] = useState<ContentBatch | null>(null);
  const [selectedQuestionIdsToLink, setSelectedQuestionIdsToLink] = useState<string[]>([]);
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [linkQuestionCategoryFilter, setLinkQuestionCategoryFilter] = useState('ALL');
  const [linkQuestionDifficultyFilter, setLinkQuestionDifficultyFilter] = useState('ALL');
  const [linkQuestionStatusFilter, setLinkQuestionStatusFilter] = useState('ALL');
  const [linkOnlyMatchingSubtopic, setLinkOnlyMatchingSubtopic] = useState(false);

  // AI Assistant State
  const [aiForm, setAiForm] = useState({
    categoryId: '',
    topicId: '',
    targetTotalCount: 20,
    language: QuestionLanguage.ENGLISH,
    focusContext: 'Telugu State competitive exams (APPSC/TSPSC)',
  });
  const [isGeneratingAiPlan, setIsGeneratingAiPlan] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<AiContentPlanRecommendation | null>(null);

  // Live Similarity Checker State
  const [scratchpadText, setScratchpadText] = useState('');
  const [isCheckingScratchpad, setIsCheckingScratchpad] = useState(false);
  const [scratchpadMatches, setScratchpadMatches] = useState<QuestionSimilarityMatch[]>([]);

  // Filter States
  const [planStatusFilter, setPlanStatusFilter] = useState<string>('ALL');
  const [planTopicFilter, setPlanTopicFilter] = useState<string>('ALL');
  const [planPriorityFilter, setPlanPriorityFilter] = useState<string>('ALL');
  const [planDifficultyFilter, setPlanDifficultyFilter] = useState<string>('ALL');
  const [planSearchQuery, setPlanSearchQuery] = useState<string>('');

  const [batchStatusFilter, setBatchStatusFilter] = useState<string>('ALL');
  const [batchSearchQuery, setBatchSearchQuery] = useState<string>('');

  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  // Initial Data Load
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Taxonomy & Questions for Modals
      const [taxRes, qRes] = await Promise.all([
        fetch('/api/taxonomy/summary').then((r) => r.json()),
        fetch('/api/questions').then((r) => r.json()),
      ]);

      if (taxRes.categories) setCategories(taxRes.categories);
      if (taxRes.topics) setTopics(taxRes.topics);
      if (taxRes.subtopics) setSubtopics(taxRes.subtopics);
      if (Array.isArray(qRes)) setAllQuestions(qRes);

      // 2. Fetch Phase 9 Planning Datasets
      const [plansRes, batchesRes, covRes, gapsRes, radarRes] = await Promise.all([
        fetch('/api/planning/plans').then((r) => r.json()),
        fetch('/api/planning/batches').then((r) => r.json()),
        fetch('/api/planning/coverage').then((r) => r.json()),
        fetch('/api/planning/gaps').then((r) => r.json()),
        fetch('/api/planning/similarity-radar').then((r) => r.json()),
      ]);

      if (Array.isArray(plansRes)) {
        setPlans(plansRes);
        // Refresh selectedPlanForDetails if open
        if (selectedPlanForDetails) {
          const updatedSelected = plansRes.find((p) => p.id === selectedPlanForDetails.id);
          if (updatedSelected) setSelectedPlanForDetails(updatedSelected);
        }
      }
      if (Array.isArray(batchesRes)) setBatches(batchesRes);
      if (covRes && !covRes.error) setCoverage(covRes);
      if (gapsRes && !gapsRes.error) setGaps(gapsRes);
      if (radarRes && !radarRes.error) setRadar(radarRes);
    } catch (err: any) {
      console.error('Failed to load planning data:', err);
      setActionMessage({ type: 'error', text: 'Failed to load planning datasets. Please check network connection.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered dropdowns for plan creation (Topic -> Subtopic primary)
  const availableTopicsForPlan = topics;
  const availableSubtopicsForPlan = subtopics.filter((s) => s.topicId === planForm.topicId);

  // Available topics for AI Assistant
  const availableTopicsForAi = topics;

  // Handlers
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/planning/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to create plan');

      setActionMessage({ type: 'success', text: `Content Plan ${data.id} created successfully in DRAFT.` });
      setIsCreatePlanOpen(false);
      fetchAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleApprovePlan = async (planId: string) => {
    try {
      const res = await fetch(`/api/planning/plans/${planId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: { id: 'USR-001', name: 'Admin / Content Lead' } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to approve plan');

      setActionMessage({ type: 'success', text: `Content Plan ${planId} approved for production batching.` });
      fetchAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleTransitionPlanStatus = async (planId: string, newStatus: ContentPlanStatus) => {
    try {
      const res = await fetch(`/api/planning/plans/${planId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `Failed to transition plan to ${newStatus}`);

      setActionMessage({ type: 'success', text: `Content Plan ${planId} transitioned to ${newStatus}.` });
      fetchAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm(`Are you sure you want to delete Content Plan ${planId}?`)) return;
    try {
      const res = await fetch(`/api/planning/plans/${planId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete plan');

      setActionMessage({ type: 'success', text: `Content Plan ${planId} deleted.` });
      if (selectedPlanForDetails?.id === planId) {
        setSelectedPlanForDetails(null);
      }
      fetchAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/planning/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to create batch');

      setActionMessage({ type: 'success', text: `Production Batch ${data.batch.id} created successfully.` });
      setIsCreateBatchOpen(false);
      fetchAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!window.confirm(`Are you sure you want to delete Production Batch ${batchId}? Linked questions will be unlinked.`)) return;
    try {
      const res = await fetch(`/api/planning/batches/${batchId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete batch');

      setActionMessage({ type: 'success', text: `Production Batch ${batchId} deleted.` });
      fetchAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleGoToQuestionGenerator = (plan: ContentPlan) => {
    const params = new URLSearchParams({
      planId: plan.id,
      categoryId: plan.categoryId,
      topicId: plan.topicId,
      subtopicId: plan.subtopicId,
      difficulty: plan.difficulty,
      language: plan.language,
      questionStyle: plan.questionStyle || QuestionStyle.REAL_WORLD_SCENARIO,
      realWorldContext: plan.realWorldContext || '',
    });
    navigate(`/generate?${params.toString()}`);
  };

  const handleOpenLinkModal = (batch: ContentBatch) => {
    setSelectedBatchForLinking(batch);
    setSelectedQuestionIdsToLink(Array.isArray(batch.questionIds) ? [...batch.questionIds] : []);
    setIsLinkQuestionsOpen(true);
  };

  const handleSaveBatchQuestions = async () => {
    if (!selectedBatchForLinking) return;
    try {
      const res = await fetch(`/api/planning/batches/${selectedBatchForLinking.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIds: selectedQuestionIdsToLink,
          action: 'SET',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to update linked questions');

      setActionMessage({
        type: 'success',
        text: `Updated questions for batch ${selectedBatchForLinking.id} (${selectedQuestionIdsToLink.length} linked).`,
      });
      setIsLinkQuestionsOpen(false);
      fetchAllData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleGenerateAiRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingAiPlan(true);
    try {
      const res = await fetch('/api/planning/ai-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to generate AI plan');
      setAiRecommendation(data);
      setActionMessage({ type: 'success', text: 'AI Content Planning recommendation generated successfully.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsGeneratingAiPlan(false);
    }
  };

  const handleApplyAiSubtopicAsPlan = async (sub: any) => {
    try {
      const targetSub = subtopics.find((s) => s.id === sub.subtopicId);
      const targetTop = targetSub ? topics.find((t) => t.id === targetSub.topicId) : null;
      const targetCat = targetTop ? categories.find((c) => c.id === targetTop.categoryId) : null;

      if (!targetSub || !targetTop) {
        throw new Error('Taxonomy mapping missing for recommended subtopic.');
      }

      const res = await fetch('/api/planning/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: targetCat?.id || '',
          topicId: targetTop.id,
          subtopicId: targetSub.id,
          difficulty: DifficultyLevel.MEDIUM,
          targetQuestionCount: sub.recommendedCount || 10,
          realWorldContext: sub.suggestedContexts?.[0] || '',
          questionStyle: QuestionStyle.REAL_WORLD_SCENARIO,
          priority: PriorityLevel.HIGH,
          plannedDate: new Date().toISOString().split('T')[0],
          notes: `[AI Advisory Recommendation] ${sub.rationale}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to create plan from recommendation');

      setActionMessage({
        type: 'success',
        text: `Created Draft Plan ${data.id} for subtopic '${sub.subtopicName}'. Review and approve under Content Plans.`,
      });
      fetchAllData();
      setActiveTab('plans');
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleCheckScratchpadSimilarity = async () => {
    if (!scratchpadText.trim()) return;
    setIsCheckingScratchpad(true);
    try {
      const res = await fetch('/api/planning/similarity-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scratchpadText, threshold: 0.65 }),
      });
      const data = await res.json();
      setScratchpadMatches(data.matches || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsCheckingScratchpad(false);
    }
  };

  const handleQuickCreatePlanForGap = (subtopicId: string) => {
    const sub = subtopics.find((s) => s.id === subtopicId);
    if (!sub) return;
    const top = topics.find((t) => t.id === sub.topicId);
    const cat = top ? categories.find((c) => c.id === top.categoryId) : null;

    if (cat && top) {
      setPlanForm({
        ...planForm,
        categoryId: cat.id,
        topicId: top.id,
        subtopicId: sub.id,
        targetQuestionCount: 10,
        notes: 'Targeted sprint to close detected syllabus gap',
        priority: PriorityLevel.HIGH,
      });
      setIsCreatePlanOpen(true);
    }
  };

  // Filtered lists with memoization
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (planStatusFilter !== 'ALL' && p.status !== planStatusFilter) return false;
      if (planTopicFilter !== 'ALL' && p.topicId !== planTopicFilter) return false;
      if (planPriorityFilter !== 'ALL' && p.priority !== planPriorityFilter) return false;
      if (planDifficultyFilter !== 'ALL' && p.difficulty !== planDifficultyFilter) return false;
      if (planSearchQuery.trim()) {
        const q = planSearchQuery.toLowerCase();
        const matches =
          (p.id || '').toLowerCase().includes(q) ||
          (p.subtopicName && p.subtopicName.toLowerCase().includes(q)) ||
          (p.topicName && p.topicName.toLowerCase().includes(q)) ||
          (p.notes && p.notes.toLowerCase().includes(q)) ||
          (p.realWorldContext && p.realWorldContext.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [plans, planStatusFilter, planTopicFilter, planPriorityFilter, planDifficultyFilter, planSearchQuery]);

  // Calendar groupings for editorial schedule
  const calendarSchedule = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const overdue: ContentPlan[] = [];
    const thisWeek: ContentPlan[] = [];
    const upcoming: ContentPlan[] = [];
    const completed: ContentPlan[] = [];
    const unscheduled: ContentPlan[] = [];

    filteredPlans.forEach((plan) => {
      if (plan.status === ContentPlanStatus.COMPLETED) {
        completed.push(plan);
      } else if (!plan.plannedDate) {
        unscheduled.push(plan);
      } else if (plan.plannedDate < today) {
        overdue.push(plan);
      } else if (plan.plannedDate <= in7Days) {
        thisWeek.push(plan);
      } else {
        upcoming.push(plan);
      }
    });

    return { overdue, thisWeek, upcoming, completed, unscheduled };
  }, [filteredPlans]);

  const filteredBatches = useMemo(() => {
    return batches.filter(({ batch }) => {
      if (batchStatusFilter !== 'ALL' && batch.status !== batchStatusFilter) return false;
      if (batchSearchQuery.trim()) {
        const q = batchSearchQuery.toLowerCase();
        const matches =
          (batch.id || '').toLowerCase().includes(q) ||
          (batch.name || '').toLowerCase().includes(q) ||
          (batch.description && batch.description.toLowerCase().includes(q)) ||
          (batch.planId && batch.planId.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [batches, batchStatusFilter, batchSearchQuery]);

  return (
    <div id="planning-hub" className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-6 h-6 text-indigo-400" />
              <h1 className="text-2xl font-bold text-white tracking-tight">Content Planning & Batches</h1>
            </div>
            <p className="text-slate-400 text-sm max-w-3xl">
              Curriculum coverage, batch production schedules, and topic planning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-planning-btn"
              onClick={fetchAllData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              id="create-plan-top-btn"
              onClick={() => setIsCreatePlanOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Content Plan
            </button>
          </div>
        </div>

        {/* Global Summary Metric Pills */}
        {coverage && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800">
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Total Questions</span>
              <span className="text-xl font-bold text-white">{coverage.totalQuestions}</span>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Taxonomy Coverage</span>
              <span className="text-xl font-bold text-emerald-400">{coverage.overallTaxonomyCoveragePercentage}%</span>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Zero-Coverage Gaps</span>
              <span className="text-xl font-bold text-rose-400">{coverage.zeroCoverageSubtopicsCount}</span>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Active Plans</span>
              <span className="text-xl font-bold text-indigo-300">
                {plans.filter((p) => p.status === ContentPlanStatus.IN_PROGRESS || p.status === ContentPlanStatus.APPROVED).length}
              </span>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Active Batches</span>
              <span className="text-xl font-bold text-amber-300">
                {batches.filter((b) => b.batch.status === ContentBatchStatus.ACTIVE).length}
              </span>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">Diversity Health</span>
              <span className="text-xl font-bold text-cyan-400">{radar ? `${radar.healthScore}%` : '100%'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span className="text-sm font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs uppercase font-semibold px-2 py-1 rounded bg-black/20 hover:bg-black/40"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          id="tab-plans-btn"
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'plans'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          Content Plans
          <span className="bg-slate-900/50 text-xs px-2 py-0.5 rounded-full">{plans.length}</span>
        </button>

        <button
          id="tab-batches-btn"
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'batches'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Production Batches
          <span className="bg-slate-900/50 text-xs px-2 py-0.5 rounded-full">{batches.length}</span>
        </button>

        <button
          id="tab-coverage-btn"
          onClick={() => setActiveTab('coverage')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'coverage'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Taxonomy Coverage
        </button>

        <button
          id="tab-gaps-btn"
          onClick={() => setActiveTab('gaps')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'gaps'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Gap Analysis
          {gaps && gaps.zeroCoverageSubtopics.length > 0 && (
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2 py-0.5 rounded-full">
              {gaps.zeroCoverageSubtopics.length} Gaps
            </span>
          )}
        </button>

        <button
          id="tab-radar-btn"
          onClick={() => setActiveTab('radar')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'radar'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          Similarity & Diversity Radar
          {radar && radar.exactDuplicatesCount > 0 && (
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2 py-0.5 rounded-full">
              {radar.exactDuplicatesCount} Dupes
            </span>
          )}
        </button>

        <button
          id="tab-ai-btn"
          onClick={() => setActiveTab('ai-assistant')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'ai-assistant'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          AI Planning Assistant
        </button>
      </div>

      {/* ============================================================================ */}
      {/* ============================================================================ */}
      {/* TAB 1: CONTENT PLANS & EDITORIAL CALENDAR                                     */}
      {/* ============================================================================ */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Filter & Control Bar */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="plan-search-input"
                  type="text"
                  placeholder="Search plans by ID, topic, subtopic, context, or notes..."
                  value={planSearchQuery}
                  onChange={(e) => setPlanSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* View Switcher & Action Button */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center">
                  <button
                    id="plan-view-grid-btn"
                    onClick={() => setPlanViewMode('grid')}
                    className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      planViewMode === 'grid'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    Grid Cards
                  </button>
                  <button
                    id="plan-view-calendar-btn"
                    onClick={() => setPlanViewMode('calendar')}
                    className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      planViewMode === 'calendar'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    Editorial Calendar
                  </button>
                </div>

                <button
                  id="create-plan-sub-btn"
                  onClick={() => setIsCreatePlanOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  New Content Plan
                </button>
              </div>
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 shrink-0">Status:</span>
                <select
                  id="plan-status-filter"
                  value={planStatusFilter}
                  onChange={(e) => setPlanStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-200 w-full focus:outline-hidden"
                >
                  <option value="ALL">All ({plans.length})</option>
                  <option value={ContentPlanStatus.DRAFT}>Draft ({plans.filter((p) => p.status === ContentPlanStatus.DRAFT).length})</option>
                  <option value={ContentPlanStatus.APPROVED}>Approved ({plans.filter((p) => p.status === ContentPlanStatus.APPROVED).length})</option>
                  <option value={ContentPlanStatus.IN_PROGRESS}>In Progress ({plans.filter((p) => p.status === ContentPlanStatus.IN_PROGRESS).length})</option>
                  <option value={ContentPlanStatus.COMPLETED}>Completed ({plans.filter((p) => p.status === ContentPlanStatus.COMPLETED).length})</option>
                  <option value={ContentPlanStatus.CANCELLED}>Cancelled ({plans.filter((p) => p.status === ContentPlanStatus.CANCELLED).length})</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 shrink-0">Topic:</span>
                <select
                  id="plan-topic-filter"
                  value={planTopicFilter}
                  onChange={(e) => setPlanTopicFilter(e.target.value)}
                  className="bg-transparent text-slate-200 w-full focus:outline-hidden"
                >
                  <option value="ALL">All Topics</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 shrink-0">Priority:</span>
                <select
                  id="plan-priority-filter"
                  value={planPriorityFilter}
                  onChange={(e) => setPlanPriorityFilter(e.target.value)}
                  className="bg-transparent text-slate-200 w-full focus:outline-hidden"
                >
                  <option value="ALL">All Priorities</option>
                  <option value={PriorityLevel.URGENT}>Urgent</option>
                  <option value={PriorityLevel.HIGH}>High</option>
                  <option value={PriorityLevel.NORMAL}>Normal</option>
                  <option value={PriorityLevel.LOW}>Low</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 shrink-0">Difficulty:</span>
                <select
                  id="plan-difficulty-filter"
                  value={planDifficultyFilter}
                  onChange={(e) => setPlanDifficultyFilter(e.target.value)}
                  className="bg-transparent text-slate-200 w-full focus:outline-hidden"
                >
                  <option value="ALL">All Difficulties</option>
                  <option value={DifficultyLevel.EASY}>Easy</option>
                  <option value={DifficultyLevel.MEDIUM}>Medium</option>
                  <option value={DifficultyLevel.HARD}>Hard</option>
                </select>
              </div>
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">No Content Plans Found</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
                No content plans matched the selected filters. Create a new plan or adjust your filter query.
              </p>
              <button
                onClick={() => setIsCreatePlanOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg"
              >
                Create Content Plan
              </button>
            </div>
          ) : planViewMode === 'grid' ? (
            /* ================= GRID VIEW ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  id={`plan-card-${plan.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: ID, Priority, Status */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">{plan.id}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            plan.priority === PriorityLevel.URGENT
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : plan.priority === PriorityLevel.HIGH
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {plan.priority}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            plan.status === ContentPlanStatus.APPROVED
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : plan.status === ContentPlanStatus.IN_PROGRESS
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : plan.status === ContentPlanStatus.COMPLETED
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : plan.status === ContentPlanStatus.CANCELLED
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </div>
                    </div>

                    {/* Taxonomy Hierarchy */}
                    <h3 className="text-base font-bold text-white mb-1">{plan.subtopicName}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                      <span>{plan.topicName}</span>
                    </div>

                    {/* Target vs Actual Progress Bar */}
                    <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 mb-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400">Target Fulfillment:</span>
                        <span className="font-semibold text-slate-200">
                          {plan.currentQuestionCount || 0} / {plan.targetQuestionCount} questions ({plan.completionPercentage || 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, plan.completionPercentage || 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Details Badges */}
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-300 mb-3">
                      <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">Difficulty: {plan.difficulty}</span>
                      <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">Lang: {plan.language}</span>
                      <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">Batches: {plan.createdBatchesCount || 0}</span>
                      {plan.plannedDate && (
                        <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          {plan.plannedDate}
                        </span>
                      )}
                    </div>

                    {plan.realWorldContext && (
                      <p className="text-xs text-indigo-300/90 bg-indigo-950/30 p-2 rounded border border-indigo-800/40 mb-2 line-clamp-1">
                        🎯 {plan.realWorldContext}
                      </p>
                    )}

                    {plan.notes && (
                      <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-800/60 mb-3 line-clamp-2">
                        {plan.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setSelectedPlanForDetails(plan)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 flex items-center gap-1"
                        title="View Full Plan Details & History"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        Details
                      </button>

                      {plan.status === ContentPlanStatus.DRAFT && (
                        <button
                          onClick={() => handleApprovePlan(plan.id)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded border border-emerald-500/40 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}

                      <button
                        onClick={() => handleGoToQuestionGenerator(plan)}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded border border-indigo-500/40 flex items-center gap-1"
                        title="Generate Questions pre-configured for this Plan"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Generate Qs
                      </button>

                      {(plan.status === ContentPlanStatus.APPROVED || plan.status === ContentPlanStatus.IN_PROGRESS) && (
                        <button
                          onClick={() => {
                            setBatchForm({
                              ...batchForm,
                              planId: plan.id,
                              name: `${plan.topicName} - Sprint ${ (plan.createdBatchesCount || 0) + 1}`,
                              targetCount: Math.min(10, plan.remainingQuestionCount || 10),
                            });
                            setIsCreateBatchOpen(true);
                          }}
                          className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold rounded border border-cyan-500/40 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Batch
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ================= EDITORIAL CALENDAR TIMELINE VIEW ================= */
            <div className="space-y-6">
              {/* Overdue Section */}
              {calendarSchedule.overdue.length > 0 && (
                <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-900/30">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wide">
                        Overdue Sprints ({calendarSchedule.overdue.length})
                      </h3>
                    </div>
                    <span className="text-xs text-rose-400 font-medium">Immediate Attention Required</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {calendarSchedule.overdue.map((plan) => (
                      <div
                        key={plan.id}
                        className="bg-slate-950/80 border border-rose-800/40 rounded-lg p-3 hover:border-rose-700 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-mono text-rose-400 font-bold">{plan.id}</span>
                            <span className="text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded text-[11px] border border-rose-800/50">
                              Due: {plan.plannedDate}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-0.5">{plan.subtopicName}</h4>
                          <span className="text-[11px] text-slate-400 block mb-2">{plan.topicName}</span>

                          <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 mb-2">
                            <span>Progress:</span>
                            <strong className="text-indigo-300">{plan.currentQuestionCount || 0} / {plan.targetQuestionCount} Qs</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                          <button
                            onClick={() => setSelectedPlanForDetails(plan)}
                            className="text-slate-300 hover:text-white underline text-[11px]"
                          >
                            View Plan
                          </button>
                          <button
                            onClick={() => handleGoToQuestionGenerator(plan)}
                            className="px-2 py-0.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded border border-rose-500/30 font-medium text-[11px]"
                          >
                            Generate Questions
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* This Week Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                      This Week's Sprints ({calendarSchedule.thisWeek.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Scheduled for current production cycle</span>
                </div>

                {calendarSchedule.thisWeek.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No content plans scheduled for this week.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {calendarSchedule.thisWeek.map((plan) => (
                      <div
                        key={plan.id}
                        className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-mono text-indigo-400 font-bold">{plan.id}</span>
                            <span className="text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded text-[11px] border border-amber-800/40">
                              Target: {plan.plannedDate}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-0.5">{plan.subtopicName}</h4>
                          <span className="text-[11px] text-slate-400 block mb-2">{plan.topicName}</span>

                          <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 mb-2">
                            <span>Progress:</span>
                            <strong className="text-indigo-300">{plan.currentQuestionCount || 0} / {plan.targetQuestionCount} Qs ({plan.completionPercentage || 0}%)</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                          <button
                            onClick={() => setSelectedPlanForDetails(plan)}
                            className="text-slate-300 hover:text-white underline text-[11px]"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleGoToQuestionGenerator(plan)}
                            className="px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded border border-indigo-500/30 font-medium text-[11px]"
                          >
                            Generate Qs
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming & Future Sprints */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wide">
                      Upcoming Pipeline ({calendarSchedule.upcoming.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Future scheduled milestones</span>
                </div>

                {calendarSchedule.upcoming.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No future plans scheduled.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {calendarSchedule.upcoming.map((plan) => (
                      <div
                        key={plan.id}
                        className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-mono text-indigo-400 font-bold">{plan.id}</span>
                            <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-slate-800">
                              {plan.plannedDate}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-0.5">{plan.subtopicName}</h4>
                          <span className="text-[11px] text-slate-400 block mb-2">{plan.topicName}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                          <button
                            onClick={() => setSelectedPlanForDetails(plan)}
                            className="text-slate-300 hover:text-white underline text-[11px]"
                          >
                            Details
                          </button>
                          <span className="text-[11px] text-slate-400">{plan.targetQuestionCount} Qs Target</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed & Unscheduled Sprints */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Completed */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wide">
                        Completed Sprints ({calendarSchedule.completed.length})
                      </h3>
                    </div>
                  </div>

                  {calendarSchedule.completed.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">No completed plans yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {calendarSchedule.completed.map((plan) => (
                        <div
                          key={plan.id}
                          className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{plan.subtopicName}</span>
                            <span className="text-slate-400 text-[11px]">{plan.topicName}</span>
                          </div>
                          <button
                            onClick={() => setSelectedPlanForDetails(plan)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unscheduled */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                        Backlog / Unscheduled ({calendarSchedule.unscheduled.length})
                      </h3>
                    </div>
                  </div>

                  {calendarSchedule.unscheduled.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">All plans are scheduled.</p>
                  ) : (
                    <div className="space-y-2">
                      {calendarSchedule.unscheduled.map((plan) => (
                        <div
                          key={plan.id}
                          className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{plan.subtopicName}</span>
                            <span className="text-slate-400 text-[11px]">{plan.topicName}</span>
                          </div>
                          <button
                            onClick={() => setSelectedPlanForDetails(plan)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                          >
                            Schedule
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================================ */}
      {/* TAB 2: PRODUCTION BATCHES                                                    */}
      {/* ============================================================================ */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="flex flex-1 items-center gap-3 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="batch-search-input"
                  type="text"
                  placeholder="Search batches by ID, name, description, plan ID..."
                  value={batchSearchQuery}
                  onChange={(e) => setBatchSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-1.5 border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400">Status:</span>
                <select
                  id="batch-status-filter"
                  value={batchStatusFilter}
                  onChange={(e) => setBatchStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-hidden"
                >
                  <option value="ALL">All Batches ({batches.length})</option>
                  <option value={ContentBatchStatus.PLANNED}>Planned ({batches.filter((b) => b.batch.status === ContentBatchStatus.PLANNED).length})</option>
                  <option value={ContentBatchStatus.ACTIVE}>Active ({batches.filter((b) => b.batch.status === ContentBatchStatus.ACTIVE).length})</option>
                  <option value={ContentBatchStatus.COMPLETED}>Completed ({batches.filter((b) => b.batch.status === ContentBatchStatus.COMPLETED).length})</option>
                  <option value={ContentBatchStatus.CANCELLED}>Cancelled ({batches.filter((b) => b.batch.status === ContentBatchStatus.CANCELLED).length})</option>
                </select>
              </div>

              <button
                onClick={() => setIsCreateBatchOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New Sprint Batch
              </button>
            </div>
          </div>

          {filteredBatches.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">No Production Batches Found</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
                Group questions into structured production sprints to track questions from generation through approval to video recording.
              </p>
              <button
                onClick={() => setIsCreateBatchOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg"
              >
                Create Sprint Batch
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredBatches.map(({ batch, metrics }) => (
                <div
                  key={batch.id}
                  id={`batch-card-${batch.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">{batch.id}</span>
                        <span className="text-xs text-slate-500">Plan: {batch.planId}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {metrics.isReadyForProduction && (
                          <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ready for Filming
                          </span>
                        )}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            batch.status === ContentBatchStatus.ACTIVE
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : batch.status === ContentBatchStatus.COMPLETED
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{batch.name}</h3>
                    {batch.description && <p className="text-xs text-slate-400 mb-3">{batch.description}</p>}

                    {/* Lifecycle Progression Breakdown Pipeline */}
                    <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 mb-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Approved Target Progress:</span>
                        <span className="font-semibold text-slate-200">
                          {metrics.approved} / {metrics.targetCount} ({metrics.completionPercentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            metrics.isReadyForProduction ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, metrics.completionPercentage)}%` }}
                        />
                      </div>

                      {/* Micro stages pills */}
                      <div className="grid grid-cols-6 gap-1.5 text-center pt-2 border-t border-slate-800/80">
                        <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Gen</span>
                          <span className="text-xs font-bold text-slate-300">{metrics.generated}</span>
                        </div>
                        <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Edit</span>
                          <span className="text-xs font-bold text-amber-300">{metrics.editing}</span>
                        </div>
                        <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Apprv</span>
                          <span className="text-xs font-bold text-emerald-400">{metrics.approved}</span>
                        </div>
                        <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Queued</span>
                          <span className="text-xs font-bold text-indigo-400">{metrics.queued}</span>
                        </div>
                        <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Prod</span>
                          <span className="text-xs font-bold text-cyan-400">{metrics.inProduction}</span>
                        </div>
                        <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">Pub</span>
                          <span className="text-xs font-bold text-purple-400">{metrics.published}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Batch Controls */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Linked Questions: <strong className="text-slate-200">{metrics.totalAssociated}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenLinkModal(batch)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 flex items-center gap-1.5"
                      >
                        <Link className="w-3.5 h-3.5 text-indigo-400" />
                        Manage Questions ({metrics.totalAssociated})
                      </button>

                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================================ */}
      {/* TAB 3: TAXONOMY COVERAGE INTELLIGENCE                                        */}
      {/* ============================================================================ */}
      {activeTab === 'coverage' && coverage && (
        <div className="space-y-6">
          {/* 100 Topics x 100 Subtopics Curriculum Capacity Banner */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  100 Topics &times; 100 Subtopics Master Matrix
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100 Subtopics Active
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Comprehensive Syllabus Taxonomy Capacity: 10,000 Subtopics Planned
              </h3>
              <p className="text-xs text-slate-400 max-w-2xl">
                Topic 1 (<code>BP-TOP-001</code>) active with 100 loaded subtopics (<code>BP-SUB-0001</code> to <code>BP-SUB-0100</code>). Direct deep-linking allows instant question drafting in Question Studio.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/studio?topicId=BP-TOP-001&subtopicId=BP-SUB-0001')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Launch in Studio</span>
              </button>
            </div>
          </div>

          {/* Difficulty & Language Distribution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Difficulty Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                Global Difficulty Distribution
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-emerald-400 font-medium">Easy ({coverage.byDifficulty.easy} Qs)</span>
                    <span className="text-slate-400">{coverage.byDifficulty.easyPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${coverage.byDifficulty.easyPercentage}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-400 font-medium">Medium ({coverage.byDifficulty.medium} Qs)</span>
                    <span className="text-slate-400">{coverage.byDifficulty.mediumPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${coverage.byDifficulty.mediumPercentage}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-400 font-medium">Hard ({coverage.byDifficulty.hard} Qs)</span>
                    <span className="text-slate-400">{coverage.byDifficulty.hardPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${coverage.byDifficulty.hardPercentage}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Language & Production Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Language & Lifecycle Status
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">English Medium</span>
                  <span className="text-lg font-bold text-white">{coverage.byLanguage.english} questions</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Telugu Medium</span>
                  <span className="text-lg font-bold text-indigo-300">{coverage.byLanguage.telugu} questions</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-800/80">
                <span>Draft: <strong className="text-slate-200">{coverage.byStatus.draft}</strong></span>
                <span>Generated: <strong className="text-slate-200">{coverage.byStatus.generated}</strong></span>
                <span>Editing: <strong className="text-amber-300">{coverage.byStatus.editing}</strong></span>
                <span>Approved: <strong className="text-emerald-400">{coverage.byStatus.approved}</strong></span>
              </div>
            </div>
          </div>

          {/* Hierarchical Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Topic & Subtopic Coverage Matrix</h3>
                <p className="text-xs text-slate-400">Click any topic to expand its subtopics.</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {coverage.coveredSubtopicsCount} of {coverage.totalSubtopics} Subtopics Covered ({coverage.overallTaxonomyCoveragePercentage}%)
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {coverage.categories.flatMap((c) => c.topics).map((top) => {
                const isExpanded = expandedTopicId === top.topicId;
                return (
                  <div key={top.topicId} className="bg-slate-900">
                    <button
                      onClick={() => setExpandedTopicId(isExpanded ? null : top.topicId)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0 bg-indigo-500" />
                        <div>
                          <span className="text-base font-semibold text-white">{top.topicName}</span>
                          <span className="text-xs text-slate-400 block">
                            {top.subtopicsCount} Subtopics • {top.totalQuestions} Questions
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <span className="text-xs text-slate-400">Subtopic Coverage</span>
                          <span className="text-sm font-bold text-slate-200 block">
                            {top.activeSubtopicsCount}/{top.subtopicsCount} ({top.coveragePercentage}%)
                          </span>
                        </div>
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="bg-slate-950 p-4 border-t border-slate-800">
                        {/* Subtopics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {top.subtopics.map((sub) => (
                            <div
                              key={sub.subtopicId}
                              className={`p-2.5 rounded border text-xs flex flex-col justify-between ${
                                sub.isZeroCoverage
                                  ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                                  : sub.isLowCoverage
                                  ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <span className="font-semibold text-slate-200">{sub.subtopicName}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                                    sub.isZeroCoverage
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-indigo-500/20 text-indigo-300'
                                  }`}
                                >
                                  {sub.totalQuestions} Qs
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                                <span>E:{sub.byDifficulty.easy} M:{sub.byDifficulty.medium} H:{sub.byDifficulty.hard}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => navigate(`/studio?topicId=${top.topicId}&subtopicId=${sub.subtopicId}`)}
                                    className="text-slate-400 hover:text-white font-medium flex items-center gap-0.5 cursor-pointer"
                                    title="Launch Studio Editor for this Subtopic"
                                  >
                                    <Wand2 className="w-3 h-3 text-indigo-400" />
                                    <span>Studio</span>
                                  </button>
                                  {sub.isZeroCoverage && (
                                    <button
                                      onClick={() => handleQuickCreatePlanForGap(sub.subtopicId)}
                                      className="text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
                                    >
                                      + Plan
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* TAB 4: CURRICULUM GAP ANALYSIS                                               */}
      {/* ============================================================================ */}
      {activeTab === 'gaps' && gaps && (
        <div className="space-y-6">
          {/* Zero-Coverage Critical Gaps */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Zero-Coverage Subtopics (Critical Priority)</h3>
              </div>
              <span className="bg-rose-500/20 text-rose-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-rose-500/30">
                {gaps.zeroCoverageSubtopics.length} Gaps
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              These subtopics currently have 0 approved or drafted questions in the question bank. Creating strategic plans for them ensures complete syllabus coverage for competitive exam candidates.
            </p>

            {gaps.zeroCoverageSubtopics.length === 0 ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Zero-Coverage Gaps Cleared! Every subtopic has at least one question.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {gaps.zeroCoverageSubtopics.map((gap) => (
                  <div
                    key={gap.subtopicId}
                    className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs text-slate-500 block mb-0.5">{gap.topicName}</span>
                      <h4 className="text-sm font-bold text-white mb-2">{gap.subtopicName}</h4>
                    </div>

                    <button
                      onClick={() => handleQuickCreatePlanForGap(gap.subtopicId)}
                      className="w-full mt-2 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded border border-indigo-500/30 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Plan for this Gap
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty & Language Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                Difficulty Tier Imbalances
              </h3>
              {gaps.difficultyGaps.length === 0 ? (
                <p className="text-xs text-emerald-400">All active topics maintain healthy Easy, Medium, and Hard distributions.</p>
              ) : (
                <div className="space-y-2.5">
                  {gaps.difficultyGaps.map((dg, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{dg.topicName}</span>
                        <span className="text-rose-400 font-mono">Missing: {dg.missingDifficulties.join(', ')}</span>
                      </div>
                      <p className="text-slate-400">{dg.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Concentration Risks */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Topic Concentration Risks
              </h3>
              {gaps.concentrationRisks.length === 0 ? (
                <p className="text-xs text-emerald-400">No single topic monopolizes the question repository disproportionately.</p>
              ) : (
                <div className="space-y-2.5">
                  {gaps.concentrationRisks.map((cr, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{cr.topicName}</span>
                        <span className="text-amber-400 font-bold">{cr.percentageOfTotal}% of total repository</span>
                      </div>
                      <p className="text-slate-400">{cr.warning}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* TAB 5: SIMILARITY & DIVERSITY RADAR                                          */}
      {/* ============================================================================ */}
      {activeTab === 'radar' && radar && (
        <div className="space-y-6">
          {/* Health Score Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center w-20 h-20 bg-slate-950 rounded-full border-4 border-indigo-500/30">
                <span className="text-2xl font-black text-white">{radar.healthScore}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Question Bank Diversity & Uniqueness Health</h3>
                <p className="text-xs text-slate-400 max-w-lg mt-0.5">
                  Scanned {radar.scannedQuestionsCount} questions for deterministic duplicates, high token Jaccard overlap, and difficulty skews.
                </p>
              </div>
            </div>

            <div className="flex gap-4 text-center">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Exact Duplicates</span>
                <span className="text-xl font-bold text-rose-400">{radar.exactDuplicatesCount}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">High Similarity Pairs</span>
                <span className="text-xl font-bold text-amber-400">{radar.highSimilarityMatchesCount}</span>
              </div>
            </div>
          </div>

          {/* Live Similarity Testing Scratchpad */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              Live Candidate Similarity Check
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Paste or draft question text below to test in real-time against the entire question bank before creating or approving.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Paste candidate question text here to check for duplicate wording or overlap..."
                rows={2}
                className="flex-1 bg-slate-950 text-slate-200 text-xs p-3 rounded-lg border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleCheckScratchpadSimilarity}
                disabled={isCheckingScratchpad || !scratchpadText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shrink-0 flex items-center justify-center gap-2"
              >
                {isCheckingScratchpad ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Check Overlap
              </button>
            </div>

            {scratchpadMatches.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-xs font-bold text-slate-300">Detected Matches ({scratchpadMatches.length}):</span>
                {scratchpadMatches.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs ${
                      m.type === 'EXACT_DUPLICATE'
                        ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                        : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{m.type} • Overlap: {Math.round(m.similarityScore * 100)}%</span>
                      <span className="font-mono text-[10px] text-slate-400">Match with {m.matchedQuestionId}</span>
                    </div>
                    <p className="italic text-slate-300">"{m.matchedText}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Warnings & Clusters */}
          {radar.diversityWarnings.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Active Diversity Alerts & Recommendations
              </h3>
              <div className="space-y-3">
                {radar.diversityWarnings.map((w, idx) => (
                  <div key={idx} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{w.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          w.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {w.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-1">{w.description}</p>
                    <p className="text-indigo-400 italic">Recommendation: {w.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================================ */}
      {/* TAB 6: AI PLANNING ASSISTANT (GEMINI)                                        */}
      {/* ============================================================================ */}
      {activeTab === 'ai-assistant' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Gemini AI Pedagogical Content Planner</h2>
            </div>
            <p className="text-xs text-slate-400 mb-6 max-w-3xl">
              Generates mathematically balanced curriculum distribution proposals based on existing zero-coverage gaps.
              <strong className="text-slate-200 block mt-1">
                Human Authority Guardrail: AI recommendations are strictly advisory. No plans or batches are activated until explicitly approved by the administrator.
              </strong>
            </p>

            <form onSubmit={handleGenerateAiRecommendation} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Topic *</label>
                <select
                  required
                  value={aiForm.topicId}
                  onChange={(e) => {
                    const tId = e.target.value;
                    setAiForm({
                      ...aiForm,
                      topicId: tId,
                    });
                  }}
                  className="w-full bg-slate-950 text-slate-200 text-xs p-2.5 rounded-lg border border-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Topic</option>
                  {availableTopicsForAi.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Sprint Count</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={aiForm.targetTotalCount}
                  onChange={(e) => setAiForm({ ...aiForm, targetTotalCount: parseInt(e.target.value, 10) || 20 })}
                  className="w-full bg-slate-950 text-slate-200 text-xs p-2.5 rounded-lg border border-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isGeneratingAiPlan || !aiForm.topicId}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGeneratingAiPlan ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate AI Plan
                </button>
              </div>
            </form>
          </div>

          {/* AI Recommendation Output Card */}
          {aiRecommendation && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-6 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide block">Advisory AI Curriculum Proposal</span>
                  <h3 className="text-xl font-bold text-white">{aiRecommendation.categoryName} Curriculum Blueprint</h3>
                </div>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 font-semibold">
                  Target: {aiRecommendation.targetTotalCount} Questions
                </span>
              </div>

              {/* Rationale */}
              <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 mb-1">Pedagogical Strategy & Justification:</h4>
                <p className="text-xs text-slate-400">{aiRecommendation.pedagogicalRationale}</p>
              </div>

              {/* Recommended Subtopic Distributions */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3">Recommended Subtopic Allocation:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aiRecommendation.recommendedDistribution.map((sub, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="text-sm font-bold text-slate-200">{sub.subtopicName}</h5>
                          <span className="text-xs font-bold text-indigo-400">{sub.recommendedCount} Questions</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{sub.rationale}</p>
                        <div className="flex gap-2 text-[10px] text-slate-400 mb-2">
                          <span className="bg-slate-900 px-2 py-0.5 rounded">Easy: {sub.difficultyBreakdown.easy}</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded">Med: {sub.difficultyBreakdown.medium}</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded">Hard: {sub.difficultyBreakdown.hard}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyAiSubtopicAsPlan(sub)}
                        className="w-full mt-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded border border-indigo-500/30 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Create Draft Plan for this Subtopic
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Production Batches */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3">Suggested Production Sprint Groupings:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiRecommendation.suggestedBatchGrouping.map((batch, idx) => (
                    <div key={idx} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-200">{batch.batchName}</span>
                        <span className="text-xs text-indigo-400 font-bold">{batch.targetCount} Qs</span>
                      </div>
                      <p className="text-xs text-slate-400">{batch.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================================ */}
      {/* MODAL: CREATE CONTENT PLAN                                                  */}
      {/* ============================================================================ */}
      {isCreatePlanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Create New Content Plan</h3>
              <button onClick={() => setIsCreatePlanOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Topic *</label>
                  <select
                    required
                    value={planForm.topicId}
                    onChange={(e) => {
                      const tId = e.target.value;
                      setPlanForm({
                        ...planForm,
                        topicId: tId,
                        subtopicId: '',
                      });
                    }}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                  >
                    <option value="">Select Topic</option>
                    {availableTopicsForPlan.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Subtopic *</label>
                  <select
                    required
                    disabled={!planForm.topicId}
                    value={planForm.subtopicId}
                    onChange={(e) => setPlanForm({ ...planForm, subtopicId: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800 disabled:opacity-50"
                  >
                    <option value="">Select Subtopic</option>
                    {availableSubtopicsForPlan.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Target Count *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={planForm.targetQuestionCount}
                    onChange={(e) => setPlanForm({ ...planForm, targetQuestionCount: parseInt(e.target.value, 10) || 10 })}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Difficulty</label>
                  <select
                    value={planForm.difficulty}
                    onChange={(e) => setPlanForm({ ...planForm, difficulty: e.target.value as DifficultyLevel })}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                  >
                    <option value={DifficultyLevel.EASY}>Easy</option>
                    <option value={DifficultyLevel.MEDIUM}>Medium</option>
                    <option value={DifficultyLevel.HARD}>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Language</label>
                  <select
                    value={planForm.language}
                    onChange={(e) => setPlanForm({ ...planForm, language: e.target.value as QuestionLanguage })}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                  >
                    <option value={QuestionLanguage.ENGLISH}>English</option>
                    <option value={QuestionLanguage.TELUGU}>Telugu</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Priority</label>
                  <select
                    value={planForm.priority}
                    onChange={(e) => setPlanForm({ ...planForm, priority: e.target.value as PriorityLevel })}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                  >
                    <option value={PriorityLevel.LOW}>Low</option>
                    <option value={PriorityLevel.NORMAL}>Normal</option>
                    <option value={PriorityLevel.HIGH}>High</option>
                    <option value={PriorityLevel.URGENT}>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Real-World Scenario / Context</label>
                <input
                  type="text"
                  placeholder="e.g. Cinema ticket discounts, metro journey times"
                  value={planForm.realWorldContext}
                  onChange={(e) => setPlanForm({ ...planForm, realWorldContext: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Notes & Strategic Guidance</label>
                <textarea
                  rows={2}
                  value={planForm.notes}
                  onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatePlanOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-medium rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-500"
                >
                  Save Draft Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* MODAL: CREATE PRODUCTION BATCH                                              */}
      {/* ============================================================================ */}
      {isCreateBatchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Create Production Batch</h3>
              <button onClick={() => setIsCreateBatchOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ratio & Proportion Sprint A"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Associated Content Plan *</label>
                <select
                  required
                  value={batchForm.planId}
                  onChange={(e) => setBatchForm({ ...batchForm, planId: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                >
                  <option value="">Select Content Plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} — {p.topicName} ({p.subtopicName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Target Count *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={batchForm.targetCount}
                    onChange={(e) => setBatchForm({ ...batchForm, targetCount: parseInt(e.target.value, 10) || 10 })}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Priority</label>
                  <select
                    value={batchForm.priority}
                    onChange={(e) => setBatchForm({ ...batchForm, priority: e.target.value as PriorityLevel })}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                  >
                    <option value={PriorityLevel.LOW}>Low</option>
                    <option value={PriorityLevel.NORMAL}>Normal</option>
                    <option value={PriorityLevel.HIGH}>High</option>
                    <option value={PriorityLevel.URGENT}>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Sprint goals, assigned editors, filming priority"
                  value={batchForm.description}
                  onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })}
                  className="w-full bg-slate-950 text-slate-200 p-2 rounded border border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateBatchOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-medium rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-500"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* MODAL: LINK QUESTIONS TO BATCH                                              */}
      {/* ============================================================================ */}
      {isLinkQuestionsOpen && selectedBatchForLinking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Manage Questions for {selectedBatchForLinking.name}</h3>
                <span className="text-xs text-indigo-400 font-mono">{selectedBatchForLinking.id}</span>
              </div>
              <button onClick={() => setIsLinkQuestionsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
              <Search className="w-4 h-4 text-slate-400 ml-1" />
              <input
                type="text"
                placeholder="Search question bank by keyword, subtopic, or ID..."
                value={questionSearchQuery}
                onChange={(e) => setQuestionSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 focus:outline-hidden"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
              {allQuestions
                .filter((q) => {
                  if (!questionSearchQuery) return true;
                  const query = questionSearchQuery.toLowerCase();
                  return (
                    (q.id || '').toLowerCase().includes(query) ||
                    q.questionText?.toLowerCase().includes(query) ||
                    q.subtopicName?.toLowerCase().includes(query) ||
                    q.topicName?.toLowerCase().includes(query)
                  );
                })
                .map((q) => {
                  const isSelected = selectedQuestionIdsToLink.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedQuestionIdsToLink(selectedQuestionIdsToLink.filter((id) => id !== q.id));
                        } else {
                          setSelectedQuestionIdsToLink([...selectedQuestionIdsToLink, q.id]);
                        }
                      }}
                      className={`p-3 rounded-lg text-xs cursor-pointer transition-colors flex items-start gap-3 ${
                        isSelected ? 'bg-indigo-950/40 border border-indigo-600/50' : 'bg-slate-950/60 border border-slate-800 hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-700 text-indigo-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-indigo-400">{q.id}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-300">{q.difficulty}</span>
                            <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-300">{q.status}</span>
                          </div>
                        </div>
                        <p className="text-slate-300 line-clamp-2">{q.questionText}</p>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Selected: <strong className="text-slate-200">{selectedQuestionIdsToLink.length}</strong> / {selectedBatchForLinking.targetCount} Target
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsLinkQuestionsOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-300 font-medium rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBatchQuestions}
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-500"
                >
                  Save Linked Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* MODAL: PLAN DETAILS & LIFECYCLE MANAGEMENT                                   */}
      {/* ============================================================================ */}
      {selectedPlanForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                    {selectedPlanForDetails.id}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      selectedPlanForDetails.status === ContentPlanStatus.APPROVED
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedPlanForDetails.status === ContentPlanStatus.IN_PROGRESS
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : selectedPlanForDetails.status === ContentPlanStatus.COMPLETED
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : selectedPlanForDetails.status === ContentPlanStatus.CANCELLED
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {selectedPlanForDetails.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{selectedPlanForDetails.subtopicName}</h2>
                <span className="text-xs text-slate-400">
                  {selectedPlanForDetails.topicName}
                </span>
              </div>
              <button
                onClick={() => setSelectedPlanForDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Progress and Quotas */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Target Completion Progress:</span>
                  <span className="font-bold text-slate-100">
                    {selectedPlanForDetails.currentQuestionCount || 0} / {selectedPlanForDetails.targetQuestionCount} Questions ({selectedPlanForDetails.completionPercentage || 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, selectedPlanForDetails.completionPercentage || 0)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Remaining to Quota: <strong className="text-amber-300">{selectedPlanForDetails.remainingQuestionCount || 0}</strong></span>
                  <span>Batches Created: <strong className="text-slate-200">{selectedPlanForDetails.createdBatchesCount || 0}</strong></span>
                </div>
              </div>

              {/* Strategic Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 block">Difficulty</span>
                  <span className="font-semibold text-slate-200">{selectedPlanForDetails.difficulty}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Language</span>
                  <span className="font-semibold text-slate-200">{selectedPlanForDetails.language}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Priority</span>
                  <span className="font-semibold text-slate-200">{selectedPlanForDetails.priority}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Target Due Date</span>
                  <span className="font-semibold text-slate-200">{selectedPlanForDetails.plannedDate || 'Unscheduled'}</span>
                </div>
              </div>

              {/* Real World Scenario */}
              {selectedPlanForDetails.realWorldContext && (
                <div className="bg-indigo-950/20 p-3 rounded-lg border border-indigo-800/40 space-y-1">
                  <span className="font-semibold text-indigo-300 block">Real-World Scenario / Context:</span>
                  <p className="text-slate-300 leading-relaxed">{selectedPlanForDetails.realWorldContext}</p>
                </div>
              )}

              {/* Notes */}
              {selectedPlanForDetails.notes && (
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="font-semibold text-slate-400 block">Notes & Strategic Guidance:</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedPlanForDetails.notes}</p>
                </div>
              )}

              {/* Lifecycle State Transitions */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block">Manage Status Lifecycle</span>
                <p className="text-[11px] text-slate-400">
                  Transition this plan along the editorial pipeline (Draft → Approved → In Progress → Completed):
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedPlanForDetails.status === ContentPlanStatus.DRAFT && (
                    <>
                      <button
                        onClick={() => handleTransitionPlanStatus(selectedPlanForDetails.id, ContentPlanStatus.APPROVED)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Plan
                      </button>
                      <button
                        onClick={() => handleTransitionPlanStatus(selectedPlanForDetails.id, ContentPlanStatus.CANCELLED)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 font-medium rounded text-xs"
                      >
                        Cancel Plan
                      </button>
                    </>
                  )}

                  {selectedPlanForDetails.status === ContentPlanStatus.APPROVED && (
                    <>
                      <button
                        onClick={() => handleTransitionPlanStatus(selectedPlanForDetails.id, ContentPlanStatus.IN_PROGRESS)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded text-xs flex items-center gap-1.5"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        Start Production (In Progress)
                      </button>
                      <button
                        onClick={() => handleTransitionPlanStatus(selectedPlanForDetails.id, ContentPlanStatus.DRAFT)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded text-xs"
                      >
                        Revert to Draft
                      </button>
                    </>
                  )}

                  {selectedPlanForDetails.status === ContentPlanStatus.IN_PROGRESS && (
                    <>
                      <button
                        onClick={() => handleTransitionPlanStatus(selectedPlanForDetails.id, ContentPlanStatus.COMPLETED)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Completed
                      </button>
                      <button
                        onClick={() => handleTransitionPlanStatus(selectedPlanForDetails.id, ContentPlanStatus.APPROVED)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded text-xs"
                      >
                        Revert to Approved
                      </button>
                    </>
                  )}

                  {(selectedPlanForDetails.status === ContentPlanStatus.COMPLETED ||
                    selectedPlanForDetails.status === ContentPlanStatus.CANCELLED) && (
                    <button
                      onClick={() => handleTransitionPlanStatus(selectedPlanForDetails.id, ContentPlanStatus.DRAFT)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded text-xs"
                    >
                      Reopen as Draft
                    </button>
                  )}
                </div>
              </div>

              {/* Linked Production Batches for this Plan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">
                    Associated Batches ({batches.filter((b) => b.batch.planId === selectedPlanForDetails.id).length})
                  </span>
                  <button
                    onClick={() => {
                      setBatchForm({
                        ...batchForm,
                        planId: selectedPlanForDetails.id,
                        name: `${selectedPlanForDetails.topicName} - Sprint ${ (selectedPlanForDetails.createdBatchesCount || 0) + 1}`,
                        targetCount: Math.min(10, selectedPlanForDetails.remainingQuestionCount || 10),
                      });
                      setSelectedPlanForDetails(null);
                      setIsCreateBatchOpen(true);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Batch for this Plan
                  </button>
                </div>

                {batches.filter((b) => b.batch.planId === selectedPlanForDetails.id).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No production batches have been created for this plan yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {batches
                      .filter((b) => b.batch.planId === selectedPlanForDetails.id)
                      .map(({ batch, metrics }) => (
                        <div
                          key={batch.id}
                          className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-indigo-400 font-bold">{batch.id}</span>
                              <span className="font-bold text-white">{batch.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Status: {batch.status} | Approved: {metrics.approved}/{batch.targetCount}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPlanForDetails(null);
                              setActiveTab('batches');
                            }}
                            className="text-slate-400 hover:text-white text-xs underline"
                          >
                            View in Batches
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Quick Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => handleDeletePlan(selectedPlanForDetails.id)}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Plan
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPlanForDetails(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 font-medium rounded hover:bg-slate-700"
                >
                  Close
                </button>
                <button
                  onClick={() => handleGoToQuestionGenerator(selectedPlanForDetails)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded flex items-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
