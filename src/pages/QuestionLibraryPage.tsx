import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles, RotateCcw, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/common/SearchInput';
import { QuestionTable } from '../components/questions/QuestionTable';
import { EmptyState } from '../components/common/EmptyState';
import { DifficultyLevel, Question, QuestionStatus, VideoProductionStatus } from '../types';
import { apiClient } from '../lib/api-client';

export const QuestionLibraryPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [taxonomyTree, setTaxonomyTree] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedQuestionStatus, setSelectedQuestionStatus] = useState('');
  const [selectedVideoStatus, setSelectedVideoStatus] = useState('');

  // Load taxonomy once
  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const tree = await apiClient.getTaxonomyTree();
        setTaxonomyTree(tree);
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
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
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
    search,
    selectedCategory,
    selectedTopic,
    selectedSubtopic,
    selectedDifficulty,
    selectedQuestionStatus,
    selectedVideoStatus,
  ]);

  // Derived taxonomy options based on selection
  const currentCategory = taxonomyTree.find((c) => c.id === selectedCategory);
  const availableTopics = currentCategory
    ? currentCategory.topics
    : taxonomyTree.flatMap((c) => c.topics || []);
  const currentTopic = availableTopics.find((t: any) => t.id === selectedTopic);
  const availableSubtopics = currentTopic ? currentTopic.subtopics : [];

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setSelectedDifficulty('');
    setSelectedQuestionStatus('');
    setSelectedVideoStatus('');
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedCategory) ||
    Boolean(selectedTopic) ||
    Boolean(selectedSubtopic) ||
    Boolean(selectedDifficulty) ||
    Boolean(selectedQuestionStatus) ||
    Boolean(selectedVideoStatus);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <PageHeader
        title="Question Library"
        description="Master repository of aptitude questions, solution scripts, and video production assignments."
        badge={
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {questions.length} Questions
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
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
            <Link to="/generate">
              <Button variant="primary" size="sm" icon={Sparkles}>
                AI Question Studio
              </Button>
            </Link>
            <Link to="/questions/new">
              <Button variant="secondary" size="sm" icon={Plus}>
                New Question
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Search & Top Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <SearchInput
            id="question-search-bar"
            value={search}
            onChange={setSearch}
            placeholder="Search by question text, formula, tag, ID..."
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedTopic('');
                setSelectedSubtopic('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {taxonomyTree.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setSelectedSubtopic('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Topics</option>
              {availableTopics.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subtopic Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subtopic</label>
            <select
              value={selectedSubtopic}
              onChange={(e) => setSelectedSubtopic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Subtopics</option>
              {availableSubtopics.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              onChange={(e) => setSelectedQuestionStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              onChange={(e) => setSelectedVideoStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          description="Try adjusting your keyword search or resetting category and status filters."
          actionLabel="Clear All Filters"
          onAction={resetFilters}
        />
      ) : (
        <QuestionTable questions={questions} />
      )}
    </div>
  );
};
