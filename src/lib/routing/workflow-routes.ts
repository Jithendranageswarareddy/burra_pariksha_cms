/**
 * BURRA PARIKSHA CMS — Canonical Workflow Route Registry & Context Resolver
 * Task: S3-T14.1 Canonical Workflow Routing Architecture
 *
 * Centralizes all 15 workflow stage routes, context resolution, and URL building.
 * Ensures no page or component manually invents or hardcodes inconsistent workflow routes.
 */

export interface WorkflowContext {
  contentMasterId?: string | null;
  questionId?: string | null;
  videoId?: string | null;
  scriptId?: string | null;
  thumbnailId?: string | null;
  publishingId?: string | null;
}

export interface CanonicalStageDefinition {
  stageNumber: number;
  id: string;
  label: string;
  shortLabel: string;
  responsibility: string;
  canonicalRouteTemplate: string;
  tab?: string;
}

export const CANONICAL_STAGE_METADATA: Record<number, CanonicalStageDefinition> = {
  1: {
    stageNumber: 1,
    id: 'question-generation',
    label: '01 Question Generation',
    shortLabel: 'Question Generation',
    responsibility: 'Question generation, taxonomy mapping, and pedagogical drafting',
    canonicalRouteTemplate: '/studio',
  },
  2: {
    stageNumber: 2,
    id: 'question-verification',
    label: '02 Question Verification',
    shortLabel: 'Question Verification',
    responsibility: 'Pedagogical verification, solution proof check, and approval',
    canonicalRouteTemplate: '/questions/:questionId/verify',
  },
  3: {
    stageNumber: 3,
    id: 'audience-script',
    label: '03 Audience Script',
    shortLabel: 'Audience Script',
    responsibility: 'Short-form presenter script with hook, proof, and pacing',
    canonicalRouteTemplate: '/videos/:videoId?tab=script',
    tab: 'script',
  },
  4: {
    stageNumber: 4,
    id: 'teleprompter-filming',
    label: '04 Teleprompter & Filming',
    shortLabel: 'Teleprompter & Filming',
    responsibility: 'Presenter filming session with auto-scroll teleprompter',
    canonicalRouteTemplate: '/videos/:videoId?tab=recording',
    tab: 'recording',
  },
  5: {
    stageNumber: 5,
    id: 'raw-video',
    label: '05 Raw Video',
    shortLabel: 'Raw Video',
    responsibility: 'Raw camera video ingestion, Drive attachment, and handoff',
    canonicalRouteTemplate: '/videos/:videoId?tab=recording',
    tab: 'recording',
  },
  6: {
    stageNumber: 6,
    id: 'editing-bay',
    label: '06 Editing Bay',
    shortLabel: 'Editing Bay',
    responsibility: 'Master cut, dynamic Telugu graphics, sound effects & timer overlay',
    canonicalRouteTemplate: '/videos/:videoId?tab=editing',
    tab: 'editing',
  },
  7: {
    stageNumber: 7,
    id: 'final-qc',
    label: '07 Final QC',
    shortLabel: 'Final QC',
    responsibility: 'Master QC certification (9:16 safe-zones, audio LUFS, typography check)',
    canonicalRouteTemplate: '/videos/:videoId?tab=final-review',
    tab: 'final-review',
  },
  8: {
    stageNumber: 8,
    id: 'thumbnail',
    label: '08 Thumbnail',
    shortLabel: 'Thumbnail',
    responsibility: 'Curiosity-framing thumbnail design and Drive asset certification',
    canonicalRouteTemplate: '/videos/:videoId?tab=thumbnail',
    tab: 'thumbnail',
  },
  9: {
    stageNumber: 9,
    id: 'social-review',
    label: '09 Social Review',
    shortLabel: 'Social Review',
    responsibility: '9:16 smartphone simulator review, copy packaging, and compliance',
    canonicalRouteTemplate: '/social-review/:contentMasterId',
    tab: 'social',
  },
  10: {
    stageNumber: 10,
    id: 'publishing-setup',
    label: '10 Publishing Setup',
    shortLabel: 'Publishing Setup',
    responsibility: 'Multi-platform scheduling, slot configuration & readiness',
    canonicalRouteTemplate: '/videos/:videoId?tab=publishing',
    tab: 'publishing',
  },
  11: {
    stageNumber: 11,
    id: 'published',
    label: '11 Published',
    shortLabel: 'Published',
    responsibility: 'Live publication on YouTube Shorts, Instagram Reels & Facebook Video',
    canonicalRouteTemplate: '/videos/:videoId?tab=publishing',
    tab: 'publishing',
  },
  12: {
    stageNumber: 12,
    id: 'platform-sync',
    label: '12 Platform Sync',
    shortLabel: 'Platform Sync',
    responsibility: 'Cross-platform adaptation verification and live sync confirmation',
    canonicalRouteTemplate: '/platform-packages/:videoId',
  },
  13: {
    stageNumber: 13,
    id: 'analytics',
    label: '13 Analytics',
    shortLabel: 'Analytics',
    responsibility: 'Engagement metrics collection (Views, Likes, Retention, Comments)',
    canonicalRouteTemplate: '/social-analytics/:contentMasterId?videoId=:videoId&publishingId=:publishingId',
  },
  14: {
    stageNumber: 14,
    id: 'performance-review',
    label: '14 Performance Review',
    shortLabel: 'Performance Review',
    responsibility: 'Retention curve drop-off review and editorial performance synthesis',
    canonicalRouteTemplate: '/analytics/engagement?contentId=:contentMasterId&videoId=:videoId&publishingId=:publishingId',
  },
  15: {
    stageNumber: 15,
    id: 'intelligence-loop',
    label: '15 Intelligence Loop',
    shortLabel: 'Intelligence Loop',
    responsibility: 'AI pedagogical insights synthesis and loopback to Stage 01 Question Studio',
    canonicalRouteTemplate: '/analytics/intelligence?contentId=:contentMasterId&videoId=:videoId&publishingId=:publishingId',
  },
};

/**
 * Generates the authoritative canonical route for a given stage number (1 to 15)
 * preserving all workflow identifiers.
 */
export function getCanonicalStageRoute(stageNumber: number, context: WorkflowContext = {}): string {
  const contentId = context.contentMasterId || '';
  const qId = context.questionId || '';
  const vId = context.videoId || '';
  const pubId = context.publishingId || '';

  switch (stageNumber) {
    case 1:
      return qId ? `/studio?id=${encodeURIComponent(qId)}` : '/studio';

    case 2:
      return qId ? `/questions/${encodeURIComponent(qId)}/verify` : '/questions/verify';

    case 3:
      return vId
        ? `/videos/${encodeURIComponent(vId)}?tab=script`
        : (qId ? `/videos/create-script?questionId=${encodeURIComponent(qId)}` : '/videos/create-script');

    case 4:
      return vId
        ? `/videos/${encodeURIComponent(vId)}?tab=recording`
        : '/videos/record';

    case 5:
      return vId
        ? `/videos/${encodeURIComponent(vId)}?tab=recording`
        : '/videos/record';

    case 6:
      return vId
        ? `/videos/${encodeURIComponent(vId)}?tab=editing`
        : '/videos/edit-video';

    case 7:
      return vId
        ? `/videos/${encodeURIComponent(vId)}?tab=final-review`
        : '/videos/final-video';

    case 8:
      return vId
        ? `/videos/${encodeURIComponent(vId)}?tab=thumbnail`
        : '/videos/thumbnail';

    case 9:
      if (contentId) {
        return `/social-review/${encodeURIComponent(contentId)}`;
      }
      if (qId) {
        return `/social-review/${encodeURIComponent(qId)}`;
      }
      return vId ? `/videos/${encodeURIComponent(vId)}?tab=social` : '/social-review';

    case 10:
    case 11:
      return vId
        ? `/videos/${encodeURIComponent(vId)}?tab=publishing`
        : '/publishing';

    case 12:
      return vId
        ? `/platform-packages/${encodeURIComponent(vId)}`
        : '/platform-packages';

    case 13: {
      const params = new URLSearchParams();
      if (vId) params.set('videoId', vId);
      if (pubId) params.set('publishingId', pubId);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return contentId
        ? `/social-analytics/${encodeURIComponent(contentId)}${qs}`
        : `/social-analytics${qs}`;
    }

    case 14: {
      const params = new URLSearchParams();
      if (contentId) params.set('contentId', contentId);
      if (vId) params.set('videoId', vId);
      if (pubId) params.set('publishingId', pubId);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return `/analytics/engagement${qs}`;
    }

    case 15: {
      const params = new URLSearchParams();
      if (contentId) params.set('contentId', contentId);
      if (vId) params.set('videoId', vId);
      if (pubId) params.set('publishingId', pubId);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return `/analytics/intelligence${qs}`;
    }

    default:
      return '/production';
  }
}

/**
 * Extracts available canonical workflow identifiers from URL pathname and search parameters.
 */
export function extractWorkflowContext(
  pathname: string,
  search: string,
  routeParams: Record<string, string | undefined> = {}
): WorkflowContext {
  const params = new URLSearchParams(search);

  const videoId =
    routeParams.videoId ||
    params.get('videoId') ||
    (pathname.startsWith('/platform-packages/') ? pathname.replace('/platform-packages/', '').split('/')[0] : null) ||
    (pathname.startsWith('/videos/') ? pathname.replace('/videos/', '').split('/')[0] : null);

  const contentMasterId =
    routeParams.contentMasterId ||
    routeParams.contentId ||
    params.get('contentId') ||
    params.get('contentMasterId') ||
    (pathname.startsWith('/social-review/') ? pathname.replace('/social-review/', '').split('/')[0] : null) ||
    (pathname.startsWith('/social-analytics/') ? pathname.replace('/social-analytics/', '').split('/')[0] : null);

  const questionId =
    routeParams.questionId ||
    routeParams.id ||
    params.get('questionId') ||
    params.get('id') ||
    (pathname.startsWith('/questions/') ? pathname.replace('/questions/', '').split('/')[0] : null);

  const publishingId =
    routeParams.publishingId ||
    params.get('publishingId') ||
    null;

  return {
    contentMasterId: contentMasterId ? decodeURIComponent(contentMasterId) : undefined,
    questionId: questionId ? decodeURIComponent(questionId) : undefined,
    videoId: videoId ? decodeURIComponent(videoId) : undefined,
    publishingId: publishingId ? decodeURIComponent(publishingId) : undefined,
  };
}
