/**
 * BURRA PARIKSHA CMS - Analytics Experience Page
 * Phase 10 — Top-Level Analytics Experience & Performance Intelligence
 * 
 * Provides clean, accessible UI views for:
 * 1. Analytics Overview
 * 2. Video Performance
 * 3. Platform Performance
 * 4. Topic Performance
 * 5. Subtopic Performance
 * 6. Difficulty Performance
 * 7. Engagement & Retention
 * 8. AI Insights / Intelligence
 * 9. Content Strategy Recommendations
 * 
 * Strictly operates read-only against Phase 27/28/29 authoritative analytics APIs.
 * Preserves strict separation of concerns — separate from the 15-step production workflow.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Share2,
  BookOpen,
  Layers,
  BarChart2,
  TrendingUp,
  Sparkles,
  Target,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { apiClient } from '../lib/api-client';
import { EmptyState } from '../design-system/components/EmptyState';
import { Badge } from '../design-system/components/Badge';
import { Button } from '../design-system/components/Button';
import { Card } from '../design-system/components/Card';
import {
  ContentStrategyRecommendation,
  SocialAnalyticsRecord,
  SocialAnalyticsSummary,
  SocialPerformanceIntelligenceRecord,
} from '../types';

export type AnalyticsSection =
  | 'overview'
  | 'video'
  | 'platform'
  | 'topic'
  | 'subtopic'
  | 'difficulty'
  | 'engagement'
  | 'retention'
  | 'intelligence'
  | 'strategy';

export const AnalyticsExperiencePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active section tab based on path name
  const activeSection: AnalyticsSection = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/analytics/video')) return 'video';
    if (p.includes('/analytics/platform')) return 'platform';
    if (p.includes('/analytics/topic')) return 'topic';
    if (p.includes('/analytics/subtopic')) return 'subtopic';
    if (p.includes('/analytics/difficulty')) return 'difficulty';
    if (p.includes('/analytics/engagement')) return 'engagement';
    if (p.includes('/analytics/retention')) return 'retention';
    if (p.includes('/analytics/intelligence')) return 'intelligence';
    if (p.includes('/analytics/strategy')) return 'strategy';
    return 'overview';
  }, [location.pathname]);

  // Loading & Global States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Authoritative Data States
  const [summary, setSummary] = useState<SocialAnalyticsSummary | null>(null);
  const [records, setRecords] = useState<SocialAnalyticsRecord[]>([]);
  const [intelligenceReports, setIntelligenceReports] = useState<SocialPerformanceIntelligenceRecord[]>([]);
  const [strategyRecs, setStrategyRecs] = useState<ContentStrategyRecommendation[]>([]);

  // Filter States
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action States
  const [isGeneratingIntelligence, setIsGeneratingIntelligence] = useState<boolean>(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Initial Data Loader
  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, recRes, intelRes, stratRes] = await Promise.all([
        apiClient.getSocialAnalyticsSummary().catch(() => ({ success: false, summary: null as any })),
        apiClient.querySocialAnalytics().catch(() => ({ success: false, count: 0, records: [] })),
        apiClient.getIntelligenceReports(10).catch(() => ({ success: false, count: 0, reports: [] })),
        apiClient.getStrategyRecommendations(10).catch(() => ({ success: false, count: 0, data: [] })),
      ]);

      if (sumRes.success && sumRes.summary) {
        setSummary(sumRes.summary);
      }
      if (recRes.success && Array.isArray(recRes.records)) {
        setRecords(recRes.records);
      }
      if (intelRes.success && Array.isArray(intelRes.reports)) {
        setIntelligenceReports(intelRes.reports);
      }
      if (stratRes.success && Array.isArray(stratRes.data)) {
        setStrategyRecs(stratRes.data);
      }
    } catch (err: any) {
      console.warn('Error loading analytics data:', err);
      setError(err?.message || 'Failed to connect to authoritative analytics service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesPlatform =
        platformFilter === 'all' || r.platform.toLowerCase() === platformFilter.toLowerCase();
      const matchesQuery =
        !searchQuery ||
        r.contentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.topicId && r.topicId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesPlatform && matchesQuery;
    });
  }, [records, platformFilter, searchQuery]);

  // Derived aggregates by Topic
  const topicAggregates = useMemo(() => {
    const map: Record<
      string,
      { topicId: string; count: number; totalViews: number; totalWatch: number; sumRetention: number; sumCtr: number }
    > = {};

    records.forEach((r) => {
      const tid = r.topicId || 'UNCLASSIFIED';
      if (!map[tid]) {
        map[tid] = { topicId: tid, count: 0, totalViews: 0, totalWatch: 0, sumRetention: 0, sumCtr: 0 };
      }
      map[tid].count += 1;
      map[tid].totalViews += r.views || 0;
      map[tid].totalWatch += r.watchTime || 0;
      map[tid].sumRetention += r.retentionRate || 0;
      map[tid].sumCtr += r.ctr || 0;
    });

    return Object.values(map).map((item) => ({
      ...item,
      avgViews: item.count > 0 ? Math.round(item.totalViews / item.count) : 0,
      avgRetention: item.count > 0 ? (item.sumRetention / item.count).toFixed(1) : '0.0',
      avgCtr: item.count > 0 ? (item.sumCtr / item.count).toFixed(1) : '0.0',
    }));
  }, [records]);

  // Derived aggregates by Subtopic
  const subtopicAggregates = useMemo(() => {
    const map: Record<
      string,
      { subtopicId: string; topicId: string; count: number; totalViews: number; sumRetention: number; sumCtr: number }
    > = {};

    records.forEach((r) => {
      const stid = r.subtopicId || 'UNCLASSIFIED';
      if (!map[stid]) {
        map[stid] = { subtopicId: stid, topicId: r.topicId || 'GENERAL', count: 0, totalViews: 0, sumRetention: 0, sumCtr: 0 };
      }
      map[stid].count += 1;
      map[stid].totalViews += r.views || 0;
      map[stid].sumRetention += r.retentionRate || 0;
      map[stid].sumCtr += r.ctr || 0;
    });

    return Object.values(map).map((item) => ({
      ...item,
      avgViews: item.count > 0 ? Math.round(item.totalViews / item.count) : 0,
      avgRetention: item.count > 0 ? (item.sumRetention / item.count).toFixed(1) : '0.0',
      avgCtr: item.count > 0 ? (item.sumCtr / item.count).toFixed(1) : '0.0',
    }));
  }, [records]);

  // Derived aggregates by Difficulty
  const difficultyAggregates = useMemo(() => {
    const tiers = ['EASY', 'MEDIUM', 'HARD'];
    return tiers.map((tier) => {
      const tierRecords = records.filter((r) => (r.difficulty || '').toUpperCase() === tier);
      const count = tierRecords.length;
      const totalViews = tierRecords.reduce((acc, r) => acc + (r.views || 0), 0);
      const sumRetention = tierRecords.reduce((acc, r) => acc + (r.retentionRate || 0), 0);
      const sumCtr = tierRecords.reduce((acc, r) => acc + (r.ctr || 0), 0);

      return {
        tier,
        count,
        totalViews,
        avgViews: count > 0 ? Math.round(totalViews / count) : 0,
        avgRetention: count > 0 ? (sumRetention / count).toFixed(1) : '0.0',
        avgCtr: count > 0 ? (sumCtr / count).toFixed(1) : '0.0',
      };
    });
  }, [records]);

  // Derived aggregates by Platform
  const platformAggregates = useMemo(() => {
    const platforms = ['youtube', 'instagram', 'facebook'];
    return platforms.map((plat) => {
      const platRecords = records.filter((r) => r.platform.toLowerCase() === plat);
      const count = platRecords.length;
      const totalViews = platRecords.reduce((acc, r) => acc + (r.views || 0), 0);
      const totalLikes = platRecords.reduce((acc, r) => acc + (r.likes || 0), 0);
      const totalShares = platRecords.reduce((acc, r) => acc + (r.shares || 0), 0);
      const sumRetention = platRecords.reduce((acc, r) => acc + (r.retentionRate || 0), 0);
      const sumCtr = platRecords.reduce((acc, r) => acc + (r.ctr || 0), 0);

      return {
        platform: plat,
        displayName: plat === 'youtube' ? 'YouTube Shorts' : plat === 'instagram' ? 'Instagram Reels' : 'Facebook Video',
        count,
        totalViews,
        totalLikes,
        totalShares,
        avgViews: count > 0 ? Math.round(totalViews / count) : 0,
        avgRetention: count > 0 ? (sumRetention / count).toFixed(1) : '0.0',
        avgCtr: count > 0 ? (sumCtr / count).toFixed(1) : '0.0',
      };
    });
  }, [records]);

  // Handlers for AI Actions
  const handleTriggerIntelligence = async () => {
    setIsGeneratingIntelligence(true);
    setActionSuccessMsg(null);
    try {
      const res = await apiClient.generateIntelligenceReport();
      if (res.success && res.record) {
        setActionSuccessMsg(`Generated AI Performance Intelligence analysis #${res.record.id}`);
        await loadAnalyticsData();
      } else {
        setError(res.error || 'Failed to generate performance intelligence.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error generating intelligence analysis.');
    } finally {
      setIsGeneratingIntelligence(false);
    }
  };

  const handleTriggerStrategy = async () => {
    setIsGeneratingStrategy(true);
    setActionSuccessMsg(null);
    try {
      const res = await apiClient.generateStrategyRecommendation();
      if (res.success && res.recommendation) {
        setActionSuccessMsg(`Generated Content Strategy Recommendation #${res.recommendation.id}`);
        await loadAnalyticsData();
      } else {
        setError(res.error || 'Failed to generate strategy recommendation.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error generating content strategy.');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleApplyStrategy = async (id: string) => {
    try {
      const res = await apiClient.applyStrategyRecommendation(id);
      if (res.success) {
        setActionSuccessMsg(`Strategy Recommendation #${id} applied to Question Studio.`);
        await loadAnalyticsData();
        const rec = strategyRecs.find((r) => r.id === id);
        if (rec) {
          const params = new URLSearchParams({
            topicId: rec.topicId || '',
            subtopicId: rec.subtopicId || '',
            difficulty: rec.difficulty || '',
            questionStyle: rec.questionStyle || '',
            context: rec.hook || '',
          });
          navigate(`/studio?${params.toString()}`);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to apply recommendation.');
    }
  };

  // Navigation Items Bar
  const navTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/analytics/overview' },
    { id: 'video', label: 'Video Performance', icon: Video, href: '/analytics/video' },
    { id: 'platform', label: 'Platform', icon: Share2, href: '/analytics/platform' },
    { id: 'topic', label: 'Topic', icon: BookOpen, href: '/analytics/topic' },
    { id: 'subtopic', label: 'Subtopic', icon: Layers, href: '/analytics/subtopic' },
    { id: 'difficulty', label: 'Difficulty', icon: BarChart2, href: '/analytics/difficulty' },
    { id: 'engagement', label: 'Engagement', icon: Heart, href: '/analytics/engagement' },
    { id: 'retention', label: 'Retention', icon: TrendingUp, href: '/analytics/retention' },
    { id: 'intelligence', label: 'AI Insights', icon: Sparkles, badge: 'AI', href: '/analytics/intelligence' },
    { id: 'strategy', label: 'Content Strategy', icon: Target, badge: 'Phase 29', href: '/analytics/strategy' },
  ];

  const totalRecordCount = records.length;
  const isInsufficientData = totalRecordCount < 3;

  return (
    <div id="analytics-experience-page" className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Analytics & Intelligence Experience"
        description="Authoritative social performance metrics, multi-dimensional breakdowns, AI intelligence reports, and content strategy recommendations."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalyticsData}
              disabled={isLoading}
              icon={RefreshCw}
            >
              Refresh
            </Button>
            <Link to="/social-analytics">
              <Button variant="secondary" size="sm" icon={Clock}>
                Snapshot Log
              </Button>
            </Link>
          </div>
        }
      />

      {/* Authoritative Freshness & Data Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xs text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Authoritative Analytics Workbook</span>
            <p className="text-slate-400">
              Data Isolated & Updated Append-Only • Total Recorded Snapshots: <span className="text-white font-medium">{totalRecordCount}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInsufficientData ? (
            <Badge variant="warning" icon={AlertCircle}>
              Insufficient Data (&lt; 3 samples)
            </Badge>
          ) : (
            <Badge variant="success" icon={CheckCircle2}>
              Statistically Valid ({totalRecordCount} samples)
            </Badge>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-xl shadow-2xs overflow-x-auto scrollbar-none">
        <nav className="flex px-2 py-1.5 gap-1 whitespace-nowrap min-w-max">
          {navTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.href)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area Based on Active Section */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading authoritative analytics dataset...</p>
        </div>
      ) : isInsufficientData && activeSection !== 'overview' && records.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No Analytics Records Found"
          description="The analytics dataset is currently empty. Record at least 3 social performance snapshots to calculate authoritative performance metrics and recommendations."
          actionLabel="Log New Snapshot"
          onAction={() => navigate('/social-analytics')}
        />
      ) : (
        <>
          {/* 1. OVERVIEW SECTION */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Views"
                  value={summary?.totalViews ? summary.totalViews.toLocaleString() : (records.reduce((a, r) => a + (r.views || 0), 0)).toLocaleString()}
                  icon={Eye}
                  accentColor="indigo"
                  subtitle={`${totalRecordCount} recorded snapshots`}
                />
                <StatCard
                  title="Avg Retention Rate"
                  value={`${summary?.averageRetentionRate ? summary.averageRetentionRate.toFixed(1) : (records.length > 0 ? (records.reduce((a, r) => a + (r.retentionRate || 0), 0) / records.length).toFixed(1) : '0.0')}%`}
                  icon={TrendingUp}
                  accentColor="emerald"
                  subtitle="Average audience watch duration %"
                />
                <StatCard
                  title="Avg Click-Through (CTR)"
                  value={`${summary?.averageCtr ? summary.averageCtr.toFixed(1) : (records.length > 0 ? (records.reduce((a, r) => a + (r.ctr || 0), 0) / records.length).toFixed(1) : '0.0')}%`}
                  icon={Zap}
                  accentColor="amber"
                  subtitle="Thumbnail & Title conversion"
                />
                <StatCard
                  title="Total Watch Time"
                  value={`${summary?.totalWatchTime ? Math.round(summary.totalWatchTime / 60) : Math.round(records.reduce((a, r) => a + (r.watchTime || 0), 0) / 60)} mins`}
                  icon={Clock}
                  accentColor="purple"
                  subtitle="Cumulative view duration"
                />
              </div>

              {/* Insufficient Data Warning Banner if < 3 records */}
              {isInsufficientData && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 space-y-1">
                    <p className="font-semibold">Insufficient Data Warning (&lt; 3 samples recorded)</p>
                    <p>
                      The current analytics dataset contains only {totalRecordCount} record(s). A minimum of 3 historical records is required for AI intelligence analysis and statistical confidence.
                    </p>
                    <div className="pt-1">
                      <Button size="sm" variant="outline" onClick={() => navigate('/social-analytics')}>
                        Log Additional Analytics Snapshot
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Performance Log */}
              <Card padding="md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Recent Analytics Records</h3>
                    <p className="text-xs text-slate-500">Authoritative performance snapshots sorted by date</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/social-analytics')} icon={Clock}>
                    View All Entry Logs
                  </Button>
                </div>

                {records.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No social performance records logged yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Snapshot ID</th>
                          <th className="p-2.5">Content ID</th>
                          <th className="p-2.5">Platform</th>
                          <th className="p-2.5">Views</th>
                          <th className="p-2.5">Retention</th>
                          <th className="p-2.5">CTR</th>
                          <th className="p-2.5">Likes</th>
                          <th className="p-2.5">Shares</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {records.slice(0, 6).map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono font-medium text-indigo-600">{r.id}</td>
                            <td className="p-2.5 font-mono font-semibold text-slate-900">{r.contentId}</td>
                            <td className="p-2.5 capitalize">{r.platform}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{r.views.toLocaleString()}</td>
                            <td className="p-2.5">{r.retentionRate}%</td>
                            <td className="p-2.5">{r.ctr}%</td>
                            <td className="p-2.5">{r.likes}</td>
                            <td className="p-2.5">{r.shares}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* 2. VIDEO PERFORMANCE SECTION */}
          {activeSection === 'video' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Content ID (BP-CNT-######), Topic..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Platform:</span>
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                  >
                    <option value="all">All Platforms</option>
                    <option value="youtube">YouTube Shorts</option>
                    <option value="instagram">Instagram Reels</option>
                    <option value="facebook">Facebook Video</option>
                  </select>
                </div>
              </div>

              <Card padding="none">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Content Asset Performance Breakdown</h3>
                  <span className="text-xs text-slate-500">{filteredRecords.length} records matching</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                      <tr>
                        <th className="p-3">Content ID</th>
                        <th className="p-3">Platform</th>
                        <th className="p-3">Topic / Subtopic</th>
                        <th className="p-3">Difficulty</th>
                        <th className="p-3">Views</th>
                        <th className="p-3">Retention %</th>
                        <th className="p-3">CTR %</th>
                        <th className="p-3">Engagement</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                            No matching content records found.
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-mono font-bold text-indigo-700">{r.contentId}</td>
                            <td className="p-3 capitalize font-medium">{r.platform}</td>
                            <td className="p-3">
                              <div className="font-medium text-slate-800">{r.topicId || '—'}</div>
                              <div className="text-[11px] text-slate-400">{r.subtopicId || '—'}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                                {r.difficulty || 'MEDIUM'}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-900">{r.views.toLocaleString()}</td>
                            <td className="p-3 text-emerald-700 font-medium">{r.retentionRate}%</td>
                            <td className="p-3 text-indigo-700 font-medium">{r.ctr}%</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2 text-slate-600">
                                <span title="Likes">❤️ {r.likes}</span>
                                <span title="Shares">🔄 {r.shares}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <Link to={`/social-analytics?contentId=${r.contentId}`}>
                                <Button size="sm" variant="outline">
                                  Inspect History
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 3. PLATFORM PERFORMANCE SECTION */}
          {activeSection === 'platform' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {platformAggregates.map((plat) => (
                  <Card key={plat.platform} padding="md" className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="font-bold text-sm text-slate-800">{plat.displayName}</div>
                      <Badge variant="active">{plat.count} snapshots</Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Views:</span>
                        <span className="font-bold text-slate-900">{plat.totalViews.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg Views / Post:</span>
                        <span className="font-semibold text-slate-800">{plat.avgViews.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg Retention Rate:</span>
                        <span className="font-semibold text-emerald-600">{plat.avgRetention}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg CTR:</span>
                        <span className="font-semibold text-indigo-600">{plat.avgCtr}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Likes:</span>
                        <span className="font-medium text-slate-700">{plat.totalLikes}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 4. TOPIC PERFORMANCE SECTION */}
          {activeSection === 'topic' && (
            <Card padding="none">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800">Curriculum Topic Aggregate Performance</h3>
                <p className="text-xs text-slate-500">Performance broken down by top-level subject topics</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                    <tr>
                      <th className="p-3">Topic ID</th>
                      <th className="p-3">Snapshots Count</th>
                      <th className="p-3">Total Views</th>
                      <th className="p-3">Avg Views / Post</th>
                      <th className="p-3">Avg Retention Rate</th>
                      <th className="p-3">Avg CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topicAggregates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                          No topic performance data recorded yet.
                        </td>
                      </tr>
                    ) : (
                      topicAggregates.map((t) => (
                        <tr key={t.topicId} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-indigo-700">{t.topicId}</td>
                          <td className="p-3">{t.count}</td>
                          <td className="p-3 font-medium text-slate-900">{t.totalViews.toLocaleString()}</td>
                          <td className="p-3 font-bold text-slate-800">{t.avgViews.toLocaleString()}</td>
                          <td className="p-3 text-emerald-600 font-semibold">{t.avgRetention}%</td>
                          <td className="p-3 text-indigo-600 font-semibold">{t.avgCtr}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 5. SUBTOPIC PERFORMANCE SECTION */}
          {activeSection === 'subtopic' && (
            <Card padding="none">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800">Subtopic Granular Performance</h3>
                <p className="text-xs text-slate-500">Fine-grained curriculum subtopic aggregates</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                    <tr>
                      <th className="p-3">Subtopic ID</th>
                      <th className="p-3">Parent Topic</th>
                      <th className="p-3">Snapshots</th>
                      <th className="p-3">Total Views</th>
                      <th className="p-3">Avg Views</th>
                      <th className="p-3">Avg Retention</th>
                      <th className="p-3">Avg CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subtopicAggregates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          No subtopic performance data recorded yet.
                        </td>
                      </tr>
                    ) : (
                      subtopicAggregates.map((s) => (
                        <tr key={s.subtopicId} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-semibold text-indigo-600">{s.subtopicId}</td>
                          <td className="p-3 font-medium text-slate-700">{s.topicId}</td>
                          <td className="p-3">{s.count}</td>
                          <td className="p-3 font-medium text-slate-900">{s.totalViews.toLocaleString()}</td>
                          <td className="p-3 font-bold text-slate-800">{s.avgViews.toLocaleString()}</td>
                          <td className="p-3 text-emerald-600 font-semibold">{s.avgRetention}%</td>
                          <td className="p-3 text-indigo-600 font-semibold">{s.avgCtr}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 6. DIFFICULTY PERFORMANCE SECTION */}
          {activeSection === 'difficulty' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {difficultyAggregates.map((diff) => (
                  <Card key={diff.tier} padding="md" className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="font-bold text-sm text-slate-800">{diff.tier} Difficulty</div>
                      <Badge variant={diff.tier === 'EASY' ? 'success' : diff.tier === 'MEDIUM' ? 'warning' : 'danger'}>
                        {diff.count} items
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Views:</span>
                        <span className="font-bold text-slate-900">{diff.totalViews.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg Views / Question:</span>
                        <span className="font-semibold text-slate-800">{diff.avgViews.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg Retention Rate:</span>
                        <span className="font-semibold text-emerald-600">{diff.avgRetention}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg CTR:</span>
                        <span className="font-semibold text-indigo-600">{diff.avgCtr}%</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 7. ENGAGEMENT SECTION */}
          {activeSection === 'engagement' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Total Likes & Shares"
                  value={`${(records.reduce((a, r) => a + (r.likes || 0) + (r.shares || 0), 0)).toLocaleString()}`}
                  icon={Heart}
                  accentColor="rose"
                  subtitle="Direct social interactions"
                />
                <StatCard
                  title="Total Comments"
                  value={`${(records.reduce((a, r) => a + (r.comments || 0), 0)).toLocaleString()}`}
                  icon={MessageSquare}
                  accentColor="emerald"
                  subtitle="Community discussion & feedback"
                />
                <StatCard
                  title="Avg Click-Through Rate"
                  value={`${records.length > 0 ? (records.reduce((a, r) => a + (r.ctr || 0), 0) / records.length).toFixed(1) : '0.0'}%`}
                  icon={Zap}
                  accentColor="indigo"
                  subtitle="Thumbnail & hook effectiveness"
                />
              </div>

              <Card padding="none">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Audience Engagement Breakdown</h3>
                  <Badge variant="active">{records.length} items</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                      <tr>
                        <th className="p-3">Content ID</th>
                        <th className="p-3">Platform</th>
                        <th className="p-3">Likes</th>
                        <th className="p-3">Comments</th>
                        <th className="p-3">Shares</th>
                        <th className="p-3">CTR (%)</th>
                        <th className="p-3">Total Interactions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...records]
                        .sort((a, b) => ((b.likes || 0) + (b.comments || 0) + (b.shares || 0)) - ((a.likes || 0) + (a.comments || 0) + (a.shares || 0)))
                        .map((r) => {
                          const totalInteractions = (r.likes || 0) + (r.comments || 0) + (r.shares || 0);
                          return (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-indigo-700">{r.contentId}</td>
                              <td className="p-3 capitalize">{r.platform}</td>
                              <td className="p-3 font-semibold text-rose-700">❤️ {r.likes || 0}</td>
                              <td className="p-3 font-semibold text-emerald-700">💬 {r.comments || 0}</td>
                              <td className="p-3 font-semibold text-indigo-700">🔄 {r.shares || 0}</td>
                              <td className="p-3 font-bold text-slate-800">{r.ctr}%</td>
                              <td className="p-3 font-bold text-slate-900">{totalInteractions.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 8. RETENTION SECTION */}
          {activeSection === 'retention' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Avg Retention Rate"
                  value={`${records.length > 0 ? (records.reduce((a, r) => a + (r.retentionRate || 0), 0) / records.length).toFixed(1) : '0.0'}%`}
                  icon={TrendingUp}
                  accentColor="emerald"
                  subtitle="Viewer hold duration target"
                />
                <StatCard
                  title="Total Watch Time"
                  value={`${Math.floor((records.reduce((a, r) => a + (r.watchTime || 0), 0)) / 3600)}h ${Math.floor(((records.reduce((a, r) => a + (r.watchTime || 0), 0)) % 3600) / 60)}m`}
                  icon={Clock}
                  accentColor="indigo"
                  subtitle="Cumulative audience watch time"
                />
                <StatCard
                  title="Subscribers Gained"
                  value={`+${records.reduce((a, r) => a + (r.subscribersGained || 0), 0)}`}
                  icon={UserPlus}
                  accentColor="purple"
                  subtitle="Audience growth conversion"
                />
              </div>

              <Card padding="none">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Retention & Hold Time Distribution</h3>
                  <Badge variant="active">{records.length} items</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-medium border-b border-slate-200">
                      <tr>
                        <th className="p-3">Content ID</th>
                        <th className="p-3">Platform</th>
                        <th className="p-3">Retention Rate (%)</th>
                        <th className="p-3">Watch Time (sec)</th>
                        <th className="p-3">Avg Watch / View</th>
                        <th className="p-3">Subscribers Gained</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...records]
                        .sort((a, b) => (b.retentionRate || 0) - (a.retentionRate || 0))
                        .map((r) => {
                          const avgWatch = r.views > 0 ? (r.watchTime / r.views).toFixed(1) : '0.0';
                          return (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-indigo-700">{r.contentId}</td>
                              <td className="p-3 capitalize">{r.platform}</td>
                              <td className="p-3 font-bold text-emerald-700">{r.retentionRate}%</td>
                              <td className="p-3 font-medium text-slate-800">{r.watchTime}s</td>
                              <td className="p-3 font-medium text-indigo-700">{avgWatch}s</td>
                              <td className="p-3 font-semibold text-slate-900">+{r.subscribersGained}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 8. AI INSIGHTS / INTELLIGENCE SECTION */}
          {activeSection === 'intelligence' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-xl text-white shadow-sm">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    Phase 28: AI Social Performance Intelligence Engine
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Conducts multi-dimensional analytics analysis using deterministic aggregation followed by structured advisory AI analysis.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTriggerIntelligence}
                  disabled={isGeneratingIntelligence}
                  icon={Sparkles}
                >
                  {isGeneratingIntelligence ? 'Analyzing...' : 'Run Intelligence Analysis'}
                </Button>
              </div>

              {intelligenceReports.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No Intelligence Reports Generated Yet"
                  description="Run an AI Performance Intelligence analysis to generate evidence-backed advisory insights, top dimensions, and verdict reports."
                  actionLabel="Run Analysis Now"
                  onAction={handleTriggerIntelligence}
                />
              ) : (
                <div className="space-y-6">
                  {intelligenceReports.map((report) => (
                    <Card key={report.id} padding="md" className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600 text-sm">{report.id}</span>
                            <Badge variant="active">Sample Size: {report.recordCount} records</Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">Analyzed At: {new Date(report.analyzedAt).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Overall Verdict */}
                      {report.aiInsights?.overallVerdict && (
                        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-950 space-y-1">
                          <p className="font-bold text-indigo-900">AI Overall Verdict</p>
                          <p className="leading-relaxed">{report.aiInsights.overallVerdict}</p>
                        </div>
                      )}

                      {/* Top & Underperforming Dimensions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.aiInsights?.topPerformingDimensions && report.aiInsights.topPerformingDimensions.length > 0 && (
                          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs space-y-2">
                            <p className="font-bold text-emerald-900 flex items-center gap-1">
                              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                              Top Performing Dimensions
                            </p>
                            <ul className="space-y-1.5 text-emerald-950">
                              {report.aiInsights.topPerformingDimensions.map((dim, idx) => (
                                <li key={idx} className="bg-white p-2 rounded border border-emerald-100">
                                  <span className="font-semibold text-emerald-800">{dim.dimension}: {dim.value}</span>
                                  <div className="text-[11px] text-slate-600 mt-0.5">
                                    Avg Views: {dim.avgViews} • Retention: {dim.avgRetention}% • {dim.reason}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {report.aiInsights?.underperformingDimensions && report.aiInsights.underperformingDimensions.length > 0 && (
                          <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg text-xs space-y-2">
                            <p className="font-bold text-rose-900 flex items-center gap-1">
                              <ArrowDownRight className="w-4 h-4 text-rose-600" />
                              Underperforming Dimensions
                            </p>
                            <ul className="space-y-1.5 text-rose-950">
                              {report.aiInsights.underperformingDimensions.map((dim, idx) => (
                                <li key={idx} className="bg-white p-2 rounded border border-rose-100">
                                  <span className="font-semibold text-rose-800">{dim.dimension}: {dim.value}</span>
                                  <div className="text-[11px] text-slate-600 mt-0.5">
                                    Avg Views: {dim.avgViews} • Retention: {dim.avgRetention}% • {dim.reason}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 9. CONTENT STRATEGY RECOMMENDATIONS SECTION */}
          {activeSection === 'strategy' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-5 rounded-xl text-white shadow-sm">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Phase 29: AI Content Strategy & Adaptive Generation
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Generates evidence-based future content strategy recommendations linking performance intelligence to Question Studio.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTriggerStrategy}
                  disabled={isGeneratingStrategy}
                  icon={Target}
                >
                  {isGeneratingStrategy ? 'Generating...' : 'Generate Recommendation'}
                </Button>
              </div>

              {strategyRecs.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No Content Strategy Recommendations Yet"
                  description="Generate evidence-backed strategy recommendations to guide upcoming question creation and video production."
                  actionLabel="Generate Strategy Now"
                  onAction={handleTriggerStrategy}
                />
              ) : (
                <div className="space-y-4">
                  {strategyRecs.map((rec) => (
                    <Card key={rec.id} padding="md" className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-700 text-sm">{rec.id}</span>
                          <Badge variant={rec.status === 'APPLIED' ? 'success' : rec.status === 'ACTIVE' ? 'active' : 'neutral'}>
                            {rec.status}
                          </Badge>
                          <Badge variant={rec.confidenceLevel === 'HIGH' ? 'success' : 'warning'}>
                            Confidence: {rec.confidenceLevel}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400">Created: {new Date(rec.createdAt).toLocaleDateString()}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                          <p className="text-slate-500 font-medium">Recommended Topic & Subtopic:</p>
                          <p className="font-bold text-slate-900">{rec.topicId} • {rec.subtopicId}</p>
                          <p className="text-slate-600">Difficulty: <span className="font-semibold">{rec.difficulty}</span> | Style: <span className="font-semibold">{rec.questionStyle}</span></p>
                        </div>

                        <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                          <p className="text-slate-500 font-medium">Presentation & Context:</p>
                          <p className="font-semibold text-slate-800">{rec.presentation}</p>
                          <p className="text-slate-600 italic">"{rec.hook}"</p>
                        </div>
                      </div>

                      <div className="p-2.5 bg-purple-50/60 border border-purple-100 rounded text-xs text-purple-950">
                        <span className="font-bold text-purple-900">Supporting Evidence: </span>
                        {rec.evidence}
                      </div>

                      {rec.status === 'ACTIVE' && (
                        <div className="pt-2 flex justify-end">
                          <Button size="sm" variant="primary" onClick={() => handleApplyStrategy(rec.id)} icon={Zap}>
                            Apply to Question Studio
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
