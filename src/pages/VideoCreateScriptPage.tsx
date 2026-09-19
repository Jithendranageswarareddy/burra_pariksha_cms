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
  Wand2,
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

  // AI Generation & Custom Prompter State
  const [tone, setTone] = useState<'ENERGETIC_EXAM_COACH' | 'CLEAR_CONCEPTUAL' | 'EXAM_TRICK_FOCUSED'>('ENERGETIC_EXAM_COACH');
  const [targetDurationSeconds, setTargetDurationSeconds] = useState<number>(20);
  const [customGuidance, setCustomGuidance] = useState<string>('');
  const [showAiPrompter, setShowAiPrompter] = useState<boolean>(false);
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

      let generated: any = null;
      try {
        generated = await apiClient.generateTeluguScript(targetId);
      } catch (e) {
        console.warn('Backend AI generation fallback:', e);
      }

      const qText = question
        ? ((question as any).statementTe || (question as any).statement || question.questionText || '')
        : selectedVideo?.title || 'గణిత ప్రశ్న';

      if (scriptFormat === 'VIRAL_CHALLENGE') {
        // CURIOSITY-DRIVEN VIRAL CHALLENGE:
        // Spoken script ONLY ASKS AND PROVOKES. ZERO solution steps in spoken script!

        let hook = 'ఈ లెక్కని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్! ట్రై చేయండి!';
        if (customGuidance.includes('99% Fail')) {
          hook = '🔥 99% మంది ఈ క్వశ్చన్‌ను చూడగానే తప్పు చేస్తారు! 5 సెకన్లలో మీరు సాల్వ్ చేయగలరా?';
        } else if (customGuidance.includes('5-Sec Speed Test')) {
          hook = '⏱️ పెన్ పేపర్ లేకుండా ఈ క్వశ్చన్‌ను 5 సెకన్లలో సాల్వ్ చేయగలరా? యువర్ టైమ్ స్టార్ట్స్ నౌ!';
        } else if (customGuidance.includes('Genius IQ Test')) {
          hook = '🧠 మీరు నిజంగా మ్యాథ్స్ జీనియస్ అయితే ఈ సింపుల్ క్వశ్చన్‌కి కామెంట్లో సమాధానం చెప్పండి!';
        } else if (customGuidance.includes('Real-Life Scenario')) {
          hook = '🛍️ రోజూ షాపింగ్ చేసేటప్పుడు అయ్యే ఈ చిన్న క్యాలిక్యులేషన్ 5 సెకన్లలో చెప్పగలరా?';
        } else if (customGuidance.trim()) {
          hook = `🔥 ${customGuidance}: 5 సెకన్లలో సాల్వ్ చేసే దమ్ముందా?`;
        } else if (generated?.hookText && !generated.hookText.includes('పరిష్కారం')) {
          hook = generated.hookText;
        }

        setViralHook(hook);
        setViralQuestion(generated?.problemStatement || qText || 'క్వశ్చన్‌ను జాగ్రత్తగా గమనించండి...');

        if (includeOptionsInVideo) {
          setViralOptions(generateOptionsTextFromQuestion(question));
        }

        setViralCta(
          'మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది. మరిన్ని బ్రెయిన్ ఛాలెంజెస్ కోసం Burra Pariksha ని ఫాలో అవ్వండి!'
        );

        // Solution & Speed Trick strictly in Pinned Comment box!
        setPinnedCommentText(generatePinnedCommentFromQuestion(question));

        setNotes(
          `AI-Generated Viral Challenge (Curiosity-Driven) • Tone: ${tone} • Guidance: ${
            customGuidance || 'Standard'
          } • Est: ~20s`
        );
        setSuccessMessage(
          'AI Auto-Drafted Curiosity Challenge! Spoken script contains 0 solution steps; full solution is pre-populated in Pinned Comment.'
        );
      } else {
        // EXPLANATION-DRIVEN FULL SOLUTION BREAKDOWN (5-Part)
        let hook = generated?.hookText || 'ఈ క్వశ్చన్‌ని 10 సెకన్లలో ఎలా సాల్వ్ చేయాలో ఇప్పుడు చూద్దాం!';
        let sol = generated?.stepByStepSolution || 'దశలవారీగా ఈ విధంగా సాల్వ్ చేయవచ్చు...';
        let trick = generated?.speedTrickOrTakeaway || generatePinnedCommentFromQuestion(question);

        if (customGuidance.includes('Burra Speed Trick Focus')) {
          trick = `⚡ Burra Speed Shortcut: ఆప్షన్స్ లో జీరో ఎలిమినేషన్ రూల్ ద్వారా డైరెక్ట్ గా 3 సెకన్లలో ఆన్సర్ పెట్టేయవచ్చు!`;
        } else if (customGuidance.includes('Beginner Friendly')) {
          sol = `మొదట ఇచ్చిన విలువలను విడివిడిగా రాసుకుందాం. ఇప్పుడు బేసిక్ ఫార్ములా ప్రకారం ప్రతీ స్టెప్ ని క్లియర్ గా సాల్వ్ చేద్దాం.`;
        } else if (customGuidance.includes('Distractor Trap Warning')) {
          sol = `${sol}\n\n⚠️ గమనిక: Option A చాలామంది అనుకునే తప్పుడు రూట్, కాబట్టి ఆప్షన్స్ జాగ్రత్తగా చెక్ చేయాలి.`;
        } else if (customGuidance.trim()) {
          sol = `${sol}\n\n[AI Guidance Applied: ${customGuidance}]`;
        }

        setHookText(hook);
        setProblemStatement(generated?.problemStatement || qText || '');
        setStepByStepSolution(sol);
        setSpeedTrickOrTakeaway(trick);
        setCallToAction(generated?.callToAction || 'మరిన్ని షార్ట్‌కట్స్ కోసం Burra Pariksha ఛానెల్ ని Follow అవ్వండి!');
        setNotes(
          `AI-Generated Full Solution Breakdown • Tone: ${tone} • Guidance: ${
            customGuidance || 'Standard'
          } • Est: ~${targetDurationSeconds}s`
        );
        setSuccessMessage('AI 5-Part Deep Dive script generated with complete spoken explanation & speed trick!');
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

      {/* 3. COMPACT 36PX SEGMENTED FORMAT SWITCHER */}
      <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 mb-3">
        <button
          type="button"
          onClick={() => handleFormatChange('VIRAL_CHALLENGE')}
          className={`h-8 px-3 text-xs flex items-center gap-1.5 rounded-lg transition-all cursor-pointer font-medium ${
            scriptFormat === 'VIRAL_CHALLENGE'
              ? 'bg-white shadow-xs text-indigo-700 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>⚡ Viral Challenge (15–25s) [Default]</span>
        </button>
        <button
          type="button"
          onClick={() => handleFormatChange('SOLUTION_BREAKDOWN')}
          className={`h-8 px-3 text-xs flex items-center gap-1.5 rounded-lg transition-all cursor-pointer font-medium ${
            scriptFormat === 'SOLUTION_BREAKDOWN'
              ? 'bg-white shadow-xs text-indigo-700 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
          <span>🎓 Full Solution (45–60s)</span>
        </button>
      </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ========================================================
              LEFT PANE (lg:col-span-7): COMPACT SCRIPT EDITOR + INLINE AI TOOLBAR
              ======================================================== */}
          <div className="lg:col-span-7 space-y-3">
            <Card variant="default" padding="md" className="rounded-2xl border-slate-200/80 shadow-xs space-y-3">
              {/* INLINE AI GENERATOR TOOLBAR + HEADER ACTIONS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      scriptFormat === 'VIRAL_CHALLENGE'
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {scriptFormat === 'VIRAL_CHALLENGE'
                        ? 'Viral Challenge Draft (4-Part)'
                        : '5-Part Deep Dive Draft'}
                    </h3>
                  </div>
                </div>

                {/* Inline AI Controls & Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAiPrompter(!showAiPrompter)}
                    className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                      showAiPrompter || customGuidance
                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Wand2 className="w-3 h-3 text-amber-600" />
                    <span>Prompter &amp; Presets</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAiPrompter ? 'rotate-180' : ''}`} />
                  </button>

                  <select
                    value={tone}
                    onChange={(e: any) => setTone(e.target.value)}
                    className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden"
                  >
                    <option value="ENERGETIC_EXAM_COACH">Energetic</option>
                    <option value="CLEAR_CONCEPTUAL">Conceptual</option>
                    <option value="EXAM_TRICK_FOCUSED">Shortcut</option>
                  </select>

                  <select
                    value={targetDurationSeconds}
                    onChange={(e) => setTargetDurationSeconds(Number(e.target.value))}
                    className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden font-mono"
                  >
                    {scriptFormat === 'VIRAL_CHALLENGE' ? (
                      <>
                        <option value={15}>15s</option>
                        <option value={20}>20s</option>
                        <option value={25}>25s</option>
                      </>
                    ) : (
                      <>
                        <option value={30}>30s</option>
                        <option value={45}>45s</option>
                        <option value={60}>60s</option>
                      </>
                    )}
                  </select>

                  <button
                    type="button"
                    disabled={isGeneratingAi}
                    onClick={handleGenerateScriptWithAi}
                    className={`py-1.5 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer ${
                      isGeneratingAi ? 'opacity-70' : ''
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isGeneratingAi ? 'Drafting...' : '✦ Auto-Draft'}</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAll}
                    icon={copied ? Check : Copy}
                    className="text-[11px] py-1 px-2 h-7"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleSaveDraft}
                    icon={Save}
                    className="text-[11px] py-1 px-2.5 h-7 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              {/* COLLAPSIBLE AI PROMPTER & PRESETS RIBBON */}
              {showAiPrompter && (
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 mb-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      AI Guidance Presets ({scriptFormat === 'VIRAL_CHALLENGE' ? 'Curiosity Challenge' : 'Full Solution'})
                    </span>
                    {customGuidance && (
                      <button
                        type="button"
                        onClick={() => setCustomGuidance('')}
                        className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                      >
                        Clear guidance
                      </button>
                    )}
                  </div>

                  {/* Quick-Click Recommendation Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {scriptFormat === 'VIRAL_CHALLENGE' ? (
                      <>
                        {[
                          { label: '🔥 99% Fail Challenge', text: 'Make the hook a 99% fail challenge to provoke viewers to prove themselves.' },
                          { label: '⏱️ 5-Sec Speed Test', text: 'Challenge viewers to solve mentally in 5 seconds without pen and paper.' },
                          { label: '🧠 Genius IQ Test', text: 'Pose this as a genius-level brain test.' },
                          { label: '🛍️ Real-Life Scenario', text: 'Connect to a relatable everyday Telugu shopping/commute dilemma.' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setCustomGuidance(preset.text)}
                            className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-medium ${
                              customGuidance === preset.text
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          { label: '⚡ Burra Speed Trick Focus', text: 'Emphasize the rapid zero-elimination mental shortcut on camera.' },
                          { label: '📚 Beginner Friendly', text: 'Explain step-by-step from first principles.' },
                          { label: '🎯 Distractor Trap Warning', text: 'Explain why Option A is a trap distractor.' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setCustomGuidance(preset.text)}
                            className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-medium ${
                              customGuidance === preset.text
                                ? 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Custom Asking Input */}
                  <div className="pt-0.5">
                    <input
                      type="text"
                      value={customGuidance}
                      onChange={(e) => setCustomGuidance(e.target.value)}
                      placeholder="Custom AI prompt: e.g. Make it energetic and challenge students preparing for APPSC..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* SCRIPT EDITOR FIELDS */}
              {scriptFormat === 'VIRAL_CHALLENGE' ? (
                /* MODE 1: VIRAL CHALLENGE (4 PARTS) */
                <div className="space-y-2.5">
                  {/* Part 1: Scroll-Stopping Hook */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          1
                        </span>
                        1. Scroll-Stopping Hook (0–3s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~8–12 words</span>
                    </div>
                    <textarea
                      value={viralHook}
                      onChange={(e) => setViralHook(e.target.value)}
                      placeholder="e.g. ఈ లెక్కని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్!"
                      rows={2}
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Part 2: Question Narration */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          2
                        </span>
                        2. Question Narration (3–10s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~15–25 words</span>
                    </div>
                    <textarea
                      value={viralQuestion}
                      onChange={(e) => setViralQuestion(e.target.value)}
                      placeholder="Clear Telugu problem statement to be read aloud..."
                      rows={2}
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Part 3: Options Delivery with Inline Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          3
                        </span>
                        3. Options Delivery (10–16s)
                      </label>

                      {/* Inline Toggle */}
                      <button
                        type="button"
                        onClick={() => setIncludeOptionsInVideo(!includeOptionsInVideo)}
                        className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer border ${
                          includeOptionsInVideo
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {includeOptionsInVideo ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span>✓ Include Options</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                            <span>Skip Options</span>
                          </>
                        )}
                      </button>
                    </div>

                    {includeOptionsInVideo ? (
                      <textarea
                        value={viralOptions}
                        onChange={(e) => setViralOptions(e.target.value)}
                        placeholder="Option A: ...&#10;Option B: ...&#10;Option C: ...&#10;Option D: ..."
                        rows={2}
                        className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                      />
                    ) : (
                      <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>⚡ <strong>Options Skipped</strong> (Direct mental math challenge)</span>
                      </div>
                    )}
                  </div>

                  {/* Part 4: Comment Challenge & Outro */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          4
                        </span>
                        4. Comment Challenge &amp; Outro (16–22s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~10–15 words</span>
                    </div>
                    <textarea
                      value={viralCta}
                      onChange={(e) => setViralCta(e.target.value)}
                      placeholder="మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది."
                      rows={2}
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                /* MODE 2: FULL SOLUTION BREAKDOWN (5 PARTS) */
                <div className="space-y-2.5">
                  {/* Part 1: Hook */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono font-bold">
                          1
                        </span>
                        1. Hook (0–5s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~10-15 words</span>
                    </div>
                    <textarea
                      value={hookText}
                      onChange={(e) => setHookText(e.target.value)}
                      placeholder="e.g. ఈ క్వశ్చన్ ని 10 సెకన్లలో సాల్వ్ చేయగలరా?"
                      rows={2}
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Part 2: Problem Statement */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono font-bold">
                          2
                        </span>
                        2. Problem Statement (5–15s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~25-35 words</span>
                    </div>
                    <textarea
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      placeholder="Telugu problem statement narration..."
                      rows={2}
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Part 3: Spoken Solution & Intuition */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono font-bold">
                          3
                        </span>
                        3. Spoken Solution &amp; Intuition (15–35s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~45-60 words</span>
                    </div>
                    <textarea
                      value={stepByStepSolution}
                      onChange={(e) => setStepByStepSolution(e.target.value)}
                      placeholder="Spoken Telugu explanation of the intuitive steps..."
                      rows={2}
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Part 4: Burra Speed Shortcut */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          4
                        </span>
                        4. Burra Speed Shortcut (35–45s)
                      </label>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Exam Shortcut
                      </span>
                    </div>
                    <textarea
                      value={speedTrickOrTakeaway}
                      onChange={(e) => setSpeedTrickOrTakeaway(e.target.value)}
                      placeholder="Pro-Tip: Check the units digit to eliminate Options B and D instantly!"
                      rows={2}
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-amber-200 bg-amber-50/30 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Part 5: Call to Action */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          5
                        </span>
                        5. Call to Action (45–50s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~10 words</span>
                    </div>
                    <textarea
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder="e.g. మరిన్ని షార్ట్‌కట్స్ కోసం ఇప్పుడే Burra Pariksha ఛానెల్ ని Follow చేయండి!"
                      rows={2}
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Notes */}
                  <div className="pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Production Cues & Teleprompter Notes..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ========================================================
              RIGHT PANE (lg:col-span-5): STICKY COMMAND STATION + PINNED COMMENT
              ======================================================== */}
          <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-3">
            {/* CARD 1 (TOP): UNIFIED TELEPROMPTER & PACING COMMAND STATION */}
            <Card variant="elevated" padding="md" className="rounded-2xl border-indigo-100 shadow-xs bg-white space-y-2.5">
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveAndProceed}
                disabled={isSaving}
                icon={ArrowRight}
                className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 text-sm rounded-xl shadow-xs"
              >
                {isSaving ? 'Saving Draft...' : 'Save & Proceed to Step 04: Teleprompter →'}
              </Button>

              {/* INLINE PACING METER */}
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Words: <strong className="text-slate-900 font-mono">{totalWords}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Duration: <strong className={`font-mono font-bold ${estimatedSeconds <= (scriptFormat === 'VIRAL_CHALLENGE' ? 25 : 50) ? 'text-emerald-600' : 'text-amber-600'}`}>~{estimatedSeconds}s</strong></span>
                </div>
                <Badge
                  variant={estimatedSeconds <= (scriptFormat === 'VIRAL_CHALLENGE' ? 25 : 50) ? 'approved' : 'draft'}
                  size="sm"
                  className="text-[10px] py-0.5 px-2 font-bold shrink-0"
                >
                  {scriptFormat === 'VIRAL_CHALLENGE'
                    ? (estimatedSeconds <= 25 ? 'Viral Sweet Spot (15–25s)' : 'Too Long')
                    : (estimatedSeconds <= 50 ? 'Optimal Pace (45s)' : 'Exceeds 50s')}
                </Badge>
              </div>
            </Card>

            {/* CARD 2: "📌 Official Pinned Comment (Solution & Speed Trick)" */}
            <Card variant="default" padding="md" className="rounded-2xl border-amber-200 bg-amber-50/20 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-700" />
                  <h4 className="text-xs font-bold text-slate-900">📌 Official Pinned Comment</h4>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPinnedComment}
                  className="py-1 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  {pinnedCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{pinnedCopied ? 'Copied!' : '📋 Copy'}</span>
                </button>
              </div>

              <textarea
                value={pinnedCommentText}
                onChange={(e) => setPinnedCommentText(e.target.value)}
                rows={3}
                className="w-full text-xs font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500 italic">
                Pin on Shorts/Reels to convert answer checks into high comment engagement.
              </p>
            </Card>

            {/* CARD 3: "Reviewer Math Proof" (Collapsible Drawer) */}
            {question && (
              <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Reviewer Math Proof
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMathProofDrawer(!showMathProofDrawer)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span>{showMathProofDrawer ? 'Collapse' : 'Expand'}</span>
                    {showMathProofDrawer ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {showMathProofDrawer && (
                  <div className="space-y-2 text-xs pt-2 border-t border-slate-800 animate-in fade-in duration-150">
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-400 block mb-0.5 uppercase tracking-wider">
                        Problem Statement
                      </span>
                      <p className="text-slate-200 text-xs leading-relaxed font-telugu">
                        {(question as any).statementTe || (question as any).statement || question.questionText}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Authoritative Math Proof
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                          Option {String(question.correctAnswer || (question as any).correctOption || '').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-slate-300 font-telugu text-[11px] bg-black/60 p-2 rounded-xl border border-slate-800 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {(question as any).explanationTe || question.explanation || 'No proof text available on record.'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>ID: <strong className="font-mono text-indigo-300">{question.id}</strong></span>
                      <span>Topic: <strong className="text-slate-300">{question.topicName || (question as any).topic || question.topicId || 'General'}</strong></span>
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

