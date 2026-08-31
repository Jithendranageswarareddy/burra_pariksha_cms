/**
 * BURRA PARIKSHA CMS - Publishing Tracker Mock Data
 * Phase 1: Manual multi-platform upload tracking prototype.
 * NOTE: YouTube, Instagram, and Facebook uploads remain manual. NO social APIs.
 */

import { Publishing, SocialPublishStatus } from '../../types';

export const MOCK_PUBLISHING_RECORDS: Publishing[] = [
  {
    id: 'PUB-105',
    videoId: 'BP-VID-105',
    videoTitle: 'Pie Chart Central Angle Mental Math Hack',
    questionId: 'BP-Q-1005',
    finalVideoStatus: 'VERIFIED',
    youtube: {
      status: SocialPublishStatus.PUBLISHED,
      videoUrl: 'https://youtube.com/shorts/mock-pie-chart-hack',
      publishedAt: '2026-02-18T16:00:00Z',
      notes: 'Ranked in top 5 search for CAT DI tricks.',
    },
    instagram: {
      status: SocialPublishStatus.PUBLISHED,
      postUrl: 'https://instagram.com/reel/mock-pie-chart-angle',
      publishedAt: '2026-02-18T16:30:00Z',
      notes: 'High save rate on calculation shortcuts.',
    },
    facebook: {
      status: SocialPublishStatus.PUBLISHED,
      postUrl: 'https://facebook.com/reel/mock-pie-chart-fb',
      publishedAt: '2026-02-18T17:00:00Z',
      notes: 'Group shares active.',
    },
    pinnedCommentReady: true,
    thumbnailReady: true,
    completedPlatformsCount: 3,
    totalPlatformsCount: 3,
    createdAt: '2026-02-14T09:00:00Z',
    updatedAt: '2026-02-18T17:30:00Z',
  },
  {
    id: 'PUB-104',
    videoId: 'BP-VID-104',
    videoTitle: 'Circular Table Seating Arrangement Shortcut',
    questionId: 'BP-Q-1004',
    finalVideoStatus: 'READY',
    youtube: {
      status: SocialPublishStatus.SCHEDULED,
      notes: 'Scheduled for tomorrow 6:00 PM IST prime slot.',
    },
    instagram: {
      status: SocialPublishStatus.NOT_STARTED,
      notes: 'Need 9:16 vertical cover frame.',
    },
    facebook: {
      status: SocialPublishStatus.NOT_STARTED,
      notes: 'Draft post saved.',
    },
    pinnedCommentReady: true,
    thumbnailReady: true,
    completedPlatformsCount: 1,
    totalPlatformsCount: 3,
    createdAt: '2026-02-22T10:00:00Z',
    updatedAt: '2026-02-23T18:00:00Z',
  },
  {
    id: 'PUB-101',
    videoId: 'BP-VID-101',
    videoTitle: 'The Viral Escalator Step Trick (CAT/Aptitude)',
    questionId: 'BP-Q-1001',
    finalVideoStatus: 'RENDERED',
    youtube: {
      status: SocialPublishStatus.NOT_STARTED,
      notes: 'Awaiting final thumbnail high-res PNG.',
    },
    instagram: {
      status: SocialPublishStatus.NOT_STARTED,
    },
    facebook: {
      status: SocialPublishStatus.NOT_STARTED,
    },
    pinnedCommentReady: true,
    thumbnailReady: false,
    completedPlatformsCount: 0,
    totalPlatformsCount: 3,
    createdAt: '2026-02-23T12:00:00Z',
    updatedAt: '2026-02-23T16:00:00Z',
  },
  {
    id: 'PUB-108',
    videoId: 'BP-VID-108',
    videoTitle: 'GMAT Critical Reasoning: Weakening Arguments in 60s',
    questionId: 'BP-Q-1008',
    finalVideoStatus: 'READY',
    youtube: {
      status: SocialPublishStatus.SCHEDULED,
      notes: 'Premiering Friday morning.',
    },
    instagram: {
      status: SocialPublishStatus.SCHEDULED,
      notes: 'Captions and hashtags prepared.',
    },
    facebook: {
      status: SocialPublishStatus.NOT_STARTED,
    },
    pinnedCommentReady: false,
    thumbnailReady: true,
    completedPlatformsCount: 2,
    totalPlatformsCount: 3,
    createdAt: '2026-02-23T14:00:00Z',
    updatedAt: '2026-02-24T08:30:00Z',
  },
];
