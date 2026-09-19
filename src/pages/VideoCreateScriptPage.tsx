import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Video, VideoProductionStatus } from '../types';
import { apiClient } from '../lib/api-client';
import { ProductionJourneyBar } from '../components/production/ProductionJourneyBar';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { PageLoading } from '../design-system/components/Loading';
import { Video as VideoIcon, ArrowRight, BookOpen, Film, Sparkles } from 'lucide-react';

export const VideoCreateScriptPage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const videoId = routeVideoId || searchParams.get('videoId') || searchParams.get('id') || '';

  const [videoList, setVideoList] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (videoId) {
      // Redirect to canonical URL structure with ?tab=script
      navigate(`/videos/${encodeURIComponent(videoId)}?tab=script`, { replace: true });
      return;
    }

    const fetchVideosNeedingScript = async () => {
      try {
        setIsLoading(true);
        const videos = await apiClient.getVideos();
        const needingScript = videos.filter(
          (v) =>
            v.status === VideoProductionStatus.QUEUED ||
            v.status === VideoProductionStatus.SCRIPT_REQUIRED ||
            v.status === VideoProductionStatus.SCRIPT_READY
        );
        setVideoList(needingScript.length > 0 ? needingScript : videos.slice(0, 20));
      } catch (err) {
        console.error('Failed to load video list for script selection:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideosNeedingScript();
  }, [videoId, navigate]);

  if (videoId) {
    return <PageLoading message="Redirecting to Audience Engagement Script Engine..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      <ProductionJourneyBar activeStage="AUDIENCE_SCRIPT" showDetails />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Audience Engagement Script Engine
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Select a video project below to launch the multi-format Viral Challenge &amp; Solution Breakdown studio.
          </p>
        </div>

        {isLoading ? (
          <PageLoading message="Loading pending video production items..." />
        ) : videoList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <VideoIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No pending videos found for scriptwriting</p>
            <p className="text-xs text-slate-500 mt-1">All current video items have completed scripts or are in production.</p>
            <Link to="/production" className="mt-4 inline-block">
              <Button variant="outline" size="sm" icon={Film}>
                Go to Production Tracker
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoList.map((vid) => (
              <Card
                key={vid.id}
                variant="default"
                padding="md"
                className="hover:border-indigo-500 transition-all cursor-pointer rounded-xl flex flex-col justify-between"
                onClick={() => navigate(`/videos/${encodeURIComponent(vid.id)}?tab=script`)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700">{vid.id}</span>
                    <Badge variant={vid.status === VideoProductionStatus.SCRIPT_READY ? 'approved' : 'draft'} size="sm">
                      {vid.status}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                    {vid.title || (vid.question ? vid.question.questionText : `Video Project ${vid.id}`)}
                  </h4>
                  {vid.questionId && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      Question ID: {vid.questionId}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold">
                  <span>Author Script</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCreateScriptPage;
