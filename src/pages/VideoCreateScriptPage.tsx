import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Save,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Video as VideoIcon,
  RefreshCw,
  Copy,
  Check,
  Film,
  ChevronDown,
  ChevronUp,
  Zap,
  GraduationCap,
  Pin,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Video, Question, VideoProductionStatus } from '../types';
import { apiClient } from '../lib/api-client';
import { ProductionJourneyBar } from '../components/production/ProductionJourneyBar';
import { useProductionJourney } from '../contexts/ProductionJourneyContext';
import { PageHeader } from '../design-system/components/PageHeader';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Alert } from '../design-system/components/Alert';
import { PageLoading } from '../design-system/components/Loading';
import { EmptyState } from '../design-system/components/EmptyState';

export const VideoCreateScriptPage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadJourneyForVideo } = useProductionJourney();

  const videoId = routeVideoId || searchParams.get('videoId') || searchParams.get('id') || '';

  // State: Video & Question Context
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [showMathProofDrawer, setShowMathProofDrawer] = useState<boolean>(false);

  // 1. SCRIPT FORMAT SWITCHER STATE (Default: VIRAL_CHALLENGE)
  const [scriptFormat, setScriptFormat] = useState<'VIRAL_CHALLENGE' | 'SOLUTION_BREAKDOWN'>('VIRAL_CHALLENGE');

  // MODE 1: Social Viral Challenge (4-Part) State
  const [includeOptionsInVideo, setIncludeOptionsInVideo] = useState<boolean>(true);
  const [viralHook, setViralHook] = useState<string>('');
  const [viralQuestion, setViralQuestion] = useState<string>('');
  const [viralOptions, setViralOptions] = useState<string>('');
  const [viralCta, setViralCta] = useState<string>(
    'మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది. మరిన్ని బ్రెయిన్ ఛాలెంజెస్ కోసం ఇప్పుడే Burra Pariksha ఛానెల్ ని ఫాలో అవ్వండి!'
  );
  const [pinnedCommentText, setPinnedCommentText] = useState<string>('');
  const [pinnedCopied, setPinnedCopied] = useState<boolean>(false);

  // MODE 2: Full Solution Breakdown (5-Part) State
  const [hookText, setHookText] = useState<string>('');
  const [problemStatement, setProblemStatement] = useState<string>('');
  const [stepByStepSolution, setStepByStepSolution] = useState<string>('');
  const [speedTrickOrTakeaway, setSpeedTrickOrTakeaway] = useState<string>('');
  const [callToAction, setCallToAction] = useState<string>('Burra Pariksha ఛానెల్ ని Follow అవ్వండి!');
  const [notes, setNotes] = useState<string>('');

  // AI Generation State
  const [tone, setTone] = useState<'ENERGETIC_EXAM_COACH' | 'CLEAR_CONCEPTUAL' | 'EXAM_TRICK_FOCUSED'>('ENERGETIC_EXAM_COACH');
  const [targetDurationSeconds, setTargetDurationSeconds] = useState<number>(20);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Helper to generate formatted pinned comment from question data
  const generatePinnedCommentFromQuestion = (q: Question | null) => {
    if (!q) {
      return `🏆 సరైన సమాధానం: [Correct Option & Value]\n💡 Burra Speed Trick: [Speed trick explanation]\n👇 మీలో ఎంతమంది కరెక్ట్ గా ఆన్సర్ చేశారో కామెంట్ చేయండి!`;
    }
    const correctKey = (q.correctAnswer || (q as any).correctOption || 'A').toUpperCase();
    const correctVal = (q as any)[`option${correctKey}`] || (q as any)[`option${correctKey}Te`] || '';
    const speedTrick = (q as any).explanationTe || q.explanation || 'See full solution on Burra Pariksha App!';

    return `🏆 సరైన సమాధానం: Option ${correctKey}${correctVal ? ` (${correctVal})` : ''}\n💡 Burra Speed Trick: ${speedTrick}\n👇 మీలో ఎంతమంది కరెక్ట్ గా ఆన్సర్ చేశారో కామెంట్ చేయండి!`;
  };

  // Helper to generate default options text from question record
  const generateOptionsTextFromQuestion = (q: Question | null) => {
    if (!q) return 'Option A: \nOption B: \nOption C: \nOption D: ';
    const optA = (q as any).optionATe || q.optionA || '';
    const optB = (q as any).optionBTe || q.optionB || '';
    const optC = (q as any).optionCTe || q.optionC || '';
    const optD = (q as any).optionDTe || q.optionD || '';
    return `Option A: ${optA}\nOption B: ${optB}\nOption C: ${optC}\nOption D: ${optD}`;
  };

  // Load video list if no ID provided
  const loadVideoList = async () => {
    try {
      setIsLoading(true);
      const videos = await apiClient.getVideos();
      setVideoList(videos);
    } catch (err: any) {
      setError(err?.message || 'Failed to load video list');
    } finally {
      setIsLoading(false);
    }
  };

  // Load specific video and its question / existing script
  const loadVideoAndDetails = async (targetId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const vid = await apiClient.getVideoById(targetId);
      setSelectedVideo(vid);
      loadJourneyForVideo(targetId, vid);

      let qRecord: Question | null = null;
      if (vid.questionId) {
        try {
          qRecord = await apiClient.getQuestionById(vid.questionId);
          setQuestion(qRecord);
        } catch (qErr) {
          console.warn('Could not fetch linked question record:', qErr);
        }
      }

      // Initialize default values based on question record
      if (qRecord) {
        const qStatement = (qRecord as any).statementTe || (qRecord as any).statement || qRecord.questionText || '';
        setViralQuestion(qStatement);
        setProblemStatement(qStatement);
        setViralOptions(generateOptionsTextFromQuestion(qRecord));
        setPinnedCommentText(generatePinnedCommentFromQuestion(qRecord));
      }

      // Fetch existing script draft if available
      try {
        const res = await apiClient.getScript(targetId);
        const scriptData = res.script || res.draftProposal;

        if (scriptData) {
          if ((scriptData as any).scriptFormat === 'SOLUTION_BREAKDOWN' || (scriptData.notes && scriptData.notes.includes('SOLUTION_BREAKDOWN'))) {
            setScriptFormat('SOLUTION_BREAKDOWN');
            setTargetDurationSeconds(45);
          }

          setHookText(scriptData.hookText || '');
          setProblemStatement(scriptData.problemStatement || '');
          setStepByStepSolution(scriptData.stepByStepSolution || '');
          setSpeedTrickOrTakeaway(scriptData.speedTrickOrTakeaway || '');
          setCallToAction(scriptData.callToAction || 'Burra Pariksha ఛానెల్ ని Follow అవ్వండి!');
          setNotes(scriptData.notes || '');

          // Populate viral fields if previously stored
          setViralHook(scriptData.hookText || '');
          if (scriptData.problemStatement) setViralQuestion(scriptData.problemStatement);
          if ((scriptData as any).pinnedCommentText) {
            setPinnedCommentText((scriptData as any).pinnedCommentText);
          }
        } else {
          // Defaults for new draft
          setViralHook('ఈ లెక్కని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్! ట్రై చేయండి!');
        }
      } catch (sErr) {
        console.warn('Could not fetch existing script draft:', sErr);
        setViralHook('ఈ లెక్కని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్! ట్రై చేయండి!');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load video script authoring studio');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      loadVideoAndDetails(videoId);
    } else {
      loadVideoList();
    }
  }, [videoId]);

  // Adjust target duration default on format switch
  const handleFormatChange = (newFormat: 'VIRAL_CHALLENGE' | 'SOLUTION_BREAKDOWN') => {
    setScriptFormat(newFormat);
    if (newFormat === 'VIRAL_CHALLENGE') {
      setTargetDurationSeconds(20);
      if (!viralHook) {
        setViralHook('ఈ లెక్కని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్! ట్రై చేయండి!');
      }
    } else {
      setTargetDurationSeconds(45);
    }
  };

  // Teleprompter pacing calculations (140 Telugu words per minute)
  const combinedScriptText =
    scriptFormat === 'VIRAL_CHALLENGE'
      ? `${viralHook}\n\n${viralQuestion}\n\n${includeOptionsInVideo ? viralOptions : ''}\n\n${viralCta}`
      : `${hookText}\n\n${problemStatement}\n\n${stepByStepSolution}\n\n${speedTrickOrTakeaway}\n\n${callToAction}`;

  const totalWords = combinedScriptText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const estimatedSeconds = Math.round((totalWords / 140) * 60);

  // Generate Telugu Script via Gemini
  const handleGenerateScriptWithAi = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsGeneratingAi(true);
      setError(null);
      setSuccessMessage(null);

      const generated = await apiClient.generateTeluguScript(targetId);

      if (scriptFormat === 'VIRAL_CHALLENGE') {
        setViralHook(generated.hookText || 'ఈ లెక్కని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్! ట్రై చేయండి!');
        setViralQuestion(generated.problemStatement || question?.questionText || '');
        if (question) {
          setViralOptions(generateOptionsTextFromQuestion(question));
          setPinnedCommentText(generatePinnedCommentFromQuestion(question));
        }
        setViralCta(
          'మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది. మరిన్ని బ్రెయిన్ ఛాలెంజెస్ కోసం ఇప్పుడే Burra Pariksha ఛానెల్ ని ఫాలో అవ్వండి!'
        );
        setNotes(`AI-Generated Viral Challenge (4-Part) • Est: ~20s`);
        setSuccessMessage('AI Auto-Drafted Viral Challenge! Review the 4 parts and the official Pinned Comment below.');
      } else {
        setHookText(generated.hookText || '');
        setProblemStatement(generated.problemStatement || '');
        setStepByStepSolution(generated.stepByStepSolution || '');
        setSpeedTrickOrTakeaway(generated.speedTrickOrTakeaway || '');
        setCallToAction(generated.callToAction || 'Burra Pariksha ఛానెల్ ని Follow అవ్వండి!');
        setNotes(`AI-Generated Full Solution Breakdown (5-Part) • Est: ~${generated.estimatedDurationSeconds || 45}s`);
        setSuccessMessage('AI 5-Part Deep Dive script generated successfully!');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate Telugu script with AI.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save Script Draft
  const handleSaveDraft = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const payload =
        scriptFormat === 'VIRAL_CHALLENGE'
          ? {
              hookText: viralHook,
              problemStatement: viralQuestion,
              stepByStepSolution: includeOptionsInVideo ? viralOptions : '⚡ Options Skipped (Mental Math Challenge)',
              callToAction: viralCta,
              speedTrickOrTakeaway: pinnedCommentText,
              notes: `[Format: VIRAL_CHALLENGE | IncludeOptions: ${includeOptionsInVideo}]\n${notes}\n\n📌 Pinned Comment:\n${pinnedCommentText}`,
              pinnedCommentText,
              createNewVersion: false,
            }
          : {
              hookText,
              problemStatement,
              stepByStepSolution,
              speedTrickOrTakeaway,
              callToAction,
              notes: `[Format: SOLUTION_BREAKDOWN]\n${notes}`,
              pinnedCommentText,
              createNewVersion: false,
            };

      await apiClient.saveScript(targetId, payload);
      setSuccessMessage('Script draft saved successfully! Teleprompter narration is ready for review or filming.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save script draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndProceed = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;
    await handleSaveDraft();
    navigate(`/videos/${encodeURIComponent(targetId)}?tab=recording`);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(combinedScriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPinnedComment = () => {
    navigator.clipboard.writeText(pinnedCommentText);
    setPinnedCopied(true);
    setTimeout(() => setPinnedCopied(false), 2000);
  };

  // If no video is specified, show list of candidate videos needing scripts
  if (!videoId && !selectedVideo) {
    const filteredVideos = videoList.filter(
      (v) =>
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.questionId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
        <ProductionJourneyBar activeStage="AUDIENCE_SCRIPT" showDetails />

        <PageHeader
          title="Draft Script"
          description="Author, draft, and AI-generate multi-format scripts for Telugu short-form educational videos"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Video Production', href: '/production' },
            { label: 'Draft Script' },
          ]}
        />

        {error && (
          <Alert variant="error" title="Error Loading Videos" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card variant="default" padding="lg" className="rounded-2xl border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select Video for Script Creation</h3>
              <p className="text-xs text-slate-500">
                Choose a video record to generate or write its Telugu teleprompter script.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by Video ID, Question ID, or Title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {isLoading ? (
            <PageLoading message="Loading video records..." />
          ) : filteredVideos.length === 0 ? (
            <EmptyState
              title="No Videos Found"
              description="No video production items matched your search query."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredVideos.map((vid) => (
                <div
                  key={vid.id}
                  onClick={() => navigate(`/videos/${encodeURIComponent(vid.id)}/create-script`)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 transition-all cursor-pointer space-y-2.5 shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {vid.id}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {vid.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2">
                    {vid.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Ref: {vid.questionId || 'N/A'}</span>
                    <span className="text-indigo-600 font-semibold flex items-center gap-1">
                      Author Script <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  const activeVideoId = selectedVideo?.id || videoId;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Permanent 15-Stage Timeline Anchor */}
      <ProductionJourneyBar activeStage="AUDIENCE_SCRIPT" showDetails />

      {/* 2. Unified Page Header with Direct Links */}
      <PageHeader
        title="Audience Engagement Script Engine"
        description="Dynamic multi-format script studio • High-velocity Viral Challenge vs. Deep Dive Masterclass"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Video Production', href: '/production' },
          { label: activeVideoId, href: `/videos/${encodeURIComponent(activeVideoId)}` },
          { label: 'Scriptwriting' },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/production">
              <Button variant="outline" size="sm" icon={Film}>
                Production Tracker
              </Button>
            </Link>
            {selectedVideo?.questionId && (
              <Link to={`/questions/${selectedVideo.questionId}`}>
                <Button variant="outline" size="sm" icon={BookOpen}>
                  View Question Record
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* ========================================================
          1. SCRIPT FORMAT SWITCHER (HIGH-VISIBILITY SEGMENTED TABS)
          ======================================================== */}
      <Card variant="default" padding="sm" className="rounded-2xl border-slate-200 bg-slate-50/80 p-2 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* TAB 1: Viral Challenge */}
          <button
            type="button"
            onClick={() => handleFormatChange('VIRAL_CHALLENGE')}
            className={`p-3.5 rounded-xl text-left transition-all flex flex-col justify-between border cursor-pointer ${
              scriptFormat === 'VIRAL_CHALLENGE'
                ? 'bg-white border-amber-300 shadow-sm ring-2 ring-amber-400/30'
                : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                ⚡ Social Viral Challenge (15–25s) [Default]
              </span>
              {scriptFormat === 'VIRAL_CHALLENGE' && (
                <Badge variant="warning" size="sm" className="text-[10px] font-bold py-0 px-2">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Viral Shorts / Reels / FB • High Comment Engagement • Answer in Pinned Comment
            </p>
          </button>

          {/* TAB 2: Full Solution Breakdown */}
          <button
            type="button"
            onClick={() => handleFormatChange('SOLUTION_BREAKDOWN')}
            className={`p-3.5 rounded-xl text-left transition-all flex flex-col justify-between border cursor-pointer ${
              scriptFormat === 'SOLUTION_BREAKDOWN'
                ? 'bg-white border-indigo-300 shadow-sm ring-2 ring-indigo-400/30'
                : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                🎓 Full Solution Breakdown (45–60s)
              </span>
              {scriptFormat === 'SOLUTION_BREAKDOWN' && (
                <Badge variant="active" size="sm" className="text-[10px] font-bold py-0 px-2">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Educational Masterclass • Step-by-Step Proof &amp; On-Camera Speed Trick
            </p>
          </button>
        </div>
      </Card>

      {error && (
        <Alert variant="error" title="Script Generation / Save Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <PageLoading message="Loading script creation workspace..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================
              LEFT PANE (lg:col-span-8): COMPACT AI RIBBON & DYNAMIC SCRIPT WORKSPACE
              ======================================================== */}
          <div className="lg:col-span-8 space-y-4">
            {/* Adaptive AI Script Generator Ribbon */}
            <Card variant="default" padding="sm" className="rounded-2xl border-slate-200/80 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      scriptFormat === 'VIRAL_CHALLENGE'
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900">
                        {scriptFormat === 'VIRAL_CHALLENGE'
                          ? 'AI Viral Challenge Generator'
                          : 'AI Telugu Script Generator'}
                      </h3>
                      <Badge variant="active" size="sm" className="text-[10px] py-0 px-1.5 font-mono">
                        Gemini 2.5 Flash
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 hidden sm:block">
                      {scriptFormat === 'VIRAL_CHALLENGE'
                        ? 'Auto-draft 4-part viral short + pinned comment'
                        : 'Auto-structure 5-part deep dive teleprompter narration'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={tone}
                    onChange={(e: any) => setTone(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="ENERGETIC_EXAM_COACH">Energetic Exam Coach</option>
                    <option value="CLEAR_CONCEPTUAL">Clear Conceptual</option>
                    <option value="EXAM_TRICK_FOCUSED">Shortcut Focused</option>
                  </select>

                  <select
                    value={targetDurationSeconds}
                    onChange={(e) => setTargetDurationSeconds(Number(e.target.value))}
                    className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                  >
                    {scriptFormat === 'VIRAL_CHALLENGE' ? (
                      <>
                        <option value={15}>15s Target</option>
                        <option value={20}>20s Target (Default)</option>
                        <option value={25}>25s Target</option>
                      </>
                    ) : (
                      <>
                        <option value={30}>30s Target</option>
                        <option value={45}>45s Target (Default)</option>
                        <option value={60}>60s Target</option>
                      </>
                    )}
                  </select>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isGeneratingAi}
                    onClick={handleGenerateScriptWithAi}
                    icon={Sparkles}
                    className={`font-bold text-xs text-white ${
                      scriptFormat === 'VIRAL_CHALLENGE'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isGeneratingAi
                      ? 'Generating...'
                      : scriptFormat === 'VIRAL_CHALLENGE'
                      ? '✦ Auto-Draft Viral Challenge (4-Part)'
                      : '✦ Generate 5-Part Deep Dive'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* ========================================================
                MODE 1: "⚡ SOCIAL VIRAL CHALLENGE (15–25s)" [DEFAULT]
                ======================================================== */}
            {scriptFormat === 'VIRAL_CHALLENGE' ? (
              <div className="space-y-4">
                <Card variant="default" padding="lg" className="rounded-2xl border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                        Viral Challenge Teleprompter Script (4 Parts)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Fast-paced short-form narration designed for maximum algorithmic retention
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyAll}
                        icon={copied ? Check : Copy}
                        className="text-xs"
                      >
                        {copied ? 'Copied' : 'Copy All'}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isSaving}
                        onClick={handleSaveDraft}
                        icon={Save}
                        className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                      >
                        {isSaving ? 'Saving...' : 'Save Draft'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Part 1: Scroll-Stopping Hook */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px] font-mono font-bold">
                            1
                          </span>
                          1. Scroll-Stopping Hook (0–3s) • Feed Pattern Interrupt
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">Target: ~8–12 words</span>
                      </div>
                      <textarea
                        value={viralHook}
                        onChange={(e) => setViralHook(e.target.value)}
                        placeholder="e.g. ఈ లెక్కని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్! ట్రై చేయండి!"
                        rows={2}
                        className="w-full text-sm sm:text-base font-telugu font-medium text-slate-900 leading-relaxed bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden p-3"
                      />
                    </div>

                    {/* Part 2: Question Narration */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px] font-mono font-bold">
                            2
                          </span>
                          2. Question Narration (3–10s) • Clear Telugu Problem Statement
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">Target: ~15–25 words</span>
                      </div>
                      <textarea
                        value={viralQuestion}
                        onChange={(e) => setViralQuestion(e.target.value)}
                        placeholder="Clear Telugu problem statement to be read aloud..."
                        rows={3}
                        className="w-full text-sm sm:text-base font-telugu font-medium text-slate-900 leading-relaxed bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden p-3"
                      />
                    </div>

                    {/* Part 3: Options Delivery with Interactive Toggle */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/80">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px] font-mono font-bold">
                            3
                          </span>
                          3. Options Delivery (10–16s)
                        </label>

                        {/* Interactive Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setIncludeOptionsInVideo(!includeOptionsInVideo)}
                          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                            includeOptionsInVideo
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {includeOptionsInVideo ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                              <span>✓ Include Options (A, B, C, D)</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-slate-500" />
                              <span>Skip Options (Open Mental Math Challenge)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {includeOptionsInVideo ? (
                        <div>
                          <p className="text-[11px] text-slate-500 mb-1.5">
                            Read options A, B, C, D on-camera before giving the comment challenge:
                          </p>
                          <textarea
                            value={viralOptions}
                            onChange={(e) => setViralOptions(e.target.value)}
                            placeholder="Option A: ...&#10;Option B: ...&#10;Option C: ...&#10;Option D: ..."
                            rows={3}
                            className="w-full text-sm sm:text-base font-telugu font-medium text-slate-900 leading-relaxed bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden p-3"
                          />
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            ⚡ <strong>Options Skipped</strong> — Keeps the video fast &amp; punchy for direct mental math challenge without reading options aloud.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Part 4: Comment Challenge & Follow CTA */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px] font-mono font-bold">
                            4
                          </span>
                          4. Comment Challenge &amp; Outro (16–22s) • Algorithm Engagement Trigger
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">Target: ~10–15 words</span>
                      </div>
                      <textarea
                        value={viralCta}
                        onChange={(e) => setViralCta(e.target.value)}
                        placeholder="మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది. మరిన్ని బ్రెయిన్ ఛాలెంజెస్ కోసం ఇప్పుడే Burra Pariksha ఛానెల్ ని ఫాలో అవ్వండి!"
                        rows={2}
                        className="w-full text-sm sm:text-base font-telugu font-medium text-slate-900 leading-relaxed bg-white border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-hidden p-3"
                      />
                    </div>
                  </div>
                </Card>

                {/* SPECIAL FEATURE: Official Pinned Comment Generator */}
                <Card variant="default" padding="lg" className="rounded-2xl border-amber-200 bg-amber-50/30 shadow-xs">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/80">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <Pin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">📌 Official Pinned Comment (Solution &amp; Speed Trick)</h4>
                        <p className="text-[11px] text-slate-500">
                          Auto-formatted comment to pin on YouTube Shorts / Instagram Reels immediately upon publishing
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCopyPinnedComment}
                      icon={pinnedCopied ? Check : Copy}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    >
                      {pinnedCopied ? 'Copied!' : '📋 Copy Pinned Comment'}
                    </Button>
                  </div>

                  <textarea
                    value={pinnedCommentText}
                    onChange={(e) => setPinnedCommentText(e.target.value)}
                    rows={4}
                    className="w-full text-sm sm:text-base font-telugu font-medium text-slate-900 leading-relaxed bg-white border border-amber-300 rounded-xl focus:border-amber-500 focus:outline-hidden p-3 shadow-inner"
                  />
                  <p className="text-[11px] text-slate-500 mt-2 italic">
                    💡 Viewers who attempt the video challenge will click into the comments section to check their answer, driving high platform engagement signals.
                  </p>
                </Card>
              </div>
            ) : (
              /* ========================================================
                  MODE 2: "🎓 FULL SOLUTION BREAKDOWN (45–60s)"
                  ======================================================== */
              <Card variant="default" padding="lg" className="rounded-2xl border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      5-Part Deep Dive Masterclass Script Draft
                    </h3>
                    <p className="text-xs text-slate-500">Full pedagogical explanation with step-by-step math proof and speed trick</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAll}
                      icon={copied ? Check : Copy}
                      className="text-xs"
                    >
                      {copied ? 'Copied' : 'Copy All'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isSaving}
                      onClick={handleSaveDraft}
                      icon={Save}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Part 1: Hook */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-mono font-bold">
                          1
                        </span>
                        1. Hook (0–5s) • High Energy Attention Grabber
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">Target: ~10-15 words</span>
                    </div>
                    <textarea
                      value={hookText}
                      onChange={(e) => setHookText(e.target.value)}
                      placeholder="e.g. ఈ క్వశ్చన్ ని 10 సెకన్లలో సాల్వ్ చేయగలరా? చాలా మంది ఇక్కడే తప్పు చేస్తారు!"
                      rows={2}
                      className="w-full text-sm sm:text-base font-telugu font-medium text-slate-900 leading-relaxed bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-hidden p-3"
                    />
                  </div>

                  {/* Part 2: Problem Statement */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-mono font-bold">
                          2
                        </span>
                        2. Problem Statement (5–15s) • Question Narration
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">Target: ~25-35 words</span>
                    </div>
                    <textarea
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      placeholder="e.g. ఒక రైలు 60 km/h వేగంతో ప్రయాణిస్తూ 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను 18 సెకన్లలో దాటింది..."
                      rows={3}
                      className="w-full text-sm sm:text-base font-telugu font-medium text-slate-900 leading-relaxed bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-hidden p-3"
                    />
                  </div>

                  {/* Part 3: Spoken Solution & Intuition */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-mono font-bold">
                          3
                        </span>
                        3. Spoken Solution &amp; Intuition (15–35s) • Conversational Explanation
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">Target: ~45-60 words</span>
                    </div>
                    <div className="p-2.5 mb-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                      💡 <strong>Conversational Narration Guidance:</strong> Spoken Telugu should explain the solution intuitively like coaching a friend. Avoid reading textbook algebraic equations mechanically!
                    </div>
                    <textarea
                      value={stepByStepSolution}
                      onChange={(e) => setStepByStepSolution(e.target.value)}
                      placeholder="Spoken Telugu explanation of the intuitive steps..."
                      rows={4}
                      className="w-full text-sm sm:text-base font-telugu font-medium text-slate-900 leading-relaxed bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-hidden p-3"
                    />
                  </div>

                  {/* Part 4: Burra Speed Shortcut */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px] font-mono font-bold">
                          4
                        </span>
                        4. Burra Speed Shortcut (35–45s) • High-Retention Exam Trick
                      </label>
                      <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Exam Shortcut
                      </span>
                    </div>
                    <div className="p-2.5 mb-2 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                      ⚡ <strong>High-Retention Exam Trick:</strong> Deliver the core mental math shortcut, unit-digit elimination rule, or ratio trick that saves 40+ seconds on the actual exam.
                    </div>
                    <textarea
                      value={speedTrickOrTakeaway}
                      onChange={(e) => setSpeedTrickOrTakeaway(e.target.value)}
                      placeholder="Pro-Tip: In the actual exam, check the units digit to eliminate Options B and D instantly!"
                      rows={2}
                      className="w-full text-sm sm:text-base font-telugu font-medium text-slate-900 leading-relaxed bg-amber-50/30 border border-amber-200 rounded-xl focus:border-indigo-500 focus:outline-hidden p-3"
                    />
                  </div>

                  {/* Part 5: Call to Action */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-mono font-bold">
                          5
                        </span>
                        5. Call to Action (45–50s) • Outro &amp; Next Question Hook
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">Target: ~10 words</span>
                    </div>
                    <textarea
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder="e.g. మరిన్ని షార్ట్‌కట్స్ కోసం ఇప్పుడే Burra Pariksha ఛానెల్ ని Follow చేయండి!"
                      rows={2}
                      className="w-full text-sm sm:text-base font-telugu font-medium text-slate-900 leading-relaxed bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-hidden p-3"
                    />
                  </div>

                  {/* Production Cues & Teleprompter Notes */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Production Cues &amp; Teleprompter Notes
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. High energy start, emphasize formula graphic at 0:18"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* ========================================================
              RIGHT PANE (lg:col-span-4): STICKY PRODUCTION & PACING METER RAIL
              ======================================================== */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
            {/* CARD 1 (TOP - PRIMARY ADVANCEMENT STATION): "Next Stage: Teleprompter & Filming" */}
            <Card
              variant="elevated"
              padding="lg"
              className="rounded-2xl border-indigo-100 shadow-md bg-white"
            >
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs pb-3 mb-3 border-b border-indigo-100">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono font-bold">
                  04
                </span>
                <span>Next Stage: Teleprompter &amp; Filming</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {scriptFormat === 'VIRAL_CHALLENGE'
                  ? 'Viral challenge script ready? Launch into filming mode with the host teleprompter.'
                  : 'Telugu spoken narration drafted? Move immediately into filming with the host teleprompter tool.'}
              </p>

              <div className="space-y-2.5">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSaveAndProceed}
                  disabled={isSaving}
                  icon={ArrowRight}
                  className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 shadow-md text-sm"
                >
                  {isSaving ? 'Saving Draft...' : 'Save & Proceed to Step 04: Teleprompter →'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const targetId = activeVideoId;
                    navigate(`/videos/${encodeURIComponent(targetId)}?tab=script`);
                  }}
                  className="w-full justify-center text-xs text-slate-700 hover:bg-slate-50"
                >
                  Open in Studio Workspace
                </Button>
              </div>
            </Card>

            {/* CARD 2: ADAPTIVE PACING & TIMING METER */}
            <Card variant="default" padding="lg" className="rounded-2xl border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Pacing &amp; Timing Meter
                </span>

                {scriptFormat === 'VIRAL_CHALLENGE' ? (
                  <Badge
                    variant={estimatedSeconds <= 25 ? 'approved' : 'draft'}
                    size="sm"
                    className={`font-bold text-[11px] ${
                      estimatedSeconds <= 25
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {estimatedSeconds <= 25 ? 'Viral Sweet Spot (15–25s)' : 'Too Long for Viral Short'}
                  </Badge>
                ) : (
                  <Badge
                    variant={estimatedSeconds <= 50 ? 'approved' : 'draft'}
                    size="sm"
                    className={`font-bold text-[11px] ${
                      estimatedSeconds <= 50
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {estimatedSeconds <= 50 ? 'Optimal Pace (45s)' : 'Exceeds 50s'}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center mb-3">
                <div>
                  <span className="text-[11px] text-slate-500 block">Total Words</span>
                  <span className="text-xl font-bold font-mono text-slate-900">{totalWords}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Est. Duration</span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      scriptFormat === 'VIRAL_CHALLENGE'
                        ? estimatedSeconds <= 25
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                        : estimatedSeconds <= 50
                        ? 'text-indigo-600'
                        : 'text-amber-600'
                    }`}
                  >
                    ~{estimatedSeconds}s
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Calculated using standard Telugu short-form narration rate of <strong>140 words/minute</strong>.
              </p>
            </Card>

            {/* CARD 3: "Reviewer Math Proof" (Dark reference drawer) */}
            {question && (
              <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Reviewer Math Proof
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMathProofDrawer(!showMathProofDrawer)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <span>{showMathProofDrawer ? 'Collapse' : 'Expand'}</span>
                    {showMathProofDrawer ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {showMathProofDrawer && (
                  <div className="space-y-3 text-xs pt-3 border-t border-slate-800 animate-in fade-in duration-150">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-400 block mb-1 uppercase tracking-wider">
                        Problem Statement
                      </span>
                      <p className="text-slate-200 text-xs leading-relaxed font-telugu">
                        {(question as any).statementTe || (question as any).statement || question.questionText}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Authoritative Math Proof
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                          Option {String(question.correctAnswer || (question as any).correctOption || '').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-slate-300 font-telugu text-[11px] bg-black/60 p-2.5 rounded-xl border border-slate-800 max-h-44 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {(question as any).explanationTe || question.explanation || 'No proof text available on record.'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800">
                      <span>
                        ID: <strong className="font-mono text-indigo-300">{question.id}</strong>
                      </span>
                      <span>
                        Topic:{' '}
                        <strong className="text-slate-300">
                          {question.topicName || (question as any).topic || question.topicId || 'General'}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCreateScriptPage;

