import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  RotateCcw,
  BookOpen,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Edit3,
  Film,
  Download,
  CheckCircle2,
  ListOrdered,
  Layers,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/common/SearchInput';
import { QuestionTable } from '../components/questions/QuestionTable';
import { EmptyState } from '../components/common/EmptyState';
import { QuestionWorkflowHeader } from '../components/questions/QuestionWorkflowHeader';
import { DifficultyLevel, Question, QuestionStatus, VideoProductionStatus } from '../types';
import { apiClient } from '../lib/api-client';

export const QuestionLibraryPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subtopics, setSubtopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Bulk Selection State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isBulkQueueing, setIsBulkQueueing] = useState<boolean>(false);

  // URL search parameter synchronization
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';
  const selectedTopic = searchParams.get('topicId') || '';
  const selectedSubtopic = searchParams.get('subtopicId') || '';
  const selectedDifficulty = searchParams.get('difficulty') || '';
  const selectedQuestionStatus = searchParams.get('status') || '';
  const selectedVideoStatus = searchParams.get('videoStatus') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Debounced URL sync for text search with replace: true to prevent history stack pollution
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const currentSearch = next.get('search') || next.get('q') || '';
        if (searchInput.trim() !== currentSearch) {
          if (searchInput.trim()) {
            next.set('search', searchInput.trim());
            next.delete('q');
          } else {
            next.delete('search');
            next.delete('q');
          }
          return next;
        }
        return prev;
      }, { replace: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  const updateFilter = (key: string, value: string, extraClears?: string[]) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (extraClears) {
        extraClears.forEach((k) => next.delete(k));
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('search');
      next.delete('q');
      next.delete('topicId');
      next.delete('subtopicId');
      next.delete('difficulty');
      next.delete('status');
      next.delete('videoStatus');
      return next;
    });
  };

  // Load topics & subtopics once
  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const [topicsData, subtopicsData] = await Promise.all([
          apiClient.getTopics().catch(() => []),
          apiClient.getSubtopics().catch(() => []),
        ]);
        setTopics(topicsData);
        setSubtopics(subtopicsData);
      } catch (err: any) {
        console.error('Error loading taxonomy:', err);
      }
    };
    fetchTaxonomy();
  }, []);

  // Fetch questions on filter changes or refresh
  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getQuestions({
        search: urlSearch.trim() || undefined,
        topicId: selectedTopic || undefined,
        subtopicId: selectedSubtopic || undefined,
        difficulty: selectedDifficulty ? (selectedDifficulty as DifficultyLevel) : undefined,
        status: selectedQuestionStatus ? (selectedQuestionStatus as QuestionStatus) : undefined,
        videoStatus: selectedVideoStatus ? (selectedVideoStatus as VideoProductionStatus) : undefined,
      });
      setQuestions(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load questions from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [
    urlSearch,
    selectedTopic,
    selectedSubtopic,
    selectedDifficulty,
    selectedQuestionStatus,
    selectedVideoStatus,
  ]);

  // Derived subtopics based on selected topic
  const availableSubtopics = selectedTopic
    ? subtopics.filter((s: any) => s.topicId === selectedTopic)
    : subtopics;

  const hasActiveFilters =
    Boolean(urlSearch) ||
    Boolean(selectedTopic) ||
    Boolean(selectedSubtopic) ||
    Boolean(selectedDifficulty) ||
    Boolean(selectedQuestionStatus) ||
    Boolean(selectedVideoStatus);

  // Checkbox Selection Helpers
  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedQuestionIds.length === questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(questions.map((q) => q.id));
    }
  };

  // Bulk Queue Action
  const handleBulkQueue = async () => {
    if (selectedQuestionIds.length === 0) return;
    setIsBulkQueueing(true);
    setError(null);
    try {
      let queuedCount = 0;
      for (const qId of selectedQuestionIds) {
        try {
          await apiClient.queueVideo({ questionId: qId });
          queuedCount++;
        } catch {
          // Continue with next
        }
      }
      setSuccessBanner(`Successfully queued ${queuedCount} questions for video production.`);
      setSelectedQuestionIds([]);
      loadQuestions();
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to queue selected questions.');
    } finally {
      setIsBulkQueueing(false);
    }
  };

  // Single Question Send to Queue
  const handleSendToQueue = async (q: Question) => {
    try {
      await apiClient.queueVideo({ questionId: q.id, title: q.questionText.slice(0, 50) });
      setSuccessBanner(`Question ${q.id} successfully sent to Video Production Queue.`);
      loadQuestions();
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      setError(err?.message || `Failed to queue question ${q.id}.`);
    }
  };

  // Bulk Export Action
  const handleBulkExport = () => {
    const selectedQuestions = questions.filter((q) => selectedQuestionIds.includes(q.id));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedQuestions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `burra_questions_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSuccessBanner(`Exported ${selectedQuestions.length} questions as JSON.`);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <PageHeader
        title="Question Bank"
        description="Master inventory of generated, draft, and approved aptitude questions. Filter by topic, difficulty, and stage."
        badge={
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {questions.length} Questions
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadQuestions}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/studio">
              <Button variant="primary" size="sm" icon={Sparkles}>
                + Create Question
              </Button>
            </Link>
          </div>
        }
      />

      <QuestionWorkflowHeader currentStep={2} />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button type="button" onClick={() => setSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Control Bar: 2-Tier Taxonomy Cascade */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Search & Top Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <SearchInput
            id="question-search-bar"
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search across question text, topic, subtopic ID (e.g. BP-SUB-0001)..."
            className="flex-1 w-full"
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Multi-Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* 2-Tier Tier 1: Topic */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Topic
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                updateFilter('topicId', e.target.value, ['subtopicId']);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Topics (BP-TOP-001...)</option>
              {topics.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2-Tier Tier 2: Subtopic */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Subtopic
            </label>
            <select
              value={selectedSubtopic}
              onChange={(e) => updateFilter('subtopicId', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Subtopics</option>
              {availableSubtopics.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.id}: {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => updateFilter('difficulty', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Difficulties</option>
              <option value={DifficultyLevel.EASY}>Easy</option>
              <option value={DifficultyLevel.MEDIUM}>Medium</option>
              <option value={DifficultyLevel.HARD}>Hard</option>
            </select>
          </div>

          {/* Question Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Q-Status</label>
            <select
              value={selectedQuestionStatus}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              {Object.values(QuestionStatus).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Video Production Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Video Stage</label>
            <select
              value={selectedVideoStatus}
              onChange={(e) => updateFilter('videoStatus', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Stages</option>
              {Object.values(VideoProductionStatus).map((vs) => (
                <option key={vs} value={vs}>
                  {vs}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table / Results */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Fetching questions from persistence layer...</span>
        </div>
      ) : questions.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No questions match your filters"
          description="Try adjusting your keyword search or resetting topic and status filters."
          actionLabel="Clear All Filters"
          onAction={resetFilters}
        />
      ) : (
        <QuestionTable
          questions={questions}
          selectedQuestionIds={selectedQuestionIds}
          onToggleSelectQuestion={handleToggleSelectQuestion}
          onToggleSelectAll={handleToggleSelectAll}
          onSendToQueue={handleSendToQueue}
        />
      )}

      {/* Floating Bulk Action Bar */}
      {selectedQuestionIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-6 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">
              {selectedQuestionIds.length}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Questions Selected
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBulkQueue}
              disabled={isBulkQueueing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <Film className="w-3.5 h-3.5" />
              <span>{isBulkQueueing ? 'Queueing...' : 'Queue for Video Production'}</span>
            </button>

            <button
              type="button"
              onClick={handleBulkExport}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedQuestionIds([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default QuestionLibraryPage;
