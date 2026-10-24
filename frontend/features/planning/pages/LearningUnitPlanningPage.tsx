/**
 * BURRA PARIKSHA CMS — Learning Unit Planning Page
 * Location: frontend/features/planning/pages/LearningUnitPlanningPage.tsx
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * (Section 6: The Central Asset: A Verified Learning Unit; Section 7: Proposed Content-Planning Model)
 * Task: S11-T04 Learning Unit Planning Workspace UI
 *
 * Provides:
 * 1. Overview and filtering of verified learning units and planning drafts.
 * 2. Dedicated interactive planning workspace for new and existing learning units.
 * 3. Deep-linking support via URL route parameters (/planning/learning-units/:id).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  AudienceContext,
  LearningUnitPlanningDto,
  LearningUnitPlanningStatus,
  SkillLevel,
  AUDIENCE_CONTEXTS,
  AUDIENCE_CONTEXT_METADATA,
  SKILL_LEVELS,
  SKILL_LEVEL_METADATA,
} from '../../../../shared';
import { learningUnitsApi } from '../../../api';
import { LearningUnitWorkspace } from '../components/LearningUnitWorkspace';

export const LearningUnitPlanningPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [units, setUnits] = useState<LearningUnitPlanningDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>('');
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Mode: list vs workspace
  const isEditing = Boolean(id);

  // Load existing units
  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filter: Record<string, string> = {};
      if (searchTerm.trim()) filter.search = searchTerm.trim();
      if (selectedSkillLevel) filter.skillLevel = selectedSkillLevel;
      if (selectedAudience) filter.audienceContext = selectedAudience;
      const data = await learningUnitsApi.list(filter);
      setUnits(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load learning units.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedSkillLevel, selectedAudience]);

  useEffect(() => {
    if (!isEditing) {
      fetchUnits();
    }
  }, [isEditing, fetchUnits]);

  // Filtered in memory for instant responsiveness
  const filteredUnits = units.filter((u) => {
    if (selectedStatus && u.planningStatus !== selectedStatus) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = u.title.toLowerCase().includes(term);
      const matchTopic = u.topicName?.toLowerCase().includes(term);
      const matchSubtopic = u.subtopicName?.toLowerCase().includes(term);
      if (!matchTitle && !matchTopic && !matchSubtopic) return false;
    }
    return true;
  });

  return (
    <div id="learning-unit-planning-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <button
              type="button"
              id="btn-back-to-list"
              onClick={() => navigate('/planning/learning-units')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Learning Units</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-indigo-600/20 border border-indigo-500/30 p-2 text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Learning Unit Hub
                </h1>
                <p className="text-xs text-slate-400">
                  Plan, verify, and govern core curriculum lessons across all production modes.
                </p>
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            <Link
              to="/planning/learning-units/new"
              id="btn-create-learning-unit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              <span>Create Learning Unit</span>
            </Link>
          </div>
        )}
      </div>

      {/* Main View: Workspace Editor or List View */}
      {isEditing ? (
        <div className="animate-in fade-in duration-200">
          <LearningUnitWorkspace
            initialUnitId={id === 'new' ? undefined : id}
            onSuccess={(newId) => {
              navigate(`/planning/learning-units/${newId}`);
            }}
          />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                id="filter-search-units"
                type="text"
                placeholder="Search by title, topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Skill Level Filter */}
            <div>
              <select
                id="filter-skill-level"
                value={selectedSkillLevel}
                onChange={(e) => setSelectedSkillLevel(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Skill Levels</option>
                {SKILL_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {SKILL_LEVEL_METADATA[lvl].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Audience Context Filter */}
            <div>
              <select
                id="filter-audience-context"
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Audiences</option>
                {AUDIENCE_CONTEXTS.map((aud) => (
                  <option key={aud} value={aud}>
                    {AUDIENCE_CONTEXT_METADATA[aud].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                id="filter-planning-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Planning Statuses</option>
                <option value="DRAFT">Planning Drafts</option>
                <option value="SUBMITTED_FOR_VERIFICATION">Submitted for Verification</option>
              </select>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-800/60 bg-rose-950/50 p-3 text-xs text-rose-200">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cards Grid / List */}
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                <span className="text-xs">Loading verified learning units...</span>
              </div>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/20 text-center p-6">
              <BookOpen className="h-10 w-10 text-slate-600 mb-2" />
              <h3 className="text-sm font-semibold text-slate-300">No Learning Units Found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Get started by creating your first verified learning unit to link curriculum concepts to questions and videos.
              </p>
              <Link
                to="/planning/learning-units/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Unit</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUnits.map((unit) => {
                const isSub = unit.planningStatus === 'SUBMITTED_FOR_VERIFICATION';
                const skillMeta = SKILL_LEVEL_METADATA[unit.skillLevel];
                const audMeta = unit.audienceContext ? AUDIENCE_CONTEXT_METADATA[unit.audienceContext] : null;

                return (
                  <Link
                    key={unit.id}
                    to={`/planning/learning-units/${unit.id}`}
                    className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition-all hover:border-slate-700 hover:bg-slate-800/80 hover:shadow-md"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <span className="inline-flex items-center rounded bg-indigo-950/80 border border-indigo-800/40 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                          {unit.topicName || 'Topic'}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isSub
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isSub ? 'Submitted' : 'Draft'}
                        </span>
                      </div>

                      {/* Title & Subtopic */}
                      <div className="mt-3">
                        <h2 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 line-clamp-2">
                          {unit.title}
                        </h2>
                        {unit.subtopicName && (
                          <p className="mt-0.5 text-xs text-slate-400 truncate">
                            {unit.subtopicName}
                          </p>
                        )}
                      </div>

                      {/* Learning Objective Excerpt */}
                      <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {unit.learningObjective}
                      </p>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-4 border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-emerald-400">
                          {skillMeta?.label || unit.skillLevel}
                        </span>
                        {audMeta && <span>• {audMeta.label}</span>}
                      </div>
                      <span className="font-mono">v{unit.version}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
