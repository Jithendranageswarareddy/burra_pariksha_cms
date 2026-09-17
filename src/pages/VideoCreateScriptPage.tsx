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
} from 'lucide-react';
import { Video, Question, VideoProductionStatus } from '../types';
import { apiClient } from '../lib/api-client';
import { VideoWorkflowHeader } from '../components/video/VideoWorkflowHeader';
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

  const videoId = routeVideoId || searchParams.get('videoId') || searchParams.get('id') || '';

  // State
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);

  // Script Draft Form State
  const [hookText, setHookText] = useState<string>('');
  const [problemStatement, setProblemStatement] = useState<string>('');
  const [stepByStepSolution, setStepByStepSolution] = useState<string>('');
  const [speedTrickOrTakeaway, setSpeedTrickOrTakeaway] = useState<string>('');
  const [callToAction, setCallToAction] = useState<string>('Burra Pariksha ఛానెల్ ని Follow అవ్వండి!');
  const [notes, setNotes] = useState<string>('');

  // AI Generation State
  const [tone, setTone] = useState<'ENERGETIC_EXAM_COACH' | 'CLEAR_CONCEPTUAL' | 'EXAM_TRICK_FOCUSED'>('ENERGETIC_EXAM_COACH');
  const [targetDurationSeconds, setTargetDurationSeconds] = useState<number>(45);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

      if (vid.questionId) {
        try {
          const q = await apiClient.getQuestionById(vid.questionId);
          setQuestion(q);
        } catch (qErr) {
          console.warn('Could not fetch linked question record:', qErr);
        }
      }

      // Fetch existing script draft if available
      try {
        const res = await apiClient.getScript(targetId);
        if (res.script) {
          setHookText(res.script.hookText || '');
          setProblemStatement(res.script.problemStatement || '');
          setStepByStepSolution(res.script.stepByStepSolution || '');
          setSpeedTrickOrTakeaway(res.script.speedTrickOrTakeaway || '');
          setCallToAction(res.script.callToAction || 'Burra Pariksha ఛానెల్ ని Follow అవ్వండి!');
          setNotes(res.script.notes || '');
        } else if (res.draftProposal) {
          setHookText(res.draftProposal.hookText || '');
          setProblemStatement(res.draftProposal.problemStatement || '');
          setStepByStepSolution(res.draftProposal.stepByStepSolution || '');
          setSpeedTrickOrTakeaway(res.draftProposal.speedTrickOrTakeaway || '');
          setCallToAction(res.draftProposal.callToAction || 'Burra Pariksha ఛానెల్ ని Follow అవ్వండి!');
          setNotes(res.draftProposal.notes || '');
        }
      } catch (sErr) {
        console.warn('Could not fetch existing script draft:', sErr);
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

  // Teleprompter pacing calculations (140 Telugu words per minute)
  const combinedScriptText = `${hookText}\n\n${problemStatement}\n\n${stepByStepSolution}\n\n${speedTrickOrTakeaway}\n\n${callToAction}`;
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

      setHookText(generated.hookText || '');
      setProblemStatement(generated.problemStatement || '');
      setStepByStepSolution(generated.stepByStepSolution || '');
      setSpeedTrickOrTakeaway(generated.speedTrickOrTakeaway || '');
      setCallToAction(generated.callToAction || 'Burra Pariksha ఛానెల్ ని Follow అవ్వండి!');
      setNotes(`AI-Generated (${generated.aiModelUsed || 'Gemini'}) • Est: ~${generated.estimatedDurationSeconds || 45}s`);

      setSuccessMessage('AI script generated successfully! Review the 5 parts and click Save Draft.');
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

      const payload = {
        hookText,
        problemStatement,
        stepByStepSolution,
        speedTrickOrTakeaway,
        callToAction,
        notes,
        createNewVersion: false,
      };

      await apiClient.saveScript(targetId, payload);
      setSuccessMessage('Script draft saved successfully! You can now proceed to Step 06 Review Script.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save script draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(combinedScriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <VideoWorkflowHeader currentStep={5} />

        <PageHeader
          title="05 Create Script"
          description="Author, draft, and AI-generate 5-part video scripts for Telugu short-form educational videos"
          badge={<Badge variant="active" size="sm" className="font-mono">STEP 05</Badge>}
        />

        {error && (
          <Alert variant="error" title="Error Loading Videos" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card padding="md">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Select Video for Script Creation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a video in SCRIPT_REQUIRED or QUEUED status to generate or write its 5-part Telugu script
            </p>
          </div>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Search by Video ID, Question ID, or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
            />

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
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <VideoWorkflowHeader
        currentStep={5}
        videoId={videoId || selectedVideo?.id}
        videoTitle={selectedVideo?.title}
        videoStatus={selectedVideo?.status}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="active" size="sm" className="font-mono">
              STEP 05
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              {selectedVideo?.id || videoId}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">05 Create Script</h1>
          <p className="text-xs text-slate-500">
            Generate and draft high-retention Telugu scripts structured for 45-second vertical videos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/production">
            <Button variant="outline" size="sm" icon={Film} className="text-xs">
              Production Tracker
            </Button>
          </Link>
          {selectedVideo?.questionId && (
            <Link to={`/questions/${selectedVideo.questionId}`}>
              <Button variant="outline" size="sm" icon={BookOpen} className="text-xs">
                View Question Record
              </Button>
            </Link>
          )}
        </div>
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
        <div className="space-y-6">
          {/* AI Generator Control Panel */}
          <Card padding="md">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">AI Telugu Script Generator</h3>
              </div>
              <Badge variant="active" size="sm">Gemini 2.5 Flash</Badge>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Script Tone & Style
                  </label>
                  <select
                    value={tone}
                    onChange={(e: any) => setTone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="ENERGETIC_EXAM_COACH">Energetic Exam Coach (High Retention)</option>
                    <option value="CLEAR_CONCEPTUAL">Clear & Conceptual (Step-by-Step Focus)</option>
                    <option value="EXAM_TRICK_FOCUSED">Speed Trick / Exam Shortcut Focused</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Duration (Seconds)
                  </label>
                  <select
                    value={targetDurationSeconds}
                    onChange={(e) => setTargetDurationSeconds(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value={30}>30s (Ultra-fast Shortcut)</option>
                    <option value={45}>45s (Standard YouTube Short)</option>
                    <option value={60}>60s (Deep Concept Explanation)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="primary"
                    size="md"
                    disabled={isGeneratingAi}
                    onClick={handleGenerateScriptWithAi}
                    icon={Sparkles}
                    className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    {isGeneratingAi ? 'Generating Telugu Script...' : 'Generate 5-Part Script'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Main 2-Column Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: 5-Part Script Editor */}
            <div className="lg:col-span-2 space-y-4">
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">5-Part Script Draft</h3>
                    <p className="text-xs text-slate-500">Edit and refine the narration script for teleprompter filming</p>
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
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Part 1: Hook */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-mono font-bold">1</span>
                        Hook (0–5s) • High Energy Attention Grabber
                      </label>
                      <span className="text-[11px] text-slate-400">Target: ~10-15 words</span>
                    </div>
                    <textarea
                      value={hookText}
                      onChange={(e) => setHookText(e.target.value)}
                      placeholder="e.g. ఈ క్వశ్చన్ ని 10 సెకన్లలో సాల్వ్ చేయగలరా? చాలా మంది ఇక్కడే తప్పు చేస్తారు!"
                      rows={2}
                      className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  {/* Part 2: Problem Statement */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-mono font-bold">2</span>
                        Problem Statement (5–15s) • Question Narration
                      </label>
                      <span className="text-[11px] text-slate-400">Target: ~25-35 words</span>
                    </div>
                    <textarea
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      placeholder="e.g. ఒక రైలు 60 km/h వేగంతో ప్రయాణిస్తూ 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను 18 సెకన్లలో దాటింది..."
                      rows={3}
                      className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Part 3: Step-by-Step Solution */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-mono font-bold">3</span>
                        Step-by-Step Solution (15–35s) • Core Concept & Math
                      </label>
                      <span className="text-[11px] text-slate-400">Target: ~45-60 words</span>
                    </div>
                    <textarea
                      value={stepByStepSolution}
                      onChange={(e) => setStepByStepSolution(e.target.value)}
                      placeholder="e.g. ముందుగా km/h ని m/s లోకి మార్చుకుందాం: 60 × 5/18 = 50/3 m/s. మొత్తం దూరం = వేగం × సమయం..."
                      rows={4}
                      className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Part 4: Speed Shortcut */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px] font-mono font-bold">4</span>
                        Speed Shortcut / Takeaway (35–45s) • Exam Super Trick
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono text-amber-700">Exam Shortcut</span>
                    </div>
                    <textarea
                      value={speedTrickOrTakeaway}
                      onChange={(e) => setSpeedTrickOrTakeaway(e.target.value)}
                      placeholder="e.g. సూపర్ ట్రిక్: ఎప్పుడైనా ట్రైన్ పొడవు కనుక్కోవాలంటే (Speed × Time) - Platform Length!"
                      rows={2}
                      className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-amber-50/40"
                    />
                  </div>

                  {/* Part 5: Call to Action */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-mono font-bold">5</span>
                        Call to Action (45–50s) • Outro & Next Question Hook
                      </label>
                      <span className="text-[11px] text-slate-400">~10 words</span>
                    </div>
                    <input
                      type="text"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder="e.g. మరిన్ని షార్ట్‌కట్స్ కోసం ఇప్పుడే Burra Pariksha ఛానెల్ ని Follow చేయండి!"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                    />
                  </div>

                  {/* Production & Teleprompter Notes */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Production Cues & Teleprompter Notes
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. High energy start, emphasize formula graphic at 0:18"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-600 bg-slate-50"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Col: Duration Estimator & Source Context */}
            <div className="space-y-4">
              {/* Teleprompter Pacing Estimator */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Pacing & Timing
                  </span>
                  <Badge variant={estimatedSeconds <= 50 ? 'success' : 'warning'} size="sm">
                    {estimatedSeconds <= 50 ? 'Optimal Pace' : 'Exceeds 50s'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Total Words</span>
                    <span className="text-xl font-bold font-mono text-slate-900">{totalWords}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Est. Duration</span>
                    <span className="text-xl font-bold font-mono text-indigo-700">~{estimatedSeconds}s</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Calculated using standard Telugu short-form narration rate of <strong>140 words/minute</strong>.
                </p>
              </div>

              {/* Source Question Snapshot */}
              {question && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Source Question
                    </span>
                    <span className="font-mono text-xs font-bold text-indigo-600">
                      {question.id}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium line-clamp-3">
                    {question.questionText}
                  </p>

                  <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-500">
                    <div>Topic: <strong className="text-slate-700">{question.topicId || 'General'}</strong></div>
                    <div>Difficulty: <strong className="text-slate-700">{question.difficulty}</strong></div>
                    <div>Correct Answer: <strong className="text-emerald-700">Option {question.correctAnswer}</strong></div>
                  </div>
                </div>
              )}

              {/* Next Step Action Card */}
              <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono">
                    06
                  </span>
                  <span>Next: Review Script</span>
                </div>
                <p className="text-xs text-slate-600">
                  Ready to verify word counts, test teleprompter timing, and approve the script?
                </p>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const targetId = videoId || selectedVideo?.id;
                    navigate(`/videos/${encodeURIComponent(targetId)}/review-script`);
                  }}
                  icon={ArrowRight}
                  className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Continue to Review Script (Step 06)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoCreateScriptPage;
