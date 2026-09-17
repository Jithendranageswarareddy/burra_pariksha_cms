/**
 * BURRA PARIKSHA CMS - Presentation Formatters
 * Phase 11: Legacy UI Removal & Simplification
 * Maps technical IDs and statuses to clean, user-friendly action-oriented presentation strings.
 */

import { VideoProductionStatus } from '../types';

/**
 * Format technical entity IDs (e.g. BP-CNT-000203 -> Content #203, BP-Q-000203 -> Question #203, BP-V-000044 -> Video #44)
 */
export function formatDisplayId(id?: string, type: 'content' | 'question' | 'video' | 'task' = 'content'): string {
  if (!id) return type === 'question' ? 'Question' : type === 'video' ? 'Video' : 'Content';
  
  const cleanStr = id.trim();
  
  if (cleanStr.startsWith('BP-CNT-')) {
    const num = cleanStr.replace('BP-CNT-', '').replace(/^0+/, '');
    return `Content #${num || '0'}`;
  }
  
  if (cleanStr.startsWith('BP-Q-')) {
    const num = cleanStr.replace('BP-Q-', '').replace(/^0+/, '');
    return `Question #${num || '0'}`;
  }

  if (cleanStr.startsWith('BP-V-')) {
    const num = cleanStr.replace('BP-V-', '').replace(/^0+/, '');
    return `Video #${num || '0'}`;
  }

  if (cleanStr.startsWith('BP-T-')) {
    const num = cleanStr.replace('BP-T-', '').replace(/^0+/, '');
    return `Task #${num || '0'}`;
  }

  if (/^\d+$/.test(cleanStr)) {
    const prefixLabel = type === 'question' ? 'Question' : type === 'video' ? 'Video' : type === 'task' ? 'Task' : 'Content';
    return `${prefixLabel} #${cleanStr.replace(/^0+/, '') || '0'}`;
  }

  if (cleanStr.length > 12) {
    const prefixLabel = type === 'question' ? 'Question' : type === 'video' ? 'Video' : type === 'task' ? 'Task' : 'Content';
    return `${prefixLabel} #${cleanStr.slice(-4).toUpperCase()}`;
  }

  return cleanStr;
}

/**
 * Maps technical backend workflow status enum values to action-oriented user-facing labels
 */
export function formatWorkflowStatusLabel(status?: string): string {
  if (!status) return 'Draft';
  
  const upper = status.trim().toUpperCase();

  switch (upper) {
    case 'SCRIPT_REQUIRED':
    case 'READY_FOR_SCRIPT':
      return 'Create Script';
    case 'SCRIPT_READY':
      return 'Review Script';
    case 'RECORDING':
      return 'Record Video';
    case 'RECORDED':
      return 'Video Recorded';
    case 'EDITING':
      return 'Edit Video';
    case 'EDITED':
      return 'Video Edited';
    case 'FINAL_REVIEW':
      return 'Final Video';
    case 'READY_TO_UPLOAD':
      return 'Create Thumbnail';
    case 'UPLOADED':
      return 'Publish';
    case 'PUBLISHED':
      return 'Published';
    case 'QUEUED':
      return 'In Queue';
    case 'DRAFT':
      return 'Improve Question';
    case 'GENERATED':
      return 'Verify & Approve';
    case 'APPROVED':
      return 'Ready for Script';
    case 'REJECTED':
      return 'Needs Revision';
    case 'COMPLETED':
      return 'Completed';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return upper.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/**
 * Get canonical step URL for a video ID based on its active production status
 */
export function getVideoCanonicalStepUrl(videoId: string, status?: VideoProductionStatus | string): string {
  if (!videoId) return '/studio';
  const enc = encodeURIComponent(videoId);
  const s = (status || '').toUpperCase();

  switch (s) {
    case 'SCRIPT_REQUIRED':
    case 'NOT_STARTED':
      return `/videos/${enc}/create-script`;
    case 'SCRIPT_READY':
      return `/videos/${enc}/review-script`;
    case 'RECORDING':
    case 'QUEUED':
      return `/videos/${enc}/record`;
    case 'RECORDED':
    case 'EDITING':
    case 'EDITED':
      return `/videos/${enc}/edit-video`;
    case 'FINAL_REVIEW':
      return `/videos/${enc}/final-video`;
    case 'READY_TO_UPLOAD':
      return `/videos/${enc}/thumbnail`;
    case 'UPLOADED':
      return `/videos/${enc}/pinned-comment`;
    case 'PUBLISHED':
      return `/videos/${enc}/platform-packages`;
    default:
      return `/videos/${enc}/create-script`;
  }
}
