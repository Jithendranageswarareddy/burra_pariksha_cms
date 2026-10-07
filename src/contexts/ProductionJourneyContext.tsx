/**
 * BURRA PARIKSHA CMS - Production Journey Context
 * Phase 1: Production Journey Orchestration Architecture
 * 
 * Manages the canonical 15-stage production journey for content items,
 * correlating ContentMaster, Question, Video, Script, Thumbnail, and Publishing
 * across the entire lifecycle.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Question,
  Video,
  Script,
  Thumbnail,
  Publishing,
  ContentMaster,
  QuestionStatus,
  VideoProductionStatus,
  SocialPublishStatus,
} from '../types';
import { apiClient } from '../lib/api-client';
import { CANONICAL_15_STEPS } from '../lib/workflow/canonical-workflow';
import { getCanonicalStageRoute, WorkflowContext } from '../lib/routing/workflow-routes';

export interface CanonicalIds {
  contentMasterId: string | null;
  questionId: string | null;
  videoId: string | null;
  scriptId: string | null;
  thumbnailId: string | null;
  publishingId: string | null;
}

export interface JourneyStage {
  stageNumber: number; // 1 to 15
  id: string;
  label: string; // e.g. "01 Question"
  shortLabel: string; // e.g. "Question"
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isBlocked: boolean;
  blockerReason?: string;
  route: string;
  tab?: string;
}

export interface JourneyNextAction {
  label: string;
  stageNumber: number;
  route: string;
  tab?: string;
  description?: string;
}

export interface ProductionJourneyContextType {
  // Active canonical content IDs
  contentMasterId: string | null;
  questionId: string | null;
  videoId: string | null;
  scriptId: string | null;
  thumbnailId: string | null;
  publishingId: string | null;

  // Active entities
  question: Question | null;
  video: Video | null;
  script: Script | null;
  thumbnail: Thumbnail | null;
  publishing: Publishing | null;
  contentMaster: ContentMaster | null;

  // Computed journey state
  currentStage: number; // 1 to 15
  stages: JourneyStage[];
  nextAction: JourneyNextAction | null;
  isLoading: boolean;
  error: string | null;

  // Navigation & transition helpers
  advanceToNextStage: () => void;
  jumpToStage: (stageNumber: number) => boolean;
  reloadJourneyData: () => Promise<void>;

  // Loaders
  loadJourneyForQuestion: (id: string, initialQuestion?: Question) => Promise<void>;
  loadJourneyForVideo: (id: string, initialVideo?: Video) => Promise<void>;
  loadJourneyForContentMaster: (id: string) => Promise<void>;
  setCanonicalIds: (ids: Partial<CanonicalIds>) => void;
  setEntityData: (data: Partial<{
    question: Question | null;
    video: Video | null;
    script: Script | null;
    thumbnail: Thumbnail | null;
    publishing: Publishing | null;
    contentMaster: ContentMaster | null;
  }>) => void;
}

export const STAGE_DEFINITIONS = CANONICAL_15_STEPS.map((s) => ({
  stageNumber: s.stepNumber,
  id: s.id,
  label: s.label,
  shortLabel: s.shortLabel,
  description: s.responsibility,
  defaultRoute: s.canonicalRoute,
  tab: s.tab,
}));

export const getJourneyStageById = (stageNum: number) => {
  const found = STAGE_DEFINITIONS.find((s) => s.stageNumber === stageNum);
  if (!found) return null;
  return {
    ...found,
    id: found.stageNumber,
    name: found.label,
    route: found.defaultRoute,
  };
};

export const getNextStage = (stageNum: number) => {
  if (stageNum >= 15) return getJourneyStageById(1);
  return getJourneyStageById(stageNum + 1);
};

const ProductionJourneyContext = createContext<ProductionJourneyContextType | undefined>(undefined);

export const ProductionJourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  // Canonical IDs
  const [contentMasterId, setContentMasterId] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [thumbnailId, setThumbnailId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Entities
  const [question, setQuestion] = useState<Question | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [publishing, setPublishing] = useState<Publishing | null>(null);
  const [contentMaster, setContentMaster] = useState<ContentMaster | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set canonical IDs partially
  const setCanonicalIds = useCallback((ids: Partial<CanonicalIds>) => {
    if (ids.contentMasterId !== undefined) setContentMasterId(ids.contentMasterId);
    if (ids.questionId !== undefined) setQuestionId(ids.questionId);
    if (ids.videoId !== undefined) setVideoId(ids.videoId);
    if (ids.scriptId !== undefined) setScriptId(ids.scriptId);
    if (ids.thumbnailId !== undefined) setThumbnailId(ids.thumbnailId);
    if (ids.publishingId !== undefined) setPublishingId(ids.publishingId);
  }, []);

  // Set entity data directly
  const setEntityData = useCallback((data: Partial<{
    question: Question | null;
    video: Video | null;
    script: Script | null;
    thumbnail: Thumbnail | null;
    publishing: Publishing | null;
    contentMaster: ContentMaster | null;
  }>) => {
    if (data.question !== undefined) setQuestion(data.question);
    if (data.video !== undefined) setVideo(data.video);
    if (data.script !== undefined) setScript(data.script);
    if (data.thumbnail !== undefined) setThumbnail(data.thumbnail);
    if (data.publishing !== undefined) setPublishing(data.publishing);
    if (data.contentMaster !== undefined) setContentMaster(data.contentMaster);
  }, []);

  // Load journey for a Question
  const loadJourneyForQuestion = useCallback(async (qId: string, initialQuestion?: Question) => {
    if (!qId) return;
    setIsLoading(true);
    setError(null);
    setQuestionId(qId);

    try {
      let q = initialQuestion;
      if (!q) {
        q = await apiClient.getQuestionById(qId);
      }
      setQuestion(q);

      const cmId = q.contentMasterId || q.contentId || null;
      if (cmId) setContentMasterId(cmId);

      // Attempt to find correlated content master details or videos
      if (cmId) {
        try {
          const detailsRes = await apiClient.getContentMasterDetails(cmId);
          if (detailsRes?.data) {
            const d = detailsRes.data;
            if (d.contentMaster) setContentMaster(d.contentMaster);
            if (d.videos && d.videos.length > 0) {
              const matchedVideo = d.videos.find((v) => v.questionId === qId) || d.videos[0];
              setVideo(matchedVideo);
              setVideoId(matchedVideo.id);
            }
            if (d.scripts && d.scripts.length > 0) {
              const matchedScript = d.scripts.find((s) => s.questionId === qId) || d.scripts[0];
              setScript(matchedScript);
              setScriptId(matchedScript.id);
            }
            if (d.thumbnails && d.thumbnails.length > 0) {
              setThumbnail(d.thumbnails[0]);
              setThumbnailId(d.thumbnails[0].id);
            }
            if (d.publishingRecords && d.publishingRecords.length > 0) {
              setPublishing(d.publishingRecords[0]);
              setPublishingId(d.publishingRecords[0].id);
            }
          }
        } catch {
          // fallback to individual fetches if content master details endpoint fails
        }
      }

      // If video still not resolved, query videos list by question ID
      if (!videoId) {
        try {
          const allVideos = await apiClient.getVideos();
          const matched = allVideos.find((v) => v.questionId === qId);
          if (matched) {
            setVideo(matched);
            setVideoId(matched.id);
            if (!contentMasterId && (matched.contentMasterId || matched.contentId)) {
              setContentMasterId(matched.contentMasterId || matched.contentId || null);
            }
          }
        } catch {
          // ignore background video query failures
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load journey for question.');
    } finally {
      setIsLoading(false);
    }
  }, [videoId, contentMasterId]);

  // Load journey for a Video
  const loadJourneyForVideo = useCallback(async (vId: string, initialVideo?: Video) => {
    if (!vId) return;
    setIsLoading(true);
    setError(null);
    setVideoId(vId);

    try {
      let v = initialVideo;
      if (!v) {
        v = await apiClient.getVideoById(vId);
      }
      setVideo(v);

      const qId = v.questionId || null;
      if (qId) setQuestionId(qId);

      const cmId = v.contentMasterId || v.contentId || null;
      if (cmId) setContentMasterId(cmId);

      // Load related assets in parallel
      const [scriptRes, thumbRes, pubRes] = await Promise.all([
        apiClient.getScript(vId).catch(() => ({ script: null })),
        apiClient.getThumbnail(vId).catch(() => ({ thumbnail: null })),
        apiClient.getVideoPublishing(vId).catch(() => null),
      ]);

      if (scriptRes?.script) {
        setScript(scriptRes.script);
        setScriptId(scriptRes.script.id);
      }
      if (thumbRes?.thumbnail) {
        setThumbnail(thumbRes.thumbnail);
        setThumbnailId(thumbRes.thumbnail.id);
      }
      if (pubRes) {
        setPublishing(pubRes);
        setPublishingId(pubRes.id);
      }

      // Fetch Question details if questionId is known
      if (qId && !question) {
        try {
          const q = await apiClient.getQuestionById(qId);
          setQuestion(q);
        } catch {
          // question fetch failed
        }
      }

      // Fetch ContentMaster if cmId is known
      if (cmId && !contentMaster) {
        try {
          const cmRes = await apiClient.getContentMasterDetails(cmId);
          if (cmRes?.data?.contentMaster) {
            setContentMaster(cmRes.data.contentMaster);
          }
        } catch {
          // content master fetch failed
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load journey for video.');
    } finally {
      setIsLoading(false);
    }
  }, [question, contentMaster]);

  // Load journey for ContentMaster directly
  const loadJourneyForContentMaster = useCallback(async (cmId: string) => {
    if (!cmId) return;
    setIsLoading(true);
    setError(null);
    setContentMasterId(cmId);

    try {
      const res = await apiClient.getContentMasterDetails(cmId);
      if (res?.data) {
        const d = res.data;
        if (d.contentMaster) setContentMaster(d.contentMaster);
        if (d.primaryQuestion) {
          setQuestion(d.primaryQuestion);
          setQuestionId(d.primaryQuestion.id);
        } else if (d.questions && d.questions.length > 0) {
          setQuestion(d.questions[0]);
          setQuestionId(d.questions[0].id);
        }
        if (d.videos && d.videos.length > 0) {
          setVideo(d.videos[0]);
          setVideoId(d.videos[0].id);
        }
        if (d.scripts && d.scripts.length > 0) {
          setScript(d.scripts[0]);
          setScriptId(d.scripts[0].id);
        }
        if (d.thumbnails && d.thumbnails.length > 0) {
          setThumbnail(d.thumbnails[0]);
          setThumbnailId(d.thumbnails[0].id);
        }
        if (d.publishingRecords && d.publishingRecords.length > 0) {
          setPublishing(d.publishingRecords[0]);
          setPublishingId(d.publishingRecords[0].id);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load journey for content master.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload current journey data
  const reloadJourneyData = useCallback(async () => {
    if (videoId) {
      await loadJourneyForVideo(videoId);
    } else if (questionId) {
      await loadJourneyForQuestion(questionId);
    } else if (contentMasterId) {
      await loadJourneyForContentMaster(contentMasterId);
    }
  }, [videoId, questionId, contentMasterId, loadJourneyForVideo, loadJourneyForQuestion, loadJourneyForContentMaster]);

  // Compute active journey stage & individual stage states
  const { currentStage, stages, nextAction } = useMemo(() => {
    // Stage completion evaluation
    const isQCompleted = Boolean(
      question && (question.status === QuestionStatus.APPROVED || question.status === QuestionStatus.GENERATED || (question.status !== QuestionStatus.DRAFT && question.questionText))
    );

    const isVerificationCompleted = Boolean(question && question.status === QuestionStatus.APPROVED);

    const isScriptCompleted = Boolean(
      (script && (script.status === 'APPROVED' || script.currentVersion > 0)) ||
      (video && [
        VideoProductionStatus.SCRIPT_READY,
        VideoProductionStatus.RECORDING,
        VideoProductionStatus.RECORDED,
        VideoProductionStatus.EDITING,
        VideoProductionStatus.EDITED,
        VideoProductionStatus.FINAL_REVIEW,
        VideoProductionStatus.READY_TO_UPLOAD,
        VideoProductionStatus.UPLOADED,
      ].includes(video.status))
    );

    const isFilmingCompleted = Boolean(
      video && [
        VideoProductionStatus.RECORDED,
        VideoProductionStatus.EDITING,
        VideoProductionStatus.EDITED,
        VideoProductionStatus.FINAL_REVIEW,
        VideoProductionStatus.READY_TO_UPLOAD,
        VideoProductionStatus.UPLOADED,
      ].includes(video.status)
    );

    const isRawVideoCompleted = Boolean(
      video && (
        Boolean(video.driveFileId || video.rawFootagePath) ||
        [
          VideoProductionStatus.RECORDED,
          VideoProductionStatus.EDITING,
          VideoProductionStatus.EDITED,
          VideoProductionStatus.FINAL_REVIEW,
          VideoProductionStatus.READY_TO_UPLOAD,
          VideoProductionStatus.UPLOADED,
        ].includes(video.status)
      )
    );

    const isEditingCompleted = Boolean(
      video && [
        VideoProductionStatus.EDITED,
        VideoProductionStatus.FINAL_REVIEW,
        VideoProductionStatus.READY_TO_UPLOAD,
        VideoProductionStatus.UPLOADED,
      ].includes(video.status)
    );

    const isFinalQcCompleted = Boolean(
      video && [
        VideoProductionStatus.READY_TO_UPLOAD,
        VideoProductionStatus.UPLOADED,
      ].includes(video.status)
    );

    // S3-T14.4: Stage N completion strictly derived from Stage N evidence (never from later status)
    const isThumbnailCompleted = Boolean(
      (thumbnail && (thumbnail.status === 'APPROVED' || (thumbnail as any)?.isApproved || (thumbnail as any)?.certified)) ||
      Boolean((video as any)?.thumbnailApproved)
    );

    const isSocialReviewCompleted = Boolean(
      (contentMaster as any)?.socialReviewState?.status === 'APPROVED' ||
      (contentMaster?.status === 'APPROVED' && Boolean((contentMaster as any)?.socialReviewState)) ||
      Boolean((video as any)?.socialReviewApproved)
    );

    const isPublishingSetupCompleted = Boolean(
      publishing && (
        publishing.youtube?.status === SocialPublishStatus.SCHEDULED ||
        publishing.youtube?.status === SocialPublishStatus.PUBLISHED ||
        Boolean(publishing.youtubeScheduledAt) ||
        Boolean(publishing.instagramScheduledAt) ||
        Boolean(publishing.facebookScheduledAt) ||
        Boolean(publishing.youtube?.scheduledAt)
      )
    );

    const isPublishedCompleted = Boolean(
      publishing && (
        publishing.youtube?.status === SocialPublishStatus.PUBLISHED ||
        publishing.instagram?.status === SocialPublishStatus.PUBLISHED ||
        publishing.facebook?.status === SocialPublishStatus.PUBLISHED ||
        (publishing.completedPlatformsCount > 0 &&
          Boolean(
            publishing.youtube?.postUrl ||
            publishing.youtube?.videoUrl ||
            publishing.instagram?.postUrl ||
            publishing.facebook?.postUrl
          ))
      )
    );

    const isPlatformSyncCompleted = Boolean(
      publishing &&
      publishing.completedPlatformsCount >= publishing.totalPlatformsCount &&
      publishing.totalPlatformsCount > 0 &&
      Boolean(
        publishing.youtube?.status === SocialPublishStatus.PUBLISHED &&
        publishing.instagram?.status === SocialPublishStatus.PUBLISHED &&
        publishing.facebook?.status === SocialPublishStatus.PUBLISHED
      )
    );

    const isAnalyticsCompleted = Boolean(
      Boolean((contentMaster as any)?.hasAnalyticsData) ||
      Boolean((video as any)?.hasAnalyticsData) ||
      Boolean((contentMaster as any)?.analyticsRecordCount && (contentMaster as any).analyticsRecordCount > 0)
    );

    const isPerformanceReviewCompleted = Boolean(
      Boolean((contentMaster as any)?.performanceReviewCompleted) ||
      Boolean((video as any)?.performanceReviewCompleted) ||
      Boolean((contentMaster as any)?.performanceReviewDate)
    );

    const isInsightsCompleted = Boolean(
      Boolean((contentMaster as any)?.intelligenceLoopCompleted) ||
      Boolean((video as any)?.intelligenceLoopCompleted) ||
      Boolean((contentMaster as any)?.strategyRecommendationId)
    );

    // Determine current active stage (1 to 15)
    let stage = 1;

    if (isPublishedCompleted) {
      if (isPlatformSyncCompleted) {
        stage = 13; // Analytics
      } else {
        stage = 12; // Platform Sync
      }
    } else if (isPublishingSetupCompleted) {
      stage = 11; // Ready to be marked Published
    } else if (video?.status === VideoProductionStatus.READY_TO_UPLOAD) {
      if (!isThumbnailCompleted) {
        stage = 8; // Thumbnail
      } else if (!isSocialReviewCompleted) {
        stage = 9; // Social Review
      } else {
        stage = 10; // Publishing Setup
      }
    } else if (video?.status === VideoProductionStatus.FINAL_REVIEW || video?.status === VideoProductionStatus.EDITED) {
      stage = 7; // Final QC
    } else if (video?.status === VideoProductionStatus.EDITING) {
      stage = 6; // Editing Bay
    } else if (video?.status === VideoProductionStatus.RECORDED) {
      stage = 6; // Ready to start editing
    } else if (video?.status === VideoProductionStatus.RECORDING) {
      stage = 4; // Teleprompter & Filming
    } else if (video?.status === VideoProductionStatus.SCRIPT_READY) {
      stage = 4; // Teleprompter ready for filming
    } else if (video?.status === VideoProductionStatus.SCRIPT_REQUIRED || video?.status === VideoProductionStatus.QUEUED) {
      stage = 3; // Audience Script
    } else if (question?.status === QuestionStatus.APPROVED) {
      stage = 3; // Question approved, ready for Audience Script
    } else if (question && ((question.status as string) === 'IN_REVIEW' || question.status === QuestionStatus.GENERATED || question.status === QuestionStatus.EDITING)) {
      stage = 2; // Verification
    } else {
      stage = 1; // Question Creation
    }

    const resolvedContentMasterId =
      contentMasterId || (video as any)?.contentMasterId || (video as any)?.contentId || question?.contentId || null;
    const resolvedQuestionId = questionId || video?.questionId || null;
    const resolvedVideoId = videoId || (video ? video.id : null);
    const resolvedPublishingId = publishingId || publishing?.id || null;
    const resolvedScriptId = scriptId || script?.id || null;
    const resolvedThumbnailId = thumbnailId || thumbnail?.id || null;

    const workflowContext: WorkflowContext = {
      contentMasterId: resolvedContentMasterId,
      questionId: resolvedQuestionId,
      videoId: resolvedVideoId,
      scriptId: resolvedScriptId,
      thumbnailId: resolvedThumbnailId,
      publishingId: resolvedPublishingId,
    };

    // Build 15 stages list with prerequisite blocking logic & canonical route registry
    const stageItems: JourneyStage[] = STAGE_DEFINITIONS.map((def) => {
      let isCompleted = false;
      let isBlocked = false;
      let blockerReason: string | undefined = undefined;
      const route = getCanonicalStageRoute(def.stageNumber, workflowContext);
      let tab: string | undefined = undefined;

      switch (def.stageNumber) {
        case 1: // 01 Question Generation
          isCompleted = isQCompleted;
          isBlocked = false;
          break;

        case 2: // 02 Question Verification
          isCompleted = isVerificationCompleted;
          isBlocked = !question;
          blockerReason = !question ? 'Question draft must be created before verification.' : undefined;
          break;

        case 3: // 03 Audience Script
          isCompleted = isScriptCompleted;
          isBlocked = !question || question.status !== QuestionStatus.APPROVED;
          blockerReason = isBlocked ? 'Question must be approved before creating audience script.' : undefined;
          tab = 'script';
          break;

        case 4: // 04 Teleprompter & Filming
          isCompleted = isFilmingCompleted;
          isBlocked = !video || !isScriptCompleted;
          blockerReason = isBlocked ? 'Audience script must be approved before filming.' : undefined;
          tab = 'recording';
          break;

        case 5: // 05 Raw Video
          isCompleted = isRawVideoCompleted;
          isBlocked = !video || (!isFilmingCompleted && video.status !== VideoProductionStatus.RECORDING);
          blockerReason = isBlocked ? 'Filming session must be initiated before uploading raw video.' : undefined;
          tab = 'recording';
          break;

        case 6: // 06 Editing Bay
          isCompleted = isEditingCompleted;
          isBlocked = !video || !isRawVideoCompleted;
          blockerReason = isBlocked ? 'Raw video asset must be uploaded before editing.' : undefined;
          tab = 'editing';
          break;

        case 7: // 07 Final QC
          isCompleted = isFinalQcCompleted;
          isBlocked = !video || !isEditingCompleted;
          blockerReason = isBlocked ? 'Edited video cut must be submitted before Final QC.' : undefined;
          tab = 'final-review';
          break;

        case 8: // 08 Thumbnail
          isCompleted = isThumbnailCompleted;
          isBlocked = !video || !isScriptCompleted;
          blockerReason = isBlocked ? 'Script and hook must be finalized before designing thumbnail.' : undefined;
          tab = 'thumbnail';
          break;

        case 9: // 09 Social Review
          isCompleted = isSocialReviewCompleted;
          isBlocked = !video || !isFinalQcCompleted;
          blockerReason = isBlocked ? 'Video must pass Final QC before approving social review package.' : undefined;
          tab = 'social';
          break;

        case 10: // 10 Publishing Setup
          isCompleted = isPublishingSetupCompleted;
          isBlocked = !video || !isFinalQcCompleted;
          blockerReason = isBlocked ? 'Video must pass Final QC before configuring publishing schedule.' : undefined;
          tab = 'publishing';
          break;

        case 11: // 11 Published
          isCompleted = isPublishedCompleted;
          isBlocked = !isPublishingSetupCompleted;
          blockerReason = isBlocked ? 'Publishing package must be configured before going live.' : undefined;
          tab = 'publishing';
          break;

        case 12: // 12 Platform Sync
          isCompleted = isPlatformSyncCompleted;
          isBlocked = !isPublishedCompleted;
          blockerReason = isBlocked ? 'Content must be published on primary platform before verifying sync.' : undefined;
          break;

        case 13: // 13 Analytics
          isCompleted = isAnalyticsCompleted;
          isBlocked = !isPublishedCompleted;
          blockerReason = isBlocked ? 'Video must be published to track engagement and analytics.' : undefined;
          break;

        case 14: // 14 Performance Review
          isCompleted = isPerformanceReviewCompleted;
          isBlocked = !isPublishedCompleted;
          blockerReason = isBlocked ? 'Audience metrics must be collected before performance review.' : undefined;
          break;

        case 15: // 15 Intelligence Loop
          isCompleted = isInsightsCompleted;
          isBlocked = !isPublishedCompleted;
          blockerReason = isBlocked ? 'Engagement metrics required to generate pedagogical insights.' : undefined;
          break;
      }

      return {
        ...def,
        route,
        tab,
        isCompleted,
        isCurrent: def.stageNumber === stage,
        isBlocked,
        blockerReason,
      };
    });

    // Compute exactly ONE Intelligent Next Action button based on active stage
    let computedAction: JourneyNextAction = {
      label: 'Continue to Verification',
      stageNumber: 2,
      route: questionId ? `/questions/${questionId}/verify` : '/questions/verify',
    };

    switch (stage) {
      case 1:
        computedAction = {
          label: 'Continue to Verification',
          stageNumber: 2,
          route: getCanonicalStageRoute(2, workflowContext),
          description: 'Submit question draft for pedagogical review',
        };
        break;

      case 2:
        if (question?.status === QuestionStatus.APPROVED) {
          computedAction = {
            label: videoId ? 'Create Audience Script' : 'Add to Video Queue',
            stageNumber: 3,
            route: getCanonicalStageRoute(3, workflowContext),
            tab: 'script',
            description: 'Open script workshop for short-form presenter script',
          };
        } else {
          computedAction = {
            label: 'Verify & Approve Question',
            stageNumber: 2,
            route: getCanonicalStageRoute(2, workflowContext),
            description: 'Review pedagogical correctness and approve question',
          };
        }
        break;

      case 3:
        if (isScriptCompleted) {
          computedAction = {
            label: 'Start Teleprompter & Filming',
            stageNumber: 4,
            route: getCanonicalStageRoute(4, workflowContext),
            tab: 'recording',
            description: 'Launch teleprompter view and start presenter recording',
          };
        } else {
          computedAction = {
            label: 'Create Audience Script',
            stageNumber: 3,
            route: getCanonicalStageRoute(3, workflowContext),
            tab: 'script',
            description: 'Draft presenter hook, step-by-step solution, and speed trick',
          };
        }
        break;

      case 4:
        if (video?.status === VideoProductionStatus.RECORDING) {
          computedAction = {
            label: 'Upload Raw Video Asset',
            stageNumber: 5,
            route: getCanonicalStageRoute(5, workflowContext),
            tab: 'recording',
            description: 'Attach filmed camera footage to video record',
          };
        } else {
          computedAction = {
            label: 'Start Filming Session',
            stageNumber: 4,
            route: getCanonicalStageRoute(4, workflowContext),
            tab: 'recording',
            description: 'Transition video to Recording and open teleprompter',
          };
        }
        break;

      case 5:
        if (isRawVideoCompleted) {
          computedAction = {
            label: 'Start Editing',
            stageNumber: 6,
            route: getCanonicalStageRoute(6, workflowContext),
            tab: 'editing',
            description: 'Hand off raw footage to Editing Bay',
          };
        } else {
          computedAction = {
            label: 'Upload Raw Video',
            stageNumber: 5,
            route: getCanonicalStageRoute(5, workflowContext),
            tab: 'recording',
            description: 'Complete raw footage ingestion',
          };
        }
        break;

      case 6:
        if (video?.status === VideoProductionStatus.EDITED || video?.status === VideoProductionStatus.FINAL_REVIEW) {
          computedAction = {
            label: 'Open Final QC',
            stageNumber: 7,
            route: getCanonicalStageRoute(7, workflowContext),
            tab: 'final-review',
            description: 'Review finalized cut and vertical presentation',
          };
        } else {
          computedAction = {
            label: 'Start Editing Bay',
            stageNumber: 6,
            route: getCanonicalStageRoute(6, workflowContext),
            tab: 'editing',
            description: 'Edit cut, sound design, and on-screen overlays',
          };
        }
        break;

      case 7:
        if (isFinalQcCompleted) {
          computedAction = {
            label: 'Design Thumbnail',
            stageNumber: 8,
            route: getCanonicalStageRoute(8, workflowContext),
            tab: 'thumbnail',
            description: 'Design curiosity-framed mobile thumbnail',
          };
        } else {
          computedAction = {
            label: 'Open Final QC',
            stageNumber: 7,
            route: getCanonicalStageRoute(7, workflowContext),
            tab: 'final-review',
            description: 'Audit visual standards and certify upload readiness',
          };
        }
        break;

      case 8:
        if (isThumbnailCompleted) {
          computedAction = {
            label: 'Review Social Package',
            stageNumber: 9,
            route: getCanonicalStageRoute(9, workflowContext),
            tab: 'social',
            description: 'Verify copy, hashtags, and pinned comment package',
          };
        } else {
          computedAction = {
            label: 'Review Thumbnail Design',
            stageNumber: 8,
            route: getCanonicalStageRoute(8, workflowContext),
            tab: 'thumbnail',
            description: 'Approve or iterate high-contrast thumbnail',
          };
        }
        break;

      case 9:
        if (isSocialReviewCompleted) {
          computedAction = {
            label: 'Configure Publishing Setup',
            stageNumber: 10,
            route: getCanonicalStageRoute(10, workflowContext),
            tab: 'publishing',
            description: 'Schedule platform upload slots',
          };
        } else {
          computedAction = {
            label: 'Approve Social Package',
            stageNumber: 9,
            route: getCanonicalStageRoute(9, workflowContext),
            tab: 'social',
            description: 'Approve multi-platform titles, tags, and commentary',
          };
        }
        break;

      case 10:
        computedAction = {
          label: 'Schedule & Publish Platforms',
          stageNumber: 10,
          route: getCanonicalStageRoute(10, workflowContext),
          tab: 'publishing',
          description: 'Launch multi-platform publishing flow',
        };
        break;

      case 11:
        computedAction = {
          label: 'Verify Multi-Platform Sync',
          stageNumber: 12,
          route: getCanonicalStageRoute(12, workflowContext),
          description: 'Verify live URLs across YouTube, IG, and Facebook',
        };
        break;

      case 12:
        computedAction = {
          label: 'View Social Analytics',
          stageNumber: 13,
          route: getCanonicalStageRoute(13, workflowContext),
          description: 'Track audience metrics and retention trends',
        };
        break;

      case 13:
        computedAction = {
          label: 'Conduct Performance Review',
          stageNumber: 14,
          route: getCanonicalStageRoute(14, workflowContext),
          description: 'Audit retention curves and viewer drop-off points',
        };
        break;

      case 14:
        computedAction = {
          label: 'Explore Pedagogical Insights',
          stageNumber: 15,
          route: getCanonicalStageRoute(15, workflowContext),
          description: 'Calibrate question difficulty and student confusion points',
        };
        break;

      case 15:
        computedAction = {
          label: 'Create Next Question',
          stageNumber: 1,
          route: getCanonicalStageRoute(1, workflowContext),
          description: 'Feed learnings back into Question Studio for next question',
        };
        break;

      default:
        computedAction = {
          label: 'Continue to Verification',
          stageNumber: 2,
          route: questionId ? `/questions/${questionId}/verify` : '/questions/verify',
        };
    }

    return {
      currentStage: stage,
      stages: stageItems,
      nextAction: computedAction,
    };
  }, [
    question,
    video,
    script,
    thumbnail,
    publishing,
    contentMaster,
    questionId,
    videoId,
    contentMasterId,
  ]);

  // Jump to specific stage
  const jumpToStage = useCallback((stageNumber: number): boolean => {
    const target = stages.find((s) => s.stageNumber === stageNumber);
    if (!target) return false;

    if (target.isBlocked) {
      return false;
    }

    if (target.route) {
      navigate(target.route);
      return true;
    }

    return false;
  }, [stages, navigate]);

  // Advance to next stage using computed nextAction
  const advanceToNextStage = useCallback(() => {
    if (nextAction?.route) {
      navigate(nextAction.route);
    } else {
      jumpToStage(Math.min(15, currentStage + 1));
    }
  }, [nextAction, currentStage, jumpToStage, navigate]);

  return (
    <ProductionJourneyContext.Provider
      value={{
        contentMasterId,
        questionId,
        videoId,
        scriptId,
        thumbnailId,
        publishingId,
        question,
        video,
        script,
        thumbnail,
        publishing,
        contentMaster,
        currentStage,
        stages,
        nextAction,
        isLoading,
        error,
        advanceToNextStage,
        jumpToStage,
        reloadJourneyData,
        loadJourneyForQuestion,
        loadJourneyForVideo,
        loadJourneyForContentMaster,
        setCanonicalIds,
        setEntityData,
      }}
    >
      {children}
    </ProductionJourneyContext.Provider>
  );
};

export const useProductionJourney = (): ProductionJourneyContextType => {
  const context = useContext(ProductionJourneyContext);
  if (!context) {
    throw new Error('useProductionJourney must be used within a ProductionJourneyProvider');
  }
  return context;
};
