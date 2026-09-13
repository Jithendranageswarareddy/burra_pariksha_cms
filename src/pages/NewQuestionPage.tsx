import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { apiClient } from '../lib/api-client';
import { DifficultyLevel, QuestionStatus, QuestionStyle, VideoProductionStatus } from '../types';
import { QUESTION_CREATION_CONFIG } from '../config/question-creation.config';

export const NewQuestionPage: React.FC = () => {
  const navigate = useNavigate();

  // Taxonomy tree state
  const [taxonomyTree, setTaxonomyTree] = useState<any[]>([]);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(true);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [difficulty, setDifficulty] = useState<string>('Intermediate');
  const [challengeType, setChallengeType] = useState<string>('ABCD');
  const [presentationType, setPresentationType] = useState<string>('Text');
  const [language, setLanguage] = useState<string>('TELUGU');
  const [realLifeContext, setRealLifeContext] = useState<string>('Shopping & E-commerce');
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [explanation, setExplanation] = useState('');
  const [tags, setTags] = useState('Aptitude, SpeedMath, CompetitiveExams');

  // Config data from API
  const [config, setConfig] = useState<any>(null);

  // Submit / Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successQuestionId, setSuccessQuestionId] = useState<string | null>(null);

  // Duplicate Detection State
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Load config & taxonomy tree
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tree, configData] = await Promise.all([
          apiClient.getTaxonomyTree().catch(() => []),
          apiClient.getQuestionCreationConfig().catch(() => null),
        ]);
        setTaxonomyTree(tree);
        if (configData) setConfig(configData);

        if (tree.length > 0) {
          const firstCat = tree[0];
          setCategoryId(firstCat.id);
          if (firstCat.topics?.length > 0) {
            const firstTop = firstCat.topics[0];
            setTopicId(firstTop.id);
            if (firstTop.subtopics?.length > 0) {
              setSubtopicId(firstTop.subtopics[0].id);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to load initial page data:', err);
      } finally {
        setIsLoadingTaxonomy(false);
      }
    };
    loadData();
  }, []);

  const currentCategory = taxonomyTree.find((c) => c.id === categoryId);
  const availableTopics = currentCategory?.topics || [];
  const currentTopic = availableTopics.find((t: any) => t.id === topicId);
  const availableSubtopics = currentTopic?.subtopics || [];

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    const cat = taxonomyTree.find((c) => c.id === newCatId);
    if (cat && cat.topics?.length > 0) {
      const top = cat.topics[0];
      setTopicId(top.id);
      if (top.subtopics?.length > 0) {
        setSubtopicId(top.subtopics[0].id);
      } else {
        setSubtopicId('');
      }
    } else {
      setTopicId('');
      setSubtopicId('');
    }
  };

  const handleTopicChange = (newTopicId: string) => {
    setTopicId(newTopicId);
    const top = availableTopics.find((t: any) => t.id === newTopicId);
    if (top && top.subtopics?.length > 0) {
      setSubtopicId(top.subtopics[0].id);
    } else {
      setSubtopicId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const idempotencyKey = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const created = await apiClient.createQuestionCanonical({
        creationMode: 'manual',
        categoryId,
        topicId,
        subtopicId,
        difficulty,
        challengeType,
        presentationType,
        language,
        realLifeContext,
        questionText: questionText.trim(),
        options: {
          a: optA.trim(),
          b: optB.trim(),
          c: optC.trim(),
          d: optD.trim(),
        },
        correctAnswer,
        explanation: explanation.trim(),
        tags: parsedTags,
        idempotencyKey,
      });

      setSuccessQuestionId(created.id);
      setTimeout(() => {
        navigate(`/questions/${created.id}`);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save question to Google Sheets database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Link
          to="/questions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Question Library</span>
        </Link>
        <Link to="/generate">
          <Button variant="outline" size="sm" icon={Sparkles}>
            Switch to AI Question Studio
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Author New Question"
        description="Compose an aptitude problem, 4 options, and step-by-step speed calculation solution. Automatically persisted to the QUESTIONS sheet with permanent sequence ID allocation."
      />

      {successQuestionId && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Question saved successfully with Permanent ID <strong className="font-mono">{successQuestionId}</strong>. Redirecting...
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Persistence / Validation Error</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Taxonomy Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={isLoadingTaxonomy}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              {taxonomyTree.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Topic <span className="text-rose-500">*</span>
            </label>
            <select
              value={topicId}
              onChange={(e) => handleTopicChange(e.target.value)}
              disabled={isLoadingTaxonomy || availableTopics.length === 0}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              {availableTopics.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subtopic <span className="text-rose-500">*</span>
            </label>
            <select
              value={subtopicId}
              onChange={(e) => setSubtopicId(e.target.value)}
              disabled={isLoadingTaxonomy || availableSubtopics.length === 0}
              required
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

        {/* Difficulty & Challenge Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {(config?.difficulties || QUESTION_CREATION_CONFIG.difficulties).map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.label || d.name || d.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Challenge Type</label>
            <select
              value={challengeType}
              onChange={(e) => setChallengeType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {(config?.challengeTypes || QUESTION_CREATION_CONFIG.challengeTypes).map((ct: any) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name || ct.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Presentation Type</label>
            <select
              value={presentationType}
              onChange={(e) => setPresentationType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {(config?.presentationTypes || QUESTION_CREATION_CONFIG.presentationTypes).map((pt: any) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name || pt.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ENGLISH">English</option>
              <option value="TELUGU">Telugu (తెలుగు)</option>
            </select>
          </div>
        </div>

        {/* Question Statement */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Question Statement <span className="text-rose-500">*</span>
            </label>
            {isCheckingDuplicate && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking for duplicates...
              </span>
            )}
          </div>
          <textarea
            rows={3}
            required
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type the complete aptitude question statement with numbers, units, and clear condition..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Duplicate Detection Warning Banner */}
        {duplicateMatches.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Duplicate Warning: {duplicateMatches.length} similar question(s) found in database</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              This is a warning to prevent accidental duplicate entries. You may still save if this is an intentional variant.
            </p>
            <div className="space-y-1.5 pt-1">
              {duplicateMatches.slice(0, 3).map((match) => (
                <div
                  key={match.questionId}
                  className="bg-white/80 p-2 rounded-lg border border-amber-200 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700">{match.questionId}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full font-semibold">
                        {Math.round(match.similarity * 100)}% match
                      </span>
                      <span className="text-[10px] text-slate-500">{match.categoryName} &bull; {match.topicName}</span>
                    </div>
                    <p className="text-slate-700 text-[11px] line-clamp-1 italic">"{match.questionText}"</p>
                  </div>
                  <Link
                    to={`/questions/${match.questionId}`}
                    target="_blank"
                    className="text-[11px] text-indigo-600 hover:underline font-medium shrink-0"
                  >
                    View &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 Options Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Options <span className="text-rose-500">*</span> (Select radio button for Correct Answer)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'A', val: optA, setVal: setOptA },
              { key: 'B', val: optB, setVal: setOptB },
              { key: 'C', val: optC, setVal: setOptC },
              { key: 'D', val: optD, setVal: setOptD },
            ].map((o) => (
              <div
                key={o.key}
                className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                  correctAnswer === o.key ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  id={`correct-opt-${o.key}`}
                  name="correctAnswer"
                  checked={correctAnswer === o.key}
                  onChange={() => setCorrectAnswer(o.key as any)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor={`correct-opt-${o.key}`} className="text-xs font-bold font-mono text-slate-700 w-4 cursor-pointer">
                  {o.key}.
                </label>
                <input
                  type="text"
                  required
                  value={o.val}
                  onChange={(e) => o.setVal(e.target.value)}
                  placeholder={`Option ${o.key} value...`}
                  className="flex-1 bg-transparent border-0 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Explanation & Solution */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Detailed Solution & Speed Math Breakdown <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Step 1: Formula definition&#10;Step 2: 30-second speed shortcut&#10;Step 3: Verification"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        {/* Metadata: Context & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Real-World Context Category</label>
            <select
              value={realLifeContext}
              onChange={(e) => setRealLifeContext(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {(config?.realLifeContexts || [
                { id: 'Shopping & E-commerce', name: 'Shopping & E-commerce' },
                { id: 'Banking & Finance', name: 'Banking & Finance' },
                { id: 'Travel & Distance', name: 'Travel & Distance' },
              ]).map((c: any) => (
                <option key={c.id || c.name} value={c.id || c.name}>
                  {c.name || c.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="CAT, Bank PO, SSC CGL, Speed Trick"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link to="/questions">
            <Button variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" size="md" icon={Save} type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving to Sheet...
              </span>
            ) : (
              'Save Question'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
